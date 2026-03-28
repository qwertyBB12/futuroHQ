#!/usr/bin/env python3
"""
Populate voice signatures on Sanity alumni/person documents.

Reads enriched JSON transcripts and matches speaker embeddings to named
speakers in Sanity video speakerSegments. Averages embeddings per person
and patches their Sanity document.

Usage:
    python3 scripts/populate-voice-signatures.py --dry-run
    python3 scripts/populate-voice-signatures.py --live
"""

import argparse
import json
import os
import sys
import urllib.request
import urllib.parse
import uuid
from collections import defaultdict
from pathlib import Path

SANITY_PROJECT_ID = os.environ.get("SANITY_PROJECT_ID", "fo6n8ceo")
SANITY_DATASET = os.environ.get("SANITY_DATASET", "production")
SANITY_API = f"https://{SANITY_PROJECT_ID}.api.sanity.io/v2024-01-01"
SANITY_TOKEN = os.environ.get("SANITY_TOKEN", "")
TRANSCRIPTS_DIR = Path("/Users/hectorhlopez/projects/clean-studio/transcripts")


def sanity_query(query: str) -> list:
    """Run a GROQ query against Sanity."""
    url = f"{SANITY_API}/data/query/{SANITY_DATASET}?" + urllib.parse.urlencode({"query": query})
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {SANITY_TOKEN}"})
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read()).get("result", [])


def sanity_mutate(mutations: list, dry_run: bool = True) -> dict:
    """Execute Sanity mutations."""
    body = json.dumps({"mutations": mutations}).encode()
    if dry_run:
        print(f"  [DRY RUN] Would execute {len(mutations)} mutation(s)")
        return {}
    url = f"{SANITY_API}/data/mutate/{SANITY_DATASET}"
    req = urllib.request.Request(
        url, data=body, method="POST",
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {SANITY_TOKEN}",
        }
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())


def cosine_similarity(a: list, b: list) -> float:
    """Compute cosine similarity between two vectors."""
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = sum(x * x for x in a) ** 0.5
    norm_b = sum(x * x for x in b) ** 0.5
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


def average_embeddings(embeddings: list[list[float]]) -> list[float]:
    """Average a list of embedding vectors."""
    if not embeddings:
        return []
    dim = len(embeddings[0])
    avg = [0.0] * dim
    for emb in embeddings:
        for i in range(dim):
            avg[i] += emb[i]
    return [x / len(embeddings) for x in avg]


def collect_speaker_embeddings() -> dict[str, list[list[float]]]:
    """
    Collect speaker embeddings for named speakers.

    Reads enriched JSON files for speaker_embeddings (SPEAKER_XX -> vector).
    Queries Sanity for the corresponding video's speakerSegments to find
    which SPEAKER_XX maps to which real person name.

    Only uses videos where speakerSegments contain real names (not SPEAKER_XX).
    """
    # Get all videos with named speaker segments
    print("Querying Sanity for videos with named speakers...")
    videos = sanity_query("""
        *[_type == 'video' && defined(b2Key) && defined(speakerSegments)
          && count(speakerSegments) > 0
          && !(_id match 'drafts.*')]{
            _id, b2Key, speakerSegments
        }
    """)

    # Filter to videos with real names (not SPEAKER_XX or UNKNOWN)
    named_videos = []
    for v in videos:
        segs = v.get("speakerSegments", [])
        has_real_names = any(
            s.get("speaker")
            and not s["speaker"].startswith("SPEAKER_")
            and s["speaker"] != "UNKNOWN"
            and s["speaker"].strip()
            for s in segs
        )
        if has_real_names:
            named_videos.append(v)

    print(f"Found {len(named_videos)} videos with named speakers")

    # For each video, find the enriched JSON and map SPEAKER_XX -> real name
    person_embeddings = defaultdict(list)
    matched = 0

    for v in named_videos:
        b2key = v.get("b2Key", "")
        segs = v.get("speakerSegments", [])

        # Derive the transcript stem from b2Key
        if "/clips/" in b2key:
            stem = b2key.split("/clips/")[1].split("/")[0]
        else:
            stem = os.path.splitext(os.path.basename(b2key))[0].replace("_processed", "")

        enriched_path = TRANSCRIPTS_DIR / f"{stem}.enriched.json"
        if not enriched_path.exists():
            continue

        try:
            with open(enriched_path) as f:
                enriched = json.load(f)
        except Exception:
            continue

        speaker_embs = enriched.get("speaker_embeddings", {})
        if not speaker_embs:
            continue

        # Build SPEAKER_XX -> real name mapping from Sanity speakerSegments
        enriched_segments = enriched.get("speaker_segments", [])

        speaker_map = {}  # SPEAKER_XX -> real name
        for sanity_seg in segs:
            real_name = sanity_seg.get("speaker", "")
            if real_name.startswith("SPEAKER_") or real_name == "UNKNOWN":
                continue
            seg_start = sanity_seg.get("start", 0)
            seg_end = sanity_seg.get("end", 0)
            seg_mid = (seg_start + seg_end) / 2

            for e_seg in enriched_segments:
                if e_seg.get("start", 0) <= seg_mid <= e_seg.get("end", 0):
                    generic_label = e_seg.get("speaker", "")
                    if generic_label.startswith("SPEAKER_"):
                        speaker_map[generic_label] = real_name
                    break

        # Collect embeddings for matched speakers
        for generic_label, real_name in speaker_map.items():
            if generic_label in speaker_embs:
                person_embeddings[real_name].append(speaker_embs[generic_label])
                matched += 1

    print(f"Collected {matched} embedding samples across {len(person_embeddings)} people")
    return dict(person_embeddings)


def resolve_sanity_ids(person_names: list[str]) -> dict[str, dict]:
    """Look up Sanity document IDs for person names."""
    results = sanity_query("""
        *[_type in ['alumni', 'person'] && !(_id match 'drafts.*')]{
            _id, _type, name
        }
    """)

    name_to_doc = {}
    for doc in results:
        name = doc.get("name", "")
        if name in person_names:
            name_to_doc[name] = {"_id": doc["_id"], "_type": doc["_type"]}

    return name_to_doc


def main():
    parser = argparse.ArgumentParser(description="Populate voice signatures on Sanity person docs")
    parser.add_argument("--dry-run", action="store_true", help="Preview without writing")
    parser.add_argument("--live", action="store_true", help="Write signatures to Sanity")
    args = parser.parse_args()

    if not args.dry_run and not args.live:
        print("Pass --dry-run or --live")
        sys.exit(1)

    dry_run = not args.live

    # Step 1: Collect embeddings from tagged videos
    person_embeddings = collect_speaker_embeddings()

    if not person_embeddings:
        print("No speaker embeddings found. Tag some videos first.")
        sys.exit(0)

    # Step 2: Average embeddings per person
    print(f"\nAveraging embeddings for {len(person_embeddings)} people:")
    signatures = {}
    for name, embs in sorted(person_embeddings.items()):
        avg = average_embeddings(embs)
        signatures[name] = avg
        print(f"  {name}: {len(embs)} samples -> {len(avg)}-dim signature")

    # Step 3: Resolve Sanity IDs
    print(f"\nResolving Sanity document IDs...")
    name_to_doc = resolve_sanity_ids(list(signatures.keys()))

    unmatched = set(signatures.keys()) - set(name_to_doc.keys())
    if unmatched:
        print(f"  ⚠ No Sanity doc found for: {unmatched}")

    # Step 4: Patch Sanity documents
    mutations = []
    for name, embedding in signatures.items():
        if name not in name_to_doc:
            continue
        doc = name_to_doc[name]
        mutations.append({
            "patch": {
                "id": doc["_id"],
                "set": {
                    "voiceSignature": embedding,
                    "hasVoiceSignature": True,
                }
            }
        })

    print(f"\n{'DRY RUN' if dry_run else 'LIVE'}: {len(mutations)} signatures to write")
    if mutations:
        result = sanity_mutate(mutations, dry_run=dry_run)
        if not dry_run:
            print(f"  ✓ Patched {len(result.get('results', []))} documents")

    # Step 5: Summary
    print(f"\n{'='*50}")
    print(f"Voice Signature Summary")
    print(f"{'='*50}")
    for name in sorted(signatures.keys()):
        samples = len(person_embeddings[name])
        in_sanity = "✓" if name in name_to_doc else "✗"
        print(f"  {in_sanity} {name}: {samples} samples")


if __name__ == "__main__":
    main()
