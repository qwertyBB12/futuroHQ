---
phase: 04-tech-debt-shared-infrastructure
plan: 01
subsystem: schema
tags: [sanity, typescript, constants, governance, schema]

# Dependency graph
requires: []
provides:
  - lib/constants.ts with GOVERNED_TYPES, BILINGUAL_TYPES, SURFACE_SITES as single source of truth
  - schemaTypes/blocks/surfaceOnField.ts shared field definition ready for propagation
  - alumniContinuum added to GOVERNED_TYPES (badges/actions/view panes now applied)
  - Arkah added to SURFACE_SITES (7 sites in brand hierarchy order)
affects: [04-02, 04-03, schema-propagation, surface-on-fields]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "lib/constants.ts as single source of truth for shared Sanity Studio constants"
    - "surfaceOnField using spread [...SURFACE_SITES] to convert readonly tuple for Sanity options.list"

key-files:
  created:
    - lib/constants.ts
    - schemaTypes/blocks/surfaceOnField.ts
  modified:
    - sanity.config.ts
    - deskStructure.ts

key-decisions:
  - "GOVERNED_TYPES merged superset: deskStructure.ts had alumniContinuum, sanity.config.ts did not — canonical set includes it"
  - "SURFACE_SITES brand hierarchy order: hectorhlopez > benext > futuro > next > arkah > mitikah > medikah"
  - "surfaceOnField group='distribution' — requires receiving schemas to define a Distribution group"
  - "SEO_TYPES and groupedDocTypes remain local to deskStructure.ts — desk-specific, not shared constants"

patterns-established:
  - "Single source: lib/constants.ts — all shared type sets live here, never duplicated in consumer files"
  - "Import pattern: import {GOVERNED_TYPES} from './lib/constants' (sanity.config.ts) and './lib/constants' (deskStructure.ts)"

requirements-completed: [SCHM-08, SCHM-02, SCHM-04]

# Metrics
duration: 2min
completed: 2026-03-16
---

# Phase 4 Plan 01: Shared Constants and surfaceOnField Summary

**GOVERNED_TYPES extracted to lib/constants.ts as single source of truth, fixing alumniContinuum badge divergence bug; SURFACE_SITES with Arkah added; surfaceOnField.ts ready for Plan 02 propagation**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-16T20:19:17Z
- **Completed:** 2026-03-16T20:21:05Z
- **Tasks:** 2
- **Files modified:** 4 (2 created, 2 modified)

## Accomplishments
- Extracted GOVERNED_TYPES, BILINGUAL_TYPES, SURFACE_SITES to lib/constants.ts — single source of truth eliminating divergence bug
- alumniContinuum now correctly included in GOVERNED_TYPES (was missing from sanity.config.ts — badges/actions/view panes were silently not applying)
- Arkah added as 5th site in SURFACE_SITES in brand hierarchy order (SCHM-04)
- Created surfaceOnField.ts with grid layout and distribution group, consuming SURFACE_SITES from constants
- TypeScript build passes with no errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Create lib/constants.ts and surfaceOnField.ts** - `ad84155` (feat)
2. **Task 2: Update sanity.config.ts and deskStructure.ts** - `6091561` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `lib/constants.ts` - GOVERNED_TYPES (22 types), BILINGUAL_TYPES (4 types), SURFACE_SITES (7 sites) — single source of truth
- `schemaTypes/blocks/surfaceOnField.ts` - Shared surfaceOn field, grid layout, distribution group, generic description
- `sanity.config.ts` - Removed local GOVERNED_TYPES + BILINGUAL_TYPES definitions, added import from lib/constants
- `deskStructure.ts` - Removed local GOVERNED_TYPES definition, added import from lib/constants

## Decisions Made
- GOVERNED_TYPES merged as superset of both files: deskStructure.ts was the authoritative copy (had alumniContinuum); sanity.config.ts was missing it
- SEO_TYPES and groupedDocTypes intentionally remain local to deskStructure.ts (desk-specific, not consumed by any other file)
- SURFACE_SITES uses `as const` for type safety; surfaceOnField uses spread `[...SURFACE_SITES]` because Sanity's options.list expects a mutable array

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- lib/constants.ts is ready for Plan 02 to import surfaceOnField into content schemas
- surfaceOnField.ts is ready; Plan 02 will add 'distribution' group + surfaceOnField to essay, video, podcastEpisode, opEd, news, keynote
- alumniContinuum governance fix is live — badges/actions/view tabs will now render for alumniContinuum documents

---
*Phase: 04-tech-debt-shared-infrastructure*
*Completed: 2026-03-16*
