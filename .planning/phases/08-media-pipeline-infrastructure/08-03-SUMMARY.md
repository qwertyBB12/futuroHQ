---
phase: 08-media-pipeline-infrastructure
plan: 03
subsystem: studio-ui
tags: [sanity, bunny-cdn, asset-source, media-pipeline, b2, civic-modern]

# Dependency graph
requires:
  - phase: 08-01
    provides: bunnyStatus field on video schema, B2-aware completeness system
provides:
  - BunnyAssetSource component for browsing CDN-hosted videos in Studio
  - Asset source registration in sanity.config.ts (both workspaces)
affects:
  - Video document editing workflow (editors can browse/select CDN videos)
  - sanity.config.ts form configuration (new file asset source)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Custom Sanity asset source using GROQ-backed listing (no external API needed)
    - Full-overlay panel with Civic Modern dark theme tokens
    - Asset source returns kind:url for CDN URL passthrough

key-files:
  created:
    - components/inputs/BunnyAssetSource.tsx
  modified:
    - sanity.config.ts

key-decisions:
  - "GROQ-backed listing instead of raw CDN browse — Bunny pull zones have no directory listing API; querying Sanity videos with cdnUrl is more reliable and useful"
  - "Asset source registered via form.file.assetSources with prev spread — preserves default upload alongside Bunny CDN browser"

patterns-established:
  - "Custom asset sources use GROQ queries to list available assets from the content lake"
  - "Overlay panels use fixed positioning with Civic Modern tokens for consistent dark theme"

requirements-completed: [MDIA-04]

# Metrics
duration: 3min
completed: 2026-03-21
---

# Phase 8 Plan 03: Bunny CDN Asset Source Plugin Summary

**Custom asset source component lets Studio editors browse and select B2/Bunny CDN-hosted videos via a searchable grid panel styled with Civic Modern tokens**

## Performance

- **Duration:** ~3 min (execution) + checkpoint verification
- **Started:** 2026-03-21T05:36:40Z
- **Completed:** 2026-03-21T06:03:58Z
- **Tasks:** 3 (2 auto + 1 human-verify)
- **Files created:** 1
- **Files modified:** 1

## Accomplishments
- Created `BunnyAssetSource.tsx` — full-overlay panel with searchable grid of CDN-hosted videos
- GROQ query filters for `videoSource == "b2"` with defined `cdnUrl`, ordered by creation date
- Search filters by title or B2 key in real-time
- Status badges color-coded with Civic Modern tokens: ready=Copper, processing=Archival Slate, error=Vermillion
- Video cards show title, B2 key, bunnyStatus, resolution, and formatted duration
- Registered as file asset source in `sanity.config.ts` via `form.file.assetSources`
- Default upload source preserved via `prev` spread — Bunny CDN is additive
- Available in both production and staging workspaces via sharedConfig
- Human-verified: Studio loads without errors, asset source panel renders correctly

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Bunny CDN asset source component** - `894abf1` (feat)
2. **Task 2: Register Bunny asset source in sanity.config.ts** - `b270970` (feat)
3. **Task 3: Verify Bunny CDN asset source in Studio** - Human-verified (approved)

## Files Created/Modified
- `components/inputs/BunnyAssetSource.tsx` - New asset source component with GROQ-backed video listing, search, status badges, Civic Modern styling
- `sanity.config.ts` - Added bunnyAssetSource import and form.file.assetSources registration

## Decisions Made
- **GROQ-backed listing over raw CDN browse:** Bunny CDN pull zones (mirroring B2) have no native directory listing API. Querying Sanity for video documents with `cdnUrl` set is more reliable and shows only videos the pipeline has processed, with metadata (title, status, resolution) already available.
- **form.file.assetSources with prev spread:** Preserves Sanity's default file upload source. Editors can still drag-and-drop files directly; Bunny CDN is an additional browse option.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. The pre-existing `@portabletext/editor` source map warning in `npx sanity dev` is unrelated to this plan's changes.

## Known Stubs

None. The component is fully functional. If no B2 videos exist in the content lake yet (i.e., the 08-02 Worker pipeline hasn't created any), the panel shows "No B2/Bunny videos found in Sanity." which is correct empty-state behavior, not a stub.

## Next Phase Readiness
- Asset source is ready to display videos as the Worker (08-02) creates them via the B2 upload pipeline
- Once B2 videos have `cdnUrl` populated and `bunnyStatus` set to ready, they appear in the Bunny CDN browser automatically
- No further Studio-side work needed for the media pipeline — all three 08-xx plans are complete

## Self-Check: PASSED

- [x] `components/inputs/BunnyAssetSource.tsx` exists
- [x] `.planning/phases/08-media-pipeline-infrastructure/08-03-SUMMARY.md` exists
- [x] Commit `894abf1` found in git log
- [x] Commit `b270970` found in git log
- [x] `sanity.config.ts` contains bunnyAssetSource import and registration

---
*Phase: 08-media-pipeline-infrastructure*
*Completed: 2026-03-21*
