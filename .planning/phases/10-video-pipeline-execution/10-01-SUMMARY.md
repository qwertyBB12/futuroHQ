---
phase: 10
plan: 01
subsystem: scripts, lib
tags: [transcript, ingestion, completeness, b2, video-pipeline]
dependency_graph:
  requires: []
  provides: [scripts/ingest-transcripts.ts, lib/completeness.ts b2Key check]
  affects: [deskStructure.ts Needs Enrichment filter, video completeness panel]
tech_stack:
  added: []
  patterns: [batch-enrich.ts chunk pattern, processInChunks helper, dotenv + @sanity/client]
key_files:
  created:
    - scripts/ingest-transcripts.ts
  modified:
    - lib/completeness.ts
decisions:
  - "Use client.patch().set() (not setIfMissing) to always overwrite transcript data with latest pipeline output"
  - "Match b2Key stem case-insensitively to handle filename variations; exact match tried first"
  - "speakerSegments items get _key (randomUUID slice) and _type: 'object' as required by Sanity array items"
  - "GROQ_FILTERS.video b2Key check uses !defined(b2Key) || b2Key == '' pattern consistent with existing cdnUrl/bunnyStatus checks"
metrics:
  duration: "~2 minutes"
  completed: "2026-03-21"
  tasks_completed: 2
  files_changed: 2
---

# Phase 10 Plan 01: Transcript Ingestion & b2Key Completeness Summary

**One-liner:** Batch transcript ingestion script matching 26 B2 videos to .enriched.json files via b2Key stem, plus b2Key added to video completeness checks.

## Objective

Create the transcript ingestion script and update video completeness config to require b2Key. The 26 video documents already exist as drafts in Sanity with b2Key/cdnUrl/bunnyStatus; this plan patches them with fullText and speakerSegments from the transcription pipeline output.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Create transcript ingestion script | cd14d05 | scripts/ingest-transcripts.ts (created) |
| 2 | Add b2Key to video completeness config | a7aeff3 | lib/completeness.ts (modified) |

## What Was Built

### scripts/ingest-transcripts.ts (new, 292 lines)

Follows the batch-enrich.ts pattern with:
- Fetches all `_type == "video" && videoSource == "b2" && defined(b2Key)` docs (includes drafts)
- Scans `transcripts/` for `*.enriched.json` files (78 found)
- Matches by extracting stem from b2Key last path segment (handles spaces in filenames)
- Case-insensitive fallback matching after exact match attempt
- Maps `full_text` -> `fullText`, `speaker_segments` -> `speakerSegments` with `_key` + `_type: 'object'` per Sanity array requirements
- Patches via `client.patch(id).set({fullText, speakerSegments}).commit()`
- `--dry-run` flag: reports matches without patching
- `--force` flag: overwrites existing transcript data
- Processes in chunks of 10 with 1s delay
- Reports matched / skipped / unmatched / orphan files

**Dry-run result:** 26/26 matched, 0 unmatched, 52 orphan files (C3460-C3485 series + other HB_ files not in Sanity)

### lib/completeness.ts (modified)

Two changes:
1. `checkCompleteness()` isB2 block: added b2Key check before cdnUrl check, label `'B2 Key'`; updated total from `checks.length + 2` to `checks.length + 3`
2. `GROQ_FILTERS.video`: added `!defined(b2Key) || b2Key == ""` to B2 condition so videos missing b2Key surface in Needs Enrichment desk list

## Verification Results

1. `npx tsx scripts/ingest-transcripts.ts --dry-run` — 26 matched, 0 unmatched, no errors
2. `grep -c "b2Key" lib/completeness.ts` — 2 literal occurrences (+ `'B2 Key'` label string = 3 total b2Key references)
3. `grep "checks.length + 3" lib/completeness.ts` — confirmed

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — the ingestion script is complete and functional. The 52 orphan enriched files (C3460 series + extra HB_ files) are pipeline output that doesn't correspond to current Sanity video documents; this is expected.

## Self-Check: PASSED

- [x] `scripts/ingest-transcripts.ts` exists (292 lines, > 80 min)
- [x] `lib/completeness.ts` contains `b2Key` in isB2 block and GROQ filter
- [x] Commits cd14d05, a7aeff3 exist
- [x] Dry-run: 26/26 matched
