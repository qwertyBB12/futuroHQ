---
phase: 01-safety-guards
plan: 01
subsystem: ui
tags: [sanity-studio, env-vars, error-handling, toast, seo, ai]

# Dependency graph
requires: []
provides:
  - "Hardened SeoGeneratorInput with correct SANITY_STUDIO_SEO_ENDPOINT env var"
  - "GenerateAIDerivativesAction with toast feedback on success and error"
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "SANITY_STUDIO_ prefix for all browser-exposed env vars"
    - "Toast notifications for async action feedback in document actions"

key-files:
  created: []
  modified:
    - components/inputs/SeoGeneratorInput.tsx
    - components/utils/fetchSeoSuggestion.ts
    - components/actions/GenerateAIDerivativesAction.ts

key-decisions:
  - "Import useToast from @sanity/ui (not sanity) — sanity package does not re-export it"
  - "Renamed AI_SEO_GENERATOR_ENDPOINT to SANITY_STUDIO_SEO_ENDPOINT to match Sanity browser bundle prefix convention"

patterns-established:
  - "All client-side env vars must use SANITY_STUDIO_ prefix"
  - "Document actions use @sanity/ui useToast for user feedback"

requirements-completed: [SAFE-01, SAFE-02]

# Metrics
duration: 2min
completed: 2026-03-08
---

# Phase 1 Plan 1: Env Guard + Error Feedback Summary

**Fixed broken SEO env var prefix (AI_SEO_GENERATOR_ENDPOINT -> SANITY_STUDIO_SEO_ENDPOINT) and added toast notifications to GenerateAIDerivativesAction replacing silent error swallowing**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-08T00:03:17Z
- **Completed:** 2026-03-08T00:05:10Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Fixed critical bug: SeoGeneratorInput now uses SANITY_STUDIO_SEO_ENDPOINT which Sanity actually exposes to the browser bundle (old AI_SEO_GENERATOR_ENDPOINT was never available client-side)
- GenerateAIDerivativesAction now shows toast on success, error response, and catch — no more silent failures
- Added SANITY_STUDIO_SEO_ENDPOINT placeholder to .env.local

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix SeoGeneratorInput env var prefix and harden disabled state** - `2442ed3` (fix)
2. **Task 2: Add error feedback to GenerateAIDerivativesAction** - `c2051a6` (fix)

## Files Created/Modified
- `components/inputs/SeoGeneratorInput.tsx` - Changed env var from AI_SEO_GENERATOR_ENDPOINT to SANITY_STUDIO_SEO_ENDPOINT, updated disabled state message
- `components/utils/fetchSeoSuggestion.ts` - Changed env var reference and console.warn message to SANITY_STUDIO_SEO_ENDPOINT
- `components/actions/GenerateAIDerivativesAction.ts` - Added useToast from @sanity/ui, replaced silent catch with error toast, added success toast, added non-ok response handling

## Decisions Made
- Used `@sanity/ui` for `useToast` import instead of `sanity` — the `sanity` package does not re-export `useToast` (discovered via TypeScript compilation error)
- Renamed env var to `SANITY_STUDIO_SEO_ENDPOINT` following established project convention (matches SANITY_STUDIO_AI_ENDPOINT, SANITY_STUDIO_NETLIFY_BUILD_HOOK_URL, etc.)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] useToast import source correction**
- **Found during:** Task 2 (Add error feedback to GenerateAIDerivativesAction)
- **Issue:** Plan specified `import {useToast} from 'sanity'` but sanity package does not export useToast
- **Fix:** Changed import to `import {useToast} from '@sanity/ui'`
- **Files modified:** components/actions/GenerateAIDerivativesAction.ts
- **Verification:** TypeScript compiles without errors for this file
- **Committed in:** c2051a6

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Import source correction was necessary for compilation. No scope creep.

## Issues Encountered
- Pre-existing TypeScript errors in migrations/ and scripts/ directories — unrelated to this plan's changes, not addressed.

## User Setup Required
None - no external service configuration required. The SANITY_STUDIO_SEO_ENDPOINT placeholder was added to .env.local (user sets the value when they have an endpoint).

## Next Phase Readiness
- Both AI-powered components now gracefully degrade when env vars are unset
- Error feedback is user-facing via toast notifications
- Ready for next plan in phase

## Self-Check: PASSED

All files exist, all commits verified.

---
*Phase: 01-safety-guards*
*Completed: 2026-03-08*
