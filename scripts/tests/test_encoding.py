"""
Tests for transcription chain correctness: HF_TOKEN env var usage,
pipeline key in output, and -movflags +faststart in clip extraction scripts.

All tests are source-code assertion tests (reading file text) since the
actual FFmpeg/B2/Whisper pipeline cannot be run in tests.
"""

import re
from pathlib import Path

SCRIPTS_DIR = Path(__file__).parent.parent


# ---------------------------------------------------------------------------
# HF_TOKEN environment variable tests
# ---------------------------------------------------------------------------

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


# ---------------------------------------------------------------------------
# Output format alignment test
# ---------------------------------------------------------------------------

def test_output_format_pipeline_key():
    """transcribe-with-speakers.py output dict must include 'pipeline': 'transcribe-only'."""
    source = (SCRIPTS_DIR / "transcribe-with-speakers.py").read_text()
    # Check for the pipeline key in the output dict
    assert '"pipeline"' in source, (
        "transcribe-with-speakers.py output dict must contain a 'pipeline' key"
    )
    assert re.search(r'"pipeline":\s*"transcribe-only"', source), (
        "transcribe-with-speakers.py must set 'pipeline': 'transcribe-only' in output"
    )


# ---------------------------------------------------------------------------
# -movflags +faststart tests
# ---------------------------------------------------------------------------

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
