---
phase: 14-script-correctness
plan: "01"
subsystem: scripts/process-raw-video.py
tags: [ffmpeg, encoding, argparse, cli, tdd, python, lut, anamorphic]
dependency_graph:
  requires: []
  provides: [fixed-encoding-pipeline, argparse-cli, lut-resolution, encoding-tests]
  affects: [scripts/process-raw-video.py, scripts/tests/test_encoding.py]
tech_stack:
  added: [argparse]
  patterns: [TDD-red-green, pure-CRF-encoding, graceful-degradation]
key_files:
  created:
    - scripts/tests/test_encoding.py
  modified:
    - scripts/process-raw-video.py
    - scripts/tests/conftest.py
decisions:
  - "CRF 18 only — no -b:v, -maxrate, -bufsize flags (D-01)"
  - "argparse CLI with --camera, --anamorphic, --skip-transcribe (D-05)"
  - "Missing LUT: warn and continue, do not abort (D-06)"
  - "detect_anamorphic() removed — explicit --anamorphic flag instead (D-08)"
  - "Dead audio constants removed: LOUDNESS_TARGET, TRUE_PEAK, HIGHPASS_FREQ, AUDIO_BITRATE, VIDEO_BITRATE (D-03)"
metrics:
  duration: 3min
  completed: 2026-03-27T00:51:33Z
  tasks_completed: 2
  files_changed: 3
---

# Phase 14 Plan 01: FFmpeg Encoding Fix + argparse CLI Summary

**One-liner:** Pure CRF 18 H.264 encoding pipeline with argparse CLI (--camera, --anamorphic, --skip-transcribe), missing LUT graceful degradation, dead code removal, and 14 unit tests.

## Tasks Completed

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 | TDD RED: Create test_encoding.py with 14 failing tests | a427ba9 | scripts/tests/test_encoding.py, scripts/tests/conftest.py |
| 2 | GREEN: Fix process-raw-video.py — encoding, argparse, dead code | 0131902 | scripts/process-raw-video.py |

## What Was Built

### scripts/process-raw-video.py (fixed)

**D-01 — Bitrate flags removed:**
- Removed `-b:v 18M`, `-maxrate 25M`, `-bufsize 50M` from `build_ffmpeg_command`
- FFmpeg now runs pure CRF 18 mode — no quality/bitrate conflict

**D-03 — Dead constants removed:**
- Removed `LOUDNESS_TARGET`, `TRUE_PEAK`, `HIGHPASS_FREQ`, `VIDEO_BITRATE`, `AUDIO_BITRATE`
- Removed `audio_loudness_target` key from output JSON `processing` dict

**D-05 — argparse CLI:**
- Added `parse_args(argv=None)` function with `ArgumentParser`
- `--camera` flag with choices from `CAMERA_LUTS` keys, default `sony-a6700-slog3`
- `--anamorphic` store_true flag
- `--skip-transcribe` store_true flag
- `main()` updated to use `parse_args()` instead of `sys.argv[1]`

**D-06 — Graceful LUT missing:**
- `build_ffmpeg_command` prints `WARNING: LUT not found for {name}, processing without color grade`
- Continues processing without `lut3d=` filter — does not abort

**D-07 — GoPro comment cleanup:**
- Removed `# ProTune Flat — LUT pending` comment from `gopro-hero7-protune` entry

**D-08 — detect_anamorphic removed:**
- Deleted `detect_anamorphic()` function entirely
- `process_video()` signature updated: `(b2_path, camera, anamorphic, skip_transcribe)`
- `anamorphic` parameter passed from `args.anamorphic` in `main()`

**D-09 — Scale approach unchanged:**
- `scale=iw*1.33:ih` in `build_ffmpeg_command` kept as-is

### scripts/tests/test_encoding.py (created)

14 tests covering all VENC-01/03 and PIPE-01/02/03 behaviors:
- `test_no_bitrate_flags` — no -b:v, -maxrate, -bufsize in command
- `test_crf_settings` — -crf 18, -preset slow, libx264, yuv420p, +faststart
- `test_audio_passthrough` — -c:a copy present
- `test_lut_applied` — lut3d= in -vf when LUT file exists
- `test_lut_missing_continues` — no lut3d= and no crash when LUT missing
- `test_camera_flag_lut_resolution` — canon-r5-clog3 maps to canon-r5-clog3.cube
- `test_camera_flag_default` — default camera is sony-a6700-slog3
- `test_anamorphic_flag` — scale=iw*1.33:ih in -vf when anamorphic=True
- `test_no_anamorphic_no_scale` — no scale= when anamorphic=False
- `test_parse_args_camera` — --camera sets args.camera
- `test_parse_args_anamorphic` — --anamorphic sets args.anamorphic=True
- `test_parse_args_skip_transcribe` — --skip-transcribe sets args.skip_transcribe=True
- `test_dead_constants_removed` — source-level check for 5 removed constants
- `test_detect_anamorphic_removed` — source-level check for removed function

### scripts/tests/conftest.py (updated)

Added `lut_dir` fixture that creates a tmp_path with sony and canon fake .cube files.

## Verification

```
python3 -m pytest scripts/tests/test_encoding.py -v
14 passed in 0.02s

grep -c "\-b:v\|maxrate\|bufsize\|LOUDNESS_TARGET\|..." scripts/process-raw-video.py
0

python3 scripts/process-raw-video.py --help
usage: process-raw-video.py ... --camera {...} --anamorphic --skip-transcribe
```

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Self-Check: PASSED

Files created/modified:
- [x] scripts/tests/test_encoding.py — FOUND
- [x] scripts/process-raw-video.py — FOUND
- [x] scripts/tests/conftest.py — FOUND

Commits:
- [x] a427ba9 — FOUND (test(14-01): add failing tests...)
- [x] 0131902 — FOUND (fix(14-01): fix FFmpeg encoding...)
