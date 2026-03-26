#!/usr/bin/env python3
"""
Sanity Data Integrity Fix Script
=================================
Consumes audit JSON output from audit-sanity-integrity.py and patches
Sanity documents to correct identified integrity issues.

Checks handled:
  1. wrong_person_tags: clears featuredIn to empty array on MMXXV clip docs
  2. cdnurl_formula_mismatch: rebuilds cdnUrl from b2Key using CDN_BASE formula
  3. b2_not_found: flags for manual investigation (no auto-patch)

Per D-08: manual_review items (MMXXV longform with MMXIX-era alumni) are NOT
          auto-patched — only failures list is acted upon.
Per D-10: dry-run mode by default; must pass --live to apply patches.
Per D-11: patches target document _id as-is (includes 'drafts.' prefix).
Per D-12: re-run audit-sanity-integrity.py after fix to verify zero failures.

Usage:
    python3 scripts/fix-sanity-integrity.py
    python3 scripts/fix-sanity-integrity.py --audit-file transcripts/integrity-audit.json
    python3 scripts/fix-sanity-integrity.py --audit-file transcripts/integrity-audit.json --live
"""

import os
import sys
import json
import time
import argparse
import subprocess
import urllib.parse
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

DEFAULT_AUDIT_FILE = "transcripts/integrity-audit.json"
RATE_LIMIT_EVERY = 25      # Sleep every N patches
RATE_LIMIT_SLEEP = 0.5     # Seconds to sleep (Sanity free tier ~100 req/s)


# ============================================================
# Core Functions
# ============================================================

def load_audit_results(path: str | Path) -> dict:
    """
    Load and validate audit JSON from audit-sanity-integrity.py output.

    Args:
        path: Path to integrity-audit.json

    Returns:
        Parsed dict with "failures" and "summary" keys.

    Raises:
        FileNotFoundError: if file does not exist
        ValueError: if JSON is missing required keys
    """
    path = Path(path)
    if not path.exists():
        raise FileNotFoundError(f"Audit file not found: {path}")

    with open(path) as f:
        data = json.load(f)

    for required_key in ("failures", "summary"):
        if required_key not in data:
            raise ValueError(f"Audit JSON missing required key: '{required_key}'")

    return data


def build_fix_plan(audit_data: dict) -> list[dict]:
    """
    Build a list of fix actions from audit failures.

    Per D-08: manual_review items are NOT included — they are report-only.

    Each fix action is a dict:
      {
        "doc_id": str,
        "patches": dict | None,   # None means no auto-patch possible
        "action": str,            # "clear_featured_in" | "fix_cdnurl" | "flag_b2_missing"
        "note": str,              # optional human-readable note
      }

    Args:
        audit_data: Parsed audit JSON dict (from load_audit_results)

    Returns:
        List of fix action dicts
    """
    fix_plan = []

    for failure in audit_data.get("failures", []):
        doc_id = failure["doc_id"]
        issues = failure.get("issues", [])
        b2_key = failure.get("b2Key", "")

        if "wrong_person_tags" in issues:
            # D-09: clear featuredIn on MMXXV clips — all current refs are wrong/unverifiable
            fix_plan.append({
                "doc_id": doc_id,
                "patches": {"featuredIn": []},
                "action": "clear_featured_in",
                "note": f"Clearing wrong person tags — D-07 enriched JSON has no named_speakers for this clip",
            })

        elif "cdnurl_formula_mismatch" in issues:
            # Rebuild cdnUrl from b2Key using CDN_BASE formula with %20 encoding
            correct_cdn_url = CDN_BASE + "/" + b2_key.replace(" ", "%20")
            fix_plan.append({
                "doc_id": doc_id,
                "patches": {"cdnUrl": correct_cdn_url},
                "action": "fix_cdnurl",
                "note": f"Rebuilding cdnUrl from b2Key: {b2_key!r}",
            })

        elif "b2_not_found" in issues:
            # Cannot auto-fix — file is missing from B2 bucket
            fix_plan.append({
                "doc_id": doc_id,
                "patches": None,
                "action": "flag_b2_missing",
                "note": "File not in B2 — manual investigation required",
            })

    # Per D-08: manual_review items are skipped entirely (no auto-patching)
    # They are reported by the audit but not acted upon here.

    return fix_plan


def patch_sanity_document(doc_id: str, patches: dict, dry_run: bool = True) -> bool:
    """
    Apply a patch to a Sanity document via Mutations API.

    Per D-10: dry_run=True shows what would change without mutating.
    Per D-11: doc_id includes 'drafts.' prefix — patches target draft docs.

    Args:
        doc_id: Sanity document _id (e.g., "drafts.abc123")
        patches: Dict of field->value to set (e.g., {"featuredIn": []})
        dry_run: If True, print message only. If False, call Sanity API.

    Returns:
        True on success (or dry-run), False on error.
    """
    if dry_run:
        print(f"  [DRY RUN] Would patch {doc_id}: {list(patches.keys())}")
        return True

    mutations = {"mutations": [{"patch": {"id": doc_id, "set": patches}}]}
    result = subprocess.run(
        [
            "curl", "-s", "-X", "POST",
            f"{SANITY_API}/data/mutate/{SANITY_DATASET}",
            "-H", "Content-Type: application/json",
            "-H", f"Authorization: Bearer {SANITY_TOKEN}",
            "-d", json.dumps(mutations),
        ],
        capture_output=True,
        text=True,
    )

    try:
        response = json.loads(result.stdout) if result.stdout else {}
    except json.JSONDecodeError:
        print(f"  ERROR: Non-JSON response for {doc_id}: {result.stdout[:200]}", file=sys.stderr)
        return False

    if "results" in response:
        return True
    else:
        error_msg = response.get("error", {})
        print(f"  ERROR patching {doc_id}: {error_msg}", file=sys.stderr)
        return False


def apply_fixes(fix_plan: list, dry_run: bool = True) -> dict:
    """
    Apply all fix actions from the fix plan.

    Per D-10: dry_run=True prints what would happen, does NOT mutate.
    Rate limiting: sleep 0.5s every 25 patches (Sanity free tier ~100 req/s).

    Args:
        fix_plan: List of fix action dicts from build_fix_plan()
        dry_run: If True, print only. If False, apply via Sanity API.

    Returns:
        Dict with keys "applied", "skipped", "failed" (counts).
    """
    applied = 0
    skipped = 0
    failed = 0
    patch_count = 0

    for item in fix_plan:
        doc_id = item["doc_id"]
        patches = item.get("patches")
        action = item.get("action", "unknown")
        note = item.get("note", "")

        if patches is None:
            # Cannot auto-patch — log and skip
            print(f"  [SKIP] {doc_id} — {action}: {note}")
            skipped += 1
            continue

        if dry_run:
            print(f"  [DRY RUN] Would patch {doc_id}: {list(patches.keys())} ({action})")
            applied += 1
        else:
            success = patch_sanity_document(doc_id, patches, dry_run=False)
            if success:
                print(f"  [OK] Patched {doc_id}: {list(patches.keys())} ({action})")
                applied += 1
            else:
                print(f"  [FAIL] Failed to patch {doc_id}", file=sys.stderr)
                failed += 1

            patch_count += 1
            # Rate limiting: sleep every 25 patches
            if patch_count % RATE_LIMIT_EVERY == 0:
                time.sleep(RATE_LIMIT_SLEEP)

    return {"applied": applied, "skipped": skipped, "failed": failed}


def print_fix_plan_summary(fix_plan: list):
    """Print a human-readable summary of the fix plan."""
    action_counts: dict[str, int] = {}
    for item in fix_plan:
        action = item.get("action", "unknown")
        action_counts[action] = action_counts.get(action, 0) + 1

    total = len(fix_plan)
    patchable = sum(1 for i in fix_plan if i.get("patches") is not None)
    parts = [f"{count} {action}" for action, count in sorted(action_counts.items())]
    print(f"Fix plan: {total} actions ({', '.join(parts)})")
    print(f"  Patchable: {patchable} documents will be mutated")
    skip_count = total - patchable
    if skip_count:
        print(f"  Skipped:   {skip_count} items require manual investigation")


# ============================================================
# Main
# ============================================================

def main():
    parser = argparse.ArgumentParser(
        description="Fix Sanity integrity issues from audit output"
    )
    parser.add_argument(
        "--audit-file",
        default=DEFAULT_AUDIT_FILE,
        help=f"Path to audit JSON (default: {DEFAULT_AUDIT_FILE})",
    )
    parser.add_argument(
        "--live",
        action="store_true",
        help="Apply patches (default: dry run — shows what would change)",
    )
    args = parser.parse_args()

    dry_run = not args.live

    print("=" * 60)
    print("SANITY DATA INTEGRITY FIX")
    print(f"Project: {SANITY_PROJECT} / {SANITY_DATASET}")
    print(f"Audit file: {args.audit_file}")
    print(f"Mode: {'DRY RUN' if dry_run else 'LIVE — patches will be applied'}")
    print("=" * 60)

    # Validate SANITY_TOKEN for live mode
    if not dry_run and not SANITY_TOKEN:
        print(
            "ERROR: SANITY_TOKEN environment variable is required for live mode.\n"
            "Get a token from: https://www.sanity.io/manage/project/fo6n8ceo/api#tokens",
            file=sys.stderr,
        )
        sys.exit(1)

    # Step 1: Load audit results
    print(f"\n[1/4] Loading audit results from: {args.audit_file}")
    try:
        audit_data = load_audit_results(args.audit_file)
    except FileNotFoundError as e:
        print(f"ERROR: {e}", file=sys.stderr)
        print("Run audit first: python3 scripts/audit-sanity-integrity.py", file=sys.stderr)
        sys.exit(1)

    summary = audit_data.get("summary", {})
    failures = audit_data.get("failures", [])
    manual_review = audit_data.get("manual_review", [])
    print(
        f"  Found {len(failures)} failures, {len(manual_review)} manual review items"
    )
    print(f"  Audit summary: {summary}")

    # Step 2: Build fix plan
    print("\n[2/4] Building fix plan...")
    fix_plan = build_fix_plan(audit_data)
    print_fix_plan_summary(fix_plan)

    if not fix_plan:
        print("\nNo fix actions needed. All issues are manual review items or audit is clean.")
        sys.exit(0)

    # Step 3: Apply fixes
    mode_label = "DRY RUN" if dry_run else "LIVE"
    print(f"\n[3/4] Applying fixes ({mode_label})...")
    results = apply_fixes(fix_plan, dry_run=dry_run)

    # Step 4: Print results
    print("\n[4/4] Results:")
    print(f"  Applied:  {results['applied']}")
    print(f"  Skipped:  {results['skipped']}")
    print(f"  Failed:   {results['failed']}")

    if manual_review:
        print(f"\n=== FLAGGED FOR MANUAL REVIEW ({len(manual_review)}) ===")
        print("  (Per D-08: MMXXV longform with MMXIX-era alumni — not auto-cleared)")
        for item in manual_review:
            print(f"  [{item.get('doc_id', '')}] {item.get('title', '')}")
            print(f"    Reason: {item.get('reason', '')}")

    if not dry_run:
        print("\nRe-run audit to verify: python3 scripts/audit-sanity-integrity.py")

    if results["failed"] > 0:
        sys.exit(1)
    sys.exit(0)


if __name__ == "__main__":
    main()
