---
phase: 13-sanity-data-integrity
plan: 02
subsystem: testing
tags: [python, pytest, sanity, b2, integrity-fix, person-tags, dry-run, mutations-api]

requires:
  - phase: 13-sanity-data-integrity
    plan: 01
    provides: audit-sanity-integrity.py + integrity-audit.json output format

provides:
  - scripts/fix-sanity-integrity.py — dry-run/live fix script consuming audit JSON, patching featuredIn + cdnUrl
  - scripts/tests/test_fix.py — 7 unit tests for load_audit_results, build_fix_plan, apply_fixes, patch_sanity_document

affects:
  - "Sanity production dataset — MMXXV clip featuredIn fields cleared when --live is passed"

tech-stack:
  added: []
  patterns:
    - "importlib.util.spec_from_file_location for loading hyphenated Python filenames (same as audit script)"
    - "dry_run=True default guard — patch_sanity_document prints [DRY RUN] and returns True without calling API"
    - "build_fix_plan iterates failures list, not manual_review list (D-08 enforcement)"
    - "Rate limiting: sleep 0.5s every 25 patches (Sanity free tier ~100 req/s)"

key-files:
  created:
    - scripts/fix-sanity-integrity.py
    - scripts/tests/test_fix.py
  modified: []

key-decisions:
  - "apply_fixes calls patch_sanity_document with dry_run=False as keyword arg (not positional) — test updated to match"
  - "apply_fixes in dry_run mode does NOT call patch_sanity_document at all — prints [DRY RUN] message inline instead"
  - "build_fix_plan only processes failures list (not manual_review) per D-08 — MMXXV longform with MMXIX alumni are flagged for human review only"

patterns-established:
  - "fix script accepts audit JSON path via --audit-file; defaults to transcripts/integrity-audit.json"
  - "patch_sanity_document uses same curl POST + SANITY_TOKEN pattern as populate-sanity-videos.py"
  - "apply_fixes returns {'applied': N, 'skipped': N, 'failed': N} summary dict"

requirements-completed: [DINT-01, DINT-02, DINT-03]

duration: 6min
completed: 2026-03-26
---

# Phase 13 Plan 02: Sanity Data Integrity Fix Summary

**Fix script consuming audit JSON to clear wrong featuredIn on MMXXV clips and fix cdnUrl mismatches, with 7-test pytest suite and dry-run/live workflow**

## Performance

- **Duration:** ~6 min
- **Started:** 2026-03-26T22:32:10Z
- **Completed:** 2026-03-26T22:38:00Z
- **Tasks:** 1 of 2 (Task 2 is checkpoint:human-verify — awaiting human verification)
- **Files created:** 2

## Accomplishments

- Created `scripts/fix-sanity-integrity.py` — consumes `transcripts/integrity-audit.json`, builds fix plan from failures list, applies featuredIn clear on `wrong_person_tags` failures, rebuilds cdnUrl for `cdnurl_formula_mismatch` failures, flags `b2_not_found` for manual investigation, dry-runs by default with `--live` flag to apply patches
- Created 7-test pytest suite (`scripts/tests/test_fix.py`) covering load_audit_results (valid + missing file), build_fix_plan (clear person tags, cdnUrl fix, skip manual review), apply_fixes dry-run guard, and live patch call verification
- Full test suite (16/16) passes: `python3 -m pytest scripts/tests/ -x -q` exits 0

## Task Commits

1. **Task 1: Create fix script with tests** — `ebc676b` (feat)
2. **Task 2: Run audit-fix-reaudit cycle** — checkpoint:human-verify (pending)

## Files Created/Modified

- `scripts/fix-sanity-integrity.py` — Fix script: load_audit_results, build_fix_plan, patch_sanity_document (dry_run guard), apply_fixes (rate-limited), CLI with --audit-file and --live
- `scripts/tests/test_fix.py` — 7 unit tests using mock data; no live Sanity/B2 calls

## Decisions Made

- **apply_fixes dry_run mode does not call patch_sanity_document:** In dry_run mode, the function prints the [DRY RUN] message inline rather than delegating to patch_sanity_document. This keeps the dry-run guard clean and testable — mock assertion confirms the real patch function is never invoked.

- **test_apply_fixes_live_calls_patch uses keyword arg:** The actual call `patch_sanity_document(doc_id, patches, dry_run=False)` passes dry_run as keyword. Test updated to `assert_called_once_with(..., dry_run=False)` to match actual calling convention.

- **build_fix_plan skips manual_review entirely:** Per D-08, MMXXV longform docs with MMXIX-era alumni references are NOT auto-patched. The fix script prints them as informational at the end but takes no action against them.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] test assertion used positional arg, actual call uses keyword arg**
- **Found during:** Task 1 (GREEN phase — tests passing check)
- **Issue:** `mock_patch.assert_called_once_with("drafts.abc", {"featuredIn": []}, False)` failed because `apply_fixes` calls `patch_sanity_document(doc_id, patches, dry_run=False)` with `dry_run` as a keyword argument. Python mock distinguishes positional vs keyword args.
- **Fix:** Updated test to `mock_patch.assert_called_once_with("drafts.abc", {"featuredIn": []}, dry_run=False)`
- **Files modified:** scripts/tests/test_fix.py
- **Verification:** All 7 tests pass after fix
- **Committed in:** ebc676b (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - bug in test assertion)
**Impact on plan:** Minor — test now correctly matches implementation's calling convention. No logic changes required.

## Issues Encountered

None — fix script implemented cleanly following the populate-sanity-videos.py mutation pattern and the audit script's importlib pattern.

## Known Stubs

None — fix script is fully functional. In dry-run mode it prints what would change; in live mode it calls the Sanity Mutations API. No placeholder data.

## User Setup Required

**Task 2 (checkpoint:human-verify):** User needs to run the audit-fix-reaudit cycle:

1. `python3 scripts/audit-sanity-integrity.py` — generate integrity-audit.json
2. `python3 scripts/fix-sanity-integrity.py --audit-file transcripts/integrity-audit.json` — review dry-run
3. `python3 scripts/fix-sanity-integrity.py --audit-file transcripts/integrity-audit.json --live` — apply patches
4. `python3 scripts/audit-sanity-integrity.py` — re-audit, expect zero failures
5. Spot-check MMXXV clip in Sanity Studio — verify featuredIn is empty

## Next Phase Readiness

- Fix script is ready to run. Requires `SANITY_TOKEN` (already in `.env.local`) and `b2` CLI for audit
- Once human verifies zero failures after live run, Phase 13 is complete
- v1.2 Phases 11-12 can unblock after v1.3 (Phase 13) confirms clean data

---
*Phase: 13-sanity-data-integrity*
*Completed: 2026-03-26*
