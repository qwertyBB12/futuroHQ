"""
Unit tests for process-raw-video.py encoding, CLI flags, and LUT behaviors.

All tests use mock data — no live B2/FFmpeg calls.
Imports process_raw_video via importlib (handles hyphenated filename).

TDD: These tests are written FIRST (RED phase). They will fail against
the current script that has bitrate flags, dead constants, detect_anamorphic,
and no parse_args function.
"""

import sys
import importlib.util
from pathlib import Path
import pytest

# Load module via importlib (filename has hyphens)
_SCRIPT_PATH = Path(__file__).parent.parent / "process-raw-video.py"


def _load_module():
    spec = importlib.util.spec_from_file_location("process_raw_video", _SCRIPT_PATH)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


# Load once at module level so import errors surface clearly
proc = _load_module()


# ============================================================
# Encoding Flag Tests (VENC-01, VENC-03)
# ============================================================

def test_no_bitrate_flags(lut_dir):
    """
    build_ffmpeg_command output list must NOT contain -b:v, -maxrate, or -bufsize.
    D-01: Remove bitrate override flags to avoid CRF+bitrate conflict.
    """
    lut_path = lut_dir / "sony-a6700-slog3.cube"
    cmd = proc.build_ffmpeg_command(
        Path("/tmp/input.mp4"),
        Path("/tmp/output.mp4"),
        lut_path,
        anamorphic=False
    )
    assert "-b:v" not in cmd, f"-b:v found in command: {cmd}"
    assert "-maxrate" not in cmd, f"-maxrate found in command: {cmd}"
    assert "-bufsize" not in cmd, f"-bufsize found in command: {cmd}"


def test_crf_settings(lut_dir):
    """
    build_ffmpeg_command must include CRF 18, preset slow, libx264, yuv420p, faststart.
    VENC-01: CRF-only encoding configuration.
    """
    lut_path = lut_dir / "sony-a6700-slog3.cube"
    cmd = proc.build_ffmpeg_command(
        Path("/tmp/input.mp4"),
        Path("/tmp/output.mp4"),
        lut_path,
        anamorphic=False
    )
    assert "-crf" in cmd, f"-crf not found in command: {cmd}"
    assert "18" in cmd, f"CRF value '18' not found in command: {cmd}"
    assert "-preset" in cmd, f"-preset not found in command: {cmd}"
    assert "slow" in cmd, f"preset value 'slow' not found in command: {cmd}"
    assert "-c:v" in cmd, f"-c:v not found in command: {cmd}"
    assert "libx264" in cmd, f"libx264 not found in command: {cmd}"
    assert "-pix_fmt" in cmd, f"-pix_fmt not found in command: {cmd}"
    assert "yuv420p" in cmd, f"yuv420p not found in command: {cmd}"
    assert "-movflags" in cmd, f"-movflags not found in command: {cmd}"
    assert "+faststart" in cmd, f"+faststart not found in command: {cmd}"


def test_audio_passthrough(lut_dir):
    """
    build_ffmpeg_command must include -c:a copy for audio passthrough.
    PIPE-01: Audio streams are copied without re-encoding.
    """
    lut_path = lut_dir / "sony-a6700-slog3.cube"
    cmd = proc.build_ffmpeg_command(
        Path("/tmp/input.mp4"),
        Path("/tmp/output.mp4"),
        lut_path,
        anamorphic=False
    )
    assert "-c:a" in cmd, f"-c:a not found in command: {cmd}"
    assert "copy" in cmd, f"'copy' not found in command: {cmd}"


# ============================================================
# LUT Tests (PIPE-02)
# ============================================================

def test_lut_applied(lut_dir):
    """
    When LUT file exists on disk, -vf argument in command contains 'lut3d='.
    PIPE-02: Color grade LUT is applied when file is present.
    """
    lut_path = lut_dir / "sony-a6700-slog3.cube"
    cmd = proc.build_ffmpeg_command(
        Path("/tmp/input.mp4"),
        Path("/tmp/output.mp4"),
        lut_path,
        anamorphic=False
    )
    # Find the -vf argument value
    assert "-vf" in cmd, f"-vf not found in command: {cmd}"
    vf_idx = cmd.index("-vf")
    vf_value = cmd[vf_idx + 1]
    assert "lut3d=" in vf_value, f"lut3d= not found in -vf value: {vf_value}"


def test_lut_missing_continues(tmp_path):
    """
    When LUT file does NOT exist, build_ffmpeg_command still succeeds (returns a list).
    The -vf argument does NOT contain 'lut3d='.
    D-06: Missing LUT warns and continues without color grade.
    """
    non_existent_lut = tmp_path / "does-not-exist.cube"
    assert not non_existent_lut.exists()

    cmd = proc.build_ffmpeg_command(
        Path("/tmp/input.mp4"),
        Path("/tmp/output.mp4"),
        non_existent_lut,
        anamorphic=False
    )
    assert isinstance(cmd, list), "build_ffmpeg_command should return a list even when LUT is missing"

    # If -vf is present, it must not contain lut3d=
    if "-vf" in cmd:
        vf_idx = cmd.index("-vf")
        vf_value = cmd[vf_idx + 1]
        assert "lut3d=" not in vf_value, (
            f"lut3d= should NOT be in -vf when LUT file is missing: {vf_value}"
        )


# ============================================================
# Camera Flag / LUT Resolution Tests (PIPE-03)
# ============================================================

def test_camera_flag_lut_resolution():
    """
    Calling with camera='canon-r5-clog3' resolves to luts/canon-r5-clog3.cube.
    PIPE-03: Camera profile selects the correct LUT file.
    """
    assert "canon-r5-clog3" in proc.CAMERA_LUTS, "canon-r5-clog3 should be in CAMERA_LUTS"
    lut_file = proc.CAMERA_LUTS["canon-r5-clog3"]
    assert lut_file == "canon-r5-clog3.cube", (
        f"Expected canon-r5-clog3.cube, got: {lut_file}"
    )


def test_camera_flag_default():
    """
    The default camera profile is sony-a6700-slog3.
    D-05: Default camera selection when --camera is not specified.
    """
    # parse_args without --camera should default to sony-a6700-slog3
    args = proc.parse_args(["some/b2/path"])
    assert args.camera == "sony-a6700-slog3", (
        f"Expected default camera 'sony-a6700-slog3', got: {args.camera}"
    )


# ============================================================
# Anamorphic Flag Tests (D-08, D-09)
# ============================================================

def test_anamorphic_flag(lut_dir):
    """
    When anamorphic=True, -vf argument contains 'scale=iw*1.33:ih'.
    D-09: Anamorphic desqueeze is applied via --anamorphic flag (not auto-detection).
    """
    lut_path = lut_dir / "sony-a6700-slog3.cube"
    cmd = proc.build_ffmpeg_command(
        Path("/tmp/input.mp4"),
        Path("/tmp/output.mp4"),
        lut_path,
        anamorphic=True
    )
    assert "-vf" in cmd, f"-vf not found in command when anamorphic=True: {cmd}"
    vf_idx = cmd.index("-vf")
    vf_value = cmd[vf_idx + 1]
    assert "scale=iw*1.33:ih" in vf_value, (
        f"scale=iw*1.33:ih not found in -vf value when anamorphic=True: {vf_value}"
    )


def test_no_anamorphic_no_scale(lut_dir):
    """
    When anamorphic=False, -vf argument does NOT contain 'scale='.
    D-09: Scale filter is only added when --anamorphic is passed.
    """
    lut_path = lut_dir / "sony-a6700-slog3.cube"
    cmd = proc.build_ffmpeg_command(
        Path("/tmp/input.mp4"),
        Path("/tmp/output.mp4"),
        lut_path,
        anamorphic=False
    )
    # If -vf is present, it must not contain scale=
    if "-vf" in cmd:
        vf_idx = cmd.index("-vf")
        vf_value = cmd[vf_idx + 1]
        assert "scale=" not in vf_value, (
            f"scale= should NOT be in -vf when anamorphic=False: {vf_value}"
        )


# ============================================================
# argparse CLI Tests (D-05)
# ============================================================

def test_parse_args_camera():
    """
    parse_args with ['path', '--camera', 'canon-r5-clog3'] sets args.camera to 'canon-r5-clog3'.
    D-05: --camera flag sets the camera profile for LUT selection.
    """
    args = proc.parse_args(["some/b2/path", "--camera", "canon-r5-clog3"])
    assert args.camera == "canon-r5-clog3", (
        f"Expected camera 'canon-r5-clog3', got: {args.camera}"
    )


def test_parse_args_anamorphic():
    """
    parse_args with ['path', '--anamorphic'] sets args.anamorphic to True.
    D-08: --anamorphic flag replaces detect_anamorphic() heuristic.
    """
    args = proc.parse_args(["some/b2/path", "--anamorphic"])
    assert args.anamorphic is True, (
        f"Expected anamorphic=True, got: {args.anamorphic}"
    )


def test_parse_args_skip_transcribe():
    """
    parse_args with ['path', '--skip-transcribe'] sets args.skip_transcribe to True.
    D-05: --skip-transcribe flag skips Whisper + diarization steps.
    """
    args = proc.parse_args(["some/b2/path", "--skip-transcribe"])
    assert args.skip_transcribe is True, (
        f"Expected skip_transcribe=True, got: {args.skip_transcribe}"
    )


# ============================================================
# Dead Code Removal Tests (D-03, D-08)
# ============================================================

def test_dead_constants_removed():
    """
    The module-level source code does NOT contain LOUDNESS_TARGET, TRUE_PEAK,
    HIGHPASS_FREQ, AUDIO_BITRATE, or VIDEO_BITRATE.
    D-03: Dead audio constants removed to clean up the script.
    """
    source = _SCRIPT_PATH.read_text()
    assert "LOUDNESS_TARGET" not in source, "LOUDNESS_TARGET should be removed from source"
    assert "TRUE_PEAK" not in source, "TRUE_PEAK should be removed from source"
    assert "HIGHPASS_FREQ" not in source, "HIGHPASS_FREQ should be removed from source"
    assert "AUDIO_BITRATE" not in source, "AUDIO_BITRATE should be removed from source"
    assert "VIDEO_BITRATE" not in source, "VIDEO_BITRATE should be removed from source"


def test_detect_anamorphic_removed():
    """
    The module source code does NOT contain 'def detect_anamorphic'.
    D-08: detect_anamorphic() heuristic removed — replaced by --anamorphic CLI flag.
    """
    source = _SCRIPT_PATH.read_text()
    assert "def detect_anamorphic" not in source, (
        "detect_anamorphic function should be removed from source"
    )


# ============================================================
# Transcription Chain Tests (D-11, D-12, Pitfall-3)
# ============================================================

import re

SCRIPTS_DIR = Path(__file__).parent.parent


def test_hf_token_env_var_process_raw():
    """process-raw-video.py must read HF_TOKEN from environment, not hardcode it."""
    source = (SCRIPTS_DIR / "process-raw-video.py").read_text()
    assert 'os.environ.get("HF_TOKEN")' in source, (
        "process-raw-video.py must use os.environ.get('HF_TOKEN') to read the token"
    )
    assert "hf_REDACTED_OLD_TOKEN" not in source, (
        "process-raw-video.py must not contain a hardcoded HF_TOKEN value"
    )


def test_hf_token_env_var_transcribe():
    """transcribe-with-speakers.py must read HF_TOKEN from environment, not hardcode it."""
    source = (SCRIPTS_DIR / "transcribe-with-speakers.py").read_text()
    assert 'os.environ.get("HF_TOKEN")' in source, (
        "transcribe-with-speakers.py must use os.environ.get('HF_TOKEN') to read the token"
    )
    assert "hf_REDACTED_OLD_TOKEN" not in source, (
        "transcribe-with-speakers.py must not contain a hardcoded HF_TOKEN value"
    )


def test_output_format_pipeline_key():
    """transcribe-with-speakers.py output dict must include 'pipeline': 'transcribe-only'."""
    source = (SCRIPTS_DIR / "transcribe-with-speakers.py").read_text()
    assert '"pipeline"' in source, (
        "transcribe-with-speakers.py output dict must contain a 'pipeline' key"
    )
    assert re.search(r'"pipeline":\s*"transcribe-only"', source), (
        "transcribe-with-speakers.py must set 'pipeline': 'transcribe-only' in output"
    )


def test_speaker_clips_faststart():
    """extract-speaker-clips.py extract_clip must include -movflags +faststart."""
    source = (SCRIPTS_DIR / "extract-speaker-clips.py").read_text()
    assert '"+faststart"' in source, (
        "extract-speaker-clips.py extract_clip must pass '+faststart' to FFmpeg "
        "for browser-streamable output"
    )


def test_dialogue_clips_faststart():
    """extract-dialogue-clips.py extract_clip must include -movflags +faststart."""
    source = (SCRIPTS_DIR / "extract-dialogue-clips.py").read_text()
    assert '"+faststart"' in source, (
        "extract-dialogue-clips.py extract_clip must pass '+faststart' to FFmpeg "
        "for browser-streamable output"
    )
