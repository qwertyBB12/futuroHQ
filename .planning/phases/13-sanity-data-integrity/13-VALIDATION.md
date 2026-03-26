---
phase: 13
slug: sanity-data-integrity
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-26
---

# Phase 13 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | pytest (Python) |
| **Config file** | none — pytest discovers `scripts/tests/` automatically |
| **Quick run command** | `python3 -m pytest scripts/tests/ -x -q` |
| **Full suite command** | `python3 -m pytest scripts/tests/ -q` |
| **Estimated runtime** | ~5 seconds (all mock data, no live calls) |

---

## Sampling Rate

- **After every task commit:** Run `python3 -m pytest scripts/tests/ -x -q`
- **After every plan wave:** Run full suite command
- **Before `/gsd:verify-work`:** Full suite must be green (zero failures)
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 13-01-01 | 01 | 1 | DINT-01, DINT-02, DINT-03 | unit (scaffolding) | `python3 -m pytest scripts/tests/test_audit.py -x -q` | W0 (created by task) | pending |
| 13-01-02 | 01 | 1 | DINT-01, DINT-02, DINT-03 | unit (audit logic) | `python3 -m pytest scripts/tests/test_audit.py -x -q` | W0 (created by 13-01-01) | pending |
| 13-02-01 | 02 | 2 | DINT-01, DINT-02, DINT-03 | unit (fix logic) | `python3 -m pytest scripts/tests/test_fix.py -x -q` | W0 (created by task) | pending |
| 13-02-02 | 02 | 2 | DINT-03 | checkpoint | Manual: audit-fix-reaudit cycle | N/A | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [x] `scripts/tests/__init__.py` — package marker (created by Plan 01, Task 1)
- [x] `scripts/tests/conftest.py` — shared fixtures for mock Sanity/B2 responses (created by Plan 01, Task 1)
- [x] `scripts/tests/test_audit.py` — 8 unit tests for audit logic (created by Plan 01, Task 1)
- [x] `scripts/tests/test_fix.py` — 6 unit tests for fix logic (created by Plan 02, Task 1)
- [x] Framework install: `pip install pytest` (Plan 01, Task 1)

*All tests use mock data — no live Sanity/B2 calls in unit tests.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| MMXXV speaker identification | DINT-03 | Diarization only has SPEAKER_xx — real names require human review | After clearing wrong tags, review flagged clips and assign correct speakers |
| CDN HTTP accessibility | DINT-01 | Bunny CDN returns 401 — no auth token available | Once Bunny token is configured, re-run URL audit with HTTP HEAD checks |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
