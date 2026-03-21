---
phase: 09-transcript-podcast-schema
plan: 01
subsystem: schema
tags: [sanity, typescript, transcript, podcast, schema, react, custom-input]

requires: []
provides:
  - "schemaTypes/blocks/transcriptBlock.ts — shared transcriptFields (fullText + speakerSegments) and transcriptGroup"
  - "components/inputs/TranscriptSegmentsInput.tsx — custom read-only collapsible renderer for speaker segments"
  - "video schema updated with transcript group and fields"
  - "podcastEpisode schema updated with transcript group, fields, and externalLinks array"
affects:
  - "09-02 (podcast completeness tracking)"
  - "phase-10 (transcript pipeline integration)"

tech-stack:
  added: []
  patterns:
    - "Shared schema field blocks: export array of defineField(), spread into schemas as ...transcriptFields"
    - "Custom Sanity input component: full custom renderer, does NOT call renderDefault"
    - "Read-only pipeline fields: readOnly:true on both fullText and speakerSegments"

key-files:
  created:
    - schemaTypes/blocks/transcriptBlock.ts
    - components/inputs/TranscriptSegmentsInput.tsx
  modified:
    - schemaTypes/video.ts
    - schemaTypes/podcastEpisode.ts

key-decisions:
  - "fullText uses rows:10 (no collapsible options — text type does not accept collapsible/collapsed)"
  - "TranscriptSegmentsInput is a full custom renderer — no renderDefault call needed for read-only display"
  - "externalLinks placed in distribution group, after audioEmbed, before videoEmbed"

patterns-established:
  - "Shared transcript fields: import { transcriptFields, transcriptGroup } from './blocks/transcriptBlock'"
  - "Custom read-only input: ArrayOfObjectsInputProps, render card list without renderDefault"

requirements-completed: [TRANS-01, TRANS-03, POD-01, POD-02]

duration: 8min
completed: 2026-03-21
---

# Phase 09 Plan 01: Transcript Schema Summary

**Shared transcriptBlock (fullText + speakerSegments with custom read-only renderer) added to video and podcastEpisode schemas; externalLinks array added to podcastEpisode with 7 platform options**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-03-21T12:34:07Z
- **Completed:** 2026-03-21T12:42:00Z
- **Tasks:** 3
- **Files modified:** 4 (+ 2 created)

## Accomplishments

- Created `transcriptBlock.ts` exporting `transcriptFields` (fullText + speakerSegments) and `transcriptGroup` — same pattern as `governanceBlock.ts`
- Created `TranscriptSegmentsInput.tsx` custom read-only component with Civic Modern palette (Copper #B17E68 for speaker labels, Archival Slate #8B8985 for timestamps)
- Added transcript fields to `video.ts` and `podcastEpisode.ts` — both show fullText and speaker segments in a dedicated Transcript tab
- Added `externalLinks` array to `podcastEpisode.ts` with platform dropdown (spotify/apple/google/youtube/amazon/captivate/other) in the Distribution group
- Studio builds successfully with `npx sanity build --yes`

## Task Commits

1. **Task 1: Create transcriptBlock and TranscriptSegmentsInput** - `0ce6257` (feat)
2. **Task 2: Add transcript + externalLinks to schemas** - `5fba583` (feat)
3. **Task 3: Fix TypeScript error, verify build** - `f411cab` (fix)

## Files Created/Modified

- `schemaTypes/blocks/transcriptBlock.ts` — Shared transcript field definitions; exports transcriptFields and transcriptGroup
- `components/inputs/TranscriptSegmentsInput.tsx` — Custom read-only collapsible renderer; Expand All/Collapse All toggle, per-segment collapse, empty state message
- `schemaTypes/video.ts` — Added transcript import, group, and ...transcriptFields spread after duration field
- `schemaTypes/podcastEpisode.ts` — Added transcript import, group, ...transcriptFields spread after videoEmbed, and externalLinks array after audioEmbed

## Decisions Made

- `fullText` uses `rows: 10` only — `text` type does not accept `collapsible`/`collapsed` options (those are for `object` types only); discovered via tsc check and auto-fixed
- `TranscriptSegmentsInput` renders fully custom, without calling `renderDefault` — appropriate for a read-only display-only component
- `externalLinks` is placed in the `distribution` group to keep it alongside other platform/distribution metadata

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed invalid `options` block from text field**
- **Found during:** Task 3 (TypeScript verification)
- **Issue:** `options: { collapsible: true, collapsed: true }` is not valid on `type: 'text'` — TypeScript error TS2559: no properties in common with TextOptions
- **Fix:** Removed the options block; `rows: 10` retained for display height
- **Files modified:** `schemaTypes/blocks/transcriptBlock.ts`
- **Verification:** `npx tsc --noEmit` shows 0 errors in new files; `npx sanity build --yes` exits 0
- **Committed in:** `f411cab`

---

**Total deviations:** 1 auto-fixed (Rule 1 - bug)
**Impact on plan:** Minor fix required by Sanity's type system; no behavior change. Text field still displays with 10 rows height.

## Issues Encountered

- Pre-existing TypeScript errors in `migrations/`, `scripts/`, and `seoBlock.ts` — documented in PROJECT.md as known tech debt; not caused by this plan's changes.

## Known Stubs

None — all fields are wired correctly. Pipeline will populate `fullText` and `speakerSegments` in Phase 10. The empty state message ("No transcript segments — run pipeline to populate") is intentional, not a stub.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Schema is ready for transcript pipeline integration (Phase 10 / plan 02 populates data)
- `externalLinks` on podcastEpisode is immediately usable for editors to add Spotify/Apple links
- `TranscriptSegmentsInput` renders correctly when segments exist (data validated against enriched.json shape)

---
*Phase: 09-transcript-podcast-schema*
*Completed: 2026-03-21*

## Self-Check: PASSED

- FOUND: schemaTypes/blocks/transcriptBlock.ts
- FOUND: components/inputs/TranscriptSegmentsInput.tsx
- FOUND: schemaTypes/video.ts (modified)
- FOUND: schemaTypes/podcastEpisode.ts (modified)
- FOUND: .planning/phases/09-transcript-podcast-schema/09-01-SUMMARY.md
- Commits: 0ce6257, 5fba583, f411cab all present in git log
