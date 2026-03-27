---
phase: 15-pipeline-automation
plan: "02"
subsystem: infra
tags: [python, pipeline, sanity, b2, urllib, tdd, draft-documents, mutations-api]

# Dependency graph
requires:
  - phase: 15-pipeline-automation
    plan: "01"
    provides: pipeline.py orchestrator with run_pipeline result dict (stem, edited_b2_path, edited_cdn_url, clips)
  - phase: 13-sanity-data-integrity
    provides: Sanity mutations API patterns, b2Key/cdnUrl field conventions
provides:
  - scripts/pipeline.py with sanity_mutate, build_video_doc, build_clip_doc, create_video_document, create_clip_documents
  - Sanity draft document creation gated by --dry-run / --live flags
  - --skip-sanity flag to bypass document creation entirely
affects:
  - Any batch processing runs that use pipeline.py --live will now create Sanity draft docs
  - Future editorial workflows — pipeline output immediately visible as drafts in Studio

# Tech tracking
tech-stack:
  added:
    - urllib.request for Sanity Mutations API POST (no external dependencies)
    - urllib.parse for GROQ query URL encoding
    - uuid for drafts. prefixed _id generation and speakerSegments _key
  patterns:
    - sanity_mutate() assigns _id — builder functions return clean docs without _id
    - dry_run=True returns doc_id without HTTP call (safe for testing)
    - check_existing_b2key() GROQ count query guards against duplicate creation
    - featuredIn=[] for generic speaker labels (D-08 — no auto-matching possible)
    - speakerSegments with _key UUID prefix (Sanity array item requirement)

key-files:
  created: []
  modified:
    - scripts/pipeline.py
    - scripts/tests/test_pipeline.py

key-decisions:
  - "sanity_mutate() always creates drafts. — editorial review required before publish (D-11)"
  - "featuredIn=[] on clip docs — SPEAKER_00/01 labels can't be auto-matched to person docs (D-08)"
  - "urllib.request used (not subprocess curl) — Python stdlib REST API per D-10"
  - "builder functions don't set _id — sanity_mutate() owns _id assignment"
  - "check_existing_b2key skips duplicate creation in live mode only — dry run always shows what would create"

# Metrics
duration: 2min
completed: 2026-03-27
---

# Phase 15 Plan 02: Sanity Document Creation Summary

**Sanity draft video and clip document creation wired into pipeline.py with urllib.request mutations API, dry-run/live modes, and TDD test coverage**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-27T03:18:43Z
- **Completed:** 2026-03-27T03:21:00Z
- **Tasks:** 1 (TDD: RED + GREEN phases)
- **Files modified:** 2

## Accomplishments

- Added `sanity_mutate()`, `check_existing_b2key()`, `build_video_doc()`, `build_clip_doc()`, `create_video_document()`, `create_clip_documents()` to `scripts/pipeline.py`
- `build_video_doc()` sets all required fields: `_type`, `videoSource`, `b2Key`, `cdnUrl`, `bunnyStatus`, `language` (array), `videoFormat`, `duration`, `narrativeOwner`, `platformTier`, `archivalStatus`, `fullText`, `speakerSegments` (with `_key`)
- `build_clip_doc()` creates shortform clip docs with `featuredIn=[]` per D-08 (generic speaker labels can't auto-match)
- `run_pipeline()` now executes Step 4: Sanity document creation when `--dry-run` or `--live` is passed
- `--skip-sanity` completely bypasses document creation
- All documents created with `drafts.` prefix via `uuid.uuid4()`
- 26 test_pipeline.py tests pass + 25 test_encoding.py tests pass (no regressions)

## Task Commits

1. **TDD RED - Failing tests for Sanity document creation** - `e9864b5` (test)
2. **GREEN + Implementation** - `7177769` (feat)

## Files Created/Modified

- `scripts/pipeline.py` - Added ~170 lines: Sanity constants, 6 new functions, Step 4 in run_pipeline
- `scripts/tests/test_pipeline.py` - Added 7 new tests covering all pure Sanity functions

## Decisions Made

- Used `urllib.request.Request` (Python stdlib) instead of `subprocess curl` — per D-10, no external dependencies, proper Python REST API pattern
- `sanity_mutate()` is the single owner of `_id` assignment — builder functions return clean dicts without `_id` so they're trivially testable
- `featuredIn` is always `[]` on clip docs — SPEAKER_00/01 labels are opaque diarization artifacts that cannot be auto-matched to person documents without manual review (D-08)
- `check_existing_b2key()` deduplication only runs in live mode — dry run intentionally shows all would-be creations for preview purposes
- `OUTPUT_DIR` defaults to `scripts/../transcripts/` (project-relative) so enriched JSON lookup works without hardcoded paths

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all fields are wired to real data sources:
- `fullText` ← `enriched_data["full_text"]`
- `speakerSegments` ← `enriched_data["speaker_segments"]`
- `b2Key` ← `pipeline_result["edited_b2_path"]` / `clip["b2_key"]`
- `cdnUrl` ← `cdn_url` (derived CDN URL) / `clip["cdn_url"]`
- `duration` ← `enriched_data["duration_seconds"]` / `clip["duration"]`

`featuredIn=[]` on clip docs is intentional, documented under decisions (D-08), not a stub — wiring requires manual speaker identification in a future editorial step.

## Next Phase Readiness

- Phase 15 complete — pipeline now creates Sanity draft documents end-to-end
- `--dry-run` mode safe for CI/testing, `--live` mode ready for production runs
- Editorial workflow: drafts appear immediately in Sanity Studio for review/publish

## Self-Check: PASSED

- scripts/pipeline.py: FOUND
- scripts/tests/test_pipeline.py: FOUND
- .planning/phases/15-pipeline-automation/15-02-SUMMARY.md: FOUND
- Commit e9864b5 (TDD RED): FOUND
- Commit 7177769 (GREEN + Implementation): FOUND

---
*Phase: 15-pipeline-automation*
*Completed: 2026-03-27*
