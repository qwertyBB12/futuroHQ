---
phase: 04-tech-debt-shared-infrastructure
plan: 02
subsystem: schema
tags: [surfaceOn, distribution, governance, alumniContinuum]
dependency_graph:
  requires: [04-01]
  provides: [surfaceOnField on all 6 content schemas, alumniContinuum governance defaults]
  affects: [essay.ts, video.ts, podcast.ts, podcastEpisode.ts, keynote.ts, news.ts, alumniContinuum.ts]
tech_stack:
  added: []
  patterns: [shared field import, Distribution group, setIfMissing defaults]
key_files:
  created: []
  modified:
    - schemaTypes/essay.ts
    - schemaTypes/video.ts
    - schemaTypes/podcast.ts
    - schemaTypes/podcastEpisode.ts
    - schemaTypes/keynote.ts
    - schemaTypes/news.ts
    - schemaTypes/alumniContinuum.ts
decisions:
  - "surfaceOnField inserted before ...governanceFields in all schemas so distribution fields appear above governance fields in form"
  - "alumniContinuum GROQ audit confirmed 0 existing documents — no patch script needed"
  - "alumniContinuum defaults changed to narrativeOwner: benext, platformTier: canonical, archivalStatus: archival per CONTEXT.md"
metrics:
  duration: 3min
  completed: "2026-03-16"
  tasks_completed: 2
  files_modified: 7
---

# Phase 04 Plan 02: surfaceOnField Propagation + alumniContinuum Governance Summary

**One-liner:** Propagated shared surfaceOnField to all 6 content schemas (replacing essay's inline definition) and corrected alumniContinuum governance defaults from futuro/alumni-only to benext/canonical/archival.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add surfaceOnField to all 6 content schemas | e65094e | essay.ts, video.ts, podcast.ts, podcastEpisode.ts, keynote.ts, news.ts |
| 2 | Audit and patch alumniContinuum governance data, update initialValue | 7c96168 | alumniContinuum.ts |

## What Was Built

### Task 1: surfaceOnField Propagation

All 6 content schemas now have:
- `import {surfaceOnField} from './blocks/surfaceOnField'`
- `groups: [{name: 'distribution', title: 'Distribution'}]`
- `surfaceOnField,` in the fields array before `...governanceFields`

**essay.ts special case:** The old inline `surfaceOn` definition (6-site list missing Arkah) was removed. The shared `surfaceOnField` from Plan 01 replaces it with the 7-site grid (adds Arkah).

### Task 2: alumniContinuum Governance

**GROQ audit result:** 0 existing `alumniContinuum` documents in production dataset — no patch required.

**initialValue updated:**
- `narrativeOwner`: `'futuro'` → `'benext'`
- `archivalStatus`: `'alumni-only'` → `'archival'`
- Added `platformTier: 'canonical'` (was missing entirely)
- `accessLevel: 'all-alumni'` — unchanged

**description string updated** to reflect `platformTier: "canonical"` and `archivalStatus: "archival"`.

Combined with Plan 01's GOVERNED_TYPES inclusion of `alumniContinuum`, new documents will now display `EntityBadge` (benext/Vermillion), `PlatformTierBadge` (canonical), and `ArchivalBadge` (archival) correctly.

## Decisions Made

1. **surfaceOnField placement:** Inserted immediately before `...governanceFields` so distribution fields appear just above governance fields in the Studio form — logical grouping with related content metadata.

2. **GROQ audit outcome:** 0 existing alumniContinuum documents confirmed — patch script not needed. initialValue update is sufficient for future documents.

3. **alumniContinuum defaults:** CONTEXT.md specifies benext/canonical/archival as the locked defaults. The old schema had futuro/alumni-only which contradicted this.

## Deviations from Plan

None — plan executed exactly as written.

## Verification

```
6 of 6 schemas contain surfaceOnField import (confirmed)
essay.ts: 0 occurrences of 'name: surfaceOn' inline (confirmed)
essay.ts: no 'hectorhlopez.com' title in site list (old inline removed)
alumniContinuum.ts: narrativeOwner: 'benext' (confirmed)
alumniContinuum.ts: platformTier: 'canonical' (confirmed)
alumniContinuum.ts: archivalStatus: 'archival' (confirmed)
npx sanity build: exit 0 (confirmed, twice)
```

## Self-Check

### Files Exist
- schemaTypes/essay.ts: FOUND
- schemaTypes/video.ts: FOUND
- schemaTypes/podcast.ts: FOUND
- schemaTypes/podcastEpisode.ts: FOUND
- schemaTypes/keynote.ts: FOUND
- schemaTypes/news.ts: FOUND
- schemaTypes/alumniContinuum.ts: FOUND

### Commits Exist
- e65094e: feat(04-02) add surfaceOnField to all 6 content schemas
- 7c96168: feat(04-02) update alumniContinuum governance defaults

## Self-Check: PASSED
