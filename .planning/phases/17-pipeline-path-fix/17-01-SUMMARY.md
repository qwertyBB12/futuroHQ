---
phase: 17-pipeline-path-fix
plan: 01
subsystem: pipeline
tags: [python, b2, pipeline, clips, path-derivation]

# Dependency graph
requires:
  - phase: 14-script-correctness
    provides: pipeline.py with upload_clips_to_b2 and derive_clips_b2_path established
  - phase: 15-pipeline-automation
    provides: run_pipeline call chain with b2_path as input
provides:
  - Dynamic clip B2 path derivation — event prefix extracted from raw input path, not hardcoded constant
  - docs/MEDIA-PIPELINE.md clip path routing table showing correct paths for all event types
  - Phase 14 VERIFICATION.md corrected to match frontmatter (passed, 7/7)
affects:
  - pipeline automation (run_pipeline uses updated upload_clips_to_b2 signature)
  - docs consumers (MEDIA-PIPELINE.md clip routing examples are now accurate)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Event prefix extraction from raw B2 path using split('/raw/')[0] — same pattern as derive_b2_upload_path uses .replace('/raw/', '/edited/')"

key-files:
  created: []
  modified:
    - scripts/pipeline.py
    - docs/MEDIA-PIPELINE.md
    - .planning/phases/14-script-correctness/14-VERIFICATION.md

key-decisions:
  - "Extract event prefix via split('/raw/')[0] with fallback to split('/')[0] — matches the existing path transformation pattern in derive_b2_upload_path"
  - "Pass event_prefix through call chain (run_pipeline -> upload_clips_to_b2 -> derive_clips_b2_path) rather than re-extracting at each level"

patterns-established:
  - "Clip B2 path: {event_prefix}/clips/{stem}/{clip_filename} where event_prefix = raw_b2_path.split('/raw/')[0]"

requirements-completed: [AUTO-03, DOCS-02]

# Metrics
duration: 10min
completed: 2026-03-27
---

# Phase 17 Plan 01: Pipeline Path Fix Summary

**Dynamic clip B2 path derivation — CLIPS_B2_PREFIX constant replaced with _extract_event_prefix() so Kah Foundry XXVI clips route to "Kah Foundry XXVI/clips/" not "Futuro MMXXV/clips/"**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-03-27T04:27:00Z
- **Completed:** 2026-03-27T04:37:58Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Removed hardcoded `CLIPS_B2_PREFIX = "Futuro MMXXV"` constant; replaced with `_extract_event_prefix()` that parses event prefix from the raw B2 path
- Updated `derive_clips_b2_path` and `upload_clips_to_b2` signatures to accept `event_prefix` parameter; `run_pipeline` extracts and passes it through
- Added "How clip paths are derived" routing table to docs/MEDIA-PIPELINE.md covering all event types
- Corrected stale Phase 14 VERIFICATION.md body to match frontmatter: status passed, 7/7, no FAILED truths

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix hardcoded CLIPS_B2_PREFIX** - `70e2e1d` (feat)
2. **Task 2: Update docs and fix stale Phase 14 VERIFICATION.md** - `99426d2` (docs)

**Plan metadata:** (this commit — docs: complete plan)

## Files Created/Modified

- `scripts/pipeline.py` - Removed CLIPS_B2_PREFIX; added _extract_event_prefix(); updated derive_clips_b2_path, upload_clips_to_b2, run_pipeline
- `docs/MEDIA-PIPELINE.md` - Added "How clip paths are derived" section with routing table
- `.planning/phases/14-script-correctness/14-VERIFICATION.md` - Fixed stale body status to match frontmatter

## Decisions Made

- Extract event prefix via `split('/raw/')[0]` with fallback to `split('/')[0]` — consistent with how `derive_b2_upload_path` already uses the raw path
- Pass `event_prefix` through the full call chain rather than re-extracting at each call site — single extraction point in `run_pipeline`

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- AUTO-03 and DOCS-02 audit gaps closed; v1.3 milestone audit items resolved
- Phase 14 VERIFICATION.md now consistent with frontmatter
- Pipeline correctly routes clips for any event type (Kah Foundry, Futuro MMXXV, MMXIX, etc.)

---
*Phase: 17-pipeline-path-fix*
*Completed: 2026-03-27*
