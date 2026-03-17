---
phase: 08-media-pipeline-infrastructure
plan: 01
subsystem: schema
tags: [sanity, video, completeness, media-pipeline, bunny-cdn, b2]

# Dependency graph
requires:
  - phase: 07-video-schema-b2-bunny-fields
    provides: B2 storage fields (b2Key, cdnUrl, resolution, thumbnailUrl, duration) and source-aware completeness baseline
provides:
  - bunnyStatus field definition in video schema (processing|ready|error enum, storage group, readOnly)
  - Updated completeness system requiring bunnyStatus=ready for B2 video completeness
  - GROQ filter surfacing B2 videos missing pipeline confirmation
affects:
  - 08-02: Cloudflare Worker (writes to bunnyStatus field)
  - deskStructure Needs Enrichment list (reflects new GROQ filter)
  - lib/completeness.ts consumers (completeness banner, enrichment scripts)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - readOnly Sanity field for machine-populated pipeline state
    - source-aware completeness with conditional total (checks.length + 2 for B2 vs checks.length + 1 for Wistia)

key-files:
  created: []
  modified:
    - schemaTypes/video.ts
    - lib/completeness.ts

key-decisions:
  - "bunnyStatus is readOnly — Worker populates it, editors never edit it directly"
  - "bunnyStatus increases video completeness total from checks.length+1 to checks.length+2 for B2 videos only — Wistia completeness unchanged"
  - "GROQ filter for video Needs Enrichment now includes bunnyStatus != 'ready' as an incomplete signal for B2 videos"

patterns-established:
  - "Machine-populated fields use readOnly: true and are hidden when their source context is inactive"
  - "Source-aware completeness branches return different totals depending on videoSource value"

requirements-completed: [MDIA-03]

# Metrics
duration: 2min
completed: 2026-03-17
---

# Phase 8 Plan 01: bunnyStatus Schema Field and Completeness Awareness Summary

**readOnly bunnyStatus pipeline-tracking field added to video schema; B2 video completeness now requires bunnyStatus=ready in both runtime checks and GROQ desk filters**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-17T03:37:14Z
- **Completed:** 2026-03-17T03:38:36Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Added `bunnyStatus` field (processing|ready|error) to video schema in B2/Bunny Storage group, readOnly, hidden when videoSource is not b2
- Extended `checkCompleteness()` for B2 videos: two source-aware checks (cdnUrl + bunnyStatus), total is now `checks.length + 2`
- Updated `GROQ_FILTERS.video` B2 branch to surface videos missing bunnyStatus=ready in Needs Enrichment lists
- Wistia/legacy video completeness behavior completely unchanged

## Task Commits

Each task was committed atomically:

1. **Task 1: Add bunnyStatus field to video schema** - `e127d0d` (feat)
2. **Task 2: Update completeness system for bunnyStatus awareness** - `b44b415` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `schemaTypes/video.ts` - Added bunnyStatus field after thumbnailUrl, before thumbnailImage, in storage group
- `lib/completeness.ts` - Updated checkCompleteness B2 branch and GROQ_FILTERS.video

## Decisions Made
- `bunnyStatus` is `readOnly: true` — this field is machine-populated by the Cloudflare Worker (Plan 02), editors should not modify it
- B2 video completeness total increases from `checks.length + 1` to `checks.length + 2` — two source-aware checks (cdnUrl + bunnyStatus) instead of one
- Wistia branches return `checks.length + 1` unchanged — no behavioral change for legacy videos
- GROQ filter extended: `bunnyStatus != "ready"` added to B2 branch so Needs Enrichment lists surface B2 videos awaiting pipeline confirmation

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Schema landing zone is ready for the Cloudflare Worker (Plan 02) to write `bunnyStatus` values
- Worker can PATCH documents setting `bunnyStatus: 'ready'` and the completeness banner will automatically clear "Pipeline Status" from missing fields
- Needs Enrichment desk list immediately reflects new filter — B2 videos without `bunnyStatus=ready` will appear there

---
*Phase: 08-media-pipeline-infrastructure*
*Completed: 2026-03-17*
