#!/usr/bin/env python3
"""
End-to-end video pipeline orchestrator.
Raw video -> encode + LUT -> transcribe -> diarize -> extract clips -> upload to B2 -> create Sanity docs.

Usage:
    python3 scripts/pipeline.py "Futuro MMXXV/raw/card-1/Day 1/C3460.MP4"
    python3 scripts/pipeline.py "Futuro MMXXV/raw/card-1/Day 1" --camera canon-r5-clog3
    python3 scripts/pipeline.py "path" --skip-upload        # local only
    python3 scripts/pipeline.py "path" --skip-sanity         # upload but no Sanity docs
    python3 scripts/pipeline.py "path" --dry-run             # preview Sanity mutations
    python3 scripts/pipeline.py "path" --live                # execute Sanity mutations
"""

import argparse
import importlib.util
import json
import sys
import os
from argparse import Namespace
from pathlib import Path

# ============================================================
# Import sibling scripts via importlib (filenames have hyphens)
# ============================================================

_SCRIPTS_DIR = Path(__file__).parent


def _load_module_from_file(name: str, filename: str):
    """Load a Python module from a file with a hyphenated name."""
    path = _SCRIPTS_DIR / filename
    spec = importlib.util.spec_from_file_location(name, path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


# Load process-raw-video.py
_proc_raw_video = _load_module_from_file("process_raw_video", "process-raw-video.py")
process_video = _proc_raw_video.process_video
upload_to_b2 = _proc_raw_video.upload_to_b2
list_videos = _proc_raw_video.list_videos
CAMERA_LUTS = _proc_raw_video.CAMERA_LUTS
CLIPS_DIR_DEFAULT = Path("/Users/hectorhlopez/projects/clean-studio/clips")

# Load extract-speaker-clips.py
_extract_speaker_clips = _load_module_from_file("extract_speaker_clips", "extract-speaker-clips.py")
process_transcript = _extract_speaker_clips.process_transcript
CLIPS_DIR = _extract_speaker_clips.CLIPS_DIR
CDN_BASE = _extract_speaker_clips.CDN_BASE

# B2 bucket (from process-raw-video constants)
BUCKET = _proc_raw_video.BUCKET

# ============================================================
# Constants
# ============================================================

# Futuro MMXXV project prefix — used in B2 path construction for clips
# Clips are stored at: Futuro MMXXV/clips/{stem}/{clip_filename}
CLIPS_B2_PREFIX = "Futuro MMXXV"

# Video file extensions for folder detection
VIDEO_EXTENSIONS = [".mp4", ".mov", ".mkv", ".webm", ".avi"]


# ============================================================
# CLI
# ============================================================

def parse_pipeline_args(argv=None) -> Namespace:
    """Parse pipeline orchestrator CLI arguments."""
    parser = argparse.ArgumentParser(
        description="End-to-end video pipeline orchestrator.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python3 scripts/pipeline.py "Futuro MMXXV/raw/card-1/Day 1/C3460.MP4"
  python3 scripts/pipeline.py "Futuro MMXXV/raw/card-1/Day 1" --camera canon-r5-clog3
  python3 scripts/pipeline.py "path" --skip-upload
  python3 scripts/pipeline.py "path" --dry-run
  python3 scripts/pipeline.py "path" --live
        """
    )
    parser.add_argument(
        "b2_path",
        help="B2 path to raw video file or folder of raw videos"
    )
    parser.add_argument(
        "--camera",
        default="sony-a6700-slog3",
        choices=list(CAMERA_LUTS.keys()),
        help="Camera profile for LUT selection (default: sony-a6700-slog3)"
    )
    parser.add_argument(
        "--anamorphic",
        action="store_true",
        help="Apply 1.33x anamorphic desqueeze (Sirui 50mm lens footage)"
    )
    parser.add_argument(
        "--skip-transcribe",
        action="store_true",
        help="Encode only — skip Whisper transcription and speaker diarization"
    )
    parser.add_argument(
        "--skip-upload",
        action="store_true",
        help="Process locally only — do not upload to B2"
    )
    parser.add_argument(
        "--skip-sanity",
        action="store_true",
        help="Upload to B2 but do not create or update Sanity documents"
    )
    parser.add_argument(
        "--skip-clips",
        action="store_true",
        help="Encode and transcribe but skip speaker clip extraction"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Preview Sanity mutations without executing them"
    )
    parser.add_argument(
        "--live",
        action="store_true",
        help="Execute Sanity mutations (creates/updates documents)"
    )
    return parser.parse_args(argv)


# ============================================================
# Path derivation helpers
# ============================================================

def derive_b2_upload_path(raw_b2_path: str) -> str:
    """
    Convert a raw B2 path to the edited output path.

    Example:
        "Futuro MMXXV/raw/card-1/Day 1/C3460.MP4"
        -> "Futuro MMXXV/edited/card-1/Day 1/C3460_processed.mp4"
    """
    filename = os.path.basename(raw_b2_path)
    stem = os.path.splitext(filename)[0]
    processed_filename = f"{stem}_processed.mp4"
    # Replace /raw/ with /edited/ and swap the filename
    edited_path = raw_b2_path.replace("/raw/", "/edited/")
    # Replace old filename with new processed filename
    edited_path = edited_path[: edited_path.rfind("/") + 1] + processed_filename
    return edited_path


def derive_clips_b2_path(stem: str, clip_filename: str) -> str:
    """
    Derive the B2 upload path for a speaker clip.

    Clips go under: {CLIPS_B2_PREFIX}/clips/{stem}/{clip_filename}

    Example:
        derive_clips_b2_path("C3460", "SPEAKER_00_00m00s-00m30s.mp4")
        -> "Futuro MMXXV/clips/C3460/SPEAKER_00_00m00s-00m30s.mp4"
    """
    return f"{CLIPS_B2_PREFIX}/clips/{stem}/{clip_filename}"


def derive_cdn_url(b2_path: str) -> str:
    """
    Convert a B2 path to a CDN URL, encoding spaces as %20.

    Example:
        derive_cdn_url("Futuro MMXXV/edited/card-1/Day 1/C3460_processed.mp4")
        -> "https://benext.b-cdn.net/Futuro%20MMXXV/edited/card-1/Day%201/C3460_processed.mp4"
    """
    encoded = b2_path.replace(" ", "%20")
    return f"{CDN_BASE}/{encoded}"


# ============================================================
# Upload helpers
# ============================================================

def upload_clips_to_b2(stem: str, clips_dir: Path) -> list:
    """
    Upload all clip files listed in the manifest to B2.

    Reads manifest.json from clips_dir/{stem}/manifest.json.
    For each clip, uploads the file and updates the clip dict with:
    - cdn_url: CDN URL for the clip
    - b2_key: B2 path for the clip

    Returns the updated clips list.
    """
    manifest_path = clips_dir / stem / "manifest.json"
    if not manifest_path.exists():
        print(f"  WARNING: No manifest found at {manifest_path}")
        return []

    with open(manifest_path) as f:
        manifest = json.load(f)

    clips = manifest.get("clips", [])
    updated_clips = []

    for clip in clips:
        clip_filename = clip["file"]
        clip_local_path = clips_dir / stem / clip_filename
        clips_b2_path = derive_clips_b2_path(stem, clip_filename)

        print(f"  Uploading clip: {clip_filename} -> {clips_b2_path}")
        success = upload_to_b2(clip_local_path, clips_b2_path)

        if success:
            print(f"    ✓ Uploaded")
        else:
            print(f"    ✗ Upload failed")

        updated_clip = dict(clip)
        updated_clip["b2_key"] = clips_b2_path
        updated_clip["cdn_url"] = derive_cdn_url(clips_b2_path)
        updated_clips.append(updated_clip)

    # Update manifest with corrected CDN URLs
    manifest["clips"] = updated_clips
    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)

    return updated_clips


# ============================================================
# Pipeline runner
# ============================================================

def run_pipeline(b2_path: str, args: Namespace) -> dict:
    """
    Run the full pipeline for a single video file.

    Steps:
    1. Encode + transcribe + diarize (process_video)
    2. Extract speaker clips (process_transcript)
    3. Upload processed video and clips to B2
    4. Clean up local temp files

    Returns a result dict with metadata about what was done.
    On failure, returns partial result with error info.
    """
    print(f"\n{'='*70}")
    print(f"PIPELINE: {b2_path}")
    print(f"{'='*70}")

    result = {
        "b2_path": b2_path,
        "stem": None,
        "steps_completed": [],
        "error": None,
        "edited_b2_path": None,
        "edited_cdn_url": None,
        "clips": [],
    }

    # Step 1: Encode + transcribe + diarize
    print(f"\n[STEP 1] Encode + Transcribe + Diarize")
    try:
        video_result = process_video(
            b2_path,
            camera=args.camera,
            anamorphic=args.anamorphic,
            skip_transcribe=args.skip_transcribe,
            skip_upload=args.skip_upload,
            skip_cleanup=True  # Keep processed file for clip extraction
        )
    except Exception as e:
        result["error"] = f"Step 1 (encode/transcribe) failed: {e}"
        print(f"  ✗ {result['error']}")
        return result

    if video_result is None:
        result["error"] = "Step 1 (encode/transcribe) failed — no result returned"
        return result

    if video_result.get("skipped"):
        print(f"  Already processed (skipped)")
        result["stem"] = video_result["stem"]
        result["steps_completed"].append("encode-skipped")
        # Still try to run clips and upload for re-runs
    else:
        result["stem"] = video_result["stem"]
        result["edited_b2_path"] = video_result.get("edited_b2_path")
        if result["edited_b2_path"]:
            result["edited_cdn_url"] = derive_cdn_url(result["edited_b2_path"])
        result["steps_completed"].append("encode")
        if not args.skip_transcribe:
            result["steps_completed"].append("transcribe")

    stem = result["stem"]
    processed_path = video_result.get("processed_path")

    # Step 2: Extract speaker clips
    if not args.skip_transcribe and not args.skip_clips:
        print(f"\n[STEP 2] Extract Speaker Clips")
        try:
            manifest = process_transcript(
                stem,
                video_path=processed_path if processed_path and processed_path.exists() else None
            )
            if manifest:
                result["steps_completed"].append("clip-extract")
                result["clips"] = manifest.get("clips", [])
                print(f"  ✓ {len(result['clips'])} clips extracted")
            else:
                print(f"  No clips extracted (no suitable segments)")
        except Exception as e:
            print(f"  ✗ Clip extraction failed: {e}")
            result["error"] = f"Step 2 (clip extraction) failed: {e}"
            # Continue — clip failure is non-fatal, still upload processed video
    else:
        print(f"\n[STEP 2] Clip extraction skipped")

    # Step 3: Upload clips to B2
    if not args.skip_upload and not args.skip_clips and result["clips"]:
        print(f"\n[STEP 3] Upload Clips to B2")
        try:
            updated_clips = upload_clips_to_b2(stem, CLIPS_DIR)
            result["clips"] = updated_clips
            result["steps_completed"].append("clip-upload")
        except Exception as e:
            print(f"  ✗ Clip upload failed: {e}")

    # Step 4: Clean up local temp files
    if processed_path and processed_path.exists():
        processed_path.unlink(missing_ok=True)
        print(f"\n[STEP 4] Cleaned up: {processed_path.name}")

    # Summary
    print(f"\n{'='*70}")
    print(f"PIPELINE COMPLETE: {stem}")
    print(f"  Steps: {', '.join(result['steps_completed'])}")
    if result["edited_cdn_url"]:
        print(f"  Video CDN URL: {result['edited_cdn_url']}")
    if result["clips"]:
        print(f"  Clips: {len(result['clips'])}")
    if result["error"]:
        print(f"  WARNING: {result['error']}")
    print(f"{'='*70}\n")

    return result


# ============================================================
# Main entry point
# ============================================================

def main():
    args = parse_pipeline_args()

    target = args.b2_path

    # Determine if target is a single file or folder
    is_video = any(target.lower().endswith(ext) for ext in VIDEO_EXTENSIONS)

    if is_video:
        videos = [target]
    else:
        print(f"Listing videos in folder: {target}")
        videos = list_videos(target)
        if not videos:
            print("No videos found.")
            sys.exit(0)

    print(f"\nFound {len(videos)} video(s)")
    lut_file = CAMERA_LUTS.get(args.camera, CAMERA_LUTS.get("default"))
    print(f"Camera: {args.camera} -> LUT: {lut_file or 'none'}")
    if args.anamorphic:
        print(f"Anamorphic: enabled (1.33x desqueeze)")
    if args.skip_transcribe:
        print(f"Transcription: skipped")
    if args.skip_upload:
        print(f"B2 upload: skipped (local processing only)")
    if args.skip_sanity:
        print(f"Sanity docs: skipped")
    if args.dry_run:
        print(f"Sanity mode: dry-run (preview mutations)")
    elif args.live:
        print(f"Sanity mode: live (executing mutations)")
    else:
        print(f"Sanity mode: none (use --dry-run or --live to create docs)")

    # Process each video
    successes = []
    failures = []

    for video in videos:
        try:
            video_result = run_pipeline(video, args)
            if video_result.get("error") and not video_result.get("steps_completed"):
                failures.append({"video": video, "error": video_result["error"]})
            else:
                successes.append(video_result)
        except Exception as e:
            print(f"\n  ✗ Unexpected error processing {video}: {e}")
            failures.append({"video": video, "error": str(e)})

    # Batch summary
    print(f"\n{'='*70}")
    print(f"BATCH COMPLETE")
    print(f"  Success: {len(successes)}/{len(videos)}")
    if failures:
        print(f"  Failures ({len(failures)}):")
        for f in failures:
            print(f"    - {f['video']}: {f['error']}")
    print(f"{'='*70}\n")

    if failures:
        sys.exit(1)


if __name__ == "__main__":
    main()
