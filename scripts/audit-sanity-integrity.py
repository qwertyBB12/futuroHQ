#!/usr/bin/env python3
"""
Sanity Data Integrity Audit Script
===================================
Single-pass audit for all B2 video Sanity documents.

Checks:
  1. b2Key existence in actual B2 bucket (via b2 ls --recursive)
  2. cdnUrl formula correctness (CDN_BASE + b2Key with %20 space encoding)
  3. Person tag (featuredIn) accuracy, cross-referencing .enriched.json per D-07

Per D-01: HTTP URL validation is deferred (Bunny CDN returns 401 expired_auth_token).
Per D-03: Single pass covers clips + longform for all 240 B2 video docs.
Per D-07: check_person_tags reads enriched JSON before concluding tags are wrong.
Per D-11: Targets docs with videoSource == "b2" regardless of draft/published state.
Per D-12: Re-running this audit after fixes is the verification method (success = 0 failures).

Usage:
    python3 scripts/audit-sanity-integrity.py
    python3 scripts/audit-sanity-integrity.py --json-out /tmp/audit.json
    python3 scripts/audit-sanity-integrity.py --enriched-dir transcripts/
"""

import os
import sys
import json
import argparse
import subprocess
import urllib.parse
import importlib.util
from pathlib import Path
from datetime import datetime, timezone

# ============================================================
# Constants
# ============================================================

SANITY_PROJECT = "fo6n8ceo"
SANITY_DATASET = "production"
SANITY_API = f"https://{SANITY_PROJECT}.api.sanity.io/v2024-01-01"
CDN_BASE = "https://benext.b-cdn.net"

SANITY_TOKEN = os.environ.get(
    "SANITY_TOKEN",
    "skEFnLU45b4KKa6gDE8kfuUIKsjreyPf8PIOU7iV3HNXLJPw8XMvpchg7KufBcU0nG9AOWXBMXRpKQCHQwyeHFhzel78vIleFyEsXCxRXpuQkDBKImrbqhLAH3MaZbqdN3A6SHY1BpN0ee8v4Kki2YUbFi1hDhK6bnbNv61dTj25RYh9GSxe",
)

ENRICHED_DIR = Path("transcripts")  # Default directory for .enriched.json files
OUTPUT_PATH = Path("transcripts/integrity-audit.json")

# ============================================================
# Import VIDEO_MAP from populate-sanity-videos.py
# (uses importlib because the filename has hyphens)
# ============================================================

def _load_video_map() -> dict:
    """Load VIDEO_MAP from populate-sanity-videos.py via importlib."""
    populate_path = Path(__file__).parent / "populate-sanity-videos.py"
    if not populate_path.exists():
        return {}
    spec = importlib.util.spec_from_file_location("populate_sanity_videos", populate_path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return getattr(mod, "VIDEO_MAP", {})


VIDEO_MAP = _load_video_map()

# ============================================================
# MMXIX Alumni Slugs — extracted from VIDEO_MAP
# These are all alumnus slugs that appear in MMXIX testimonial videos.
# MMXXV longform docs should NOT reference these alumni.
# ============================================================

MMXIX_ALUMNI_SLUGS = {
    "alistair-coll",
    "laura-miller",
    "nestor-gaytan",
    "felipe-eleta",
    "mateo-porras-bermudez",
    "pierina-diana",
    "ricardo-adames",
    "diego-hernandez",
    "diego-gordon",
    "mark-franklin",
    "maria-sofia",
    "samuel-rios",
    "santiago-ramirez-anguiano",
}


# ============================================================
# Sanity API
# ============================================================

def query_sanity(q: str) -> list | dict:
    """
    Query Sanity Content Lake via REST API.
    Returns the .result field (list of docs or a scalar).
    Per D-11: uses non-CDN API endpoint so draft documents are included.
    """
    url = f"{SANITY_API}/data/query/{SANITY_DATASET}?query={urllib.parse.quote(q)}"
    result = subprocess.run(
        ["curl", "-s", url, "-H", f"Authorization: Bearer {SANITY_TOKEN}"],
        capture_output=True,
        text=True,
    )
    try:
        data = json.loads(result.stdout)
        return data.get("result", [])
    except (json.JSONDecodeError, AttributeError):
        print(f"ERROR: Failed to parse Sanity response: {result.stdout[:200]}", file=sys.stderr)
        return []


# ============================================================
# B2 Inventory
# ============================================================

def list_b2_folder(path: str) -> list[str]:
    """
    List all .mp4 files in a B2 folder (recursive).
    Returns full relative paths (not including bucket name).
    """
    result = subprocess.run(
        ["b2", "ls", "--recursive", f"b2://hector-ecosystem-archive-prod/{path}"],
        capture_output=True,
        text=True,
    )
    lines = []
    for line in result.stdout.strip().split("\n"):
        line = line.strip()
        if line and line.lower().endswith(".mp4"):
            lines.append(line)
    return lines


def build_b2_inventory() -> set[str]:
    """
    Build a complete set of all .mp4 file paths in the 4 B2 video folders.
    Returns a set of relative paths (no bucket prefix).
    """
    folders = [
        "Futuro MMXIX/edited/",
        "Futuro MMXIX/clips/",
        "Futuro MMXXV/edited/",
        "Futuro MMXXV/clips/",
    ]
    all_files: set[str] = set()
    for folder in folders:
        print(f"  Listing B2: {folder}...")
        files = list_b2_folder(folder)
        print(f"    Found {len(files)} .mp4 files")
        all_files.update(files)
    return all_files


# ============================================================
# URL Integrity Check
# ============================================================

def check_url_integrity(doc: dict, b2_inventory: set) -> dict:
    """
    Check a document's b2Key and cdnUrl for integrity.

    Returns a dict with:
      - doc_id: the document _id
      - b2_exists: bool — whether b2Key is in the B2 inventory
      - cdn_formula_ok: bool — whether cdnUrl matches CDN_BASE + b2Key formula
      - issues: list of issue codes ("b2_not_found", "cdnurl_formula_mismatch")

    Per D-01: No HTTP HEAD calls (Bunny CDN returns 401 expired_auth_token).
              B2 existence via b2 ls is the primary signal.
    """
    b2_key = doc.get("b2Key", "")
    cdn_url = doc.get("cdnUrl", "")

    b2_exists = b2_key in b2_inventory
    expected_cdn = CDN_BASE + "/" + b2_key.replace(" ", "%20")
    cdn_formula_ok = cdn_url == expected_cdn

    issues = []
    if not b2_exists:
        issues.append("b2_not_found")
    if not cdn_formula_ok:
        issues.append("cdnurl_formula_mismatch")

    return {
        "doc_id": doc.get("_id", ""),
        "b2_exists": b2_exists,
        "cdn_formula_ok": cdn_formula_ok,
        "issues": issues,
    }


# ============================================================
# Document Categorization
# ============================================================

def categorize_documents(docs: list) -> dict:
    """
    Split docs into 4 categories by b2Key path prefix.

    Returns:
      {
        "mmxix_longform": [...],
        "mmxix_clips": [...],
        "mmxxv_longform": [...],
        "mmxxv_clips": [...],
      }
    """
    categories = {
        "mmxix_longform": [],
        "mmxix_clips": [],
        "mmxxv_longform": [],
        "mmxxv_clips": [],
    }
    for doc in docs:
        b2_key = doc.get("b2Key", "")
        if b2_key.startswith("Futuro MMXIX/edited/"):
            categories["mmxix_longform"].append(doc)
        elif b2_key.startswith("Futuro MMXIX/clips/"):
            categories["mmxix_clips"].append(doc)
        elif b2_key.startswith("Futuro MMXXV/edited/"):
            categories["mmxxv_longform"].append(doc)
        elif b2_key.startswith("Futuro MMXXV/clips/"):
            categories["mmxxv_clips"].append(doc)
        else:
            # Unknown category — include in mmxix_longform as fallback
            categories["mmxix_longform"].append(doc)
    return categories


# ============================================================
# Person Tag Helpers
# ============================================================

def build_person_slug_map(docs: list) -> dict:
    """
    Build a map of doc_id -> [slug1, slug2, ...] from dereferenced featuredIn data.

    Uses featuredIn[].slug.current if present, else featuredIn[].name as identifier.
    """
    slug_map: dict[str, list[str]] = {}
    for doc in docs:
        doc_id = doc.get("_id", "")
        featured_in = doc.get("featuredIn", []) or []
        slugs = []
        for ref in featured_in:
            if ref is None:
                continue
            slug_obj = ref.get("slug")
            if slug_obj and slug_obj.get("current"):
                slugs.append(slug_obj["current"])
            elif ref.get("name"):
                slugs.append(ref["name"])
        slug_map[doc_id] = slugs
    return slug_map


def load_enriched_speakers(stem: str, enriched_dir: Path) -> dict:
    """
    Load named_speakers from a .enriched.json file for a given source stem.

    Per D-07: reads actual diarization output to cross-reference speaker identification.

    Args:
        stem: Source video stem, e.g. "C3460" or "HB2_Laura"
        enriched_dir: Directory containing .enriched.json files

    Returns:
        dict of named_speakers (e.g., {"SPEAKER_00": "Laura Miller"}) or {} if:
          - file not found
          - named_speakers key is absent
          - named_speakers is empty
    """
    enriched_path = Path(enriched_dir) / f"{stem}.enriched.json"
    if not enriched_path.exists():
        return {}
    try:
        with open(enriched_path) as f:
            data = json.load(f)
        return data.get("named_speakers", {}) or {}
    except (json.JSONDecodeError, OSError):
        return {}


def check_person_tags(
    doc: dict,
    video_map: dict,
    mmxix_alumni_slugs: set,
    person_slug_map: dict,
    enriched_dir: Path = None,
) -> dict:
    """
    Check the person tag accuracy for a video document.

    Logic per D-07, D-08, D-09:

    MMXXV clips (b2Key starts with "Futuro MMXXV/clips/"):
      - Extract camera stem from b2Key (4th path segment, e.g. "C3460")
      - Read {enriched_dir}/{stem}.enriched.json -> named_speakers
      - If named_speakers is empty/absent: current featuredIn refs are unverifiable
        -> return "wrong_person_tags"
      - If named_speakers has entries: compare named slugs against actual featuredIn slugs
        -> mismatch = "wrong_person_tags", match = no issue

    MMXXV longform (b2Key starts with "Futuro MMXXV/edited/"):
      - If any featuredIn slug is in mmxix_alumni_slugs -> "mmxix_alumni_in_mmxxv"
        (flag for manual review, per D-08)

    MMXIX docs (b2Key starts with "Futuro MMXIX/"):
      - For clips: extract source stem (4th path segment) -> look up in video_map
      - For longform: extract filename -> look up in video_map
      - If video_map entry exists: compare expected slugs vs actual featuredIn slugs
      - Mismatch -> "person_tag_mismatch"

    Returns:
      {"doc_id": str, "issues": [...], "action": str|None, "reason": str|None}
    """
    if enriched_dir is None:
        enriched_dir = ENRICHED_DIR

    b2_key = doc.get("b2Key", "")
    doc_id = doc.get("_id", "")
    actual_slugs = set(person_slug_map.get(doc_id, []))

    # ── MMXXV clips ──────────────────────────────────────────
    if b2_key.startswith("Futuro MMXXV/clips/"):
        # b2Key format: "Futuro MMXXV/clips/{stem}/{clip}.mp4"
        # "Futuro MMXXV" is index 0 (contains space, not slash), so:
        # index 0 = "Futuro MMXXV", 1 = "clips", 2 = stem (e.g. "C3460"), 3 = clip filename
        parts = b2_key.split("/")
        stem = parts[2] if len(parts) > 2 else ""
        named_speakers = load_enriched_speakers(stem, enriched_dir)

        if not named_speakers:
            if not actual_slugs:
                # featuredIn is already empty AND no named_speakers — awaiting speaker identification
                # This is not a failure; the clip has been cleared and is pending enrichment.
                return {
                    "doc_id": doc_id,
                    "issues": ["pending_identification"],
                    "action": "informational",
                    "reason": (
                        f"MMXXV clip — featuredIn cleared, awaiting speaker identification "
                        f"(no named_speakers in enriched JSON for '{stem}')"
                    ),
                }
            else:
                # featuredIn has refs but no named_speakers — refs are unverifiable
                return {
                    "doc_id": doc_id,
                    "issues": ["wrong_person_tags"],
                    "action": "clear_and_flag",
                    "reason": (
                        f"MMXXV clip — enriched JSON for '{stem}' has no named_speakers; "
                        "current featuredIn refs are unverifiable (per D-07 cross-reference)"
                    ),
                }
        else:
            # named_speakers has entries — compare against actual featuredIn slugs
            # named_speakers values are person slugs or names; normalize to set
            expected_slugs = set(named_speakers.values())
            if expected_slugs != actual_slugs:
                return {
                    "doc_id": doc_id,
                    "issues": ["wrong_person_tags"],
                    "action": "update_tags",
                    "reason": (
                        f"MMXXV clip — named_speakers {list(expected_slugs)} "
                        f"does not match featuredIn slugs {list(actual_slugs)}"
                    ),
                }
            return {"doc_id": doc_id, "issues": [], "action": None, "reason": None}

    # ── MMXXV longform ───────────────────────────────────────
    if b2_key.startswith("Futuro MMXXV/edited/"):
        mmxix_refs_found = actual_slugs & mmxix_alumni_slugs
        if mmxix_refs_found:
            return {
                "doc_id": doc_id,
                "issues": ["mmxix_alumni_in_mmxxv"],
                "action": "flag_for_review",
                "reason": (
                    f"MMXXV longform has MMXIX-era alumni reference: "
                    f"{list(mmxix_refs_found)}"
                ),
            }
        return {"doc_id": doc_id, "issues": [], "action": None, "reason": None}

    # ── MMXIX clips ──────────────────────────────────────────
    if b2_key.startswith("Futuro MMXIX/clips/"):
        # b2Key format: "Futuro MMXIX/clips/{source_stem}/{clip}.mp4"
        # "Futuro MMXIX" is index 0, "clips" is index 1, source_stem is index 2
        parts = b2_key.split("/")
        source_stem = parts[2] if len(parts) > 2 else ""
        filename = source_stem + ".mp4"
        video_info = video_map.get(filename, {})
        expected_slugs = set(video_info.get("alumni", []) + video_info.get("collaborators", []))

        if expected_slugs and not expected_slugs.issubset(actual_slugs):
            return {
                "doc_id": doc_id,
                "issues": ["person_tag_mismatch"],
                "action": "review",
                "reason": (
                    f"MMXIX clip — VIDEO_MAP expected slugs {list(expected_slugs)} "
                    f"are not all present in featuredIn slugs {list(actual_slugs)}"
                ),
            }
        return {"doc_id": doc_id, "issues": [], "action": None, "reason": None}

    # ── MMXIX longform ───────────────────────────────────────
    if b2_key.startswith("Futuro MMXIX/edited/"):
        filename = b2_key.split("/")[-1]
        video_info = video_map.get(filename, {})
        expected_slugs = set(video_info.get("alumni", []) + video_info.get("collaborators", []))

        if expected_slugs and not expected_slugs.issubset(actual_slugs):
            return {
                "doc_id": doc_id,
                "issues": ["person_tag_mismatch"],
                "action": "review",
                "reason": (
                    f"MMXIX longform — VIDEO_MAP expected slugs {list(expected_slugs)} "
                    f"are not all present in featuredIn slugs {list(actual_slugs)}"
                ),
            }
        return {"doc_id": doc_id, "issues": [], "action": None, "reason": None}

    # Unknown pattern — no check possible
    return {"doc_id": doc_id, "issues": [], "action": None, "reason": None}


# ============================================================
# Console Summary Printer
# ============================================================

def print_summary_table(categories: dict, url_results: dict, person_results: dict):
    """Print a human-readable summary table to stdout."""
    header = f"{'Category':<22} {'Total':>7} {'URL OK':>8} {'Person OK':>10} {'Issues':>8}"
    print("\n" + "=" * 60)
    print("INTEGRITY AUDIT SUMMARY")
    print("=" * 60)
    print(header)
    print("-" * 60)

    category_labels = {
        "mmxix_longform": "MMXIX Longform",
        "mmxix_clips": "MMXIX Clips",
        "mmxxv_longform": "MMXXV Longform",
        "mmxxv_clips": "MMXXV Clips",
    }

    total_docs = 0
    total_url_ok = 0
    total_person_ok = 0
    total_issues = 0

    for cat_key, label in category_labels.items():
        docs = categories.get(cat_key, [])
        n = len(docs)
        url_ok = sum(1 for d in docs if not url_results.get(d["_id"], {}).get("issues"))
        person_ok = sum(1 for d in docs if not person_results.get(d["_id"], {}).get("issues"))
        issues = n - url_ok + (n - person_ok)
        print(f"{label:<22} {n:>7} {url_ok:>8} {person_ok:>10} {issues:>8}")
        total_docs += n
        total_url_ok += url_ok
        total_person_ok += person_ok
        total_issues += issues

    print("-" * 60)
    print(f"{'TOTAL':<22} {total_docs:>7} {total_url_ok:>8} {total_person_ok:>10} {total_issues:>8}")
    print("=" * 60)


def print_failures(failures: list, manual_review: list):
    """Print detailed failure and manual review entries."""
    if failures:
        print(f"\n=== URL / INTEGRITY FAILURES ({len(failures)}) ===")
        for f in failures:
            print(f"  [{f.get('doc_id', '')}] {f.get('title', '')} :: {f.get('issues', [])}")
            print(f"    b2Key: {f.get('b2Key', '')}")

    if manual_review:
        print(f"\n=== FLAGGED FOR MANUAL REVIEW ({len(manual_review)}) ===")
        for m in manual_review:
            print(f"  [{m.get('doc_id', '')}] {m.get('title', '')}")
            print(f"    Reason: {m.get('reason', '')}")


# ============================================================
# Main
# ============================================================

def main():
    parser = argparse.ArgumentParser(
        description="Sanity Data Integrity Audit — single-pass B2 video document check"
    )
    parser.add_argument(
        "--json-out",
        default=str(OUTPUT_PATH),
        help=f"Path for JSON output (default: {OUTPUT_PATH})",
    )
    parser.add_argument(
        "--enriched-dir",
        default=str(ENRICHED_DIR),
        help=f"Directory containing .enriched.json files (default: {ENRICHED_DIR})",
    )
    parser.add_argument(
        "--skip-b2",
        action="store_true",
        help="Skip B2 inventory listing (faster, skips b2_not_found check)",
    )
    args = parser.parse_args()

    enriched_dir = Path(args.enriched_dir)
    json_out = Path(args.json_out)

    print("=" * 60)
    print("SANITY DATA INTEGRITY AUDIT")
    print(f"Project: {SANITY_PROJECT} / {SANITY_DATASET}")
    print(f"Enriched dir: {enriched_dir}")
    print(f"JSON output: {json_out}")
    print("=" * 60)

    # Step 1: Fetch all B2 video documents from Sanity
    print("\n[1/4] Fetching all B2 video documents from Sanity...")
    groq_query = (
        '*[_type == "video" && videoSource == "b2"]'
        '{_id, title, b2Key, cdnUrl, featuredIn[]->{_id, _type, slug, name}, videoFormat}'
    )
    docs = query_sanity(groq_query)
    if not docs:
        print("ERROR: No documents returned from Sanity. Check SANITY_TOKEN and network.", file=sys.stderr)
        sys.exit(1)
    print(f"  Found {len(docs)} video documents with videoSource == 'b2'")

    # Step 2: Build B2 inventory
    if args.skip_b2:
        print("\n[2/4] Skipping B2 inventory (--skip-b2 flag set)")
        b2_inventory: set[str] = set()
    else:
        print("\n[2/4] Building B2 file inventory (b2 ls --recursive on 4 folders)...")
        b2_inventory = build_b2_inventory()
        print(f"  Total B2 .mp4 files found: {len(b2_inventory)}")

    # Step 3: Categorize documents
    print("\n[3/4] Categorizing documents and running checks...")
    categories = categorize_documents(docs)
    for cat, cat_docs in categories.items():
        print(f"  {cat}: {len(cat_docs)} docs")

    # Step 4: Check each document
    person_slug_map = build_person_slug_map(docs)
    url_results: dict[str, dict] = {}
    person_results: dict[str, dict] = {}
    failures: list[dict] = []
    manual_review: list[dict] = []
    informational: list[dict] = []

    for doc in docs:
        doc_id = doc.get("_id", "")

        # URL / B2 existence check
        url_result = check_url_integrity(doc, b2_inventory)
        url_results[doc_id] = url_result

        # Person tag check
        person_result = check_person_tags(
            doc, VIDEO_MAP, MMXIX_ALUMNI_SLUGS, person_slug_map, enriched_dir=enriched_dir
        )
        person_results[doc_id] = person_result

        # Collect failures, review items, and informational items
        all_issues = url_result.get("issues", []) + person_result.get("issues", [])
        action = person_result.get("action")

        if action == "flag_for_review":
            manual_review.append({
                "doc_id": doc_id,
                "title": doc.get("title", ""),
                "b2Key": doc.get("b2Key", ""),
                "reason": person_result.get("reason", ""),
            })
        elif action == "informational":
            # pending_identification and similar — not failures, not manual review
            informational.append({
                "doc_id": doc_id,
                "title": doc.get("title", ""),
                "b2Key": doc.get("b2Key", ""),
                "issues": person_result.get("issues", []),
                "reason": person_result.get("reason", ""),
            })
        elif all_issues:
            failures.append({
                "doc_id": doc_id,
                "title": doc.get("title", ""),
                "b2Key": doc.get("b2Key", ""),
                "issues": all_issues,
                "details": {
                    "url": url_result,
                    "person": person_result,
                },
            })

    # Step 4: Print summary
    print("\n[4/4] Audit complete.")
    print_summary_table(categories, url_results, person_results)
    print_failures(failures, manual_review)

    if informational:
        print(f"\n=== INFORMATIONAL — PENDING IDENTIFICATION ({len(informational)}) ===")
        for item in informational:
            print(f"  [{item.get('doc_id', '')}] {item.get('title', '')}")
            print(f"    Reason: {item.get('reason', '')}")

    # Step 5: Write JSON output
    audit_result = {
        "generated": datetime.now(timezone.utc).isoformat(),
        "summary": {
            "total_docs": len(docs),
            "url_failures": sum(1 for r in url_results.values() if r.get("issues")),
            "person_tag_issues": sum(1 for r in person_results.values() if r.get("issues")),
            "manual_review_count": len(manual_review),
            "informational_count": len(informational),
        },
        "failures": failures,
        "manual_review": manual_review,
        "informational": informational,
    }

    json_out.parent.mkdir(parents=True, exist_ok=True)
    with open(json_out, "w") as f:
        json.dump(audit_result, f, indent=2)
    print(f"\nJSON output written to: {json_out}")

    # Exit code: 0 if zero failures, 1 if failures found
    # Note: informational items do NOT count as failures
    n_failures = len(failures)
    if n_failures == 0 and len(manual_review) == 0:
        print("\nAudit result: CLEAN — no issues found.")
        if informational:
            print(f"  ({len(informational)} clips pending speaker identification — not failures)")
        sys.exit(0)
    else:
        print(f"\nAudit result: {n_failures} failure(s), {len(manual_review)} items for manual review.")
        if informational:
            print(f"  ({len(informational)} clips pending speaker identification — not failures)")
        sys.exit(1 if n_failures > 0 else 0)


if __name__ == "__main__":
    main()
