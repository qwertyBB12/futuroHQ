---
phase: 13-sanity-data-integrity
plan: 01
subsystem: testing
tags: [python, pytest, sanity, b2, integrity-audit, diarization, person-tags]

requires:
  - phase: 10-video-pipeline-execution
    provides: populate-sanity-videos.py with VIDEO_MAP and CDN_BASE constants; B2 video docs created
  - phase: 09-transcript-podcast-schema
    provides: .enriched.json files in transcripts/ directory with speaker diarization output

provides:
  - scripts/audit-sanity-integrity.py — single-pass B2 video integrity audit (b2Key, cdnUrl, person tags)
  - scripts/tests/test_audit.py — 9 unit tests for audit logic with mock data
  - scripts/tests/conftest.py — shared fixtures (mock B2 inventory, Sanity docs, enriched JSON)
  - Structured JSON output format (transcripts/integrity-audit.json) consumable by fix script (Plan 02)

affects:
  - 13-02 (fix script will consume integrity-audit.json and call the same helper functions)

tech-stack:
  added:
    - pytest (installed via pip)
  patterns:
    - importlib.util.spec_from_file_location for loading hyphenated Python filenames
    - D-07 enriched JSON cross-reference before concluding person tags are wrong
    - categorize_documents routing by b2Key path prefix
    - b2 ls --recursive subprocess pattern for B2 inventory

key-files:
  created:
    - scripts/audit-sanity-integrity.py
    - scripts/tests/__init__.py
    - scripts/tests/conftest.py
    - scripts/tests/test_audit.py
  modified: []

key-decisions:
  - "b2Key path index for stem is parts[2] not parts[3] — 'Futuro MMXXV' has a space not slash so it counts as one segment"
  - "MMXXV clips with empty named_speakers are flagged wrong_person_tags (unverifiable), not just missing — per D-07"
  - "MMXXV longform uses flag_for_review action, not clear_and_flag — preserves legitimate multi-speaker references"

patterns-established:
  - "load_enriched_speakers(stem, enriched_dir) -> named_speakers dict (or {} if absent/empty)"
  - "check_person_tags dispatches on b2Key prefix: MMXXV clips -> D-07 enriched JSON; MMXXV longform -> mmxix_alumni_slugs check; MMXIX -> VIDEO_MAP comparison"
  - "build_person_slug_map(docs) -> {doc_id: [slug1, slug2]} for O(1) lookup during per-doc tag checks"

requirements-completed: [DINT-01, DINT-02, DINT-03]

duration: 11min
completed: 2026-03-26
---

# Phase 13 Plan 01: Sanity Data Integrity Audit Summary

**Single-pass B2 video integrity audit (b2Key + cdnUrl + D-07 person tags) with 9-test pytest suite using mock Sanity/B2/enriched-JSON fixtures**

## Performance

- **Duration:** ~11 min
- **Started:** 2026-03-26T21:42:17Z
- **Completed:** 2026-03-26T21:53:20Z
- **Tasks:** 2
- **Files created:** 4

## Accomplishments

- Created `scripts/audit-sanity-integrity.py` — queries all 240 B2 video docs in one Sanity GROQ call, cross-references against actual B2 bucket listings, checks cdnUrl formula, and reads `.enriched.json` per D-07 before flagging MMXXV clip person tags as wrong
- Created 9-test pytest suite (conftest.py + test_audit.py) with mock data covering b2 cross-reference, cdnUrl space-encoding, single-pass categorization, and both branches of the D-07 named_speakers check
- Script produces console summary table + structured `integrity-audit.json` for the fix script in Plan 02
- All 9 tests pass: `python3 -m pytest scripts/tests/test_audit.py -x -q` exits 0

## Task Commits

1. **Task 1: Create test scaffolding and audit unit tests** - `a0c33d8` (test)
2. **Task 2: Create audit-sanity-integrity.py script** - `41a9689` (feat)

## Files Created/Modified

- `scripts/audit-sanity-integrity.py` — Single-pass audit: Sanity query, B2 inventory, url integrity check, person tag check with D-07 enriched JSON cross-reference, console table + JSON output
- `scripts/tests/__init__.py` — Empty package marker
- `scripts/tests/conftest.py` — Shared pytest fixtures: mock_b2_inventory, mock_sanity_docs (6 scenario docs), mock_video_map, mmxix_alumni_slugs, mock_enriched_json_dir
- `scripts/tests/test_audit.py` — 9 unit tests (all using mock data, no live API calls)

## Decisions Made

- **b2Key path split index correction:** The plan spec said `parts[3]` for extracting the camera stem (e.g. "C3460") from MMXXV clip b2Keys. However `"Futuro MMXXV"` is a single segment (contains a space, not a slash), making the stem index 2 not 3. Fixed in the implementation; the same applies to MMXIX clip source stem extraction.

- **named_speakers vs enriched JSON structure:** Actual MMXXV `.enriched.json` files do NOT have a `named_speakers` key at all (not just empty dict). `load_enriched_speakers` uses `.get("named_speakers", {}) or {}` to handle both absent key and empty dict identically.

- **flag_for_review vs clear_and_flag actions:** MMXXV clips use `clear_and_flag` (tags must be cleared — all wrong per D-08). MMXXV longform uses `flag_for_review` (some multi-speaker docs may have legitimate refs per Pitfall 4). This distinction maps to Plan 02 fix script behavior.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Corrected b2Key path segment index for stem extraction**
- **Found during:** Task 2 verification (test_person_tag_mmxxv_clip_with_named_speakers failed)
- **Issue:** Plan interface spec used `parts[3]` to extract camera stem from MMXXV clip b2Key (e.g., "C3460" from "Futuro MMXXV/clips/C3460/SPEAKER_00.mp4"). Since "Futuro MMXXV" contains a space (not a slash), split("/") produces ["Futuro MMXXV", "clips", "C3460", "clip.mp4"]. The stem is at index 2, not 3.
- **Fix:** Changed `parts[3]` to `parts[2]` for both MMXXV clips and MMXIX clips stem extraction in `check_person_tags`.
- **Files modified:** scripts/audit-sanity-integrity.py
- **Verification:** test_person_tag_mmxxv_clip_with_named_speakers now passes (8/9 -> 9/9)
- **Committed in:** 41a9689 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - bug in path indexing from plan interface spec)
**Impact on plan:** Essential correctness fix. Without this, stem extraction would return the clip filename instead of the camera folder name, causing load_enriched_speakers to always return {} and D-07 named_speakers path to never be exercised.

## Issues Encountered

- `named_speakers` key is absent entirely from MMXXV enriched JSONs (not just an empty dict). The implementation handles this correctly via `.get("named_speakers", {}) or {}`.

## Known Stubs

None — audit script produces real output when run with `SANITY_TOKEN` env var and `b2` CLI available. No placeholder data flows to any UI rendering.

## User Setup Required

None — no external service configuration required. Script uses existing `SANITY_TOKEN` from `.env.local` and the already-installed `b2` CLI.

## Next Phase Readiness

- `scripts/audit-sanity-integrity.py` is ready for Plan 02 (fix script) to import `check_url_integrity`, `check_person_tags`, and `categorize_documents` via importlib
- `transcripts/integrity-audit.json` output format is documented in the audit script docstring and ready for fix script consumption
- 9 unit tests establish the testing pattern; Plan 02 should add `scripts/tests/test_fix.py` following the same fixture pattern from conftest.py

---
*Phase: 13-sanity-data-integrity*
*Completed: 2026-03-26*
