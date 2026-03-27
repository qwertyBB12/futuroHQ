---
phase: 14-script-correctness
plan: "03"
subsystem: video-pipeline
tags: [faststart, mp4, binary-parsing, audit, python, tdd]
dependency_graph:
  requires: []
  provides: [VENC-02]
  affects: [scripts/audit-faststart.py, scripts/tests/test_encoding.py]
tech_stack:
  added: []
  patterns: [binary-box-parsing, argparse-cli, importlib-dynamic-import]
key_files:
  created:
    - scripts/audit-faststart.py
    - scripts/tests/test_encoding.py
  modified: []
decisions:
  - "Binary MP4 box parsing (stdlib struct) over ffprobe — ffprobe does not expose atom order"
  - "importlib.util.spec_from_file_location for test imports — audit-faststart.py is not a package"
  - "Extended size (size==1) handled by reading 8 extra bytes and seeking past actual_size - 16"
metrics:
  duration: 97s
  completed: "2026-03-26"
  tasks: 1
  files: 2
---

# Phase 14 Plan 03: Faststart Audit Script Summary

**One-liner:** Standalone `audit-faststart.py` with `has_faststart()` binary box parser and argparse CLI for scanning MP4 files for MOOV-before-MDAT (progressive streaming compliance).

## Tasks Completed

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 (RED) | Add 6 failing faststart tests to test_encoding.py | 96d0bcb | scripts/tests/test_encoding.py |
| 1 (GREEN) | Create audit-faststart.py with has_faststart(), audit_directory(), CLI | 36d8333 | scripts/audit-faststart.py |

## What Was Built

**`scripts/audit-faststart.py`** — Standalone tool for auditing MP4 faststart compliance.

- `has_faststart(file_path: Path) -> bool` — Reads MP4 box headers (8 bytes each: 4-byte big-endian size + 4-byte ASCII type). Returns True if `moov` is encountered before `mdat`. Handles:
  - `size == 0`: extends to EOF, return False
  - `size == 1`: 64-bit extended size, reads 8 more bytes via `struct.unpack(">Q", ...)`
  - `size < 8`: malformed, return False
  - `IOError / struct.error / OSError`: return False

- `audit_directory(dir_path: Path) -> dict` — Scans `**/*.mp4` and `**/*.MP4` recursively, returns `{"pass": [...], "fail": [...], "error": [...]}`.

- CLI mode with argparse:
  - `python3 scripts/audit-faststart.py /path/to/dir` — scan directory, print table
  - `python3 scripts/audit-faststart.py --file /path/to/video.mp4` — single file check
  - Exits 0 if all pass, 1 if any fail/error

**`scripts/tests/test_encoding.py`** — 6 unit tests using synthetic MP4 byte sequences:

| Test | Scenario | Expected |
|------|----------|----------|
| test_faststart_moov_first | ftyp + moov + mdat | True |
| test_faststart_mdat_first | ftyp + mdat + moov | False |
| test_faststart_extended_size | ftyp + free(extended) + moov + mdat | True |
| test_faststart_empty_file | empty file | False |
| test_faststart_malformed | 4 bytes only | False |
| test_faststart_no_moov_no_mdat | ftyp only | False |

## Verification

```
python3 -m pytest scripts/tests/test_encoding.py -k "faststart" -v
6 passed in 0.02s
```

## Deviations from Plan

None — plan executed exactly as written. TDD RED→GREEN flow followed precisely.

## Known Stubs

None — `has_faststart()` is fully functional binary parser. No placeholder values or TODO items.

## Self-Check: PASSED

- `scripts/audit-faststart.py` — FOUND (231 lines)
- `scripts/tests/test_encoding.py` — FOUND (113 lines)
- Commits: 96d0bcb (test RED), 36d8333 (feat GREEN)
- All 6 faststart tests PASSED
