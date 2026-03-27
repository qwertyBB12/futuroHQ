# Phase 14: Script Correctness - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-27
**Phase:** 14-script-correctness
**Areas discussed:** FFmpeg encoding, Camera profiles, Anamorphic desqueeze, Transcription chain

---

## FFmpeg Encoding

### CRF Mode

| Option | Description | Selected |
|--------|-------------|----------|
| Pure CRF 18 | Remove -b:v 18M, -maxrate, -bufsize. Let CRF control quality. | ✓ |
| CRF + bitrate cap | Keep current behavior. Limits worst-case file size. | |
| You decide | Claude picks. | |

**User's choice:** Pure CRF 18
**Notes:** Matches VENC-03 requirement exactly.

### Audio Handling

| Option | Description | Selected |
|--------|-------------|----------|
| Keep audio copy | DaVinci Fairlight handles audio separately. | ✓ |
| Add loudness normalization | Apply -16 LUFS + 80Hz highpass via FFmpeg. | |
| You decide | Claude picks. | |

**User's choice:** Keep audio copy
**Notes:** None.

### Dead Code

| Option | Description | Selected |
|--------|-------------|----------|
| Remove unused constants | Remove LOUDNESS_TARGET, TRUE_PEAK, HIGHPASS_FREQ, AUDIO_BITRATE. | ✓ |
| Keep as comments | Comment out with future-use note. | |

**User's choice:** Remove them
**Notes:** None.

### Existing File Backlog (faststart)

| Option | Description | Selected |
|--------|-------------|----------|
| Audit + flag script | ffprobe check on existing files, output list of files needing re-processing. | ✓ |
| Re-encode all existing | Run qt-faststart or re-process everything. | |
| Skip backlog this phase | Only fix the script. | |

**User's choice:** Audit + flag script
**Notes:** None.

---

## Camera Profiles

### Profile Selection

| Option | Description | Selected |
|--------|-------------|----------|
| CLI flag --camera | Add --camera flag, default stays sony-a6700-slog3. | ✓ |
| Folder-based detection | Infer camera from B2 folder structure. | |
| Config file per batch | JSON/YAML maps filename patterns to cameras. | |

**User's choice:** CLI flag
**Notes:** None.

### Missing LUT (GoPro ProTune)

| Option | Description | Selected |
|--------|-------------|----------|
| Create a basic LUT | Generate ProTune Flat → Rec.709 LUT. | |
| Skip with warning | Process without color grading, log warning. | |
| You decide | Claude picks. | |

**User's choice:** Other — "Have not yet identified GoPro Flat profile footage. It has all mostly been standard. If it does come up I will make a LUT."
**Notes:** No ProTune Flat footage exists yet. User will create the LUT when needed.

### Missing LUT Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Warn and skip LUT | Process without color grading, print clear warning. | ✓ |
| Error and abort | Refuse to process until LUT is provided. | |
| You decide | Claude picks. | |

**User's choice:** Warn and skip LUT
**Notes:** None.

---

## Anamorphic Desqueeze

### Detection Method

| Option | Description | Selected |
|--------|-------------|----------|
| CLI flag --anamorphic | Explicit opt-in, no auto-detection. | ✓ |
| Auto-detect + confirm | Keep heuristic but add user prompt. | |
| Auto-detect silently | Keep current behavior, trust heuristic. | |

**User's choice:** CLI flag --anamorphic
**Notes:** Anamorphic is only on a few Sony videos from Futuro MMXXV (Sirui lens).

### Scaling Method

| Option | Description | Selected |
|--------|-------------|----------|
| Scale pixels (current) | Physical resize with scale=iw*1.33:ih. | ✓ |
| Set DAR metadata | Keep pixels, set container aspect ratio. | |
| You decide | Claude picks. | |

**User's choice:** Scale pixels (current)
**Notes:** None.

---

## Transcription Chain

### Canonical Script

| Option | Description | Selected |
|--------|-------------|----------|
| process-raw-video.py | Single pipeline: encode + transcribe + diarize. | ✓ |
| transcribe-with-speakers.py | Keep transcription separate, call from pipeline. | |
| Shared module | Extract into shared Python module. | |

**User's choice:** process-raw-video.py
**Notes:** None.

### Credential Handling

| Option | Description | Selected |
|--------|-------------|----------|
| Environment variable | Read HF_TOKEN from env, error if not set. | ✓ |
| Keep inline | Current approach, token already committed. | |
| You decide | Claude picks. | |

**User's choice:** Environment variable
**Notes:** None.

### Standalone Transcription Tool

| Option | Description | Selected |
|--------|-------------|----------|
| Keep as standalone tool | Keep for re-transcribing edited videos. Fix credentials and output format. | ✓ |
| Deprecate it | Remove or mark as legacy. | |
| You decide | Claude picks. | |

**User's choice:** Keep as standalone tool
**Notes:** None.

---

## Claude's Discretion

- Test strategy for verifying FFmpeg output
- Whether to add --skip-transcribe flag
- Internal refactoring approach
- Faststart audit structure (standalone script vs mode flag)

## Deferred Ideas

None — discussion stayed within phase scope.
