# Phase 14: Script Correctness - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix encoding settings, camera profile handling, anamorphic desqueeze, and transcription chain in pipeline scripts (process-raw-video.py, extract-speaker-clips.py, extract-dialogue-clips.py) so they produce correctly encoded, web-optimized output for all supported camera profiles. Also audit existing processed files for faststart compliance. No new pipeline features, no automation wiring (Phase 15), no documentation (Phase 16).

</domain>

<decisions>
## Implementation Decisions

### FFmpeg Encoding
- **D-01:** Pure CRF 18 mode — remove `-b:v 18M`, `-maxrate 25M`, `-bufsize 50M`. Let CRF control quality alone. Matches VENC-03 requirement (CRF 18, H.264, slow preset).
- **D-02:** Audio stays as `-c:a copy` (passthrough). DaVinci Fairlight handles audio mastering separately — the pipeline is not the final audio stage.
- **D-03:** Remove unused audio constants (LOUDNESS_TARGET, TRUE_PEAK, HIGHPASS_FREQ, AUDIO_BITRATE). Dead code cleanup.
- **D-04:** Add an audit mode (or separate script) that runs ffprobe on existing processed files in B2 to check MOOV atom position, outputs a list of files needing re-processing. Satisfies VENC-02.

### Camera Profiles
- **D-05:** Add `--camera` CLI flag to process-raw-video.py for explicit camera profile selection. Default remains `sony-a6700-slog3` for Futuro MMXXV footage.
- **D-06:** When `--camera` specifies a profile whose LUT file doesn't exist on disk, warn clearly ("LUT not found for {profile}, processing without color grade") and continue without LUT. Do not abort.
- **D-07:** GoPro ProTune Flat LUT (`gopro-hero7-protune.cube`) is intentionally missing — no ProTune Flat footage has been identified yet. User will create the LUT when footage appears. Remove the "LUT pending" comment, keep the mapping entry.

### Anamorphic Desqueeze
- **D-08:** Replace auto-detection heuristic with explicit `--anamorphic` CLI flag. Only a few Sony A6700 videos from Futuro MMXXV used the Sirui anamorphic lens. Explicit opt-in prevents false positives.
- **D-09:** Keep current pixel scaling approach (`scale=iw*1.33:ih`). Physical resize is universally compatible across players.

### Transcription Chain
- **D-10:** `process-raw-video.py` is the canonical pipeline for PIPE-04 — it handles encode + transcribe + diarize in one flow.
- **D-11:** `transcribe-with-speakers.py` is kept as a standalone re-transcription tool for already-processed/edited videos that don't need the full pipeline. Fix it to share the same output format and credential handling.
- **D-12:** Move HF_TOKEN from hardcoded inline value to environment variable (`HF_TOKEN`). Error if not set. Standard credentials pattern — keeps secrets out of source. Apply to both scripts.

### Claude's Discretion
- Test strategy for verifying FFmpeg output (ffprobe assertions, sample file approach)
- Whether to add `--skip-transcribe` flag for encode-only runs
- Internal refactoring of process-raw-video.py (function extraction, error handling)
- How to structure the faststart audit (standalone script vs mode flag)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Pipeline Scripts
- `scripts/process-raw-video.py` — Main processing pipeline. Contains FFmpeg command builder, camera LUT mapping, anamorphic detection, transcription steps. Primary target for this phase.
- `scripts/extract-speaker-clips.py` — Clip extraction from diarized videos. Uses stream copy (no re-encoding). May need encoding fixes if clips should also have faststart.
- `scripts/extract-dialogue-clips.py` — Dialogue clip extraction with conversational awareness. Same stream copy pattern as speaker clips.
- `scripts/transcribe-with-speakers.py` — Standalone transcription+diarization. Shares logic with process-raw-video.py. Needs credential fix and output format alignment.
- `scripts/populate-sanity-videos.py` — Reference for VIDEO_MAP, CDN_BASE, Sanity API patterns, --dry-run/--live pattern.

### LUT Files
- `luts/sony-a6700-slog3.cube` — Sony A6700 S-Log 3 to Rec.709
- `luts/canon-r5-clog3.cube` — Canon R5 Canon Log 3 to Rec.709
- `luts/gopro-hero7-standard.cube` — GoPro Hero 7 Standard profile
- `luts/iphone-12promax-standard.cube` — iPhone 12 Pro Max Standard

### Requirements
- `.planning/REQUIREMENTS.md` — VENC-01, VENC-02, VENC-03, PIPE-01, PIPE-02, PIPE-03, PIPE-04
- `.planning/ROADMAP.md` — Phase 14 success criteria (5 criteria: Sony faststart, Canon LUT, anamorphic desqueeze, transcription chain, CRF 18 confirmation)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `process-raw-video.py` `build_ffmpeg_command()` — FFmpeg command builder. Needs modification (remove bitrate cap, make LUT optional, replace anamorphic auto-detect with flag).
- `process-raw-video.py` `get_video_info()` — ffprobe wrapper. Can be reused for faststart audit.
- `transcribe-with-speakers.py` transcription functions — Same Whisper+pyannote pattern as process-raw-video.py. Needs HF_TOKEN env var fix.

### Established Patterns
- Camera LUT mapping: `CAMERA_LUTS` dict in process-raw-video.py maps profile names to .cube files
- B2 access: `b2` CLI tool for file operations
- FFmpeg invocation: subprocess.run with capture_output
- Lazy model loading: Global singletons for Whisper and pyannote models (MPS acceleration when available)

### Integration Points
- LUT directory: `luts/` at project root
- Transcript output: `transcripts/` directory, `.enriched.json` format
- B2 bucket: `hector-ecosystem-archive-prod`
- Processed file upload path: derives from raw path (replaces `/raw/` with `/edited/`)

</code_context>

<specifics>
## Specific Ideas

- Anamorphic footage is only on a few Sony A6700 videos from Futuro MMXXV (Sirui 50mm 1.33x lens)
- GoPro ProTune Flat footage has not been identified yet — LUT will be created by user when needed
- Audio mastering is intentionally handled in DaVinci Fairlight, not in the pipeline
- faststart (`-movflags +faststart`) is already in the script but existing processed files may not have it

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 14-script-correctness*
*Context gathered: 2026-03-27*
