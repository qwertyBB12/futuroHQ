---
phase: 17-pipeline-path-fix
verified: 2026-03-26T09:45:00Z
status: passed
score: 4/4 must-haves verified
re_verification: false
human_verification:
  - test: "Run pipeline.py against a real Kah Foundry XXVI clip and inspect uploaded B2 path"
    expected: "Clip appears under 'Kah Foundry XXVI/clips/135A3217/' in B2 — not under 'Futuro MMXXV/clips/'"
    why_human: "Requires live B2 credentials, actual file download, FFmpeg execution, and B2 ls inspection"
---

# Phase 17: Pipeline Path Fix Verification Report

**Phase Goal:** Fix hardcoded CLIPS_B2_PREFIX so non-MMXXV clip uploads route to correct B2 paths, update documentation, and fix stale tracking artifacts
**Verified:** 2026-03-26T09:45:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| 1 | `derive_clips_b2_path()` extracts event prefix from raw B2 path instead of using hardcoded CLIPS_B2_PREFIX | VERIFIED | `CLIPS_B2_PREFIX` grep returns 0 matches; `_extract_event_prefix()` defined at line 362; `derive_clips_b2_path` signature updated to accept `event_prefix: str` at line 379 |
| 2 | Running pipeline against `Kah Foundry XXVI/raw/...` routes clips to `Kah Foundry XXVI/clips/` not `Futuro MMXXV/clips/` | VERIFIED | Inline unit test (plan-specified assertions) passes: `ALL ASSERTIONS PASSED`. `derive_clips_b2_path("135A3217", "SPEAKER_00_00m00s.mp4", "Kah Foundry XXVI")` returns `"Kah Foundry XXVI/clips/135A3217/SPEAKER_00_00m00s.mp4"` |
| 3 | `docs/MEDIA-PIPELINE.md` Camera Profile Examples show correct clip routing for all event types | VERIFIED | "How clip paths are derived" section exists at line 102 with routing table covering MMXXV, Kah Foundry XXVI, and MMXIX paths |
| 4 | Phase 14 VERIFICATION.md body status matches frontmatter (passed, 7/7) | VERIFIED | Frontmatter: `status: passed`, `score: 7/7 must-haves verified`. Body line 35: `**Status:** passed`, line 51: `**Score:** 7/7 truths verified`. `grep -c "gaps_found"` returns 0. `grep -c "FAILED"` returns 0. |

**Score:** 4/4 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `scripts/pipeline.py` | Dynamic clip B2 path derivation from raw input path; contains `def derive_clips_b2_path` | VERIFIED | `_extract_event_prefix()` at line 362, `derive_clips_b2_path(stem, clip_filename, event_prefix)` at line 379, `upload_clips_to_b2(stem, clips_dir, event_prefix)` at line 411, `event_prefix = _extract_event_prefix(b2_path)` at line 490, `upload_clips_to_b2(stem, CLIPS_DIR, event_prefix)` at line 554 |
| `docs/MEDIA-PIPELINE.md` | Accurate Quick Start examples for all event types | VERIFIED | "How clip paths are derived" section at line 102; routing table with 3 event types (MMXXV, Kah Foundry XXVI, MMXIX) |
| `.planning/phases/14-script-correctness/14-VERIFICATION.md` | Corrected verification status | VERIFIED | Frontmatter and body both show `passed`, `7/7`; no `gaps_found` or `FAILED` text anywhere in file |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `scripts/pipeline.py:run_pipeline` | `scripts/pipeline.py:upload_clips_to_b2` | `event_prefix` passed through from `_extract_event_prefix(b2_path)` | WIRED | Line 490: `event_prefix = _extract_event_prefix(b2_path)`. Line 554: `upload_clips_to_b2(stem, CLIPS_DIR, event_prefix)`. Line 436: `derive_clips_b2_path(stem, clip_filename, event_prefix)`. Single extraction at `run_pipeline`, propagated through full call chain. |

---

### Data-Flow Trace (Level 4)

Not applicable. `pipeline.py` is a CLI script that processes B2 paths and calls external services (B2 CLI, FFmpeg, Whisper, pyannote). There are no web components or in-app data stores to trace.

---

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| `_extract_event_prefix` correctly parses MMXXV, Kah Foundry XXVI, and MMXIX paths | Inline Python assertions from PLAN `<verify>` block | `ALL ASSERTIONS PASSED` | PASS |
| `derive_clips_b2_path` routes Kah Foundry clips to correct prefix | Inline assertion: `derive_clips_b2_path("135A3217", "SPEAKER_00_00m00s.mp4", "Kah Foundry XXVI")` | `"Kah Foundry XXVI/clips/135A3217/SPEAKER_00_00m00s.mp4"` | PASS |
| `CLIPS_B2_PREFIX` constant fully removed | `grep -c "CLIPS_B2_PREFIX" scripts/pipeline.py` | `0` | PASS |
| `_extract_event_prefix` defined exactly once | `grep -c "def _extract_event_prefix" scripts/pipeline.py` | `1` | PASS |
| `event_prefix` used throughout call chain | `grep -c "event_prefix" scripts/pipeline.py` | `10` (definition, docstring examples, parameters, call sites) | PASS |
| Docs routing table present | `grep -c "How clip paths are derived" docs/MEDIA-PIPELINE.md` | `1` | PASS |
| Kah Foundry clip path in docs | `grep -c "Kah Foundry XXVI/clips" docs/MEDIA-PIPELINE.md` | `1` | PASS |
| Phase 14 has no "gaps_found" text | `grep -c "gaps_found" .planning/phases/14-script-correctness/14-VERIFICATION.md` | `0` | PASS |
| Phase 14 has no "FAILED" truths | `grep -c "FAILED" .planning/phases/14-script-correctness/14-VERIFICATION.md` | `0` | PASS |
| Phase 14 7/7 score in both frontmatter and body | `grep -n "Score.*7/7\|score.*7/7" 14-VERIFICATION.md` | Lines 5 and 51 | PASS |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|---------|
| AUTO-03 | 17-01 | Processed files and clips are uploaded to B2 in correct folder structure | SATISFIED | `_extract_event_prefix()` dynamically derives event prefix from raw B2 path; `derive_clips_b2_path` no longer uses hardcoded `CLIPS_B2_PREFIX`. Kah Foundry clips route to `Kah Foundry XXVI/clips/`, MMXXV clips route to `Futuro MMXXV/clips/`. Unit assertions pass. |
| DOCS-02 | 17-01 | Pipeline includes clear instructions for processing new raw video (step-by-step or single-command) | SATISFIED | `docs/MEDIA-PIPELINE.md` "How clip paths are derived" section added at line 102 with routing table for all event types. Camera Profile Examples at lines 88-100 already show Kah Foundry and MMXIX commands. |

Both requirement IDs from PLAN frontmatter `requirements: [AUTO-03, DOCS-02]` are accounted for.

**Orphaned requirements check:** REQUIREMENTS.md traceability table (lines 98-99) still shows Phase 17 status as "Pending" for both AUTO-03 (gap) and DOCS-02 (gap). This is a stale documentation artifact — REQUIREMENTS.md was not listed in `files_modified` for this phase and was not updated. The gap entries read as still open in the traceability table. This does not affect the implementation but should be updated to "Complete" in a subsequent documentation pass. Severity: Info (traceability artifact, not a code gap).

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `.planning/REQUIREMENTS.md` | 98-99 | Traceability rows for Phase 17 still show "Pending" for AUTO-03 (gap) and DOCS-02 (gap) after phase completion | Info | Cosmetic — implementation is correct, docs traceability row not updated. No code impact. |

No placeholder comments, hardcoded empty returns, TODO stubs, or stale constants found in any of the three modified files.

---

### Human Verification Required

#### 1. Live B2 Upload Path Inspection

**Test:** Run `python3 scripts/pipeline.py "Kah Foundry XXVI/raw/135A3217.MP4" --camera canon-r5-clog3 --skip-sanity` with valid B2 credentials and FFmpeg environment, then inspect B2 with `b2 ls hector-ecosystem-archive-prod "Kah Foundry XXVI/clips/"`
**Expected:** Clip files appear under `Kah Foundry XXVI/clips/135A3217/` — not under `Futuro MMXXV/clips/`
**Why human:** Requires live B2 authentication, a real Canon R5 source file in B2, FFmpeg execution, and B2 ls inspection to confirm actual upload destination

---

### Gaps Summary

No gaps. All four must-have truths are verified, all three artifacts pass all levels, the key link call chain is fully wired, behavioral spot-checks pass, and both requirement IDs are satisfied. The single info-level note (stale REQUIREMENTS.md traceability rows) is cosmetic and does not block the phase goal.

---

_Verified: 2026-03-26T09:45:00Z_
_Verifier: Claude (gsd-verifier)_
