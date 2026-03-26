---
phase: 13-sanity-data-integrity
plan: 03
subsystem: testing
tags: [python, pytest, audit, sanity, integrity, tdd]

# Dependency graph
requires:
  - phase: 13-02
    provides: fix-sanity-integrity.py with wrong_person_tags handler and live Sanity patching

provides:
  - "pending_identification" issue code for cleared MMXXV clips (action=informational, not failure)
  - issubset comparison for MMXIX clips and longform — extra host refs no longer cause false mismatches
  - person_tag_mismatch handler in fix script — flags for review with patches=None
  - pending_identification graceful skip in fix script
  - informational routing in main() — separate list, not counted as failures
  - 7 new tests covering all gap closure logic

affects:
  - 13-04 (re-audit — zero failures criterion now achievable)
  - fix script invocations that consume audit JSON output

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "TDD RED-GREEN cycle: write failing tests first, then implement, then verify"
    - "Subset comparison pattern: issubset() for MMXIX video tags — extra refs are acceptable, missing expected refs are not"
    - "Informational routing: action='informational' goes to separate list, not failures, not manual_review"

key-files:
  created: []
  modified:
    - scripts/audit-sanity-integrity.py
    - scripts/fix-sanity-integrity.py
    - scripts/tests/test_audit.py
    - scripts/tests/test_fix.py
    - scripts/tests/conftest.py

key-decisions:
  - "pending_identification fires only when both featuredIn AND named_speakers are empty — non-empty featuredIn with no named_speakers is still wrong_person_tags (unverifiable refs)"
  - "issubset comparison for MMXIX: extra refs like hector-as-host are acceptable; only flag when VIDEO_MAP expected people are absent"
  - "person_tag_mismatch in fix script: flag_person_mismatch with patches=None (no auto-patch per D-08)"
  - "informational items explicitly excluded from exit code 1 trigger — they are additive output only"

patterns-established:
  - "informational action pattern: action='informational' routes to separate list in main(), printed after failures, included in JSON but not in failure count"

requirements-completed: [DINT-03]

# Metrics
duration: 14min
completed: 2026-03-26
---

# Phase 13 Plan 03: Audit Logic Gap Closure Summary

**Audit script now correctly distinguishes cleared MMXXV clips (pending_identification, informational) from unverifiable ones (wrong_person_tags, failure) and uses subset comparison for MMXIX docs — eliminating 146 false failures from post-fix re-audit**

## Performance

- **Duration:** 14 min
- **Started:** 2026-03-26T22:22:44Z
- **Completed:** 2026-03-26T22:36:56Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- MMXXV clips with empty featuredIn + no named_speakers now return `pending_identification` (action=`informational`) instead of `wrong_person_tags` (failure) — 68 false failures eliminated
- MMXIX clips and longform now use `issubset()` comparison — extra refs like hector-as-host no longer trigger `person_tag_mismatch` — 78 false failures eliminated
- Fix script handles `person_tag_mismatch` with `flag_person_mismatch` + `patches=None` and gracefully skips `pending_identification`
- Full test suite: 23 tests passing (original 16 + 7 new for gap closure logic)

## Task Commits

Each task was committed atomically:

1. **Task 1 RED: Add failing tests for audit logic gaps** - `35bdace` (test)
2. **Task 1 GREEN: Fix audit logic — pending_identification and issubset** - `75e4c91` (feat)
3. **Task 2 RED: Add failing tests for fix script handlers** - `a846610` (test)
4. **Task 2 GREEN: Add person_tag_mismatch and pending_identification handlers to fix script** - `24278a3` (feat)

_TDD tasks have separate RED/GREEN commits per task_

## Files Created/Modified

- `scripts/audit-sanity-integrity.py` - pending_identification branch for cleared MMXXV clips, issubset for MMXIX clips+longform, informational routing in main()
- `scripts/fix-sanity-integrity.py` - person_tag_mismatch (flag_person_mismatch) and pending_identification (pass) handlers in build_fix_plan
- `scripts/tests/test_audit.py` - 5 new tests: pending_identification, wrong_person_tags-with-refs, MMXIX subset pass, MMXIX missing expected person, MMXIX longform subset pass
- `scripts/tests/test_fix.py` - 2 new tests: person_tag_mismatch flagging, pending_identification graceful skip
- `scripts/tests/conftest.py` - 2 new mock docs (mmxxv-clip-cleared, mmxix-clip-with-host), 2 new B2 inventory paths

## Decisions Made

- `pending_identification` fires only when BOTH `featuredIn` is empty AND `named_speakers` is empty — non-empty `featuredIn` with no `named_speakers` remains `wrong_person_tags` (unverifiable refs still present)
- MMXIX subset check: `issubset()` replaces strict `!=` comparison — only flag when expected people are absent, not when extra refs exist
- `person_tag_mismatch` in fix script: `flag_person_mismatch` with `patches=None` per D-08 (no auto-patch for MMXIX mismatches)
- `informational` items explicitly excluded from exit code 1 — additive output only, not counted as failures

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None — both tasks straightforward per plan specification.

## Next Phase Readiness

- Plan 04 (re-audit) can now run and should achieve zero failures criterion (D-12)
- 68 MMXXV cleared clips will show as informational (not failures)
- 78 MMXIX docs with extra host refs will show as clean (subset match passes)
- Genuine MMXIX mismatches (missing expected people) will be flagged as `flag_person_mismatch` for manual review

---
*Phase: 13-sanity-data-integrity*
*Completed: 2026-03-26*
