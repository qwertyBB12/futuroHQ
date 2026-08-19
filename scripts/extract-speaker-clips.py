#!/usr/bin/env python3
"""
Extract individual speaker clips from diarized videos.
Reads enriched transcript JSON → downloads video → extracts per-speaker clips via FFmpeg.

Usage:
    python3 scripts/extract-speaker-clips.py "HB2_OAS PARTNER 4K_ahq12"
    python3 scripts/extract-speaker-clips.py --all  # process all enriched transcripts
"""

import sys
import os
import json
import subprocess
from pathlib import Path

BUCKET = "hector-ecosystem-archive-prod"
TRANSCRIPT_DIR = Path("/Users/hectorhlopez/projects/clean-studio/transcripts")
CLIPS_DIR = Path("/Users/hectorhlopez/projects/clean-studio/clips")
WORK_DIR = Path("/tmp/b2-clip-extract")
CDN_BASE = "https://benext.b-cdn.net"

# Minimum segment duration to extract (skip tiny fragments)
MIN_CLIP_DURATION = 5  # seconds


def download_video(b2_path: str, local_path: Path) -> bool:
    local_path.parent.mkdir(parents=True, exist_ok=True)
    result = subprocess.run(
        ["b2", "file", "download", f"b2://{BUCKET}/{b2_path}", str(local_path)],
        capture_output=True, text=True
    )
    return result.returncode == 0


def extract_clip(video_path: Path, output_path: Path, start: float, end: float) -> bool:
    """Extract clip using stream copy, then apply faststart in a second pass.

    Two-step approach because -ss (input seeking) + -c copy + -movflags +faststart
    in a single pass does not reliably relocate the moov atom.
    """
    duration = end - start
    temp_path = output_path.with_suffix(".tmp.mp4")

    # Step 1: Extract clip with stream copy (no faststart yet)
    result = subprocess.run([
        "ffmpeg", "-ss", str(start), "-i", str(video_path),
        "-t", str(duration),
        "-c", "copy",
        "-avoid_negative_ts", "make_zero",
        "-y", str(temp_path)
    ], capture_output=True, text=True)
    if result.returncode != 0:
        temp_path.unlink(missing_ok=True)
        return False

    # Step 2: Apply faststart (relocates moov atom to beginning)
    result = subprocess.run([
        "ffmpeg", "-i", str(temp_path),
        "-c", "copy",
        "-movflags", "+faststart",
        "-y", str(output_path)
    ], capture_output=True, text=True)
    temp_path.unlink(missing_ok=True)
    return result.returncode == 0


def format_time(seconds: float) -> str:
    m = int(seconds // 60)
    s = int(seconds % 60)
    return f"{m:02d}m{s:02d}s"


def process_transcript(stem: str, video_path: Path = None):
    enriched_path = TRANSCRIPT_DIR / f"{stem}.enriched.json"
    if not enriched_path.exists():
        print(f"No enriched transcript found: {enriched_path}")
        return None

    with open(enriched_path) as f:
        data = json.load(f)

    source_file = data.get("source_file", "")
    speakers = data.get("speakers", [])
    speaker_segments = data.get("speaker_segments", [])
    duration = data.get("duration_seconds", 0)

    print(f"\n{'='*60}")
    print(f"EXTRACTING CLIPS: {stem}")
    print(f"{'='*60}")
    print(f"Source: {source_file}")
    print(f"Duration: {duration/60:.1f} min")
    print(f"Speakers: {len(speakers)}")

    # Filter segments worth extracting
    extractable = [s for s in speaker_segments
                   if (s["end"] - s["start"]) >= MIN_CLIP_DURATION
                   and s["speaker"] != "UNKNOWN"]

    print(f"Extractable segments: {len(extractable)} (>= {MIN_CLIP_DURATION}s)")

    if not extractable:
        print("No segments to extract.")
        return

    # Create output directory per source video
    video_clips_dir = CLIPS_DIR / stem
    video_clips_dir.mkdir(parents=True, exist_ok=True)

    # Download video (or use provided local path if available)
    _downloaded_video = False
    if video_path is not None and Path(video_path).exists():
        video_path = Path(video_path)
        print(f"\n  Using provided local video: {video_path}")
    else:
        video_path = WORK_DIR / os.path.basename(source_file)
        if not video_path.exists():
            print(f"\n  Downloading video from B2...")
            if not download_video(source_file, video_path):
                print(f"  ✗ Download failed")
                return None
            _downloaded_video = True
            print(f"  ✓ Downloaded")

    # Extract clips per speaker
    clips_manifest = []
    for i, seg in enumerate(extractable):
        speaker = seg["speaker"]
        start = seg["start"]
        end = seg["end"]
        duration_s = end - start
        text_preview = seg["text"][:80] + "..." if len(seg["text"]) > 80 else seg["text"]

        clip_name = f"{speaker}_{format_time(start)}-{format_time(end)}.mp4"
        clip_path = video_clips_dir / clip_name

        if clip_path.exists():
            print(f"  SKIP: {clip_name} (exists)")
            clips_manifest.append({
                "file": clip_name,
                "speaker": speaker,
                "start": start,
                "end": end,
                "duration": round(duration_s, 1),
                "text": seg["text"],
                "cdn_url": f"{CDN_BASE}/{source_file.replace(os.path.basename(source_file), '')}clips/{clip_name}".replace(" ", "%20")
            })
            continue

        print(f"  [{i+1}/{len(extractable)}] {speaker} "
              f"({format_time(start)}-{format_time(end)}, {duration_s:.0f}s)")
        print(f"    \"{text_preview}\"")

        if extract_clip(video_path, clip_path, start, end):
            size_mb = clip_path.stat().st_size / (1024**2)
            print(f"    ✓ {size_mb:.1f} MB")
            clips_manifest.append({
                "file": clip_name,
                "speaker": speaker,
                "start": start,
                "end": end,
                "duration": round(duration_s, 1),
                "text": seg["text"],
            })
        else:
            print(f"    ✗ Extraction failed")

    # Save manifest
    manifest_path = video_clips_dir / "manifest.json"
    manifest = {
        "source": stem,
        "source_file": source_file,
        "total_speakers": len(speakers),
        "total_clips": len(clips_manifest),
        "clips": clips_manifest,
        "speaker_summary": {}
    }

    # Build per-speaker summary
    for speaker in speakers:
        speaker_clips = [c for c in clips_manifest if c["speaker"] == speaker]
        total_time = sum(c["duration"] for c in speaker_clips)
        manifest["speaker_summary"][speaker] = {
            "clip_count": len(speaker_clips),
            "total_duration": round(total_time, 1),
            "clips": [c["file"] for c in speaker_clips]
        }

    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)

    # Clean up video only if we downloaded it (not if caller provided the path)
    # The _downloaded_video variable tracks whether we own this file
    if _downloaded_video:
        video_path.unlink(missing_ok=True)

    # Report
    print(f"\n  ✓ {len(clips_manifest)} clips extracted to {video_clips_dir}")
    print(f"\n  Speaker Summary:")
    for speaker, info in manifest["speaker_summary"].items():
        print(f"    {speaker}: {info['clip_count']} clips, "
              f"{info['total_duration']:.0f}s total")

    return manifest


def main():
    WORK_DIR.mkdir(parents=True, exist_ok=True)
    CLIPS_DIR.mkdir(parents=True, exist_ok=True)

    if len(sys.argv) > 1:
        if sys.argv[1] == "--all":
            # Process all enriched transcripts
            for f in sorted(TRANSCRIPT_DIR.glob("*.enriched.json")):
                stem = f.name.replace(".enriched.json", "")
                process_transcript(stem)
        else:
            process_transcript(sys.argv[1])
    else:
        print("Usage:")
        print("  python3 scripts/extract-speaker-clips.py 'VIDEO_STEM'")
        print("  python3 scripts/extract-speaker-clips.py --all")

    print("\n=== Extraction complete ===")


if __name__ == "__main__":
    main()
