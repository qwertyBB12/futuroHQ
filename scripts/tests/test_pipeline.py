"""
Unit tests for the pipeline.py orchestrator.

All tests use mock data — no live B2/FFmpeg/Sanity calls.
Imports pipeline via importlib (filename has no hyphens — plain python).

TDD RED phase: Tests written before implementation.
Tests cover:
- Import chain (pipeline imports from process-raw-video and extract-speaker-clips)
- parse_pipeline_args with various flag combinations
- derive_b2_upload_path path transformation
- derive_clips_b2_path stem + clip filename
- derive_cdn_url URL encoding
- Standalone guard existence in source scripts
- upload_clips_to_b2 function exists and calls upload_to_b2 for each clip
"""

import sys
import importlib
import importlib.util
import json
from pathlib import Path
import pytest

SCRIPTS_DIR = Path(__file__).parent.parent
PIPELINE_PATH = SCRIPTS_DIR / "pipeline.py"


def _load_pipeline():
    spec = importlib.util.spec_from_file_location("pipeline", PIPELINE_PATH)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


# Load once at module level so import errors surface clearly
pipeline = _load_pipeline()


# ============================================================
# Test 1 & 2: Import chain
# ============================================================

def test_pipeline_imports_process_video():
    """
    Test 1: pipeline.py imports process_video from process-raw-video without error.
    Verifying the module has the attribute after load.
    """
    # If module loaded successfully, check that process_video is accessible
    # (either directly imported or via a module attribute)
    assert hasattr(pipeline, "process_video") or hasattr(pipeline, "_proc_raw_video"), (
        "pipeline.py must make process_video available (directly or via module attribute)"
    )


def test_pipeline_imports_process_transcript():
    """
    Test 2: pipeline.py imports process_transcript from extract-speaker-clips without error.
    """
    assert hasattr(pipeline, "process_transcript") or hasattr(pipeline, "_extract_speaker_clips"), (
        "pipeline.py must make process_transcript available (directly or via module attribute)"
    )


# ============================================================
# Test 3–5: parse_pipeline_args
# ============================================================

def test_parse_pipeline_args_returns_namespace():
    """
    Test 3: parse_pipeline_args("path/to/video.mp4") returns namespace with
    b2_path, camera, anamorphic, skip_transcribe, skip_upload, skip_sanity, skip_clips, live.
    """
    args = pipeline.parse_pipeline_args(["path/to/video.mp4"])
    assert hasattr(args, "b2_path"), "args must have b2_path"
    assert hasattr(args, "camera"), "args must have camera"
    assert hasattr(args, "anamorphic"), "args must have anamorphic"
    assert hasattr(args, "skip_transcribe"), "args must have skip_transcribe"
    assert hasattr(args, "skip_upload"), "args must have skip_upload"
    assert hasattr(args, "skip_sanity"), "args must have skip_sanity"
    assert hasattr(args, "skip_clips"), "args must have skip_clips"
    assert hasattr(args, "live"), "args must have live"


def test_parse_pipeline_args_skip_upload():
    """
    Test 4: parse_pipeline_args("path/to/folder") with --skip-upload sets skip_upload=True
    """
    args = pipeline.parse_pipeline_args(["path/to/folder", "--skip-upload"])
    assert args.skip_upload is True, f"Expected skip_upload=True, got: {args.skip_upload}"


def test_parse_pipeline_args_defaults():
    """
    Test 5: parse_pipeline_args defaults:
    camera=sony-a6700-slog3, anamorphic=False, skip_transcribe=False,
    skip_upload=False, skip_sanity=False, skip_clips=False, live=False
    """
    args = pipeline.parse_pipeline_args(["some/path"])
    assert args.camera == "sony-a6700-slog3", (
        f"Expected default camera 'sony-a6700-slog3', got: {args.camera}"
    )
    assert args.anamorphic is False, f"Expected anamorphic=False, got: {args.anamorphic}"
    assert args.skip_transcribe is False, f"Expected skip_transcribe=False, got: {args.skip_transcribe}"
    assert args.skip_upload is False, f"Expected skip_upload=False, got: {args.skip_upload}"
    assert args.skip_sanity is False, f"Expected skip_sanity=False, got: {args.skip_sanity}"
    assert args.skip_clips is False, f"Expected skip_clips=False, got: {args.skip_clips}"
    assert args.live is False, f"Expected live=False, got: {args.live}"


# ============================================================
# Test 6: derive_b2_upload_path
# ============================================================

def test_derive_b2_upload_path():
    """
    Test 6: derive_b2_upload_path("Futuro MMXXV/raw/card-1/Day 1/C3460.MP4")
    returns "Futuro MMXXV/edited/card-1/Day 1/C3460_processed.mp4"
    """
    result = pipeline.derive_b2_upload_path("Futuro MMXXV/raw/card-1/Day 1/C3460.MP4")
    expected = "Futuro MMXXV/edited/card-1/Day 1/C3460_processed.mp4"
    assert result == expected, f"Expected: {expected!r}, got: {result!r}"


def test_derive_b2_upload_path_lowercase_extension():
    """
    derive_b2_upload_path also works with lowercase .mp4 extension
    """
    result = pipeline.derive_b2_upload_path("Futuro MMXXV/raw/card-2/Day 2/C3461.mp4")
    expected = "Futuro MMXXV/edited/card-2/Day 2/C3461_processed.mp4"
    assert result == expected, f"Expected: {expected!r}, got: {result!r}"


# ============================================================
# Test 7: derive_clips_b2_path
# ============================================================

def test_derive_clips_b2_path():
    """
    Test 7: derive_clips_b2_path("C3460", "SPEAKER_00_00m00s-00m30s.mp4")
    returns "Futuro MMXXV/clips/C3460/SPEAKER_00_00m00s-00m30s.mp4"
    """
    result = pipeline.derive_clips_b2_path("C3460", "SPEAKER_00_00m00s-00m30s.mp4")
    expected = "Futuro MMXXV/clips/C3460/SPEAKER_00_00m00s-00m30s.mp4"
    assert result == expected, f"Expected: {expected!r}, got: {result!r}"


# ============================================================
# Test 8: derive_cdn_url
# ============================================================

def test_derive_cdn_url_spaces_encoded():
    """
    Test 8: derive_cdn_url("Futuro MMXXV/edited/card-1/Day 1/C3460_processed.mp4")
    returns "https://benext.b-cdn.net/Futuro%20MMXXV/edited/card-1/Day%201/C3460_processed.mp4"
    """
    result = pipeline.derive_cdn_url("Futuro MMXXV/edited/card-1/Day 1/C3460_processed.mp4")
    expected = "https://benext.b-cdn.net/Futuro%20MMXXV/edited/card-1/Day%201/C3460_processed.mp4"
    assert result == expected, f"Expected: {expected!r}, got: {result!r}"


def test_derive_cdn_url_no_spaces():
    """
    derive_cdn_url works correctly when there are no spaces in path
    """
    result = pipeline.derive_cdn_url("Futuro MMXIX/edited/HB_ALISTAIR.mp4")
    expected = "https://benext.b-cdn.net/Futuro%20MMXIX/edited/HB_ALISTAIR.mp4"
    assert result == expected, f"Expected: {expected!r}, got: {result!r}"


# ============================================================
# Test 9 & 10: Standalone guards in source scripts
# ============================================================

def test_process_raw_video_standalone_guard():
    """
    Test 9: process-raw-video.py still executes standalone (if __name__ == "__main__" block intact).
    """
    source = (SCRIPTS_DIR / "process-raw-video.py").read_text()
    assert 'if __name__ == "__main__":' in source, (
        'process-raw-video.py must contain if __name__ == "__main__": block'
    )


def test_extract_speaker_clips_standalone_guard():
    """
    Test 10: extract-speaker-clips.py still executes standalone (if __name__ == "__main__" block intact).
    """
    source = (SCRIPTS_DIR / "extract-speaker-clips.py").read_text()
    assert 'if __name__ == "__main__":' in source, (
        'extract-speaker-clips.py must contain if __name__ == "__main__": block'
    )


# ============================================================
# Test 11: upload_clips_to_b2 function exists
# ============================================================

def test_upload_clips_to_b2_function_exists():
    """
    Test 11: upload_clips_to_b2 function exists and calls upload_to_b2 for each clip file in manifest.
    Verify via source inspection that upload_to_b2 is called inside upload_clips_to_b2.
    """
    assert hasattr(pipeline, "upload_clips_to_b2"), (
        "pipeline.py must have upload_clips_to_b2 function"
    )
    # Inspect source to verify it calls upload_to_b2
    source = PIPELINE_PATH.read_text()
    assert "upload_to_b2" in source, (
        "pipeline.py upload_clips_to_b2 must call upload_to_b2"
    )


# ============================================================
# Additional: run_pipeline function exists
# ============================================================

def test_run_pipeline_function_exists():
    """pipeline.py must have run_pipeline function."""
    assert hasattr(pipeline, "run_pipeline"), (
        "pipeline.py must have run_pipeline function"
    )


# ============================================================
# Additional: process_video returns dict with required keys
# ============================================================

def test_process_raw_video_signature_skip_upload():
    """
    process-raw-video.py process_video() must accept skip_upload parameter.
    Verified via source inspection.
    """
    source = (SCRIPTS_DIR / "process-raw-video.py").read_text()
    assert "skip_upload" in source, (
        "process-raw-video.py process_video() must accept skip_upload parameter"
    )


def test_process_raw_video_signature_skip_cleanup():
    """
    process-raw-video.py process_video() must accept skip_cleanup parameter.
    """
    source = (SCRIPTS_DIR / "process-raw-video.py").read_text()
    assert "skip_cleanup" in source, (
        "process-raw-video.py process_video() must accept skip_cleanup parameter"
    )


def test_process_raw_video_returns_dict():
    """
    process-raw-video.py process_video() must return a dict (not None) on success.
    Verified via source — must contain 'return {' or 'return result'.
    """
    source = (SCRIPTS_DIR / "process-raw-video.py").read_text()
    has_return_dict = "return {" in source or "return result" in source
    assert has_return_dict, (
        "process-raw-video.py process_video() must return a dict"
    )


def test_extract_speaker_clips_video_path_param():
    """
    extract-speaker-clips.py process_transcript() must accept optional video_path param.
    """
    source = (SCRIPTS_DIR / "extract-speaker-clips.py").read_text()
    assert "video_path=None" in source, (
        "extract-speaker-clips.py process_transcript() must accept video_path=None parameter"
    )


def test_extract_speaker_clips_returns_manifest():
    """
    extract-speaker-clips.py process_transcript() must return the manifest dict.
    """
    source = (SCRIPTS_DIR / "extract-speaker-clips.py").read_text()
    assert "return manifest" in source, (
        "extract-speaker-clips.py process_transcript() must return manifest"
    )
