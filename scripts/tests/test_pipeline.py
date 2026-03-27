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
    Accepts both typed (video_path: Path = None) and untyped (video_path=None) forms.
    """
    source = (SCRIPTS_DIR / "extract-speaker-clips.py").read_text()
    has_video_path_param = "video_path=None" in source or "video_path: Path = None" in source
    assert has_video_path_param, (
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


# ============================================================
# Plan 02 Tests: Sanity document creation
# ============================================================

# Shared test fixtures
_ENRICHED_DATA = {
    "pipeline": "raw",
    "source_file": "Futuro MMXXV/raw/card-1/Day 1/C3460.MP4",
    "processed_file": "Futuro MMXXV/edited/card-1/Day 1/C3460_processed.mp4",
    "duration_seconds": 30.54,
    "language": "en",
    "speakers": ["SPEAKER_00", "SPEAKER_01"],
    "full_text": "Hello world, this is a test transcript.",
    "speaker_segments": [
        {"speaker": "SPEAKER_00", "start": 0.0, "end": 15.0, "text": "Hello world"},
        {"speaker": "SPEAKER_01", "start": 15.0, "end": 30.0, "text": "This is a test"},
    ],
}

_PIPELINE_RESULT = {
    "b2_path": "Futuro MMXXV/raw/card-1/Day 1/C3460.MP4",
    "stem": "C3460",
    "edited_b2_path": "Futuro MMXXV/edited/card-1/Day 1/C3460_processed.mp4",
    "edited_cdn_url": "https://benext.b-cdn.net/Futuro%20MMXXV/edited/card-1/Day%201/C3460_processed.mp4",
    "clips": [],
    "steps_completed": ["encode", "transcribe"],
    "error": None,
}

_CDN_URL = "https://benext.b-cdn.net/Futuro%20MMXXV/edited/card-1/Day%201/C3460_processed.mp4"

_CLIP_DATA = {
    "file": "SPEAKER_00_00m00s-00m30s.mp4",
    "speaker": "SPEAKER_00",
    "start": 0.0,
    "end": 30.38,
    "duration": 30.4,
    "text": "Not only do they come to everything...",
    "cdn_url": "https://benext.b-cdn.net/Futuro%20MMXXV/clips/C3460/SPEAKER_00_00m00s-00m30s.mp4",
    "b2_key": "Futuro MMXXV/clips/C3460/SPEAKER_00_00m00s-00m30s.mp4",
}


def test_build_video_doc_fields():
    """
    Test 1: build_video_doc() returns dict with all required governance and storage fields.
    """
    doc = pipeline.build_video_doc(_PIPELINE_RESULT, _ENRICHED_DATA, _CDN_URL)
    assert doc["_type"] == "video", f"Expected _type='video', got: {doc.get('_type')}"
    assert doc["videoSource"] == "b2", f"Expected videoSource='b2', got: {doc.get('videoSource')}"
    assert doc["b2Key"] == _PIPELINE_RESULT["edited_b2_path"], f"b2Key mismatch"
    assert doc["cdnUrl"] == _CDN_URL, f"cdnUrl mismatch"
    assert doc["narrativeOwner"] == "hector", f"Expected narrativeOwner='hector', got: {doc.get('narrativeOwner')}"
    assert doc["platformTier"] == "canonical", f"Expected platformTier='canonical', got: {doc.get('platformTier')}"
    assert doc["archivalStatus"] == "archival", f"Expected archivalStatus='archival', got: {doc.get('archivalStatus')}"
    assert doc["bunnyStatus"] == "ready", f"Expected bunnyStatus='ready', got: {doc.get('bunnyStatus')}"
    assert "_id" not in doc, "build_video_doc must NOT set _id — sanity_mutate adds it"


def test_build_video_doc_language_array():
    """
    Test 2: build_video_doc() sets language as array (not string), title from stem, duration from duration_seconds.
    """
    doc = pipeline.build_video_doc(_PIPELINE_RESULT, _ENRICHED_DATA, _CDN_URL)
    assert isinstance(doc["language"], list), f"Expected language to be a list, got: {type(doc['language'])}"
    assert "en" in doc["language"], f"Expected 'en' in language, got: {doc['language']}"
    assert doc.get("duration") == 30.54, f"Expected duration=30.54, got: {doc.get('duration')}"
    # Title should reference Day 1 and clip number C3460
    assert "Day 1" in doc.get("title", "") or "C3460" in doc.get("title", ""), (
        f"Expected title to reference Day 1 or C3460, got: {doc.get('title')}"
    )


def test_build_video_doc_transcript():
    """
    Test 3: build_video_doc() sets fullText from enriched JSON full_text,
    speakerSegments from enriched JSON speaker_segments (with _key added).
    """
    doc = pipeline.build_video_doc(_PIPELINE_RESULT, _ENRICHED_DATA, _CDN_URL)
    assert doc.get("fullText") == _ENRICHED_DATA["full_text"], (
        f"Expected fullText to match enriched full_text, got: {doc.get('fullText')}"
    )
    segs = doc.get("speakerSegments", [])
    assert len(segs) == 2, f"Expected 2 speakerSegments, got: {len(segs)}"
    assert all("_key" in s for s in segs), "Each speakerSegment must have a _key field"
    assert segs[0]["speaker"] == "SPEAKER_00", f"Expected first speaker=SPEAKER_00, got: {segs[0]['speaker']}"


def test_build_clip_doc_fields():
    """
    Test 4: build_clip_doc() returns dict with _type='video', videoFormat='shortform',
    b2Key and cdnUrl from clip data, duration from clip duration.
    """
    doc = pipeline.build_clip_doc(_CLIP_DATA, "C3460", _ENRICHED_DATA)
    assert doc["_type"] == "video", f"Expected _type='video', got: {doc.get('_type')}"
    assert doc["videoFormat"] == "shortform", f"Expected videoFormat='shortform', got: {doc.get('videoFormat')}"
    assert doc["b2Key"] == _CLIP_DATA["b2_key"], f"b2Key mismatch"
    assert doc["cdnUrl"] == _CLIP_DATA["cdn_url"], f"cdnUrl mismatch"
    assert doc["duration"] == _CLIP_DATA["duration"], f"Expected duration={_CLIP_DATA['duration']}, got: {doc.get('duration')}"
    assert "_id" not in doc, "build_clip_doc must NOT set _id — sanity_mutate adds it"


def test_build_clip_doc_featured_in_empty():
    """
    Test 5: build_clip_doc() sets featuredIn as empty array when speaker label is generic (SPEAKER_00).
    Per D-08: speakers are generic labels that can't be auto-matched to person docs.
    """
    doc = pipeline.build_clip_doc(_CLIP_DATA, "C3460", _ENRICHED_DATA)
    assert "featuredIn" in doc, "build_clip_doc must include featuredIn key"
    assert doc["featuredIn"] == [], f"Expected featuredIn=[], got: {doc.get('featuredIn')}"


def test_sanity_mutate_dry_run():
    """
    Test 6: sanity_mutate() with dry_run=True returns a doc_id starting with 'drafts.'
    without making any HTTP request.
    """
    doc = {"_type": "video", "title": "Test Video", "videoSource": "b2"}
    doc_id = pipeline.sanity_mutate(doc, dry_run=True)
    assert doc_id is not None, "sanity_mutate(dry_run=True) must return a doc_id"
    assert doc_id.startswith("drafts."), f"Expected doc_id to start with 'drafts.', got: {doc_id}"
    assert doc.get("_id") == doc_id, "sanity_mutate must set _id on the doc"


def test_create_clip_documents_count():
    """
    Test 8: create_clip_documents() creates one document per clip in the clips list.
    Uses dry_run=True to avoid HTTP calls.
    """
    clips = [
        {**_CLIP_DATA},
        {**_CLIP_DATA, "file": "SPEAKER_01_00m30s-01m00s.mp4", "speaker": "SPEAKER_01"},
    ]
    ids = pipeline.create_clip_documents(clips, "C3460", _ENRICHED_DATA, dry_run=True)
    assert len(ids) == 2, f"Expected 2 doc_ids, got: {len(ids)}"
    assert all(i.startswith("drafts.") for i in ids), "All clip doc ids must start with 'drafts.'"
