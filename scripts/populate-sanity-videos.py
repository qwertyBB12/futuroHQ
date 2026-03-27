#!/usr/bin/env python3
"""
Populate Sanity with video documents from B2 edited videos.
Maps HB filenames to alumni/collaborator/ledgerPerson references.
Creates video documents with CDN URLs, transcripts, and person tags.

Usage:
    python3 scripts/populate-sanity-videos.py --dry-run    # preview only
    python3 scripts/populate-sanity-videos.py --live        # create documents
"""

import sys
import os
import json
import subprocess
import uuid
from pathlib import Path

SANITY_PROJECT = "fo6n8ceo"
SANITY_DATASET = "production"
SANITY_API = f"https://{SANITY_PROJECT}.api.sanity.io/v2024-01-01"
CDN_BASE = "https://benext.b-cdn.net"
TRANSCRIPT_DIR = Path("/Users/hectorhlopez/projects/clean-studio/transcripts")
CLIPS_DIR = Path("/Users/hectorhlopez/projects/clean-studio/clips")

# Read Sanity token from env or use API key
SANITY_TOKEN = os.environ.get("SANITY_TOKEN", "skEFnLU45b4KKa6gDE8kfuUIKsjreyPf8PIOU7iV3HNXLJPw8XMvpchg7KufBcU0nG9AOWXBMXRpKQCHQwyeHFhzel78vIleFyEsXCxRXpuQkDBKImrbqhLAH3MaZbqdN3A6SHY1BpN0ee8v4Kki2YUbFi1hDhK6bnbNv61dTj25RYh9GSxe")

# ============================================================
# FILENAME → PERSON MAPPING
# Maps HB video filenames to Sanity document references
# ============================================================

# Format: filename_pattern → { "people": [...refs], "orgs": [...refs], "title": "..." }
VIDEO_MAP = {
    "HB_ALISTAIR_ahq12.mp4": {
        "title": "Alistair Coll — Futuro MMXIX Testimonial",
        "alumni": ["alistair-coll"],
        "language": "en",
    },
    "HB2_Laura.mp4": {
        "title": "Laura Miller — Futuro MMXIX Testimonial",
        "alumni": ["laura-miller"],
        "language": "en",
    },
    "HB2_Nestor.mp4": {
        "title": "Nestor Gaytan — Futuro MMXIX Testimonial",
        "alumni": ["nestor-gaytan"],
        "language": "en",
    },
    "HB2_felipe.mp4": {
        "title": "Felipe Eleta — Futuro MMXIX Testimonial",
        "alumni": ["felipe-eleta"],
        "language": "es",
    },
    "HB2_paisa.mp4": {
        "title": "Javier Lezcano — Futuro MMXIX Testimonial",
        "alumni": ["javier-lezcano"],
        "language": "es",
    },
    "HB2_pierina.mp4": {
        "title": "Pierina Diana — Futuro MMXIX Testimonial",
        "alumni": ["pierina-diana"],
        "language": "es",
    },
    "HB_RICARDO ADAMES_ahq12.mp4": {
        "title": "Ricardo Adames — Futuro MMXIX Testimonial",
        "alumni": ["ricardo-adames"],
        "language": "es",
    },
    "HB_DIEGOMTY_ahq12.mp4": {
        "title": "Diego Gracia — Futuro MMXIX Testimonial",
        "alumni": ["diego-gracia"],
        "language": "es",
    },
    "HB_Diego.mp4": {
        "title": "Diego Gordon — Futuro MMXIX Testimonial",
        "alumni": ["diego-gordon"],
        "language": "es",
    },
    "HB_GORDON_ahq12.mp4": {
        "title": "Diego Gordon — Futuro MMXIX Extended",
        "alumni": ["diego-gordon"],
        "language": "es",
    },
    "HB_Male.mp4": {
        "title": "Maria Alexandra Sheppard — Futuro MMXIX Testimonial",
        "alumni": ["maria-alexandra-sheppard"],
        "language": "es",
    },
    "HB_Nestor.mp4": {
        "title": "Nestor Gaytan — Futuro MMXIX Extended",
        "alumni": ["nestor-gaytan"],
        "language": "es",
    },
    "HB_MASO_ahq12.mp4": {
        "title": "Maria Sofia — Futuro MMXIX Testimonial",
        "alumni": ["maria-sofia"],
        "language": "es",
    },
    "HB_rockero.mp4": {
        "title": "Samuel Rios — Futuro MMXIX Testimonial",
        "alumni": ["samuel-rios"],
        "language": "es",
    },
    "HB_puebla.mp4": {
        "title": "Claudia Concepcion — Futuro MMXIX Testimonial",
        "alumni": ["claudia-concepcion"],
        "language": "es",
    },
    # Multi-speaker / Organization videos
    "HB2_OAS PARTNER 4K_ahq12.mp4": {
        "title": "OAS Secretary General Meeting — Futuro MMXIX",
        "collaborators": ["organization-of-american-states-oas"],
        "ledger": ["Luis Almagro"],
        "language": "es",
        "multi_speaker": True,
    },
    "HB_smithsonian_ahq12.mp4": {
        "title": "Smithsonian Institution Visit — Futuro MMXIX",
        "collaborators": ["smithsonian"],
        "ledger": ["Dr. Peter Jakab"],
        "language": "en",
        "multi_speaker": True,
    },
    "HB_ ej final_ahq12.mp4": {
        "title": "EarthJustice Meeting — Futuro MMXIX",
        "collaborators": ["earthjustice"],
        "ledger": ["Raul Garcia"],
        "language": "es",
        "multi_speaker": True,
    },
    "HB_LOC_ahq12.mp4": {
        "title": "Library of Congress Visit — Futuro MMXIX",
        "collaborators": ["us-library-of-congress"],
        "ledger": ["Carlos Olave"],
        "language": "en",
        "multi_speaker": True,
    },
    "HB_MCIf_ahq12.mp4": {
        "title": "Mexican Cultural Institute — Futuro MMXIX",
        "collaborators": ["mexican-cultural-institute"],
        "language": "es",
        "multi_speaker": True,
    },
    "HB_g20_apo8_ahq12.mp4": {
        "title": "G20 Event — Futuro MMXIX",
        "collaborators": ["g20"],
        "language": "es",
        "multi_speaker": True,
    },
    "HB_DR_f_ahq12.mp4": {
        "title": "Dominican Republic Embassy — Futuro MMXIX",
        "collaborators": ["embassy-of-the-dominican-republic-washington-dc"],
        "ledger": ["Jose Tomas Perez"],
        "language": "es",
        "multi_speaker": True,
    },
    "HB_mxF_ahq12.mp4": {
        "title": "Embassy of Mexico — Futuro MMXIX",
        "collaborators": ["embassy-of-mexico-washington-dc"],
        "language": "es",
        "multi_speaker": True,
    },
    "HB_hoya fla_apo8_ahq12.mp4": {
        "title": "Georgetown University — Futuro MMXIX",
        "collaborators": ["georgetown-university"],
        "language": "en",
        "multi_speaker": True,
    },
    # Unidentified
    "HB_Untitled_ahq12.mp4": {
        "title": "Untitled — Futuro MMXIX",
        "unmatched": True,
        "language": "es",
    },
    "hb_4k final.mp4": {
        "title": "Futuro MMXIX — Full Program (4K)",
        "multi_speaker": True,
        "language": "es",
    },
}

# Slug → Sanity _id cache
_slug_to_id = {}


def get_sanity_id_by_slug(slug: str, doc_types: list) -> str | None:
    """Look up Sanity document _id by slug"""
    if slug in _slug_to_id:
        return _slug_to_id[slug]

    types_str = ",".join(f'"{t}"' for t in doc_types)
    query = f'*[_type in [{types_str}] && slug.current == "{slug}"][0]._id'
    import urllib.parse
    url = f"{SANITY_API}/data/query/{SANITY_DATASET}?query={urllib.parse.quote(query)}"
    result = subprocess.run(["curl", "-s", url], capture_output=True, text=True)
    data = json.loads(result.stdout)
    doc_id = data.get("result")
    if doc_id:
        _slug_to_id[slug] = doc_id
    return doc_id


def get_sanity_id_by_name(name: str, doc_types: list) -> str | None:
    """Look up Sanity document _id by name (for ledgerPerson which may lack slugs)"""
    cache_key = f"name:{name}"
    if cache_key in _slug_to_id:
        return _slug_to_id[cache_key]

    types_str = ",".join(f'"{t}"' for t in doc_types)
    # Search both name and fullName fields
    query = f'*[_type in [{types_str}] && (name match "{name}*" || fullName match "{name}*")][0]._id'
    import urllib.parse
    url = f"{SANITY_API}/data/query/{SANITY_DATASET}?query={urllib.parse.quote(query)}"
    result = subprocess.run(["curl", "-s", url], capture_output=True, text=True)
    data = json.loads(result.stdout)
    doc_id = data.get("result")
    if doc_id:
        _slug_to_id[cache_key] = doc_id
    return doc_id


def build_references(video_info: dict) -> list:
    """Build Sanity reference array for featuredContent"""
    refs = []

    for slug in video_info.get("alumni", []):
        doc_id = get_sanity_id_by_slug(slug, ["alumni"])
        if doc_id:
            refs.append({"_type": "reference", "_ref": doc_id, "_key": str(uuid.uuid4())[:8]})
        else:
            print(f"    ⚠ Alumni not found: {slug}")

    for slug in video_info.get("collaborators", []):
        doc_id = get_sanity_id_by_slug(slug, ["collaborator"])
        if doc_id:
            refs.append({"_type": "reference", "_ref": doc_id, "_key": str(uuid.uuid4())[:8]})
        else:
            print(f"    ⚠ Collaborator not found: {slug}")

    for name_query in video_info.get("ledger", []):
        doc_id = get_sanity_id_by_name(name_query, ["ledgerPerson"])
        if doc_id:
            refs.append({"_type": "reference", "_ref": doc_id, "_key": str(uuid.uuid4())[:8]})
        else:
            print(f"    ⚠ LedgerPerson not found: {name_query}")

    return refs


def build_video_document(filename: str, b2_path: str, video_info: dict) -> dict:
    """Build a Sanity video document"""
    stem = os.path.splitext(filename)[0]
    cdn_url = f"{CDN_BASE}/{b2_path.replace(' ', '%20')}"

    doc = {
        "_type": "video",
        "title": video_info.get("title", stem),
        "videoSource": "b2",
        "b2Key": b2_path,
        "cdnUrl": cdn_url,
        "bunnyStatus": "ready",
        "language": [video_info.get("language", "es")],
        "videoFormat": "longform",
        # Governance defaults
        "narrativeOwner": "hector",
        "platformTier": "canonical",
        "archivalStatus": "archival",
    }

    # Add person references as featuredIn
    refs = build_references(video_info)
    if refs:
        doc["featuredIn"] = refs

    # Add transcript if available
    transcript_file = TRANSCRIPT_DIR / f"{stem}.txt"
    if transcript_file.exists():
        text = transcript_file.read_text().strip()
        if text:
            doc["description"] = text[:500]  # First 500 chars as description

    return doc


def check_existing_b2key(b2_key: str) -> bool:
    """Check if a video document already exists in Sanity with this b2Key"""
    import urllib.parse
    query = f'count(*[_type == "video" && b2Key == "{b2_key}"])'
    url = f"{SANITY_API}/data/query/{SANITY_DATASET}?query={urllib.parse.quote(query)}"
    result = subprocess.run(["curl", "-s", url, "-H", f"Authorization: Bearer {SANITY_TOKEN}"],
                           capture_output=True, text=True)
    try:
        data = json.loads(result.stdout)
        return data.get("result", 0) > 0
    except (json.JSONDecodeError, KeyError):
        return False


def create_sanity_document(doc: dict, dry_run: bool = True) -> str | None:
    """Create a document in Sanity via Mutations API"""
    # Skip if document already exists with this b2Key
    if not dry_run and check_existing_b2key(doc.get("b2Key", "")):
        print(f"    ⏭ Already exists in Sanity — skipping")
        return None

    doc_id = f"drafts.{uuid.uuid4()}"
    doc["_id"] = doc_id

    if dry_run:
        print(f"    [DRY RUN] Would create: {doc_id}")
        return doc_id

    mutations = {"mutations": [{"create": doc}]}
    result = subprocess.run(
        ["curl", "-s", "-X", "POST",
         f"{SANITY_API}/data/mutate/{SANITY_DATASET}",
         "-H", "Content-Type: application/json",
         "-H", f"Authorization: Bearer {SANITY_TOKEN}",
         "-d", json.dumps(mutations)],
        capture_output=True, text=True
    )
    response = json.loads(result.stdout) if result.stdout else {}
    if "results" in response:
        print(f"    ✓ Created: {doc_id}")
        return doc_id
    else:
        print(f"    ✗ Failed: {response.get('error', response)}")
        return None


# ============================================================
# B2 FOLDERS TO SCAN
# Each entry: (b2_path, event_label, auto_generate)
# auto_generate=True creates generic entries for unmapped files
# ============================================================
B2_SOURCES = [
    ("Futuro MMXIX/edited/", "Futuro MMXIX", False),
    ("Futuro MMXXV/edited/", "Futuro MMXXV", True),
]


def generate_mmxxv_info(filename: str, b2_path: str) -> dict:
    """Auto-generate video info for MMXXV camera-numbered files.
    Extracts day number from B2 path and creates descriptive title."""
    stem = os.path.splitext(filename)[0]

    # Skip version variants (v2, v3, v4) — only use _processed or latest
    if "_v2" in stem or "_v3" in stem or "_v4" in stem:
        return None

    # Extract day from path (e.g., "card-1/Day 1/C3460_processed.mp4")
    day = "Unknown"
    for part in b2_path.split("/"):
        if part.startswith("Day "):
            day = part
            break

    clip_number = stem.replace("_processed", "")
    return {
        "title": f"Futuro MMXXV — {day}, {clip_number}",
        "language": "es",
        "unmatched": True,  # Needs manual speaker identification
    }


def main():
    dry_run = "--live" not in sys.argv
    if dry_run:
        print("=== DRY RUN MODE (use --live to create documents) ===\n")
    else:
        if not SANITY_TOKEN:
            print("ERROR: Set SANITY_TOKEN environment variable")
            print("Get a token from: https://www.sanity.io/manage/project/fo6n8ceo/api#tokens")
            sys.exit(1)

    unmatched_log = []
    created = 0
    skipped = 0

    for b2_folder, event_label, auto_generate in B2_SOURCES:
        print(f"\n{'='*50}")
        print(f"  Scanning: {event_label}")
        print(f"{'='*50}")

        # List edited videos from B2
        result = subprocess.run(
            ["b2", "ls", "--recursive", f"b2://hector-ecosystem-archive-prod/{b2_folder}"],
            capture_output=True, text=True
        )
        b2_files = [l.strip() for l in result.stdout.strip().split("\n")
                    if l.strip() and not l.strip().endswith(".bzEmpty")]

        # Filter to video files only
        video_extensions = {".mp4", ".mov", ".MP4", ".MOV"}
        b2_files = [f for f in b2_files if any(f.lower().endswith(ext.lower()) for ext in video_extensions)]

        print(f"Found {len(b2_files)} edited videos in B2")

        for b2_path in b2_files:
            filename = b2_path.split("/")[-1]
            print(f"\n{filename}")

            if filename in VIDEO_MAP:
                info = VIDEO_MAP[filename]
                if info.get("unmatched"):
                    print(f"  ⚠ Unmatched video — needs manual identification")
                    unmatched_log.append({
                        "filename": filename,
                        "b2_path": b2_path,
                        "event": event_label,
                        "reason": "No person mapping in VIDEO_MAP"
                    })
                doc = build_video_document(filename, b2_path, info)
                result = create_sanity_document(doc, dry_run)
                if result:
                    created += 1
            elif auto_generate:
                # Auto-generate entry for camera-numbered files
                info = generate_mmxxv_info(filename, b2_path)
                if info is None:
                    print(f"  ⏭ Skipping version variant")
                    skipped += 1
                    continue
                print(f"  📎 Auto-generated: {info['title']}")
                unmatched_log.append({
                    "filename": filename,
                    "b2_path": b2_path,
                    "event": event_label,
                    "reason": "Auto-generated — needs speaker identification"
                })
                doc = build_video_document(filename, b2_path, info)
                result = create_sanity_document(doc, dry_run)
                if result:
                    created += 1
            else:
                print(f"  ⚠ Not in VIDEO_MAP — skipping")
                unmatched_log.append({
                    "filename": filename,
                    "b2_path": b2_path,
                    "event": event_label,
                    "reason": "Not in VIDEO_MAP dictionary"
                })
                skipped += 1

    # Report
    print(f"\n{'='*50}")
    print(f"SUMMARY")
    print(f"{'='*50}")
    print(f"Created: {created}")
    print(f"Skipped: {skipped}")
    print(f"Unmatched: {len(unmatched_log)}")

    if unmatched_log:
        print(f"\n=== UNMATCHED PERSONS LOG ===")
        print("These need manual identification or new Sanity entries:")
        for item in unmatched_log:
            print(f"  - {item['filename']}: {item['reason']}")

        # Save unmatched log
        log_path = Path("/Users/hectorhlopez/projects/clean-studio/transcripts/unmatched-persons.json")
        with open(log_path, "w") as f:
            json.dump(unmatched_log, f, indent=2)
        print(f"\nFull log saved to: {log_path}")


if __name__ == "__main__":
    main()
