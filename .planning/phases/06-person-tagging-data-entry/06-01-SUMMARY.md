---
phase: 06-person-tagging-data-entry
plan: 01
subsystem: schema
tags: [sanity, typescript, schema, enrichment, person-tagging, completeness]

# Dependency graph
requires: []
provides:
  - "featuredInField — shared people reference array for 7 content types"
  - "featuredContentField — shared content reference array for 3 people types"
  - "COMPLETENESS_CONFIG expanded to 10 types with featuredIn checks"
  - "GROQ_FILTERS expanded to 10 types"
  - "deskStructure updated with listWithEnrichment for all 10 tracked types"
  - "EnrichmentProgressWidget now shows 10 type progress rows"
affects:
  - phase-06-plan-02
  - phase-06-plan-03

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Shared field definition files in schemaTypes/blocks/ — follow surfaceOnField.ts pattern"
    - "featuredIn on content types, featuredContent on people types — bidirectional person-content tagging pattern"
    - "listWithEnrichment used for all completeness-tracked types in deskStructure"

key-files:
  created:
    - schemaTypes/blocks/featuredInField.ts
    - schemaTypes/blocks/featuredContentField.ts
  modified:
    - schemaTypes/video.ts
    - schemaTypes/essay.ts
    - schemaTypes/podcast.ts
    - schemaTypes/podcastEpisode.ts
    - schemaTypes/keynote.ts
    - schemaTypes/opEd.ts
    - schemaTypes/news.ts
    - schemaTypes/alumni.ts
    - schemaTypes/collaborator.ts
    - schemaTypes/ledgerPerson.ts
    - lib/completeness.ts
    - deskStructure.ts
    - components/dashboard/EnrichmentProgressWidget.tsx

key-decisions:
  - "featuredIn uses 4 people types as targets: alumni, person, ledgerPerson, collaborator"
  - "featuredContent uses 7 content types as targets: video, essay, podcast, podcastEpisode, keynote, opEd, news"
  - "alumni featuredEssays + featuredVideos replaced by single featuredContent field"
  - "podcastEpisode not added to featuredContent targets — episodes reference series, not standalone"

patterns-established:
  - "Person-tagging pattern: content types get featuredIn (who appears), people types get featuredContent (what they appear in)"
  - "COMPLETENESS_CONFIG entries can be single-field for new types — just the featuredIn check is enough to track data entry progress"

requirements-completed: [SCHM-07]

# Metrics
duration: 15min
completed: 2026-03-16
---

# Phase 6 Plan 1: Person Tagging Schema Foundation Summary

**Bidirectional person-content tagging schema via shared featuredIn/featuredContent reference fields on all 10 tracked types with expanded completeness tracking and desk structure**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-03-16T22:30:00Z
- **Completed:** 2026-03-16T22:45:00Z
- **Tasks:** 2
- **Files modified:** 15

## Accomplishments
- Created shared `featuredInField` and `featuredContentField` definition files following `surfaceOnField.ts` pattern
- Added `featuredIn` to all 7 content types (video, essay, podcast, podcastEpisode, keynote, opEd, news)
- Added `featuredContent` to all 3 people types (alumni, collaborator, ledgerPerson)
- Removed deprecated `featuredEssays` + `featuredVideos` from alumni and replaced with unified `featuredContent`
- Expanded `COMPLETENESS_CONFIG` from 5 to 10 tracked types with `featuredIn` checks
- Expanded `GROQ_FILTERS` from 5 to 10 entries with `featuredIn` conditions
- Converted 5 additional desk structure entries from `listWithPreview` to `listWithEnrichment`
- Dashboard widget `TRACKED_TYPES` expanded from 5 to 10 rows

## Task Commits

Each task was committed atomically:

1. **Task 1: Create shared field definitions and update all schemas** - `7a14473` (feat)
2. **Task 2: Expand completeness config, GROQ filters, desk structure, and dashboard widget** - `7c588e9` (feat)

**Plan metadata:** (see below — docs commit)

## Files Created/Modified
- `schemaTypes/blocks/featuredInField.ts` - Shared people reference array field definition
- `schemaTypes/blocks/featuredContentField.ts` - Shared content reference array field definition
- `schemaTypes/video.ts` - Added featuredInField after tags
- `schemaTypes/essay.ts` - Added featuredInField after tags
- `schemaTypes/podcast.ts` - Added featuredInField after coverMedia
- `schemaTypes/podcastEpisode.ts` - Added featuredInField after tags
- `schemaTypes/keynote.ts` - Added featuredInField after tags
- `schemaTypes/opEd.ts` - Added featuredInField after tags
- `schemaTypes/news.ts` - Added featuredInField after tags
- `schemaTypes/alumni.ts` - Replaced featuredEssays+featuredVideos with featuredContentField
- `schemaTypes/collaborator.ts` - Added featuredContentField after relatedPeople
- `schemaTypes/ledgerPerson.ts` - Added featuredContentField after affiliatedOrgs
- `lib/completeness.ts` - Expanded from 5 to 10 tracked types, added featuredIn checks
- `deskStructure.ts` - 5 additional listWithEnrichment calls (essay, podcast, opEd, news, keynote)
- `components/dashboard/EnrichmentProgressWidget.tsx` - TRACKED_TYPES expanded to 10 entries

## Decisions Made
- `featuredIn` targets 4 people types: `alumni`, `person`, `ledgerPerson`, `collaborator` — all identity types that can appear in content
- `featuredContent` targets all 7 content types — broad enough to be useful for any person
- Alumni's `featuredEssays` + `featuredVideos` removed and consolidated into single `featuredContent` field — reduces schema surface area, `featuredContent` can do all the same work with broader type coverage
- Pre-existing TypeScript errors in import scripts (scripts/*.ts, migrations/*.ts) were pre-existing and out of scope — not introduced by this plan

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- `npx sanity schema extract --enforce-required-fields` requires `--workspace production` flag due to multiple workspaces in config — plan's verify command didn't include this flag, added it manually. Not a code issue.

## Next Phase Readiness
- Schema foundation complete — all 7 content types have `featuredIn`, all 3 people types have `featuredContent`
- `COMPLETENESS_CONFIG` and `GROQ_FILTERS` cover 10 types, ready for data entry tracking
- Ready for Plan 02 (data entry scripts) and Plan 03 (UI improvements) in Phase 6

## Self-Check: PASSED

All files verified present. Both task commits confirmed in git log.

---
*Phase: 06-person-tagging-data-entry*
*Completed: 2026-03-16*
