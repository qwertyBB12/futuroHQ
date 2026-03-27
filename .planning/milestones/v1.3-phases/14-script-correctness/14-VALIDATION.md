---
phase: 14
slug: script-correctness
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-26
---

# Phase 14 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | pytest 9.0.2 |
| **Config file** | scripts/tests/conftest.py |
| **Quick run command** | `python -m pytest scripts/tests/test_encoding.py -x -q` |
| **Full suite command** | `python -m pytest scripts/tests/ -v` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `python -m pytest scripts/tests/test_encoding.py -x -q`
- **After every plan wave:** Run `python -m pytest scripts/tests/ -v`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 14-01-01 | 01 | 1 | VENC-01 | unit | `python -m pytest scripts/tests/test_encoding.py::test_crf_mode -v` | ❌ W0 | ⬜ pending |
| 14-01-02 | 01 | 1 | VENC-02 | unit | `python -m pytest scripts/tests/test_encoding.py::test_faststart -v` | ❌ W0 | ⬜ pending |
| 14-01-03 | 01 | 1 | VENC-03 | unit | `python -m pytest scripts/tests/test_encoding.py::test_lut_application -v` | ❌ W0 | ⬜ pending |
| 14-02-01 | 02 | 1 | PIPE-01 | unit | `python -m pytest scripts/tests/test_encoding.py::test_anamorphic -v` | ❌ W0 | ⬜ pending |
| 14-02-02 | 02 | 1 | PIPE-02 | unit | `python -m pytest scripts/tests/test_encoding.py::test_enriched_json -v` | ❌ W0 | ⬜ pending |
| 14-02-03 | 02 | 1 | PIPE-03 | unit | `python -m pytest scripts/tests/test_encoding.py::test_clip_faststart -v` | ❌ W0 | ⬜ pending |
| 14-02-04 | 02 | 1 | PIPE-04 | unit | `python -m pytest scripts/tests/test_encoding.py::test_pipeline_end_to_end -v` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `scripts/tests/test_encoding.py` — stubs for VENC-01, VENC-02, VENC-03, PIPE-01, PIPE-02, PIPE-03, PIPE-04
- [ ] `scripts/tests/conftest.py` — shared fixtures (synthetic MP4 bytes, mock ffprobe output)

*Existing conftest.py exists but may need additional fixtures for encoding tests.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual color correctness after LUT | VENC-03 | Requires human visual inspection | Process Canon R5 CLog3 file, view output in browser, confirm colors look natural |
| Anamorphic desqueeze visual check | PIPE-01 | Aspect ratio correctness needs visual confirm | Process 1.33x anamorphic source, confirm circles appear round in output |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
