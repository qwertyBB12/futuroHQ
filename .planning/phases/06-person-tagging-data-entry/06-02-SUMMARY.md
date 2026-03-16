---
phase: 06-person-tagging-data-entry
plan: 02
subsystem: database
tags: [sanity, typescript, migration, data-population, batch-scripts]

requires:
  - phase: 06-01
    provides: featuredContent and featuredIn schema fields added to alumni, collaborator, ledgerPerson, and 7 content types

provides:
  - Alumni featured field migration script (featuredEssays + featuredVideos -> featuredContent)
  - Batch population scripts for alumni, collaborators, ledger persons (JSON-driven, chunked)
  - Data template files showing expected JSON shape for each type
  - scripts/data/ gitignore rule to keep personal data out of repo

affects: [data-population, enrichment-tooling, content-lake]

tech-stack:
  added: []
  patterns:
    - "JSON-driven batch population: scripts read from scripts/data/*.json (gitignored), templates committed in scripts/data-templates/"
    - "Migration scripts use --live flag (default: dry-run) rather than --dry-run flag (default: live) for safety"

key-files:
  created:
    - scripts/migrate-alumni-featured.ts
    - scripts/populate-alumni.ts
    - scripts/populate-collaborators.ts
    - scripts/populate-ledger-persons.ts
    - scripts/data-templates/alumni-data.example.json
    - scripts/data-templates/collaborators-data.example.json
    - scripts/data-templates/ledger-persons-data.example.json
    - scripts/data-templates/README.md
  modified:
    - .gitignore

key-decisions:
  - "Migration uses --live flag (opt-in) not --dry-run (opt-out) — safer default for destructive field removal"
  - "Runtime data files live in scripts/data/ (gitignored); templates in scripts/data-templates/ (committed)"
  - "Populate scripts use client.patch().set() to overwrite — distinct from batch-enrich.ts which uses setIfMissing"

patterns-established:
  - "Migration scripts: opt-in live flag, explicit WARNING in dry-run output, [DRY RUN] / [PATCHING] markers"
  - "Population scripts: processInChunks(25) with 1s delay, transactional batch commits per chunk"

requirements-completed: [DATA-01, DATA-02, DATA-03]

duration: 2min
completed: 2026-03-16
---

# Phase 6 Plan 02: Migration and Population Scripts Summary

**Alumni featured field migration + 3 JSON-driven batch population scripts with data templates committed, runtime data gitignored**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-16T22:39:19Z
- **Completed:** 2026-03-16T22:41:49Z
- **Tasks:** 1 complete (Task 2: awaiting human verification)
- **Files modified:** 9

## Accomplishments
- Migration script consolidates `featuredEssays` + `featuredVideos` into unified `featuredContent` on alumni documents, with deduplication and opt-in `--live` mode
- Three batch population scripts ready for user-provided JSON data (alumni, collaborators, ledger persons), following `batch-enrich.ts` chunked transaction pattern
- Data template JSON files committed in `scripts/data-templates/`, runtime data files in `scripts/data/` are gitignored

## Task Commits

Each task was committed atomically:

1. **Task 1: Create alumni migration script and all data population scripts with templates** - `025e8f6` (feat)

**Plan metadata:** pending (checkpoint not yet cleared)

## Files Created/Modified
- `scripts/migrate-alumni-featured.ts` - Migrates featuredEssays + featuredVideos into featuredContent, then unsets old fields; dry-run default, --live to apply
- `scripts/populate-alumni.ts` - Batch patches alumni from scripts/data/alumni-data.json using chunked transactions
- `scripts/populate-collaborators.ts` - Batch patches collaborators from scripts/data/collaborators-data.json
- `scripts/populate-ledger-persons.ts` - Batch patches ledgerPerson from scripts/data/ledger-persons-data.json
- `scripts/data-templates/README.md` - Describes copy-to-scripts/data workflow
- `scripts/data-templates/alumni-data.example.json` - Template with _id, cohortYear, generation, country
- `scripts/data-templates/collaborators-data.example.json` - Template with _id, bio, orgType
- `scripts/data-templates/ledger-persons-data.example.json` - Template with _id, openingPortrait, currentTitle, organization
- `.gitignore` - Added scripts/data/ exclusion rule

## Decisions Made
- Migration uses `--live` opt-in flag (not `--dry-run` opt-out) — safer for destructive operations that unset fields
- `populate-*` scripts use `client.patch().set()` to overwrite, while `batch-enrich.ts` uses `setIfMissing` — intentional distinction for real vs placeholder data
- Templates committed in `scripts/data-templates/`, runtime data gitignored in `scripts/data/`

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- `npx tsc --noEmit scripts/*.ts` (inline file mode) shows pre-existing @sanity/client type errors unrelated to new scripts — confirmed against existing `batch-enrich.ts` which shows identical errors. Project's full `npx tsc --noEmit` passes clean.

## User Setup Required

**Scripts require manual data entry before running.** Steps:
1. `mkdir -p scripts/data`
2. Copy templates: `cp scripts/data-templates/alumni-data.example.json scripts/data/alumni-data.json` (repeat for collaborators and ledger-persons)
3. Edit each `scripts/data/*.json` with real Sanity document IDs and field values
4. Run migration: `npx tsx scripts/migrate-alumni-featured.ts` (dry-run), then `npx tsx scripts/migrate-alumni-featured.ts --live`
5. Run population scripts: `npx tsx scripts/populate-alumni.ts --dry-run` then `npx tsx scripts/populate-alumni.ts` (repeat for collaborators, ledger-persons)

## Next Phase Readiness
- Scripts are ready; user must provide data files to complete population
- Task 2 checkpoint: user must verify Studio UI, run migration/population with real data, and confirm completeness targets
- After Task 2 approved: DATA-01, DATA-02, DATA-03 requirements fully satisfied

---
*Phase: 06-person-tagging-data-entry*
*Completed: 2026-03-16*
