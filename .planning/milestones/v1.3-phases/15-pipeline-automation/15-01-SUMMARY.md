---
phase: 15-pipeline-automation
plan: "01"
subsystem: infra
tags: [python, pipeline, b2, bunny-cdn, ffmpeg, whisper, argparse, importlib, tdd]

# Dependency graph
requires:
  - phase: 14-script-correctness
    provides: process-raw-video.py with argparse CLI, CRF-only encoding, HF_TOKEN env var
  - phase: 13-sanity-data-integrity
    provides: CDN URL formula (benext.b-cdn.net), B2 path conventions, clip manifest structure
provides:
  - scripts/pipeline.py end-to-end orchestrator wiring all pipeline stages
  - parse_pipeline_args with full flag set (skip-upload, skip-sanity, skip-clips, dry-run, live)
  - derive_b2_upload_path / derive_clips_b2_path / derive_cdn_url path helpers
  - upload_clips_to_b2 reads manifest filenames (no hardcoded speaker numbering)
  - run_pipeline with staged failure handling and step tracking
  - process_video() returns result dict, accepts skip_upload/skip_cleanup params
  - process_transcript() accepts optional video_path, returns manifest dict
affects:
  - 15-02 (Sanity doc creation) depends on pipeline.py run_pipeline result dict
  - Any future batch job scripts that import from process-raw-video or extract-speaker-clips

# Tech tracking
tech-stack:
  added: []
  patterns:
    - importlib.util.spec_from_file_location for loading hyphenated Python filenames
    - skip_cleanup=True pattern to retain processed file across pipeline stages
    - Manifest-driven clip iteration (no hardcoded speaker numbering)
    - Typed optional param with Path default: video_path: Path = None

key-files:
  created:
    - scripts/pipeline.py
    - scripts/tests/test_pipeline.py
  modified:
    - scripts/process-raw-video.py
    - scripts/extract-speaker-clips.py

key-decisions:
  - "importlib.util.spec_from_file_location used to import hyphenated filenames without renaming"
  - "skip_cleanup=True passed by orchestrator so processed file survives into clip extraction"
  - "process_transcript tracks _downloaded_video flag to only delete files it owns"
  - "CLIPS_B2_PREFIX hardcoded to Futuro MMXXV — covers current production use case"
  - "derive_b2_upload_path uses rfind('/') + 1 to cleanly swap filename regardless of subfolder depth"
  - "Batch mode logs failures and continues — clip failure is non-fatal for processed video upload"

patterns-established:
  - "Pipeline scripts importable via importlib without renaming — preserves standalone CLI"
  - "Result dict pattern: each stage returns dict with stem, paths, upload_success, error info"
  - "Manifest-driven uploads: upload_clips_to_b2 reads manifest.json filenames, no assumptions"

requirements-completed: [AUTO-01, AUTO-02, AUTO-03]

# Metrics
duration: 4min
completed: 2026-03-27
---

# Phase 15 Plan 01: Pipeline Orchestrator Summary

**Python pipeline.py orchestrator wiring process-raw-video + extract-speaker-clips into one command with B2 upload, manifest-driven clip iteration, and importlib module loading for hyphenated filenames**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-03-27T03:11:55Z
- **Completed:** 2026-03-27T03:15:53Z
- **Tasks:** 1 (TDD: RED + GREEN phases)
- **Files modified:** 4

## Accomplishments

- Created `scripts/pipeline.py` with full CLI (`--skip-upload`, `--skip-sanity`, `--skip-clips`, `--dry-run`, `--live`), path helpers, and staged `run_pipeline()` function
- Refactored `process_video()` to return a result dict and accept `skip_upload`/`skip_cleanup` params without breaking standalone CLI
- Refactored `process_transcript()` to accept optional `video_path` (avoids re-download) and return manifest dict with ownership-based cleanup
- All 19 new test_pipeline.py tests pass + all 25 existing test_encoding.py tests still pass (no regressions)

## Task Commits

1. **TDD RED - Failing tests for pipeline orchestrator** - `ec825b3` (test)
2. **GREEN + Implementation** - `0e6f933` (feat)

## Files Created/Modified

- `scripts/pipeline.py` - End-to-end orchestrator (new, ~230 lines)
- `scripts/tests/test_pipeline.py` - 19 unit tests for orchestrator (new)
- `scripts/process-raw-video.py` - Added `skip_upload`, `skip_cleanup` params; `process_video()` now returns result dict
- `scripts/extract-speaker-clips.py` - Added `video_path=None` param; `process_transcript()` returns manifest dict; tracks `_downloaded_video` for safe cleanup

## Decisions Made

- Used `importlib.util.spec_from_file_location` to load hyphenated filenames (`process-raw-video.py`, `extract-speaker-clips.py`) — avoids renaming files, preserves standalone CLI usage
- `skip_cleanup=True` passed by orchestrator so processed file survives from encode stage into clip extraction — orchestrator manages final cleanup
- `process_transcript()` tracks `_downloaded_video` flag to only delete files it downloaded (not files the orchestrator provided)
- `CLIPS_B2_PREFIX = "Futuro MMXXV"` hardcoded for current production use case — can be made configurable in future
- Batch failure handling: clip extraction failure is non-fatal, processed video still uploads; step failures are tracked in `steps_completed` list

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Test assertion used `video_path=None` but source uses typed annotation `video_path: Path = None`**
- **Found during:** Task 1 GREEN phase (test run)
- **Issue:** Test searched for exact string `video_path=None` but typed annotation `video_path: Path = None` is the correct Python form
- **Fix:** Updated test to check for both forms using `or` logic
- **Files modified:** scripts/tests/test_pipeline.py
- **Verification:** All 19 tests pass
- **Committed in:** 0e6f933 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - bug in test assertion)
**Impact on plan:** Minor fix to test string matching. No scope creep.

## Issues Encountered

None — plan executed cleanly.

## Known Stubs

None — `pipeline.py` Sanity doc creation is gated behind `--dry-run`/`--live` flags (Plan 02 adds the implementation). The orchestrator prints "use --dry-run or --live" when neither is passed — this is intentional gating, not a stub.

## Next Phase Readiness

- `scripts/pipeline.py` ready for Plan 02 to add Sanity document creation (`--dry-run`/`--live` paths)
- `run_pipeline()` returns a result dict with `stem`, `edited_b2_path`, `edited_cdn_url`, `clips` — Plan 02 will consume this to create video + clip documents
- Both existing scripts still work standalone — no regression risk

---
*Phase: 15-pipeline-automation*
*Completed: 2026-03-27*
