---
phase: 03-schema-consolidation
plan: 02
subsystem: schema
tags: [sanity, schema, keynote, video, content-modeling]

requires:
  - phase: 01-quick-wins
    provides: Working studio with governance fields
provides:
  - Keynote as canonical speech hub with cross-references to video, essay, podcast
  - Clean video schema without keynote-specific conditional fields
affects: [frontend-queries, content-migration]

tech-stack:
  added: []
  patterns: [canonical-hub-with-references, single-source-of-truth-schema]

key-files:
  created: []
  modified:
    - schemaTypes/video.ts
    - schemaTypes/keynote.ts

key-decisions:
  - "Keynote type is the single canonical representation of speeches, video type no longer holds keynote data"
  - "videoUrl on keynote kept as legacy field with updated description pointing to linkedVideo reference"

patterns-established:
  - "Hub pattern: canonical type with reference fields to related content types (linkedVideo, linkedEssay, linkedPodcastEpisode)"

requirements-completed: [SCHM-03]

duration: 2min
completed: 2026-03-08
---

# Phase 03 Plan 02: Keynote-Video Separation Summary

**Keynote schema promoted to canonical speech hub with linkedVideo/linkedEssay/linkedPodcastEpisode references; video schema cleaned of 5 keynote-specific conditional fields**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-08T02:27:20Z
- **Completed:** 2026-03-08T02:28:38Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Removed 5 keynote-specific fields from video.ts (speechText, linkedEssay, linkedReflection, linkedPodcastEpisode, keynoteVenue)
- Removed 'keynote' from video contentCategory options, simplified videoUrl validation
- Added speechText, linkedVideo, linkedEssay, linkedPodcastEpisode to keynote.ts as hub fields
- Updated keynote description to document it as the canonical speech representation

## Task Commits

Each task was committed atomically:

1. **Task 1: Remove keynote-specific fields from video schema** - `bcbd696` (feat)
2. **Task 2: Enrich keynote schema as canonical speech hub** - `67e55ce` (feat)

## Files Created/Modified
- `schemaTypes/video.ts` - Removed keynote fields, simplified validation, updated description
- `schemaTypes/keynote.ts` - Added speechText, linkedVideo, linkedEssay, linkedPodcastEpisode; updated description as canonical hub

## Decisions Made
- Kept videoUrl on keynote as legacy field with updated description suggesting linkedVideo reference instead of removing it (existing data may use it)
- Used hub pattern: keynote references video/essay/podcastEpisode rather than those types referencing keynote

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
- Schema extract requires `--workspace production` flag due to multi-workspace config (resolved immediately)

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Video and keynote schemas are cleanly separated
- Existing keynote documents may need data migration to populate new linkedVideo/linkedEssay fields
- Frontend queries referencing video contentCategory 'keynote' will need updating

---
*Phase: 03-schema-consolidation*
*Completed: 2026-03-08*
