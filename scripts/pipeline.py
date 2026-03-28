#!/usr/bin/env python3
"""
End-to-end video pipeline orchestrator.
Raw video -> encode + LUT -> transcribe -> diarize -> extract clips -> upload to B2 -> create Sanity docs.

Usage:
    python3 scripts/pipeline.py "Futuro MMXXV/raw/card-1/Day 1/C3460.MP4"
    python3 scripts/pipeline.py "Futuro MMXXV/raw/card-1/Day 1" --camera canon-r5-clog3
    python3 scripts/pipeline.py "path" --skip-upload        # local only
    python3 scripts/pipeline.py "path" --skip-sanity         # upload but no Sanity docs
    python3 scripts/pipeline.py "path" --dry-run             # preview Sanity mutations
    python3 scripts/pipeline.py "path" --live                # execute Sanity mutations
"""

import argparse
import importlib.util
import json
import sys
import os
import uuid
import urllib.request
import urllib.parse
from argparse import Namespace
from pathlib import Path

# ============================================================
# Import sibling scripts via importlib (filenames have hyphens)
# ============================================================

_SCRIPTS_DIR = Path(__file__).parent


def _load_module_from_file(name: str, filename: str):
    """Load a Python module from a file with a hyphenated name."""
    path = _SCRIPTS_DIR / filename
    spec = importlib.util.spec_from_file_location(name, path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


# Load process-raw-video.py
_proc_raw_video = _load_module_from_file("process_raw_video", "process-raw-video.py")
process_video = _proc_raw_video.process_video
upload_to_b2 = _proc_raw_video.upload_to_b2
list_videos = _proc_raw_video.list_videos
CAMERA_LUTS = _proc_raw_video.CAMERA_LUTS
CLIPS_DIR_DEFAULT = Path("/Users/hectorhlopez/projects/clean-studio/clips")

# Load extract-speaker-clips.py
_extract_speaker_clips = _load_module_from_file("extract_speaker_clips", "extract-speaker-clips.py")
process_transcript = _extract_speaker_clips.process_transcript
CLIPS_DIR = _extract_speaker_clips.CLIPS_DIR
CDN_BASE = _extract_speaker_clips.CDN_BASE

# B2 bucket (from process-raw-video constants)
BUCKET = _proc_raw_video.BUCKET

# ============================================================
# Constants
# ============================================================

# Video file extensions for folder detection
VIDEO_EXTENSIONS = [".mp4", ".mov", ".mkv", ".webm", ".avi"]

# Sanity API constants
SANITY_PROJECT = "fo6n8ceo"
SANITY_DATASET = "production"
SANITY_API = f"https://{SANITY_PROJECT}.api.sanity.io/v2024-01-01"
SANITY_TOKEN = os.environ.get("SANITY_TOKEN")

# Transcript directory for enriched JSON
OUTPUT_DIR = Path(__file__).parent.parent / "transcripts"


# ============================================================
# Voice signature matching
# ============================================================

def cosine_similarity(a: list, b: list) -> float:
    """Compute cosine similarity between two vectors."""
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = sum(x * x for x in a) ** 0.5
    norm_b = sum(x * x for x in b) ** 0.5
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


_voice_signatures = None


def load_voice_signatures() -> list[dict]:
    """Query Sanity for all people with voice signatures. Cached per session."""
    global _voice_signatures
    if _voice_signatures is not None:
        return _voice_signatures

    query = '*[defined(voiceSignature) && !(_id match "drafts.*")]{_id, _type, name, voiceSignature}'
    url = f"{SANITY_API}/data/query/{SANITY_DATASET}?" + urllib.parse.urlencode({"query": query})
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {SANITY_TOKEN}"})
    try:
        with urllib.request.urlopen(req) as resp:
            _voice_signatures = json.loads(resp.read()).get("result", [])
    except Exception as e:
        print(f"  WARNING: Could not load voice signatures: {e}")
        _voice_signatures = []

    print(f"  Loaded {len(_voice_signatures)} voice signature(s)")
    return _voice_signatures


def match_speakers(enriched_data: dict) -> dict:
    """
    Match speaker embeddings against known voice signatures.
    Returns dict mapping SPEAKER_XX -> {name, sanity_id, confidence, needs_review}
    """
    signatures = load_voice_signatures()
    if not signatures:
        return {}

    speaker_embeddings = enriched_data.get("speaker_embeddings", {})
    if not speaker_embeddings:
        return {}

    matches = {}
    for speaker_label, embedding in speaker_embeddings.items():
        best_match = None
        best_score = 0.0

        for sig in signatures:
            score = cosine_similarity(embedding, sig.get("voiceSignature", []))
            if score > best_score:
                best_score = score
                best_match = sig

        if best_match and best_score >= 0.50:
            matches[speaker_label] = {
                "name": best_match["name"],
                "sanity_id": best_match["_id"],
                "sanity_type": best_match["_type"],
                "confidence": round(best_score, 3),
                "needs_review": best_score < 0.80,
            }
            status = "✓" if best_score >= 0.80 else "⚠ review"
            print(f"    {speaker_label} -> {best_match['name']} ({best_score:.2f}) {status}")
        else:
            score_str = f" (best: {best_score:.2f})" if best_match else ""
            print(f"    {speaker_label} -> unmatched{score_str}")

    return matches


# ============================================================
# Sanity integration
# ============================================================

def format_clip_time(seconds: float) -> str:
    """Format seconds as mm:ss for clip title."""
    m = int(seconds) // 60
    s = int(seconds) % 60
    return f"{m:02d}m{s:02d}s"


def sanity_mutate(doc: dict, dry_run: bool = True) -> str | None:
    """
    Create a document in Sanity via Mutations API.

    Generates a drafts. prefixed _id and sets it on the doc.
    If dry_run=True, prints what would be created without HTTP request.
    Returns doc_id on success, None on failure.
    """
    doc_id = f"drafts.{uuid.uuid4()}"
    doc["_id"] = doc_id

    if dry_run:
        print(f"  [DRY RUN] Would create: {doc_id} — {doc.get('title', 'untitled')}")
        return doc_id

    if not SANITY_TOKEN:
        print(f"  ERROR: SANITY_TOKEN not set — cannot create document")
        return None

    try:
        mutations = json.dumps({"mutations": [{"create": doc}]}).encode()
        req = urllib.request.Request(
            f"{SANITY_API}/data/mutate/{SANITY_DATASET}",
            data=mutations,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {SANITY_TOKEN}",
            },
            method="POST",
        )
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read())
            if "results" in data:
                print(f"  ✓ Created: {doc_id} — {doc.get('title', 'untitled')}")
                return doc_id
            else:
                print(f"  ✗ Failed: {data.get('error', data)}")
                return None
    except Exception as e:
        print(f"  ✗ Sanity mutation error: {e}")
        return None


def check_existing_b2key(b2_key: str) -> bool:
    """Check if a video document already exists in Sanity with this b2Key."""
    query = f'count(*[_type == "video" && b2Key == "{b2_key}"])'
    url = f"{SANITY_API}/data/query/{SANITY_DATASET}?query={urllib.parse.quote(query)}"
    try:
        req = urllib.request.Request(
            url,
            headers={"Authorization": f"Bearer {SANITY_TOKEN}"} if SANITY_TOKEN else {},
        )
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read())
            return data.get("result", 0) > 0
    except Exception:
        return False


def build_video_doc(pipeline_result: dict, enriched_data: dict, cdn_url: str, speaker_matches: dict = None) -> dict:
    """
    Build a Sanity video document from pipeline result and enriched JSON data.

    Does NOT set _id — sanity_mutate() assigns the drafts. prefixed id.
    """
    if speaker_matches is None:
        speaker_matches = {}
    source_file = enriched_data.get("source_file", "")

    # Extract day from source_file path (e.g., "Futuro MMXXV/raw/card-1/Day 1/C3460.MP4" -> "Day 1")
    day = "Unknown"
    for part in source_file.split("/"):
        if part.startswith("Day "):
            day = part
            break

    # Extract clip number from stem (e.g., "C3460_processed" -> "C3460")
    edited_b2_path = pipeline_result.get("edited_b2_path", "")
    stem = os.path.splitext(os.path.basename(edited_b2_path))[0].replace("_processed", "")
    if not stem:
        stem = pipeline_result.get("stem", "unknown")

    title = f"Futuro MMXXV — {day}, {stem}"

    # Transform speaker_segments to Sanity format with _key
    # Replace generic SPEAKER_XX with matched real names
    speaker_segments = []
    for s in enriched_data.get("speaker_segments", []):
        speaker_label = s["speaker"]
        match = speaker_matches.get(speaker_label)
        display_name = match["name"] if match else speaker_label
        speaker_segments.append({
            "_key": str(uuid.uuid4())[:8],
            "speaker": display_name,
            "start": s["start"],
            "end": s["end"],
            "text": s["text"],
        })

    # Build featuredIn from all matched speakers (deduplicated)
    seen_ids = set()
    featured_in = []
    for match in speaker_matches.values():
        if match["sanity_id"] not in seen_ids:
            seen_ids.add(match["sanity_id"])
            featured_in.append({
                "_key": str(uuid.uuid4())[:8],
                "_type": "reference",
                "_ref": match["sanity_id"],
            })

    doc = {
        "_type": "video",
        "title": title,
        "videoSource": "b2",
        "b2Key": pipeline_result["edited_b2_path"],
        "cdnUrl": cdn_url,
        "bunnyStatus": "ready",
        "language": [enriched_data.get("language", "es")],
        "videoFormat": "longform",
        "duration": enriched_data.get("duration_seconds"),
        "narrativeOwner": "hector",
        "platformTier": "canonical",
        "archivalStatus": "archival",
        "fullText": enriched_data.get("full_text", ""),
        "speakerSegments": speaker_segments,
    }

    if featured_in:
        doc["featuredIn"] = featured_in

    return doc


def build_clip_doc(clip: dict, parent_stem: str, enriched_data: dict, speaker_matches: dict = None) -> dict:
    """
    Build a Sanity video document for a speaker clip.

    Does NOT set _id — sanity_mutate() assigns the drafts. prefixed id.
    Uses voice signature matches to set real names, featuredIn, and confidence.
    """
    if speaker_matches is None:
        speaker_matches = {}

    speaker_label = clip.get("speaker", "")
    match = speaker_matches.get(speaker_label)
    display_name = match["name"] if match else speaker_label

    # Build descriptive title from transcript excerpt + speaker name
    clip_text = clip.get("text", "")
    if clip_text:
        words = clip_text.split()[:7]
        desc = " ".join(words)
        if len(clip_text.split()) > 7:
            desc += "..."
    else:
        start_fmt = format_clip_time(clip["start"])
        end_fmt = format_clip_time(clip["end"])
        desc = f"{start_fmt}–{end_fmt}"

    # Extract program and day from source_file for suffix
    source_file = enriched_data.get("source_file", "")
    program = ""
    day = ""
    for part in source_file.split("/"):
        if "Futuro" in part or "Kah" in part or "NeXT" in part:
            program = part
        if part.startswith("Day "):
            day = part

    title = f"{desc} — {display_name}"
    if program and day:
        title += f" — {program} — {day}"

    doc = {
        "_type": "video",
        "title": title,
        "videoSource": "b2",
        "b2Key": clip["b2_key"],
        "cdnUrl": clip["cdn_url"],
        "bunnyStatus": "ready",
        "language": [enriched_data.get("language", "es")],
        "videoFormat": "shortform",
        "duration": clip["duration"],
        "narrativeOwner": "hector",
        "platformTier": "canonical",
        "archivalStatus": "archival",
    }

    # featuredIn from match data
    if match:
        doc["featuredIn"] = [{
            "_key": str(uuid.uuid4())[:8],
            "_type": "reference",
            "_ref": match["sanity_id"],
        }]
        doc["speakerConfidence"] = match["confidence"]
        doc["needsReview"] = match["needs_review"]
    else:
        doc["featuredIn"] = []

    # Add clip text as description if present
    if clip_text:
        doc["description"] = clip_text[:500]

    return doc


def create_video_document(
    pipeline_result: dict,
    enriched_data: dict,
    cdn_url: str,
    dry_run: bool = True,
    speaker_matches: dict = None,
) -> str | None:
    """
    Create a Sanity draft video document from pipeline result.

    Skips creation if b2Key already exists in Sanity.
    Returns doc_id on success, None if skipped or failed.
    """
    b2_key = pipeline_result.get("edited_b2_path", "")
    if not dry_run and check_existing_b2key(b2_key):
        print(f"  ⏭ Already exists in Sanity (b2Key: {b2_key}) — skipping")
        return None

    doc = build_video_doc(pipeline_result, enriched_data, cdn_url, speaker_matches=speaker_matches)
    return sanity_mutate(doc, dry_run=dry_run)


def create_clip_documents(
    clips: list,
    parent_stem: str,
    enriched_data: dict,
    dry_run: bool = True,
    speaker_matches: dict = None,
) -> list:
    """
    Create Sanity draft video documents for each speaker clip.

    Skips clips whose b2Key already exists in Sanity.
    Returns list of created doc_ids.
    """
    doc_ids = []
    for clip in clips:
        # Duplicate prevention — skip if b2Key already exists
        b2_key = clip.get("b2_key", "")
        if not dry_run and b2_key and check_existing_b2key(b2_key):
            print(f"  ⏭ Clip already exists (b2Key: {b2_key}) — skipping")
            continue

        doc = build_clip_doc(clip, parent_stem, enriched_data, speaker_matches=speaker_matches)
        doc_id = sanity_mutate(doc, dry_run=dry_run)
        if doc_id:
            doc_ids.append(doc_id)
    return doc_ids


# ============================================================
# CLI
# ============================================================

def parse_pipeline_args(argv=None) -> Namespace:
    """Parse pipeline orchestrator CLI arguments."""
    parser = argparse.ArgumentParser(
        description="End-to-end video pipeline orchestrator.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python3 scripts/pipeline.py "Futuro MMXXV/raw/card-1/Day 1/C3460.MP4"
  python3 scripts/pipeline.py "Futuro MMXXV/raw/card-1/Day 1" --camera canon-r5-clog3
  python3 scripts/pipeline.py "path" --skip-upload
  python3 scripts/pipeline.py "path" --dry-run
  python3 scripts/pipeline.py "path" --live
        """
    )
    parser.add_argument(
        "b2_path",
        help="B2 path to raw video file or folder of raw videos"
    )
    parser.add_argument(
        "--camera",
        default="sony-a6700-slog3",
        choices=list(CAMERA_LUTS.keys()),
        help="Camera profile for LUT selection (default: sony-a6700-slog3)"
    )
    parser.add_argument(
        "--anamorphic",
        action="store_true",
        help="Apply 1.33x anamorphic desqueeze (Sirui 50mm lens footage)"
    )
    parser.add_argument(
        "--skip-transcribe",
        action="store_true",
        help="Encode only — skip Whisper transcription and speaker diarization"
    )
    parser.add_argument(
        "--skip-upload",
        action="store_true",
        help="Process locally only — do not upload to B2"
    )
    parser.add_argument(
        "--skip-sanity",
        action="store_true",
        help="Upload to B2 but do not create or update Sanity documents"
    )
    parser.add_argument(
        "--skip-clips",
        action="store_true",
        help="Encode and transcribe but skip speaker clip extraction"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Preview Sanity mutations without executing them"
    )
    parser.add_argument(
        "--live",
        action="store_true",
        help="Execute Sanity mutations (creates/updates documents)"
    )
    return parser.parse_args(argv)


# ============================================================
# Path derivation helpers
# ============================================================

def derive_b2_upload_path(raw_b2_path: str) -> str:
    """
    Convert a raw B2 path to the edited output path.

    Example:
        "Futuro MMXXV/raw/card-1/Day 1/C3460.MP4"
        -> "Futuro MMXXV/edited/card-1/Day 1/C3460_processed.mp4"
    """
    filename = os.path.basename(raw_b2_path)
    stem = os.path.splitext(filename)[0]
    processed_filename = f"{stem}_processed.mp4"
    # Replace /raw/ with /edited/ and swap the filename
    edited_path = raw_b2_path.replace("/raw/", "/edited/")
    # Replace old filename with new processed filename
    edited_path = edited_path[: edited_path.rfind("/") + 1] + processed_filename
    return edited_path


def _extract_event_prefix(raw_b2_path: str) -> str:
    """
    Extract the event prefix from a raw B2 path.

    Example:
        _extract_event_prefix("Kah Foundry XXVI/raw/135A3217.MP4")
        -> "Kah Foundry XXVI"

        _extract_event_prefix("Futuro MMXXV/raw/card-1/Day 1/C3460.MP4")
        -> "Futuro MMXXV"
    """
    if "/raw/" in raw_b2_path:
        return raw_b2_path.split("/raw/")[0]
    # Fallback: use first path segment
    return raw_b2_path.split("/")[0]


def derive_clips_b2_path(stem: str, clip_filename: str, event_prefix: str) -> str:
    """
    Derive the B2 upload path for a speaker clip.

    Clips go under: {event_prefix}/clips/{stem}/{clip_filename}

    Example:
        derive_clips_b2_path("C3460", "SPEAKER_00_00m00s-00m30s.mp4", "Futuro MMXXV")
        -> "Futuro MMXXV/clips/C3460/SPEAKER_00_00m00s-00m30s.mp4"

        derive_clips_b2_path("135A3217", "SPEAKER_00_00m00s-00m30s.mp4", "Kah Foundry XXVI")
        -> "Kah Foundry XXVI/clips/135A3217/SPEAKER_00_00m00s-00m30s.mp4"
    """
    return f"{event_prefix}/clips/{stem}/{clip_filename}"


def derive_cdn_url(b2_path: str) -> str:
    """
    Convert a B2 path to a CDN URL, encoding spaces as %20.

    Example:
        derive_cdn_url("Futuro MMXXV/edited/card-1/Day 1/C3460_processed.mp4")
        -> "https://benext.b-cdn.net/Futuro%20MMXXV/edited/card-1/Day%201/C3460_processed.mp4"
    """
    encoded = b2_path.replace(" ", "%20")
    return f"{CDN_BASE}/{encoded}"


# ============================================================
# Upload helpers
# ============================================================

def upload_clips_to_b2(stem: str, clips_dir: Path, event_prefix: str) -> list:
    """
    Upload all clip files listed in the manifest to B2.

    Reads manifest.json from clips_dir/{stem}/manifest.json.
    For each clip, uploads the file and updates the clip dict with:
    - cdn_url: CDN URL for the clip
    - b2_key: B2 path for the clip

    Returns the updated clips list.
    """
    manifest_path = clips_dir / stem / "manifest.json"
    if not manifest_path.exists():
        print(f"  WARNING: No manifest found at {manifest_path}")
        return []

    with open(manifest_path) as f:
        manifest = json.load(f)

    clips = manifest.get("clips", [])
    updated_clips = []

    for clip in clips:
        clip_filename = clip["file"]
        clip_local_path = clips_dir / stem / clip_filename
        clips_b2_path = derive_clips_b2_path(stem, clip_filename, event_prefix)

        print(f"  Uploading clip: {clip_filename} -> {clips_b2_path}")
        success = upload_to_b2(clip_local_path, clips_b2_path)

        if success:
            print(f"    ✓ Uploaded")
        else:
            print(f"    ✗ Upload failed")

        updated_clip = dict(clip)
        updated_clip["b2_key"] = clips_b2_path
        updated_clip["cdn_url"] = derive_cdn_url(clips_b2_path)
        updated_clips.append(updated_clip)

    # Update manifest with corrected CDN URLs
    manifest["clips"] = updated_clips
    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)

    return updated_clips


# ============================================================
# Pipeline runner
# ============================================================

def run_pipeline(b2_path: str, args: Namespace) -> dict:
    """
    Run the full pipeline for a single video file.

    Steps:
    1. Encode + transcribe + diarize (process_video)
    2. Extract speaker clips (process_transcript)
    3. Upload processed video and clips to B2
    4. Clean up local temp files

    Returns a result dict with metadata about what was done.
    On failure, returns partial result with error info.
    """
    print(f"\n{'='*70}")
    print(f"PIPELINE: {b2_path}")
    print(f"{'='*70}")

    result = {
        "b2_path": b2_path,
        "stem": None,
        "steps_completed": [],
        "error": None,
        "edited_b2_path": None,
        "edited_cdn_url": None,
        "clips": [],
    }

    event_prefix = _extract_event_prefix(b2_path)

    # Step 1: Encode + transcribe + diarize
    print(f"\n[STEP 1] Encode + Transcribe + Diarize")
    try:
        video_result = process_video(
            b2_path,
            camera=args.camera,
            anamorphic=args.anamorphic,
            skip_transcribe=args.skip_transcribe,
            skip_upload=args.skip_upload,
            skip_cleanup=True  # Keep processed file for clip extraction
        )
    except Exception as e:
        result["error"] = f"Step 1 (encode/transcribe) failed: {e}"
        print(f"  ✗ {result['error']}")
        return result

    if video_result is None:
        result["error"] = "Step 1 (encode/transcribe) failed — no result returned"
        return result

    if video_result.get("skipped"):
        print(f"  Already processed (skipped)")
        result["stem"] = video_result["stem"]
        result["steps_completed"].append("encode-skipped")
        # Still try to run clips and upload for re-runs
    else:
        result["stem"] = video_result["stem"]
        result["edited_b2_path"] = video_result.get("edited_b2_path")
        if result["edited_b2_path"]:
            result["edited_cdn_url"] = derive_cdn_url(result["edited_b2_path"])
        result["steps_completed"].append("encode")
        if not args.skip_transcribe:
            result["steps_completed"].append("transcribe")

    stem = result["stem"]
    processed_path = video_result.get("processed_path")

    # Step 2: Extract speaker clips
    if not args.skip_transcribe and not args.skip_clips:
        print(f"\n[STEP 2] Extract Speaker Clips")
        try:
            manifest = process_transcript(
                stem,
                video_path=processed_path if processed_path and processed_path.exists() else None
            )
            if manifest:
                result["steps_completed"].append("clip-extract")
                result["clips"] = manifest.get("clips", [])
                print(f"  ✓ {len(result['clips'])} clips extracted")
            else:
                print(f"  No clips extracted (no suitable segments)")
        except Exception as e:
            print(f"  ✗ Clip extraction failed: {e}")
            result["error"] = f"Step 2 (clip extraction) failed: {e}"
            # Continue — clip failure is non-fatal, still upload processed video
    else:
        print(f"\n[STEP 2] Clip extraction skipped")

    # Step 3: Upload clips to B2
    if not args.skip_upload and not args.skip_clips and result["clips"]:
        print(f"\n[STEP 3] Upload Clips to B2")
        try:
            updated_clips = upload_clips_to_b2(stem, CLIPS_DIR, event_prefix)
            result["clips"] = updated_clips
            result["steps_completed"].append("clip-upload")
        except Exception as e:
            print(f"  ✗ Clip upload failed: {e}")

    # Step 4: Create Sanity draft documents
    if not args.skip_sanity:
        if args.dry_run or args.live:
            dry_run = not args.live
            mode_label = "DRY RUN" if dry_run else "LIVE"
            print(f"\n[STEP 4] Create Sanity Documents ({mode_label})")

            # Read enriched JSON for transcript data
            enriched_path = OUTPUT_DIR / f"{stem}.enriched.json"
            enriched_data = {}
            if enriched_path.exists():
                try:
                    with open(enriched_path) as f:
                        enriched_data = json.load(f)
                except Exception as e:
                    print(f"  WARNING: Could not read enriched JSON: {e}")
            else:
                print(f"  WARNING: No enriched JSON found at {enriched_path}")

            cdn_url = result.get("edited_cdn_url", "")

            # Voice matching — identify speakers from signatures
            speaker_matches = {}
            if enriched_data.get("speaker_embeddings"):
                print(f"\n  [STEP 4a] Speaker Identification")
                speaker_matches = match_speakers(enriched_data)
                if speaker_matches:
                    print(f"  ✓ Matched {len(speaker_matches)} speaker(s)")

            # Create main video document
            if result.get("edited_b2_path"):
                try:
                    video_doc_id = create_video_document(
                        result, enriched_data, cdn_url, dry_run=dry_run,
                        speaker_matches=speaker_matches,
                    )
                    if video_doc_id:
                        result["sanity_video_doc_id"] = video_doc_id
                        result["steps_completed"].append("sanity-video-doc")
                except Exception as e:
                    print(f"  ✗ Video document creation failed: {e}")

            # Create clip documents
            if result["clips"]:
                try:
                    clip_doc_ids = create_clip_documents(
                        result["clips"], stem, enriched_data, dry_run=dry_run,
                        speaker_matches=speaker_matches,
                    )
                    result["sanity_clip_doc_ids"] = clip_doc_ids
                    if clip_doc_ids:
                        result["steps_completed"].append("sanity-clip-docs")
                    print(f"  ✓ {len(clip_doc_ids)} clip document(s) {('would be created' if dry_run else 'created')}")
                except Exception as e:
                    print(f"  ✗ Clip document creation failed: {e}")
        else:
            print(f"\n[STEP 4] Sanity document creation skipped (pass --dry-run or --live)")
    else:
        print(f"\n[STEP 4] Skipping Sanity document creation (--skip-sanity)")

    # Step 5: Clean up local temp files
    if processed_path and processed_path.exists():
        processed_path.unlink(missing_ok=True)
        print(f"\n[STEP 5] Cleaned up: {processed_path.name}")

    # Summary
    print(f"\n{'='*70}")
    print(f"PIPELINE COMPLETE: {stem}")
    print(f"  Steps: {', '.join(result['steps_completed'])}")
    if result["edited_cdn_url"]:
        print(f"  Video CDN URL: {result['edited_cdn_url']}")
    if result["clips"]:
        print(f"  Clips: {len(result['clips'])}")
    if result["error"]:
        print(f"  WARNING: {result['error']}")
    print(f"{'='*70}\n")

    return result


# ============================================================
# Main entry point
# ============================================================

def main():
    args = parse_pipeline_args()

    target = args.b2_path

    # Determine if target is a single file or folder
    is_video = any(target.lower().endswith(ext) for ext in VIDEO_EXTENSIONS)

    if is_video:
        videos = [target]
    else:
        print(f"Listing videos in folder: {target}")
        videos = list_videos(target)
        if not videos:
            print("No videos found.")
            sys.exit(0)

    print(f"\nFound {len(videos)} video(s)")
    lut_file = CAMERA_LUTS.get(args.camera, CAMERA_LUTS.get("default"))
    print(f"Camera: {args.camera} -> LUT: {lut_file or 'none'}")
    if args.anamorphic:
        print(f"Anamorphic: enabled (1.33x desqueeze)")
    if args.skip_transcribe:
        print(f"Transcription: skipped")
    if args.skip_upload:
        print(f"B2 upload: skipped (local processing only)")
    if args.skip_sanity:
        print(f"Sanity docs: skipped")
    if args.dry_run:
        print(f"Sanity mode: dry-run (preview mutations)")
    elif args.live:
        print(f"Sanity mode: live (executing mutations)")
    else:
        print(f"Sanity mode: none (use --dry-run or --live to create docs)")

    # Process each video
    successes = []
    failures = []

    for video in videos:
        try:
            video_result = run_pipeline(video, args)
            if video_result.get("error") and not video_result.get("steps_completed"):
                failures.append({"video": video, "error": video_result["error"]})
            else:
                successes.append(video_result)
        except Exception as e:
            print(f"\n  ✗ Unexpected error processing {video}: {e}")
            failures.append({"video": video, "error": str(e)})

    # Batch summary
    print(f"\n{'='*70}")
    print(f"BATCH COMPLETE")
    print(f"  Success: {len(successes)}/{len(videos)}")
    if failures:
        print(f"  Failures ({len(failures)}):")
        for f in failures:
            print(f"    - {f['video']}: {f['error']}")
    print(f"{'='*70}\n")

    if failures:
        sys.exit(1)


if __name__ == "__main__":
    main()
