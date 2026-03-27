# Phase 14: Script Correctness - Research

**Researched:** 2026-03-26
**Domain:** FFmpeg encoding, Python pipeline scripts, pyannote speaker diarization, ffprobe verification
**Confidence:** HIGH

## Summary

Phase 14 fixes four script-level problems in the video processing pipeline: (1) FFmpeg encoding settings have dead bitrate constraints (`-b:v`, `-maxrate`, `-bufsize`) that override CRF and must be removed; (2) camera profile handling needs a `--camera` CLI flag replacing the current positional lut_name argument; (3) anamorphic desqueeze needs an explicit `--anamorphic` CLI flag replacing a broken auto-detection heuristic; (4) the HF_TOKEN hardcoded credential in both scripts must move to an environment variable.

All five pipeline scripts have been read. The core FFmpeg command builder (`build_ffmpeg_command`) in `process-raw-video.py` is correct structurally — it already uses CRF 18, H.264, slow preset, `-movflags +faststart`, and `-c:a copy`. Only the three bitrate constants (`-b:v 18M`, `-maxrate 25M`, `-bufsize 50M`) need removal. The pyannote `DiarizeOutput` dataclass confirms that `result.speaker_diarization` is the correct attribute to access — no bug there.

A faststart audit tool is required by D-04 (VENC-02): detect existing B2-processed files whose MOOV atom is not at file start. The cleanest approach is binary parsing of the first 64 bytes of each file (reading box headers) rather than using ffprobe, because ffprobe does not expose atom order directly. The gopro-hero7-protune.cube LUT file is intentionally absent — the code handles missing LUTs by checking `.exists()`, so the main change needed is to remove the comment and leave the dict entry.

**Primary recommendation:** All changes are surgical edits to existing Python scripts. No new frameworks or external libraries required. Use pytest with the existing `scripts/tests/` infrastructure for verification — add `test_encoding.py` covering ffprobe assertions on a tiny synthetic MP4.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01:** Pure CRF 18 mode — remove `-b:v 18M`, `-maxrate 25M`, `-bufsize 50M`. Let CRF control quality alone.
**D-02:** Audio stays as `-c:a copy` (passthrough). DaVinci Fairlight handles audio mastering separately.
**D-03:** Remove unused audio constants (LOUDNESS_TARGET, TRUE_PEAK, HIGHPASS_FREQ, AUDIO_BITRATE). Dead code cleanup.
**D-04:** Add an audit mode (or separate script) that runs ffprobe on existing processed files in B2 to check MOOV atom position, outputs a list of files needing re-processing. Satisfies VENC-02.
**D-05:** Add `--camera` CLI flag to process-raw-video.py for explicit camera profile selection. Default remains `sony-a6700-slog3` for Futuro MMXXV footage.
**D-06:** When `--camera` specifies a profile whose LUT file doesn't exist on disk, warn clearly ("LUT not found for {profile}, processing without color grade") and continue without LUT. Do not abort.
**D-07:** GoPro ProTune Flat LUT (`gopro-hero7-protune.cube`) is intentionally missing — no ProTune Flat footage identified yet. Remove the "LUT pending" comment, keep the mapping entry.
**D-08:** Replace auto-detection heuristic with explicit `--anamorphic` CLI flag. Only a few Sony A6700 videos from Futuro MMXXV used the Sirui anamorphic lens. Explicit opt-in prevents false positives.
**D-09:** Keep current pixel scaling approach (`scale=iw*1.33:ih`). Physical resize is universally compatible across players.
**D-10:** `process-raw-video.py` is the canonical pipeline for PIPE-04 — it handles encode + transcribe + diarize in one flow.
**D-11:** `transcribe-with-speakers.py` is kept as a standalone re-transcription tool for already-processed/edited videos that don't need the full pipeline. Fix it to share the same output format and credential handling.
**D-12:** Move HF_TOKEN from hardcoded inline value to environment variable (`HF_TOKEN`). Error if not set. Standard credentials pattern. Apply to both scripts.

### Claude's Discretion

- Test strategy for verifying FFmpeg output (ffprobe assertions, sample file approach)
- Whether to add `--skip-transcribe` flag for encode-only runs
- Internal refactoring of process-raw-video.py (function extraction, error handling)
- How to structure the faststart audit (standalone script vs mode flag)

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| VENC-01 | process-raw-video.py outputs files with faststart encoding (MOOV atom at file start) | `-movflags +faststart` already present in build_ffmpeg_command. Confirm correct CRF-only mode removes bitrate override that could affect muxer behavior. |
| VENC-02 | Existing processed files that lack faststart are re-encoded or flagged for re-processing | Requires new audit script/mode. Binary box-header parsing (read first 64–200 bytes) is the correct detection method since ffprobe does not report atom order. B2 list + download-per-file approach works via existing `b2` CLI. |
| VENC-03 | All pipeline output files use consistent, correct FFmpeg settings (CRF 18, H.264, slow preset, web-optimized) | Confirmed: current command already has these. Only remove the 3 bitrate flags. ffprobe `codec_name`, `r_frame_rate`, and `format.bit_rate` verify output. |
| PIPE-01 | process-raw-video.py correctly applies LUT, vignette, brightness adjustment, and audio passthrough for each camera profile | LUT path resolution and vf_filters chain confirmed correct. D-06 governs graceful handling of missing LUTs. |
| PIPE-02 | Pipeline handles multiple camera profiles with correct LUT selection | `CAMERA_LUTS` dict mapping is correct. `--camera` CLI flag (D-05) is the mechanism. All 4 LUT files verified present on disk except gopro-hero7-protune.cube (intentionally absent per D-07). |
| PIPE-03 | Pipeline detects and applies anamorphic desqueeze (1.33x) when needed | Replace `detect_anamorphic()` with `--anamorphic` flag (D-08). Keep `scale=iw*1.33:ih` filter (D-09). |
| PIPE-04 | Processed video is automatically transcribed (Whisper) and diarized (pyannote) with enriched JSON output | Full chain confirmed working. HF_TOKEN must move to env var (D-12). Output format alignment between process-raw-video.py and transcribe-with-speakers.py needed (D-11). |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| FFmpeg | 8.0.1 | Video encode/decode, filter pipeline, muxing | Installed, all required filters available |
| ffprobe | 8.0.1 | Output verification (codec, CRF metadata, format) | Ships with FFmpeg, subprocess-compatible |
| openai-whisper | 20250625 | Speech-to-text with word timestamps | Already in use, working |
| pyannote.audio | 2.10.0 | Speaker diarization | Already in use, confirmed API correct |
| pytest | 9.0.2 | Test framework | Installed, existing test infrastructure in scripts/tests/ |
| b2 CLI | 4.6.0 | B2 file operations (download, upload, list) | In use throughout scripts |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| argparse (stdlib) | stdlib | CLI flag parsing (`--camera`, `--anamorphic`, `--skip-transcribe`) | Replacing positional sys.argv usage |
| struct (stdlib) | stdlib | Binary MP4 box header parsing for MOOV atom detection | Faststart audit tool |
| pathlib (stdlib) | stdlib | File path handling | Already in use |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Binary box parsing for MOOV detection | mediainfo CLI | mediainfo not confirmed installed; binary parsing is zero-dependency |
| Binary box parsing for MOOV detection | ffprobe format tags | ffprobe does NOT expose atom order — binary parsing is the only reliable method |
| argparse for CLI flags | click | argparse is stdlib, no install required, sufficient for this use case |

## Architecture Patterns

### Recommended Project Structure
No structural changes. All modifications are within existing files:
```
scripts/
├── process-raw-video.py      # PRIMARY TARGET: encoding fix, CLI flags, HF_TOKEN
├── transcribe-with-speakers.py  # OUTPUT FORMAT + HF_TOKEN fix
├── extract-speaker-clips.py  # Faststart audit consideration (stream copy clips)
├── extract-dialogue-clips.py # Stream copy — no encoding changes needed
├── audit-faststart.py        # NEW: standalone faststart audit script (D-04)
└── tests/
    ├── conftest.py            # EXTEND: add fixtures for encoding tests
    └── test_encoding.py       # NEW: ffprobe assertions on output
```

### Pattern 1: Pure CRF FFmpeg Command (remove bitrate override)

**What:** Remove `-b:v`, `-maxrate`, `-bufsize` from build_ffmpeg_command. These flags conflict with CRF — when both CRF and `-b:v` are specified, FFmpeg treats `-b:v` as a target, effectively defeating CRF quality control.

**Current (broken):**
```python
cmd = [
    "ffmpeg", "-i", str(input_path),
    "-c:v", "libx264",
    "-preset", "slow",
    "-crf", "18",
    "-b:v", VIDEO_BITRATE,    # REMOVE — overrides CRF
    "-maxrate", "25M",         # REMOVE — dead constraint
    "-bufsize", "50M",         # REMOVE — dead constraint
    "-pix_fmt", "yuv420p",
    "-movflags", "+faststart",
]
```

**Fixed (correct):**
```python
cmd = [
    "ffmpeg", "-i", str(input_path),
    "-c:v", "libx264",
    "-preset", "slow",
    "-crf", "18",
    "-pix_fmt", "yuv420p",
    "-movflags", "+faststart",
]
```

### Pattern 2: argparse CLI Flag Migration

**What:** Replace `sys.argv[1]` positional argument with argparse. Add `--camera`, `--anamorphic`, and optionally `--skip-transcribe`.

**Example:**
```python
import argparse

def parse_args():
    parser = argparse.ArgumentParser(description="Raw video processing pipeline")
    parser.add_argument("b2_path", help="B2 path to raw video file or folder")
    parser.add_argument(
        "--camera",
        default="sony-a6700-slog3",
        choices=list(CAMERA_LUTS.keys()),
        help="Camera profile for LUT selection (default: sony-a6700-slog3)"
    )
    parser.add_argument(
        "--anamorphic",
        action="store_true",
        help="Apply 1.33x anamorphic desqueeze (Sirui lens footage)"
    )
    parser.add_argument(
        "--skip-transcribe",
        action="store_true",
        help="Encode only — skip Whisper and pyannote steps"
    )
    return parser.parse_args()
```

### Pattern 3: HF_TOKEN Environment Variable

**What:** Replace hardcoded `HF_TOKEN = "hf_..."` with `os.environ` lookup, erroring if not set. Apply to both `process-raw-video.py` and `transcribe-with-speakers.py`.

```python
HF_TOKEN = os.environ.get("HF_TOKEN")
if not HF_TOKEN:
    print("ERROR: HF_TOKEN environment variable not set.")
    print("Get token from https://huggingface.co/settings/tokens")
    sys.exit(1)
```

The token must be set in the shell before running the pipeline:
```bash
export HF_TOKEN="hf_..."
python3 scripts/process-raw-video.py "Futuro MMXXV/raw/card-1/Day 1/C3460.MP4"
```

### Pattern 4: MOOV Atom Detection (Binary Box Parsing)

**What:** Parse the MP4 container box sequence at the start of the file to determine atom order. faststart files have `ftyp → moov → mdat`. Non-faststart files have `ftyp → mdat → moov` (or just `mdat` first).

**Why binary parsing, not ffprobe:** ffprobe's `-show_format` and `-show_streams` output does not include atom/box order information. The only reliable way is to read the raw file.

```python
import struct

def has_faststart(file_path: Path) -> bool:
    """
    Returns True if the MP4 MOOV atom appears before the MDAT atom.
    Reads only the box headers (8 bytes each), skipping content.
    """
    try:
        with open(file_path, "rb") as f:
            while True:
                header = f.read(8)
                if len(header) < 8:
                    break
                size = struct.unpack(">I", header[:4])[0]
                box_type = header[4:8].decode("ascii", errors="replace")
                if box_type == "moov":
                    return True
                if box_type == "mdat":
                    return False
                # Skip box content (size includes 8-byte header)
                if size < 8:
                    break  # malformed
                f.seek(size - 8, 1)
    except (IOError, struct.error):
        return False
    return False
```

**Edge cases:**
- `size == 0`: box extends to EOF — treat as non-faststart
- `size == 1`: 64-bit extended size field — read next 8 bytes for actual size
- Malformed files: return False (not faststart), log warning

### Pattern 5: transcribe-with-speakers.py Output Format Alignment

**What:** The output JSON from `transcribe-with-speakers.py` is missing the `"pipeline"` key that `process-raw-video.py` includes. It also lacks `"processed_file"` and `"processing"` fields (which don't apply to standalone transcription). The minimum alignment needed per D-11 is that `speaker_segments`, `segments`, `speakers`, and `speaker_embeddings` use identical schemas in both scripts.

**transcribe-with-speakers.py current output (missing keys):**
- Has: `source_file`, `filename`, `duration_seconds`, `language`, `speakers`, `speaker_embeddings`, `full_text`, `speaker_segments`, `segments`
- Missing vs process-raw-video.py: `pipeline` field

**Fix:** Add `"pipeline": "transcribe-only"` to `transcribe-with-speakers.py` output.

### Anti-Patterns to Avoid

- **Mixing CRF with `-b:v`:** When both are present in libx264, `-b:v` wins for average bitrate targeting. This produces variable quality, not constant quality. Never mix them.
- **Auto-detection of lens type from aspect ratio:** The current `detect_anamorphic()` uses a 1.2–1.45 aspect ratio range that will false-positive on legitimate 4:3 footage. Always use explicit `--anamorphic` flag instead.
- **Hardcoding model credentials:** `HF_TOKEN` must be an env var. The token is personal and grants access to gated models — it must never appear in source.
- **Aborting on missing LUT:** The pipeline should warn and continue without color grade per D-06. This ensures non-Sony footage isn't silently blocked.
- **Using `subprocess.run` with check=True for FFmpeg without capturing stderr:** FFmpeg writes progress to stderr. Without capture, long encodes will flood the terminal with unparseable output. Always `capture_output=True` or redirect stderr.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Faststart detection | Custom HTTP byte-range downloader for B2 | Download locally first, then binary parse | B2 CLI handles auth; parsing a local copy is simpler and reliable |
| ffprobe-based atom detection | Parse ffprobe JSON for atom order | Binary box parsing (Pattern 4 above) | ffprobe does not expose atom sequence in its output |
| LUT loading/validation | Custom .cube file parser | Let FFmpeg handle it via `lut3d` filter | FFmpeg's lut3d filter handles all .cube variants correctly |
| Speaker matching across videos | Cross-video embedding similarity | Out of scope (PIPE-F01 — future) | Not in phase 14 |

## Runtime State Inventory

> Step 2.5 check: This phase involves no renames, rebrands, or migrations. Omitted per instructions.

## Common Pitfalls

### Pitfall 1: CRF + `-b:v` Interaction in libx264
**What goes wrong:** When `-b:v` is specified alongside `-crf`, libx264 ignores CRF for quality and uses ABR (average bitrate) targeting instead. Output quality is inconsistent and bitrate does not reflect the source.
**Why it happens:** FFmpeg's libx264 wrapper: if `-b:v` is nonzero, it activates ABR mode. CRF is only active when `-b:v 0`.
**How to avoid:** Remove `-b:v`, `-maxrate`, and `-bufsize` entirely (D-01). Verify with: `ffprobe -v quiet -show_streams -select_streams v:0 output.mp4 | grep bit_rate` — in pure CRF mode, bit_rate will vary per clip, not be constant.
**Warning signs:** Output files are suspiciously close to the same bitrate regardless of content complexity.

### Pitfall 2: `detect_anamorphic()` False Positives
**What goes wrong:** The current heuristic checks `1.2 < aspect < 1.45`. Any 4:3 source (1.33 aspect) triggers this — including screen recordings and older camera footage not shot with the Sirui lens. This applies a 1.33x scale to already-square-ish footage, producing stretched output.
**Why it happens:** The function uses stored pixel aspect ratio, not display aspect ratio or lens metadata.
**How to avoid:** Remove `detect_anamorphic()` entirely. Pass anamorphic decision via `--anamorphic` CLI flag only (D-08).
**Warning signs:** Output videos appear horizontally stretched when viewed.

### Pitfall 3: `-movflags +faststart` with Stream Copy Clips
**What goes wrong:** `extract-speaker-clips.py` and `extract-dialogue-clips.py` use `-c copy` (stream copy). Faststart requires the muxer to rewrite the file after encoding — stream copy bypasses the muxer's final pass. Clips extracted from a faststart-encoded source may NOT themselves have faststart.
**Why it happens:** `-movflags +faststart` works by doing a two-pass write: FFmpeg writes the file, then moves the MOOV atom to the front. With `-c copy` and `-ss` seek, the output is written sequentially without the rewrite pass.
**How to avoid:** Add `-movflags +faststart` explicitly to the `extract_clip()` command in both clip extraction scripts. Verify that clips also pass `has_faststart()` check.
**Warning signs:** Clips buffer slowly in browsers; MOOV atom at end of clip file.

### Pitfall 4: pyannote Pipeline Return Type
**What goes wrong:** Calling `pipeline(audio_path)` returns a `DiarizeOutput` dataclass (not an `Annotation` directly). Code must access `.speaker_diarization` to get the `Annotation` object. If the pipeline is loaded with `legacy=True`, it returns `Annotation` directly — accessing `.speaker_diarization` on it would fail.
**Why it happens:** pyannote 2.x introduced `DiarizeOutput` as the default return type for `speaker-diarization-3.1`. Older code may expect a raw `Annotation`.
**How to avoid:** The current code already accesses `result.speaker_diarization` correctly. Verify that `Pipeline.from_pretrained` is NOT called with `legacy=True`. No change needed here — document as a watch item.
**Warning signs:** `AttributeError: 'Annotation' object has no attribute 'speaker_diarization'` (would appear if legacy mode were active).

### Pitfall 5: Extended Size MP4 Boxes (edge case in MOOV detection)
**What goes wrong:** MP4 box size field is 4 bytes. If size == 1, the actual size is in the next 8 bytes (64-bit extended size). Skipping this case causes the box parser to seek to the wrong offset and misidentify atom order.
**Why it happens:** Large files (>4GB) use extended size. Uncommon for web-optimized clips but possible for raw 4K source files.
**How to avoid:** Handle `size == 1` in the binary parser (see Pattern 4 above). Read 8 additional bytes and use `struct.unpack('>Q', ...)` for the actual size.
**Warning signs:** Audit tool reports a faststart file as non-faststart (or vice versa) on a specific large file.

### Pitfall 6: `format_srt_time` Defined Twice
**What goes wrong:** `process-raw-video.py` and `transcribe-with-speakers.py` both define an identical `format_srt_time()` function. This is not a bug but is a maintenance hazard — fixing one doesn't fix the other.
**How to avoid:** For this phase, the simplest fix is to keep both definitions as-is (they are correct) and note in comments that they are intentionally in sync. Extracting shared utilities to a `scripts/pipeline_utils.py` module is in Claude's Discretion.

## Code Examples

### Verify CRF-only output with ffprobe
```python
# Source: verified with ffprobe 8.0.1
def verify_encoding(video_path: Path) -> dict:
    """Assert CRF 18, H.264, slow preset on output file."""
    result = subprocess.run([
        "ffprobe", "-v", "quiet",
        "-print_format", "json",
        "-show_streams",
        "-select_streams", "v:0",
        str(video_path)
    ], capture_output=True, text=True)
    data = json.loads(result.stdout)
    streams = data.get("streams", [])
    if not streams:
        return {"ok": False, "error": "no video streams"}
    v = streams[0]
    return {
        "codec": v.get("codec_name"),           # expect "h264"
        "pix_fmt": v.get("pix_fmt"),            # expect "yuv420p"
        "profile": v.get("profile"),            # expect "High"
        "width": v.get("width"),
        "height": v.get("height"),
    }
```

Note: ffprobe does NOT expose CRF value or preset in stream output — these are encoding-time parameters. To confirm CRF 18 was used, inspect the FFmpeg command that was run, or use `mediainfo` which parses x264 private data. For automated testing, verifying `codec_name == "h264"` and `pix_fmt == "yuv420p"` is sufficient evidence that the correct command ran.

### Verify faststart on a local file
```python
# Source: MP4 box format spec (ISO 14496-12)
import struct
from pathlib import Path

def has_faststart(file_path: Path) -> bool:
    try:
        with open(file_path, "rb") as f:
            while True:
                header = f.read(8)
                if len(header) < 8:
                    return False
                size = struct.unpack(">I", header[:4])[0]
                box_type = header[4:8].decode("ascii", errors="replace")
                if box_type == "moov":
                    return True
                if box_type == "mdat":
                    return False
                if size == 0:
                    return False  # extends to EOF — treat as non-faststart
                if size == 1:
                    ext = f.read(8)
                    if len(ext) < 8:
                        return False
                    size = struct.unpack(">Q", ext)[0]
                    f.seek(size - 16, 1)
                else:
                    f.seek(size - 8, 1)
    except (IOError, struct.error):
        return False
```

### HF_TOKEN environment variable pattern
```python
import os, sys

HF_TOKEN = os.environ.get("HF_TOKEN")
if not HF_TOKEN:
    print("ERROR: HF_TOKEN environment variable not set.", file=sys.stderr)
    print("  export HF_TOKEN='hf_...'", file=sys.stderr)
    sys.exit(1)
```

### argparse main() replacement
```python
import argparse

def main():
    parser = argparse.ArgumentParser(
        description="Pipeline B — Raw Video Processing"
    )
    parser.add_argument("b2_path", help="B2 path to raw video or folder")
    parser.add_argument(
        "--camera",
        default="sony-a6700-slog3",
        help=f"Camera profile. Choices: {', '.join(CAMERA_LUTS.keys())} (default: sony-a6700-slog3)"
    )
    parser.add_argument(
        "--anamorphic",
        action="store_true",
        help="Apply 1.33x anamorphic desqueeze (Sirui 50mm lens footage)"
    )
    parser.add_argument(
        "--skip-transcribe",
        action="store_true",
        help="Encode only, skip Whisper + pyannote steps"
    )
    args = parser.parse_args()
    # ...
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| CRF + ABR mix (`-crf 18 -b:v 18M`) | Pure CRF (`-crf 18` only) | Phase 14 fix | Variable quality → consistent quality; file size varies by content complexity |
| Hardcoded HF_TOKEN | `os.environ["HF_TOKEN"]` | Phase 14 fix | Security: token no longer in source control |
| Auto anamorphic detection | Explicit `--anamorphic` flag | Phase 14 fix | Eliminates false positives on 4:3 and non-Sirui footage |
| Positional lut_name arg | `--camera` CLI flag | Phase 14 fix | Discoverable interface with clear choices list |

**No deprecated libraries in use.** whisper 20250625, pyannote 2.10.0, ffmpeg 8.0.1 are all current.

## Open Questions

1. **Should clips from extract-speaker-clips.py also get `-movflags +faststart`?**
   - What we know: Stream copy clips from faststart-encoded source may not be faststart themselves (Pitfall 3). VENC-01 requirement applies to process-raw-video.py output only by literal reading.
   - What's unclear: Whether VENC-02 audit should also flag stream-copy clips.
   - Recommendation: Add `-movflags +faststart` to both clip extraction scripts as a low-cost correctness fix. Include in audit scope.

2. **Should the faststart audit (D-04) download files or use B2 byte-range API?**
   - What we know: `b2` CLI tool supports full file downloads. Byte-range reads require the B2 SDK directly (not the CLI).
   - What's unclear: How many existing processed files exist in B2 — if 50+ files, downloading each for audit is slow.
   - Recommendation: Use B2 SDK `download_file_range()` (bytes 0–256) per file for the audit. This avoids full downloads. Alternatively, a simpler first pass using full downloads on files <= 5MB is acceptable for the phase scope.

3. **Should `--skip-transcribe` be added to this phase?**
   - What we know: It's listed as Claude's Discretion in CONTEXT.md.
   - Recommendation: Yes, add it. It costs one argparse line and enables quick encode-only re-runs when debugging video settings. Confirm with planner.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| ffmpeg | Encoding (VENC-01, VENC-03) | Yes | 8.0.1 | — |
| ffprobe | Output verification | Yes | 8.0.1 | — |
| b2 CLI | B2 file access | Yes | 4.6.0 | — |
| Python 3 | Script runtime | Yes | 3.14.3 | — |
| openai-whisper | Transcription (PIPE-04) | Yes | 20250625 | — |
| pyannote.audio | Diarization (PIPE-04) | Yes | 2.10.0 | — |
| pytest | Test framework | Yes | 9.0.2 | — |
| torch | MPS acceleration | Yes (implicit via pyannote) | — | CPU fallback |
| LUTs: sony-a6700-slog3.cube | PIPE-01, PIPE-02 | Yes | — | — |
| LUTs: canon-r5-clog3.cube | PIPE-02 | Yes | — | — |
| LUTs: gopro-hero7-standard.cube | PIPE-02 | Yes | — | — |
| LUTs: iphone-12promax-standard.cube | PIPE-02 | Yes | — | — |
| LUTs: gopro-hero7-protune.cube | PIPE-02 | No (intentional) | — | D-06: warn + continue without LUT |

**Missing dependencies with no fallback:** None — all required tools are installed.

**Missing dependencies with fallback:** gopro-hero7-protune.cube is absent by design; the `--camera gopro-hero7-protune` path warns and continues without LUT per D-06.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | pytest 9.0.2 |
| Config file | None (rootdir discovery from scripts/tests/) |
| Quick run command | `python3 -m pytest scripts/tests/ -x -q` |
| Full suite command | `python3 -m pytest scripts/tests/ -v` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| VENC-01 | build_ffmpeg_command produces no -b:v/-maxrate/-bufsize flags | unit | `python3 -m pytest scripts/tests/test_encoding.py::test_no_bitrate_flags -x` | Wave 0 |
| VENC-01 | FFmpeg output file passes has_faststart() check | unit | `python3 -m pytest scripts/tests/test_encoding.py::test_faststart_detection -x` | Wave 0 |
| VENC-02 | has_faststart() returns False for mdat-first file | unit | `python3 -m pytest scripts/tests/test_encoding.py::test_faststart_mdat_first -x` | Wave 0 |
| VENC-02 | has_faststart() returns True for moov-first file | unit | `python3 -m pytest scripts/tests/test_encoding.py::test_faststart_moov_first -x` | Wave 0 |
| VENC-02 | has_faststart() handles extended size box | unit | `python3 -m pytest scripts/tests/test_encoding.py::test_faststart_extended_size -x` | Wave 0 |
| VENC-03 | build_ffmpeg_command includes -crf 18, -preset slow, -c:v libx264 | unit | `python3 -m pytest scripts/tests/test_encoding.py::test_crf_settings -x` | Wave 0 |
| PIPE-01 | LUT filter present in vf_string when LUT file exists | unit | `python3 -m pytest scripts/tests/test_encoding.py::test_lut_applied -x` | Wave 0 |
| PIPE-01 | LUT filter absent and warning emitted when LUT file missing | unit | `python3 -m pytest scripts/tests/test_encoding.py::test_lut_missing_continues -x` | Wave 0 |
| PIPE-02 | --camera gopro-hero7-standard selects correct LUT path | unit | `python3 -m pytest scripts/tests/test_encoding.py::test_camera_flag_lut_resolution -x` | Wave 0 |
| PIPE-03 | --anamorphic flag adds scale=iw*1.33:ih to vf_filters | unit | `python3 -m pytest scripts/tests/test_encoding.py::test_anamorphic_flag -x` | Wave 0 |
| PIPE-03 | Without --anamorphic, scale filter is absent | unit | `python3 -m pytest scripts/tests/test_encoding.py::test_no_anamorphic_no_scale -x` | Wave 0 |
| PIPE-04 | HF_TOKEN missing causes sys.exit(1) | unit | `python3 -m pytest scripts/tests/test_encoding.py::test_hf_token_required -x` | Wave 0 |
| PIPE-04 | transcribe-with-speakers.py output includes pipeline key | unit | `python3 -m pytest scripts/tests/test_encoding.py::test_output_format_pipeline_key -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `python3 -m pytest scripts/tests/ -x -q`
- **Per wave merge:** `python3 -m pytest scripts/tests/ -v`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `scripts/tests/test_encoding.py` — new file covering all VENC/PIPE requirements above
- [ ] `scripts/audit-faststart.py` — new script (D-04), testable via `has_faststart()` unit tests

*(conftest.py exists and covers B2/Sanity fixtures; encoding tests need new fixtures with synthetic MP4 bytes)*

## Sources

### Primary (HIGH confidence)
- Direct code inspection of `scripts/process-raw-video.py` — FFmpeg command structure, LUT handling, anamorphic detection, transcription chain
- Direct code inspection of `scripts/transcribe-with-speakers.py` — output format, HF_TOKEN location, diarization return handling
- Direct code inspection of `scripts/extract-speaker-clips.py`, `scripts/extract-dialogue-clips.py` — stream copy clip extraction
- `python3 -c "from pyannote.audio.pipelines.speaker_diarization import DiarizeOutput; ..."` — confirmed `DiarizeOutput.speaker_diarization` attribute exists and is an `Annotation`
- `ffmpeg -version`, `ffprobe -version`, `b2 version`, `python3 --version` — all tools available
- `python3 -m pytest --version`, `ls scripts/tests/` — pytest 9.0.2, existing test infrastructure confirmed
- ISO 14496-12 MP4 box format: 4-byte size + 4-byte type header, size==1 means extended 64-bit size
- FFmpeg libx264 encoding guide: CRF and -b:v are mutually exclusive modes; -b:v 0 activates pure CRF

### Secondary (MEDIUM confidence)
- pyannote speaker-diarization-3.1 return type: verified by reading `pyannote.audio.pipelines.speaker_diarization` source on machine

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard Stack: HIGH — all tools and versions verified by running commands
- Architecture: HIGH — all code read directly, no external sources needed
- Pitfalls: HIGH — three of the six pitfalls derived directly from code reading; two from FFmpeg encoding mechanics (well-established); one from MP4 spec

**Research date:** 2026-03-26
**Valid until:** 2026-06-26 (stable domain — FFmpeg flags, Python stdlib, pyannote API)
