# Media Pipeline Architecture

## Overview

This pipeline processes raw video footage from educational summits (Futuro MMXXV, Kah Foundry) into streamable clips with transcripts, managed in Sanity CMS and delivered via Bunny CDN. The content serves the Hector H. Lopez ecosystem — BeNeXT Global, Futuro.NGO, and related entities.

**Source of truth for all media: Backblaze B2** (`hector-ecosystem-archive-prod`)
**CDN delivery: Bunny CDN** (`benext.b-cdn.net`) — pulls from B2 on first request, caches at edge
**Metadata & editorial: Sanity CMS** (`fo6n8ceo/production`) — draft documents created by pipeline, published by editors

The pipeline is a set of Python scripts run on a local Mac workstation. No cloud compute is used for processing.

No media files should persist in Git repos or locally on machines. Local copies are temporary for processing only.

---

## Pipeline Flow

```
Raw footage (B2 raw/)
       |
       v
  [pipeline.py]  <-- single entry point
       |
       |--- Step 1: Download + Encode (process-raw-video.py)
       |      LUT color grade --> H.264 CRF 18 slow --> faststart
       |      Whisper transcribe --> pyannote diarize
       |      Output: _processed.mp4 + .enriched.json
       |
       |--- Step 2: Upload processed video to B2 (edited/)
       |
       |--- Step 3: Extract speaker clips (extract-speaker-clips.py)
       |      Reads .enriched.json manifest
       |      Output: per-speaker .mp4 clips + manifest.json
       |
       |--- Step 4: Upload clips to B2 (clips/)
       |
       |--- Step 5: Create Sanity draft documents (--dry-run / --live)
       |      Video doc: b2Key, cdnUrl, fullText, speakerSegments
       |      Clip docs: b2Key, cdnUrl, duration, featuredIn=[]
       |
       v
  Sanity Studio --> Editorial review --> Publish
       |
       v
  Bunny CDN (benext.b-cdn.net) <-- pulls from B2 on first request
```

---

## Quick Start

### Common Case (Sony A6700, full pipeline with Sanity docs)

```bash
export HF_TOKEN="hf_..."           # Hugging Face (pyannote diarization)
export SANITY_TOKEN="sk..."        # Sanity write token

python3 scripts/pipeline.py "Futuro MMXXV/raw/card-1/Day 1/C3460.MP4" --live
```

This downloads the raw file from B2, applies the Sony A6700 S-Log3 LUT, encodes H.264 CRF 18, transcribes with Whisper, diarizes with pyannote, extracts per-speaker clips, uploads everything to B2, and creates draft Sanity documents.

### Processing a folder (all videos in a directory)

```bash
python3 scripts/pipeline.py "Futuro MMXXV/raw/card-1/Day 1" --live
```

### Flags Reference

| Flag | Default | Effect |
|------|---------|--------|
| `b2_path` (positional) | required | B2 path to raw video file or folder |
| `--camera PROFILE` | `sony-a6700-slog3` | Camera profile for LUT selection. Options: `sony-a6700-slog3`, `canon-r5-clog3`, `gopro-hero7-standard`, `gopro-hero7-protune`, `iphone-12promax`, `rec709` |
| `--anamorphic` | off | Apply 1.33x horizontal desqueeze (Sirui 50mm anamorphic lens) |
| `--skip-transcribe` | off | Encode only — skip Whisper transcription and speaker diarization |
| `--skip-upload` | off | Process locally only — do not upload to B2 |
| `--skip-sanity` | off | Upload to B2 but do not create Sanity documents |
| `--skip-clips` | off | Encode and transcribe but skip speaker clip extraction |
| `--dry-run` | off | Preview Sanity mutations without executing them |
| `--live` | off | Execute Sanity mutations (creates draft documents) |

Note: `--dry-run` and `--live` control Sanity document creation only. Without either flag, the pipeline runs through upload but skips Sanity. Documents are always created as drafts (`drafts.` prefix) — editorial review in Sanity Studio is required before publishing.

### Camera Profile Examples

```bash
# Canon R5 C-Log3
python3 scripts/pipeline.py "Kah Foundry XXVI/raw/135A3217.MP4" --camera canon-r5-clog3 --live

# GoPro Hero 7 standard (sRGB)
python3 scripts/pipeline.py "Futuro MMXIX/raw/confessional.MP4" --camera gopro-hero7-standard --live

# Screen recording (no LUT)
python3 scripts/pipeline.py "Kah Foundry XXVI/raw/screen-recording.mp4" --camera rec709 --live

# Anamorphic footage (Sony A6700 + Sirui 50mm)
python3 scripts/pipeline.py "path/to/anamorphic.MP4" --anamorphic --live
```

### How clip paths are derived

The pipeline extracts the event prefix from the input B2 path (everything before `/raw/`) and uses it for clip uploads:

| Input Path | Clips Upload To |
|-----------|----------------|
| `Futuro MMXXV/raw/card-1/Day 1/C3460.MP4` | `Futuro MMXXV/clips/C3460/` |
| `Kah Foundry XXVI/raw/135A3217.MP4` | `Kah Foundry XXVI/clips/135A3217/` |
| `Futuro MMXIX/raw/confessional.MP4` | `Futuro MMXIX/clips/confessional/` |

### Prerequisites

- Python 3.10+
- FFmpeg with libx264 support (`brew install ffmpeg`)
- Backblaze B2 CLI authenticated (`b2 authorize-account`)
- LUT files in `luts/` directory (FilmConvert Nitrate exports)
- Python packages: `whisper`, `pyannote.audio`, `torch`

---

## Script Reference

All scripts live in `/projects/clean-studio/scripts/`:

| Script | Purpose | Standalone Usage | Used by pipeline.py |
|--------|---------|------------------|---------------------|
| `pipeline.py` | End-to-end orchestrator: encode + transcribe + clips + B2 upload + Sanity docs | `python3 scripts/pipeline.py "B2/path" --camera sony-a6700-slog3 --live` | N/A (this IS the entry point) |
| `process-raw-video.py` | Download from B2, apply LUT, encode H.264 CRF 18, transcribe (Whisper medium), diarize (pyannote) | `python3 scripts/process-raw-video.py "B2/path" --camera canon-r5-clog3` | Yes — called via `process_video()` |
| `extract-speaker-clips.py` | Cut per-speaker clips from diarized video using .enriched.json timestamps | `python3 scripts/extract-speaker-clips.py --all` | Yes — called via `process_transcript()` |
| `extract-dialogue-clips.py` | Cut multi-speaker dialogue segments | `python3 scripts/extract-dialogue-clips.py` | No |
| `populate-sanity-videos.py` | Batch-create Sanity drafts from existing B2 edited files | `python3 scripts/populate-sanity-videos.py --live` | No |
| `transcribe-with-speakers.py` | Standalone re-transcription (Whisper + pyannote) | `python3 scripts/transcribe-with-speakers.py "path.mp4"` | No |
| `audit-faststart.py` | Check MP4 files for faststart (MOOV atom position) | `python3 scripts/audit-faststart.py path.mp4` | No |
| `audit-sanity-integrity.py` | Verify Sanity docs match actual B2 files (CDN URL audit) | `python3 scripts/audit-sanity-integrity.py` | No |

---

## Camera Profiles & LUTs

All LUTs created with **FilmConvert Nitrate** using **Kodak 5207 VIS-3 250T** for a consistent institutional cinematic look.

### Base Settings (all cameras)
| Setting | Value |
|---------|-------|
| Film Stock | Kodak 5207 VIS-3 250T |
| Film Type | Cine onto Print Film — 95% |
| Film Color | 90% |
| Grain | 0 (off) |
| Format | Super 35 |

### Per-Camera LUTs

| Camera | Input Profile | LUT File | Event |
|--------|--------------|----------|-------|
| Sony A6700 | S-Log3 | `sony-a6700-slog3.cube` | Futuro MMXXV |
| Canon R5 | C-Log3 | `canon-r5-clog3.cube` | Kah Foundry, Futuro MMXXV |
| GoPro Hero 7 (standard) | sRGB | `gopro-hero7-standard.cube` | Futuro MMXIX confessionals |
| GoPro Hero 7 (ProTune) | Flat | `gopro-hero7-protune.cube` | Futuro MMXIX dailies (PENDING) |
| Screen recordings | Rec 709 | None (skip LUT) | Kah Foundry |

### GoPro Standard LUT Settings (differs from base)
- Input: sRGB (default standard)
- Vibrance: +5
- Film Chroma: 96.4%
- Film Luma: 98.8%

### Post-LUT Processing (applied by pipeline on all footage)
- Brightness: -0.05
- Gamma: 0.95
- Vignette: angle PI/5

LUTs stored in: `/projects/clean-studio/luts/`

---

## Compression Settings

| Parameter | Value |
|-----------|-------|
| Codec | H.264 (libx264) |
| Preset | slow |
| CRF | 18 |
| Pixel format | yuv420p |
| Optimization | faststart (MOOV atom at start for progressive streaming) |

---

## B2 Bucket Structure

```
hector-ecosystem-archive-prod/
├── Futuro MMXIX/               # GoPro Hero Black 7
│   ├── raw/                    # Original camera footage
│   │   ├── daily/              # Day 3-10 RAW.mov + RX10 audio
│   │   └── Panama.mov
│   ├── edited/                 # 26 manually edited testimonials (HB_*.mp4)
│   ├── clips/                  # Speaker extractions
│   ├── transcripts/            # Enriched JSON + SRT
│   └── Thumbnails MMXIX/       # JPG thumbnails
│
├── Futuro MMXXV/               # Sony A6700 S-Log3 + Canon R5 C-Log3
│   ├── raw/
│   │   ├── card-1/Day 1-8/     # Sony A6700 S-Log3 (C3460-C3513+)
│   │   └── canon-r5/           # Canon R5 C-Log3 (135A3217-135A3225)
│   ├── edited/                 # Processed _processed.mp4 files
│   ├── clips/                  # Speaker extractions
│   ├── transcripts/            # Enriched JSON + SRT
│   └── photos/                 # Sony ARW stills
│
├── Kah Foundry XXVI - La Forja/  # Canon R5 C-Log3 + Screen recordings
│   ├── raw/                    # 2 Canon files + 2 screen recordings
│   └── edited/                 # Pipeline output (processing)
│
└── MMXIX_Raw_Daily/            # Legacy overflow (Days 5-6)
```

---

## Sanity Video Schema

Key fields for pipeline integration:
- `videoSource`: 'b2' or 'wistia' (legacy)
- `b2Key`: Full B2 path (e.g., `Futuro MMXXV/edited/card-1/Day 1/C3460_processed.mp4`)
- `cdnUrl`: Bunny CDN URL for playback
- `bunnyStatus`: 'processing' | 'ready' | 'error'
- `fullText`: Complete transcript
- `speakerSegments`: Array of {speaker, start, end, text}

---

## Troubleshooting

### `ERROR: HF_TOKEN environment variable not set`

pyannote speaker diarization requires a Hugging Face token with access to the pyannote models.

```bash
export HF_TOKEN="hf_..."
```

Get a token at https://huggingface.co/settings/tokens. You must also accept the pyannote model license at https://huggingface.co/pyannote/speaker-diarization-3.1.

### `ERROR: SANITY_TOKEN not set`

Only needed when using `--dry-run` or `--live`. Create a token in the Sanity management dashboard:

```bash
export SANITY_TOKEN="sk..."
```

Project ID: `fo6n8ceo`, Dataset: `production`.

### FFmpeg not found or missing libx264

```bash
brew install ffmpeg
ffmpeg -encoders | grep libx264  # verify
```

### B2 authentication failure

The pipeline uses the `b2` CLI for downloads and uploads. Authenticate first:

```bash
b2 authorize-account <applicationKeyId> <applicationKey>
```

Key must have read+write access to `hector-ecosystem-archive-prod`.

### Mid-pipeline failure / resuming

The pipeline processes each video independently. If a batch run (folder mode) fails partway through, re-run the same command — already-uploaded B2 files will be overwritten (idempotent), and `check_existing_b2key()` prevents duplicate Sanity documents in `--live` mode.

For single-file failures, check `/tmp/b2-raw-process/` for intermediate files. The pipeline cleans up after success but leaves files on failure for debugging.

---

## Current State (March 2026)

| Project | Raw | Processed | In Sanity | Transcripts | Clips |
|---------|-----|-----------|-----------|-------------|-------|
| Futuro MMXIX | 10 daily + confessionals | 26 edited (manual) | 26 drafts | 26 enriched | 24 folders |
| Futuro MMXXV (Sony) | 377 raw (card 1-3) | 51 processed | 53 drafts | 51 enriched | 49 folders |
| Futuro MMXXV (Canon) | 9 raw (100CANON) | Processing... | Pending | Pending | Pending |
| Kah Foundry XXVI | 4 raw (2 Canon + 2 screen) | Processing... | Pending | Pending | Pending |

### Pending Work
- [ ] GoPro Hero 7 ProTune Flat LUT creation
- [ ] Process remaining 326 Sony A6700 raw files (cards 2-3, Days 2-8)
- [ ] Process 9 Canon R5 files for Futuro MMXXV
- [ ] Process 4 Kah Foundry files
- [ ] Process Futuro MMXIX daily raws through pipeline
- [ ] Phase 11: Video metadata completion (descriptions, thumbnails, tags)
- [ ] Phase 12: Podcast data + content tagging
- [ ] Speaker voice matching via embeddings (future feature)

---

*Last updated: March 2026*
