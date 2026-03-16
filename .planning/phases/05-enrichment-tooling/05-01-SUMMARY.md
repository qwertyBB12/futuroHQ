---
phase: 05-enrichment-tooling
plan: 01
subsystem: ui
tags: [sanity, desk-structure, groq, typescript, completeness, enrichment]

# Dependency graph
requires: []
provides:
  - lib/completeness.ts — central completeness config (COMPLETENESS_CONFIG, checkCompleteness, ENRICHMENT_TYPES, GROQ_FILTERS)
  - Nested Needs Enrichment desk lists for alumni, collaborator, ledgerPerson, video, podcastEpisode
affects:
  - 05-02 (EnrichmentProgressWidget imports GROQ_FILTERS from lib/completeness.ts)
  - future batch scripts (import COMPLETENESS_CONFIG for field validation)
  - sanity.config.ts (ENRICHMENT_TYPES for CompletenessInput registration guard)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "listWithEnrichment desk helper: nested All [Type] + Needs Enrichment children using S.documentList().filter()"
    - "Pure TypeScript lib files with no Studio imports — importable by both browser Studio and Node.js scripts"
    - "GROQ_FILTERS single source: one change updates desk lists, dashboard widget, and banner simultaneously"

key-files:
  created:
    - lib/completeness.ts
  modified:
    - deskStructure.ts

key-decisions:
  - "S.documentList().filter() used for Needs Enrichment — NOT S.documentTypeList().filter() which silently ignores the filter"
  - "lib/completeness.ts has zero sanity/@sanity/ui imports — pure TypeScript for Node.js batch script compatibility"
  - "ENRICHMENT_TYPES is separate from GOVERNED_TYPES — collaborator and ledgerPerson are tracked but not governed"
  - "ledgerPerson upgraded from S.documentTypeListItem to listWithEnrichment — gains Content/Preview/SEO view tabs"

patterns-established:
  - "Pattern: lib/ files as shared constants with no Studio imports (follow lib/constants.ts convention)"
  - "Pattern: listWithEnrichment helper for nested All/Needs Enrichment desk structure"

requirements-completed: [ENRH-01]

# Metrics
duration: 1min
completed: 2026-03-16
---

# Phase 05 Plan 01: Completeness Config and Enrichment Desk Lists Summary

**Pure TypeScript completeness config (lib/completeness.ts) plus nested Needs Enrichment filtered desk lists for all 5 tracked types using S.documentList().filter() with draft-excluded GROQ**

## Performance

- **Duration:** 1 min
- **Started:** 2026-03-16T21:31:45Z
- **Completed:** 2026-03-16T21:33:34Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Created lib/completeness.ts as the single source of truth — COMPLETENESS_CONFIG with deep validation (bio >50 chars, asset._ref checks, array length >0), checkCompleteness() utility, ENRICHMENT_TYPES Set, and GROQ_FILTERS for all 5 types
- Added listWithEnrichment helper to deskStructure.ts with nested All [Type] + Needs Enrichment children, sourcing GROQ filters from lib/completeness
- Upgraded ledgerPerson from flat S.documentTypeListItem to full nested listWithEnrichment, gaining view tabs (Content, Preview, SEO)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create lib/completeness.ts** - `eb2a63c` (feat)
2. **Task 2: Add nested Needs Enrichment desk lists** - `c97d967` (feat)

**Plan metadata:** (see final commit below)

## Files Created/Modified

- `lib/completeness.ts` — central completeness config: COMPLETENESS_CONFIG, ENRICHMENT_TYPES, checkCompleteness(), GROQ_FILTERS (pure TypeScript, zero Studio imports)
- `deskStructure.ts` — imports GROQ_FILTERS, adds listWithEnrichment helper, replaces 5 tracked types with enrichment-nested structure

## Decisions Made

- Used `S.documentList().schemaType(schemaType).filter()` for Needs Enrichment lists (not `S.documentTypeList().filter()` which silently ignores custom GROQ filters)
- lib/completeness.ts kept pure TypeScript with no sanity/@sanity/ui imports so it can be imported by Node.js batch scripts
- ENRICHMENT_TYPES defined separately from GOVERNED_TYPES because collaborator and ledgerPerson are enrichment-tracked but not governance-governed

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None — pre-existing TypeScript errors in scripts/ and migrations/ directories are unrelated and were present before this plan.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- lib/completeness.ts is ready for import by Phase 05-02 (EnrichmentProgressWidget uses GROQ_FILTERS)
- lib/completeness.ts is ready for Phase 05-03 (CompletenessInput banner uses COMPLETENESS_CONFIG + checkCompleteness)
- lib/completeness.ts is ready for Phase 05-04 batch scripts (Node.js compatible, zero Studio imports)
- Desk structure fully functional — editors can immediately navigate to Needs Enrichment under any tracked type

---
*Phase: 05-enrichment-tooling*
*Completed: 2026-03-16*
