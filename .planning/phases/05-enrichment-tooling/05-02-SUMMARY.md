---
phase: 05-enrichment-tooling
plan: 02
subsystem: ui
tags: [sanity, react, dashboard, completeness, enrichment, batch-script]

# Dependency graph
requires:
  - phase: 05-01
    provides: lib/completeness.ts with COMPLETENESS_CONFIG, GROQ_FILTERS, checkCompleteness, ENRICHMENT_TYPES
provides:
  - EnrichmentProgressWidget — per-type Copper progress bars on dashboard
  - CompletenessInput — live completeness banner above document forms for 5 tracked types
  - batch-enrich.ts — CLI batch script with chunked transactions and --dry-run flag
affects:
  - Phase 06 data entry (editors use banner to track enrichment; batch script primes placeholder values)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - document.components.unstable_layout for document-level form wrapping (chains with @sanity/assist)
    - useFormValue([]) to read full document state inside a form wrapper component
    - processInChunks helper pattern for rate-limit-safe batch Sanity operations
    - client.transaction() for atomic multi-doc batch patches

key-files:
  created:
    - components/dashboard/EnrichmentProgressWidget.tsx
    - components/inputs/CompletenessInput.tsx
    - scripts/batch-enrich.ts
  modified:
    - components/dashboard/DashboardLayout.tsx
    - sanity.config.ts

key-decisions:
  - "document.components.unstable_layout used for banner registration — @sanity/assist already uses it and Sanity 5 chains multiple registrations via renderDefault"
  - "CompletenessInput guards internally via COMPLETENESS_CONFIG so it can be registered globally without type filtering at registration time"
  - "ENRICHMENT_TYPES imported in sanity.config.ts but guard is in CompletenessInput itself — registration applies to all doc types, component self-guards"

patterns-established:
  - "Pattern 1: Form wrapper via document.components.unstable_layout — renderDefault(props) called to preserve default layout"
  - "Pattern 2: processInChunks — chunk + sleep(1000) + transaction commit for Sanity batch writes"

requirements-completed: [ENRH-02, ENRH-03, ENRH-04]

# Metrics
duration: 2min
completed: 2026-03-16
---

# Phase 05 Plan 02: Enrichment Tooling UI Summary

**Dashboard progress widget (Copper bars), live per-doc completeness banner (caution/positive tones), and batch-enrich CLI script with chunked transactions for all 5 tracked types**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-16T21:36:06Z
- **Completed:** 2026-03-16T21:37:54Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments
- EnrichmentProgressWidget renders 5 tracked types with Copper (#B17E68) progress bars (8px, 0.4s ease) fetching counts via GROQ_FILTERS
- CompletenessInput banner updates live as editors fill fields — caution tone shows count/% and missing field names; positive tone at 100%
- batch-enrich.ts processes docs in chunks of 25 with 1s delay, uses transaction() + setIfMissing for idempotent runs, --dry-run for safe preview

## Task Commits

Each task was committed atomically:

1. **Task 1: Create EnrichmentProgressWidget and register in DashboardLayout** - `0400d93` (feat)
2. **Task 2: Create CompletenessInput banner and register in sanity.config.ts** - `912abcc` (feat)
3. **Task 3: Create batch enrichment script with chunked transactions** - `c601f03` (feat)

**Plan metadata:** (final docs commit)

## Files Created/Modified
- `components/dashboard/EnrichmentProgressWidget.tsx` - Per-type Copper progress bars, fetches total and incomplete counts on mount
- `components/inputs/CompletenessInput.tsx` - Live completeness banner using useFormValue([]), caution/positive tones
- `scripts/batch-enrich.ts` - Batch patch CLI with processInChunks, transaction commits, --dry-run flag
- `components/dashboard/DashboardLayout.tsx` - Added EnrichmentProgressWidget in new Grid row before Sites row
- `sanity.config.ts` - Added document.components.unstable_layout registration for CompletenessInput

## Decisions Made
- Used `document.components.unstable_layout` (same pattern as @sanity/assist) — Sanity 5 chains multiple registrations so no conflict
- CompletenessInput guards internally via `COMPLETENESS_CONFIG[schemaType]` so global registration is safe; returns `renderDefault(props)` for non-tracked types
- Banner progress bar has no CSS transition (immediate update per UI-SPEC interaction contract), unlike widget which has 0.4s ease

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None — the `@sanity/assist` plugin source confirmed the exact `document.components.unstable_layout` registration pattern before implementation.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All enrichment tooling UI is complete (Phase 05 done)
- Phase 06 data entry can begin: editors see live completeness banners on all 5 tracked types
- batch-enrich.ts ready to prime placeholder values before manual data entry
- Dashboard widget provides at-a-glance enrichment status for all 5 types

---
*Phase: 05-enrichment-tooling*
*Completed: 2026-03-16*

## Self-Check: PASSED

- FOUND: components/dashboard/EnrichmentProgressWidget.tsx
- FOUND: components/inputs/CompletenessInput.tsx
- FOUND: scripts/batch-enrich.ts
- FOUND: .planning/phases/05-enrichment-tooling/05-02-SUMMARY.md
- FOUND: commit 0400d93 (Task 1)
- FOUND: commit 912abcc (Task 2)
- FOUND: commit c601f03 (Task 3)
