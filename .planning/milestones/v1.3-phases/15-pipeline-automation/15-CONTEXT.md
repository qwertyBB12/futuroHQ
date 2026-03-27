# Phase 15: Pipeline Automation - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Wire all existing pipeline scripts into a single end-to-end Python orchestrator: raw video → compress/filter/transcode → transcribe → diarize → extract clips → upload to B2 → create/update Sanity documents. One command processes a raw video file (or folder of files) through the full chain with no intermediate manual steps. No new encoding features (Phase 14 handles correctness), no documentation (Phase 16).

</domain>

<decisions>
## Implementation Decisions

### Orchestration Approach
- **D-01:** Single Python orchestrator script (`pipeline.py`) that imports functions from existing scripts as modules. Not subprocess calls — shared Python process with clean error handling and shared state.
- **D-02:** Orchestrator supports both single file and folder (batch) mode. Accepts a B2 path to a raw file or a folder of raw files. Matches `process-raw-video.py`'s existing folder mode.
- **D-03:** CLI inherits existing flags from `process-raw-video.py` (`--camera`, `--anamorphic`, `--skip-transcribe`) and adds orchestrator-specific flags: `--skip-upload` (local-only run), `--skip-sanity` (upload but don't create docs), `--dry-run`/`--live` for Sanity mutations.
- **D-04:** Existing scripts (`process-raw-video.py`, `extract-speaker-clips.py`, `populate-sanity-videos.py`) will need key functions refactored into importable form. Scripts should still work standalone.

### B2 Upload Structure
- **D-05:** Processed file upload path — Claude's discretion based on existing patterns and downstream needs.
- **D-06:** Clips go to a dedicated `clips/` folder in B2: `Futuro MMXXV/clips/{stem}/{clip_filename}`. Clean separation from raw and edited. Matches local `clips/` directory structure.
- **D-07:** Transcripts and manifests stay local in the clean-studio repo (committed to git). NOT uploaded to B2. B2 is for media files only.

### Sanity Document Creation
- **D-08:** Pipeline auto-creates video documents using B2 key, CDN URL, and transcript data from enriched JSON. Person tags (featuredIn) derived from diarization speaker labels when possible, flagged as 'untagged' when speaker can't be matched to a person doc.
- **D-09:** Pipeline creates both full-length video docs AND individual clip docs for each extracted speaker clip. Clip docs get cdnUrl, b2Key, featuredIn from manifest data. Matches existing clip doc structure from Phase 13.
- **D-10:** Sanity API calls use Python direct REST API (same pattern as `populate-sanity-videos.py`). Keeps the entire orchestrator in Python — no TypeScript step.
- **D-11:** Always create draft documents (drafts. prefix). User reviews and publishes manually in Studio. Matches existing pattern — no auto-publishing.
- **D-12:** `--dry-run`/`--live` flag controls Sanity mutations. Dry-run prints what would be created/updated without touching Sanity. Live executes mutations. Same pattern as `populate-sanity-videos.py`.

### Error Handling & Resume
- **D-13:** Single file mode: stop at failed step, print clear error with which step failed and what completed. No automatic retry — video processing is too slow for blind retries.
- **D-14:** Batch (folder) mode: if one file fails, log it and continue with remaining files. Print summary of successes and failures at the end. Each file is independent.
- **D-15:** Resume via skip-flags — no checkpoint state file. If encoding succeeded but upload failed, re-run with `--skip-transcribe` to jump past completed steps. Simple, no state management needed.

### Claude's Discretion
- Processed file upload path in B2 (flat vs mirrored structure)
- Internal module refactoring strategy (how to make existing scripts importable while keeping standalone use)
- GROQ queries and Sanity API patterns for document creation/update
- How to derive person tags from diarization output (speaker label matching logic)
- Batch size and rate limiting for B2 uploads and Sanity API calls
- Console output format (progress indicators, step completion messages)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Pipeline Scripts (primary targets for refactoring)
- `scripts/process-raw-video.py` — Main encode + transcribe + diarize pipeline. Has argparse CLI, camera LUT mapping, FFmpeg command builder. Functions need to be importable.
- `scripts/extract-speaker-clips.py` — Clip extraction from diarized videos. Reads enriched JSON, produces manifest + clips. Functions need to be importable.
- `scripts/populate-sanity-videos.py` — Sanity document creation via REST API. Has VIDEO_MAP, CDN_BASE, SANITY_TOKEN, --dry-run/--live pattern. Sanity API patterns to reuse.

### Supporting Scripts (reference patterns)
- `scripts/ingest-transcripts.ts` — TypeScript Sanity client pattern. Reference only — orchestrator uses Python REST API instead.
- `scripts/transcribe-b2-videos.sh` — Shell-based batch transcription. Shows B2 CLI patterns for listing and downloading.

### Data Artifacts
- `transcripts/*.enriched.json` — Diarization output with speaker segments. Source for auto-tagging.
- `clips/*/manifest.json` — Per-video clip manifest with filenames, speaker labels, CDN URLs, durations.

### Schema
- `schemaTypes/video.ts` — Video document schema (cdnUrl, b2Key, featuredIn, videoSource, resolution, duration, thumbnailUrl, bunnyStatus fields)

### Requirements
- `.planning/REQUIREMENTS.md` — AUTO-01 through AUTO-04
- `.planning/ROADMAP.md` — Phase 15 success criteria (4 criteria)

### Prior Phase Context
- `.planning/phases/13-sanity-data-integrity/13-CONTEXT.md` — CDN URL formula, B2 ground truth patterns, Sanity API patterns
- `.planning/phases/14-script-correctness/14-CONTEXT.md` — Encoding settings, camera profiles, CLI flag design, transcription chain

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `process-raw-video.py` — `parse_args()`, `build_ffmpeg_command()`, `get_video_info()`, `get_diarization_pipeline()`, `get_whisper_model()`. Core functions for encode + transcribe stages.
- `extract-speaker-clips.py` — `process_transcript()`, `extract_clip()`, `download_video()`. Core functions for clip extraction stage.
- `populate-sanity-videos.py` — Sanity REST API client setup, `CDN_BASE`, `VIDEO_MAP`, document creation patterns with `drafts.` prefix. Core patterns for Sanity stage.
- `transcribe-b2-videos.sh` — B2 CLI patterns: `b2 ls --recursive`, `b2 file download`, `b2 file upload`.

### Established Patterns
- B2 access: `b2` CLI tool for all operations (ls, download, upload)
- CDN URL formula: `https://benext.b-cdn.net/{b2_path}` with space → `%20` encoding
- Sanity API: Direct REST API via `urllib.request` in Python, `SANITY_TOKEN` env var
- Sanity document IDs: `drafts.` prefix for draft documents
- CLI pattern: argparse with `--dry-run`/`--live` for mutation control
- Transcription output: `.enriched.json` with `fullText`, `speakerSegments`, speaker labels
- Clip manifests: JSON with `clips[]` array containing `file`, `speaker`, `start`, `end`, `text`, `cdn_url`

### Integration Points
- B2 bucket: `hector-ecosystem-archive-prod`
- Bunny CDN: `benext.b-cdn.net` (fronts B2 bucket)
- Sanity Content Lake: project `fo6n8ceo`, dataset `production`
- Local dirs: `transcripts/` (enriched JSON, SRT), `clips/` (per-video clip dirs with manifests), `luts/` (LUT cube files)
- Env vars required: `HF_TOKEN` (HuggingFace for pyannote), `SANITY_TOKEN` (Sanity API)

</code_context>

<specifics>
## Specific Ideas

- Clip manifest CDN URLs currently point to raw/ paths (e.g., `Futuro MMXXV/raw/card-1/Day 1/clips/...`). The orchestrator should generate correct CDN URLs pointing to the new `clips/` B2 path instead.
- VIDEO_MAP in populate-sanity-videos.py is for legacy MMXIX footage. New MMXXV footage should use auto-creation from diarization data — no need to extend VIDEO_MAP.
- All 26 existing B2 video documents are draft-only (created by populate-sanity-videos.py in Phase 10). New documents should follow the same draft pattern.
- Transcripts and manifests committed to git in clean-studio repo — not uploaded to B2.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 15-pipeline-automation*
*Context gathered: 2026-03-26*
