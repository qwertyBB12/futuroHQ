#!/usr/bin/env python3
"""
Extract dialogue clips with conversational awareness.
Groups question-answer exchanges into single clips, preserving reactions and emotional moments.

Logic:
1. Identify the "main speaker" (most talk time — usually the interviewee/host)
2. Group segments into dialogues: non-main-speaker segment + main-speaker response
3. Include reaction buffers (laughter, applause, pauses) between exchanges
4. Tag all speakers in each dialogue clip
5. Only cut at natural conversation boundaries

Usage:
    python3 scripts/extract-dialogue-clips.py "HB2_OAS PARTNER 4K_ahq12"
    python3 scripts/extract-dialogue-clips.py --all
"""

import sys
import os
import json
import subprocess
from pathlib import Path

BUCKET = "hector-ecosystem-archive-prod"
TRANSCRIPT_DIR = Path("/Users/hectorhlopez/projects/clean-studio/transcripts")
CLIPS_DIR = Path("/Users/hectorhlopez/projects/clean-studio/clips-dialogue")
WORK_DIR = Path("/tmp/b2-clip-extract")
CDN_BASE = "https://benext.b-cdn.net"

# Clip parameters
LEAD_BUFFER = 2.0       # seconds before first word of clip
TRAIL_BUFFER = 4.0      # seconds after last word (captures reactions)
MIN_CLIP_DURATION = 8   # minimum clip length in seconds
MAX_CLIP_DURATION = 300  # maximum clip length (5 minutes)
SILENCE_GAP = 3.0       # seconds of silence between speakers to consider "new topic"


def download_video(b2_path: str, local_path: Path) -> bool:
    local_path.parent.mkdir(parents=True, exist_ok=True)
    result = subprocess.run(
        ["b2", "file", "download", f"b2://{BUCKET}/{b2_path}", str(local_path)],
        capture_output=True, text=True
    )
    return result.returncode == 0


def extract_clip(video_path: Path, output_path: Path, start: float, end: float) -> bool:
    """Extract clip with lead/trail buffers using stream copy, then apply faststart.

    Two-step approach because -ss (input seeking) + -c copy + -movflags +faststart
    in a single pass does not reliably relocate the moov atom.
    """
    # Clamp start to 0
    actual_start = max(0, start - LEAD_BUFFER)
    actual_end = end + TRAIL_BUFFER
    duration = actual_end - actual_start
    temp_path = output_path.with_suffix(".tmp.mp4")

    # Step 1: Extract clip with stream copy (no faststart yet)
    result = subprocess.run([
        "ffmpeg", "-ss", str(actual_start), "-i", str(video_path),
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


def identify_main_speaker(speaker_segments: list, speakers: list) -> str:
    """Identify the main speaker (most total talk time)"""
    talk_time = {}
    for seg in speaker_segments:
        sp = seg["speaker"]
        talk_time[sp] = talk_time.get(sp, 0) + (seg["end"] - seg["start"])
    return max(talk_time, key=talk_time.get) if talk_time else speakers[0]


def group_into_dialogues(speaker_segments: list, main_speaker: str) -> list:
    """
    Group speaker segments into dialogue exchanges.

    A dialogue is: one or more non-main-speaker segments (question/intro)
    followed by the main speaker's response, including any brief interjections.

    A new dialogue starts when:
    - A different non-main-speaker begins talking (new questioner)
    - There's a long silence gap between exchanges
    - The clip would exceed MAX_CLIP_DURATION
    """
    if not speaker_segments:
        return []

    dialogues = []
    current_dialogue = {
        "segments": [],
        "speakers": set(),
        "start": None,
        "end": None,
    }

    def flush_dialogue():
        if current_dialogue["segments"] and current_dialogue["start"] is not None:
            duration = current_dialogue["end"] - current_dialogue["start"]
            if duration >= MIN_CLIP_DURATION:
                dialogues.append({
                    "start": current_dialogue["start"],
                    "end": current_dialogue["end"],
                    "speakers": list(current_dialogue["speakers"]),
                    "segments": list(current_dialogue["segments"]),
                    "text": " ".join(s["text"] for s in current_dialogue["segments"]).strip(),
                    "duration": round(duration, 1),
                })

    current_questioner = None
    in_response = False

    for i, seg in enumerate(speaker_segments):
        speaker = seg["speaker"]
        if speaker == "UNKNOWN":
            # Include unknown segments (reactions, crowd) in current dialogue
            if current_dialogue["start"] is not None:
                current_dialogue["segments"].append(seg)
                current_dialogue["end"] = seg["end"]
            continue

        # Check for long gap from previous segment
        if current_dialogue["end"] is not None:
            gap = seg["start"] - current_dialogue["end"]
            if gap > SILENCE_GAP and in_response:
                # Long pause after a response = natural break
                flush_dialogue()
                current_dialogue = {"segments": [], "speakers": set(), "start": None, "end": None}
                current_questioner = None
                in_response = False

        # Check max duration
        if current_dialogue["start"] is not None:
            projected_duration = seg["end"] - current_dialogue["start"]
            if projected_duration > MAX_CLIP_DURATION and in_response:
                flush_dialogue()
                current_dialogue = {"segments": [], "speakers": set(), "start": None, "end": None}
                current_questioner = None
                in_response = False

        if speaker != main_speaker:
            # Non-main speaker (questioner)
            if in_response and speaker != current_questioner:
                # New questioner after a response = new dialogue
                flush_dialogue()
                current_dialogue = {"segments": [], "speakers": set(), "start": None, "end": None}
                in_response = False

            current_questioner = speaker
            in_response = False

            if current_dialogue["start"] is None:
                current_dialogue["start"] = seg["start"]

            current_dialogue["segments"].append(seg)
            current_dialogue["speakers"].add(speaker)
            current_dialogue["end"] = seg["end"]

        else:
            # Main speaker (responder)
            if current_dialogue["start"] is None:
                # Main speaker starts without a question (opening remarks)
                current_dialogue["start"] = seg["start"]

            current_dialogue["segments"].append(seg)
            current_dialogue["speakers"].add(speaker)
            current_dialogue["end"] = seg["end"]
            in_response = True

    # Flush last dialogue
    flush_dialogue()

    return dialogues


def process_transcript(stem: str):
    enriched_path = TRANSCRIPT_DIR / f"{stem}.enriched.json"
    if not enriched_path.exists():
        print(f"No enriched transcript: {stem}")
        return

    with open(enriched_path) as f:
        data = json.load(f)

    speakers = data.get("speakers", [])
    speaker_segments = data.get("speaker_segments", [])
    source_file = data.get("source_file", "")
    duration = data.get("duration_seconds", 0)

    if len(speakers) < 2:
        print(f"SKIP: {stem} (single speaker)")
        return

    print(f"\n{'='*60}")
    print(f"DIALOGUE EXTRACTION: {stem}")
    print(f"{'='*60}")
    print(f"Source: {source_file}")
    print(f"Duration: {duration/60:.1f} min, {len(speakers)} speakers")

    # Identify main speaker
    main_speaker = identify_main_speaker(speaker_segments, speakers)
    print(f"Main speaker: {main_speaker}")

    # Group into dialogues
    dialogues = group_into_dialogues(speaker_segments, main_speaker)
    print(f"Dialogues found: {len(dialogues)}")

    if not dialogues:
        print("No dialogues to extract.")
        return

    # Create output directory
    video_clips_dir = CLIPS_DIR / stem
    video_clips_dir.mkdir(parents=True, exist_ok=True)

    # Download video
    video_path = WORK_DIR / os.path.basename(source_file)
    if not video_path.exists():
        print(f"\n  Downloading video from B2...")
        if not download_video(source_file, video_path):
            print("  ✗ Download failed")
            return
        print("  ✓ Downloaded")

    # Extract dialogue clips
    clips_manifest = []
    for i, dialogue in enumerate(dialogues):
        speakers_str = "+".join(sorted(dialogue["speakers"]))
        clip_name = f"dialogue_{i+1:02d}_{speakers_str}_{format_time(dialogue['start'])}.mp4"
        clip_path = video_clips_dir / clip_name

        text_preview = dialogue["text"][:100] + "..." if len(dialogue["text"]) > 100 else dialogue["text"]
        print(f"\n  [{i+1}/{len(dialogues)}] {speakers_str} "
              f"({format_time(dialogue['start'])}-{format_time(dialogue['end'])}, "
              f"{dialogue['duration']:.0f}s)")
        print(f"    \"{text_preview}\"")

        if clip_path.exists():
            print(f"    SKIP (exists)")
        else:
            if extract_clip(video_path, clip_path, dialogue["start"], dialogue["end"]):
                size_mb = clip_path.stat().st_size / (1024**2)
                print(f"    ✓ {size_mb:.1f} MB")
            else:
                print(f"    ✗ Extraction failed")
                continue

        clips_manifest.append({
            "file": clip_name,
            "dialogue_number": i + 1,
            "speakers": dialogue["speakers"],
            "start": dialogue["start"],
            "end": dialogue["end"],
            "duration": dialogue["duration"],
            "text": dialogue["text"],
            "segment_count": len(dialogue["segments"]),
        })

    # Clean up video
    video_path.unlink(missing_ok=True)

    # Save manifest
    manifest = {
        "source": stem,
        "source_file": source_file,
        "main_speaker": main_speaker,
        "total_speakers": len(speakers),
        "total_dialogues": len(clips_manifest),
        "clips": clips_manifest,
    }
    with open(video_clips_dir / "manifest.json", "w") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)

    print(f"\n  ✓ {len(clips_manifest)} dialogue clips extracted")
    print(f"  Output: {video_clips_dir}")


def main():
    WORK_DIR.mkdir(parents=True, exist_ok=True)
    CLIPS_DIR.mkdir(parents=True, exist_ok=True)

    if len(sys.argv) > 1:
        if sys.argv[1] == "--all":
            for f in sorted(TRANSCRIPT_DIR.glob("*.enriched.json")):
                stem = f.name.replace(".enriched.json", "")
                process_transcript(stem)
        else:
            process_transcript(sys.argv[1])
    else:
        print("Usage:")
        print("  python3 scripts/extract-dialogue-clips.py 'VIDEO_STEM'")
        print("  python3 scripts/extract-dialogue-clips.py --all")

    print("\n=== Dialogue extraction complete ===")


if __name__ == "__main__":
    main()
