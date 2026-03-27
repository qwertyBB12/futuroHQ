#!/usr/bin/env python3
"""
Pipeline B — Raw Video Processing
Downloads raw video → LUT color grade → Compress to web 4K →
Transcribe → Speaker diarization → Upload processed to edited/ → Create metadata

Usage:
    python3 scripts/process-raw-video.py "Futuro MMXXV/raw/card-1/Day 1/C3460.MP4"
    python3 scripts/process-raw-video.py "Futuro MMXXV/raw/card-1/Day 1"  # folder
    python3 scripts/process-raw-video.py "path" --camera canon-r5-clog3 --anamorphic
    python3 scripts/process-raw-video.py "path" --skip-transcribe
"""

import argparse
import sys
import os
import json
import subprocess
import time
from pathlib import Path

HF_TOKEN = "hf_REDACTED_OLD_TOKEN"
BUCKET = "hector-ecosystem-archive-prod"
WORK_DIR = Path("/tmp/b2-raw-process")
OUTPUT_DIR = Path("/Users/hectorhlopez/projects/clean-studio/transcripts")
LUT_DIR = Path("/Users/hectorhlopez/projects/clean-studio/luts")
WHISPER_MODEL_NAME = "medium"

# Camera → LUT mapping
CAMERA_LUTS = {
    "sony-a6700-slog3": "sony-a6700-slog3.cube",
    "canon-r5-clog3": "canon-r5-clog3.cube",
    "gopro-hero7-standard": "gopro-hero7-standard.cube",
    "gopro-hero7-protune": "gopro-hero7-protune.cube",
    "iphone-12promax": "iphone-12promax-standard.cube",
    "rec709": None,  # Screen recordings — no LUT needed
    "default": "sony-a6700-slog3.cube",  # default for Futuro MMXXV
}

# Anamorphic lens squeeze factor (Sirui 50mm = 1.33x)
ANAMORPHIC_SQUEEZE = 1.33

_pipeline = None
_whisper_model = None


def parse_args(argv=None):
    parser = argparse.ArgumentParser(description="Pipeline B - Raw Video Processing")
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
        help="Apply 1.33x anamorphic desqueeze (Sirui 50mm lens footage)"
    )
    parser.add_argument(
        "--skip-transcribe",
        action="store_true",
        help="Encode only, skip Whisper + pyannote steps"
    )
    return parser.parse_args(argv)


def get_diarization_pipeline():
    global _pipeline
    if _pipeline is None:
        import torch
        from pyannote.audio import Pipeline
        print("  Loading speaker diarization model...")
        _pipeline = Pipeline.from_pretrained(
            "pyannote/speaker-diarization-3.1", token=HF_TOKEN
        )
        if torch.backends.mps.is_available():
            _pipeline.to(torch.device("mps"))
    return _pipeline


def get_whisper_model():
    global _whisper_model
    if _whisper_model is None:
        import whisper
        print(f"  Loading Whisper {WHISPER_MODEL_NAME}...")
        _whisper_model = whisper.load_model(WHISPER_MODEL_NAME)
    return _whisper_model


def download_from_b2(b2_path: str, local_path: Path) -> bool:
    result = subprocess.run(
        ["b2", "file", "download", f"b2://{BUCKET}/{b2_path}", str(local_path)],
        capture_output=True, text=True
    )
    return result.returncode == 0


def upload_to_b2(local_path: Path, b2_path: str) -> bool:
    result = subprocess.run(
        ["b2", "file", "upload", f"b2://{BUCKET}", str(local_path), b2_path],
        capture_output=True, text=True
    )
    return result.returncode == 0


def get_video_info(video_path: Path) -> dict:
    """Get video metadata via ffprobe"""
    result = subprocess.run(
        ["ffprobe", "-v", "quiet", "-print_format", "json", "-show_streams", "-show_format",
         str(video_path)],
        capture_output=True, text=True
    )
    return json.loads(result.stdout) if result.returncode == 0 else {}


def build_ffmpeg_command(input_path: Path, output_path: Path, lut_path: Path,
                         anamorphic: bool = False) -> list:
    """Build FFmpeg command for full processing pipeline"""

    # Video filters
    vf_filters = []

    # Anamorphic desqueeze (1.33x horizontal) — only when --anamorphic flag is passed
    if anamorphic:
        vf_filters.append(f"scale=iw*{ANAMORPHIC_SQUEEZE}:ih")

    # Apply LUT for color grading (gracefully skip if file is missing)
    if lut_path.exists():
        vf_filters.append(f"lut3d='{lut_path}'")
    else:
        print(f"WARNING: LUT not found for {lut_path.name}, processing without color grade")

    # Slight exposure reduction + vignette for cinematic look
    vf_filters.append("eq=brightness=-0.05:gamma=0.95")
    vf_filters.append("vignette=angle=PI/5")

    vf_string = ",".join(vf_filters) if vf_filters else None

    # Audio: passthrough (no processing) — DaVinci Fairlight handles audio separately
    cmd = [
        "ffmpeg", "-i", str(input_path),
        # Video encoding — CRF only, no bitrate override
        "-c:v", "libx264",
        "-preset", "slow",          # Better compression (slower but worth it)
        "-crf", "18",               # High quality constant rate factor
        "-pix_fmt", "yuv420p",      # Web compatible
        "-movflags", "+faststart",  # Web streaming optimization
    ]

    if vf_string:
        cmd.extend(["-vf", vf_string])

    cmd.extend([
        # Audio: copy original stream untouched
        "-c:a", "copy",
        # Output
        "-y", str(output_path)
    ])

    return cmd


def run_transcription(audio_path: Path) -> dict:
    model = get_whisper_model()
    return model.transcribe(str(audio_path), word_timestamps=True, verbose=False)


def run_diarization(audio_path: Path) -> tuple:
    pipeline = get_diarization_pipeline()
    result = pipeline(str(audio_path))
    annotation = result.speaker_diarization

    segments = []
    for turn, _, speaker in annotation.itertracks(yield_label=True):
        segments.append({
            "start": round(turn.start, 2),
            "end": round(turn.end, 2),
            "speaker": speaker
        })

    embeddings = {}
    if result.speaker_embeddings is not None:
        for i, label in enumerate(annotation.labels()):
            if i < len(result.speaker_embeddings):
                embeddings[label] = result.speaker_embeddings[i].tolist()

    return segments, embeddings, list(annotation.labels())


def assign_speakers(whisper_result: dict, diar_segments: list) -> dict:
    for segment in whisper_result.get("segments", []):
        for word in segment.get("words", []):
            word_mid = (word["start"] + word["end"]) / 2
            word["speaker"] = "UNKNOWN"
            for dseg in diar_segments:
                if dseg["start"] <= word_mid <= dseg["end"]:
                    word["speaker"] = dseg["speaker"]
                    break
        speakers = [w.get("speaker", "UNKNOWN") for w in segment.get("words", [])]
        if speakers:
            segment["speaker"] = max(set(speakers), key=speakers.count)
    return whisper_result


def format_srt_time(seconds: float) -> str:
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    ms = int((seconds % 1) * 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def process_video(b2_path: str, camera: str = "sony-a6700-slog3",
                  anamorphic: bool = False, skip_transcribe: bool = False):
    filename = os.path.basename(b2_path)
    stem = os.path.splitext(filename)[0]

    output_file = OUTPUT_DIR / f"{stem}.enriched.json"
    if output_file.exists():
        print(f"SKIP: {filename} (already processed)")
        return

    print(f"\n{'='*60}")
    print(f"RAW PIPELINE: {filename}")
    print(f"{'='*60}")

    video_path = WORK_DIR / filename
    processed_path = WORK_DIR / f"{stem}_processed.mp4"
    audio_path = WORK_DIR / f"{stem}.wav"

    # Resolve LUT from camera profile
    lut_file = CAMERA_LUTS.get(camera, CAMERA_LUTS.get("default"))
    lut_path = LUT_DIR / lut_file if lut_file else LUT_DIR / "nonexistent.cube"

    # Step 1: Download
    print(f"  [1/7] Downloading from B2...")
    t = time.time()
    if not download_from_b2(b2_path, video_path):
        print(f"  ✗ Download failed")
        return
    print(f"  Downloaded in {time.time()-t:.0f}s")

    # Step 2: Analyze
    print(f"  [2/7] Analyzing video...")
    info = get_video_info(video_path)
    if anamorphic:
        print(f"  ⚠ Anamorphic mode enabled — will desqueeze 1.33x")
    for stream in info.get("streams", []):
        if stream.get("codec_type") == "video":
            print(f"  Video: {stream.get('width')}x{stream.get('height')} "
                  f"{stream.get('codec_name')} {stream.get('r_frame_rate')} fps")
        elif stream.get("codec_type") == "audio":
            print(f"  Audio: {stream.get('sample_rate')}Hz {stream.get('channels')}ch "
                  f"{stream.get('codec_name')}")

    # Step 3: Process (LUT + compress)
    print(f"  [3/7] Processing: LUT + compress...")
    print(f"  LUT: {lut_path.name}" if lut_path.exists() else "  LUT: none (file not found)")
    t = time.time()
    cmd = build_ffmpeg_command(video_path, processed_path, lut_path, anamorphic)
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"  ✗ FFmpeg failed: {result.stderr[-200:]}")
        video_path.unlink(missing_ok=True)
        return
    proc_time = time.time() - t
    orig_size = video_path.stat().st_size / (1024**2)
    proc_size = processed_path.stat().st_size / (1024**2)
    print(f"  Processed in {proc_time:.0f}s — {orig_size:.0f}MB → {proc_size:.0f}MB "
          f"({proc_size/orig_size*100:.0f}%)")

    if skip_transcribe:
        # Upload processed video and skip transcription steps
        edited_b2_path = b2_path.replace("/raw/", "/edited/").replace(filename, f"{stem}_processed.mp4")
        print(f"  [4/7] Uploading to B2 (--skip-transcribe): {edited_b2_path}")
        t = time.time()
        if upload_to_b2(processed_path, edited_b2_path):
            print(f"  Uploaded in {time.time()-t:.0f}s")
        else:
            print(f"  ✗ Upload failed — processed file saved locally")
        video_path.unlink(missing_ok=True)
        processed_path.unlink(missing_ok=True)
        print(f"\n  ✓ Complete (encode only, transcription skipped)")
        return

    # Step 4: Extract audio for transcription
    print(f"  [4/7] Extracting audio for transcription...")
    subprocess.run(
        ["ffmpeg", "-i", str(processed_path), "-vn", "-acodec", "pcm_s16le",
         "-ar", "16000", "-ac", "1", str(audio_path), "-y", "-loglevel", "error"],
        check=True
    )
    duration_result = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "csv=p=0", str(audio_path)],
        capture_output=True, text=True
    )
    duration = float(duration_result.stdout.strip())
    print(f"  Duration: {duration:.0f}s ({duration/60:.1f} min)")

    # Step 5: Transcribe
    print(f"  [5/7] Transcribing with Whisper...")
    t = time.time()
    whisper_result = run_transcription(audio_path)
    print(f"  Transcribed in {time.time()-t:.0f}s — language: {whisper_result.get('language')}")

    # Step 6: Speaker diarization
    print(f"  [6/7] Speaker diarization...")
    t = time.time()
    diar_segments, embeddings, speakers = run_diarization(audio_path)
    print(f"  Diarized in {time.time()-t:.0f}s — {len(speakers)} speaker(s)")

    # Merge
    enriched = assign_speakers(whisper_result, diar_segments)

    # Step 7: Upload processed video to edited/
    # Derive edited path from raw path
    edited_b2_path = b2_path.replace("/raw/", "/edited/").replace(filename, f"{stem}_processed.mp4")
    print(f"  [7/7] Uploading to B2: {edited_b2_path}")
    t = time.time()
    if upload_to_b2(processed_path, edited_b2_path):
        print(f"  Uploaded in {time.time()-t:.0f}s")
    else:
        print(f"  ✗ Upload failed — processed file saved locally")

    # Save enriched transcript
    speaker_segments = []
    current_speaker = None
    current_text, current_start, current_end = [], 0, 0
    for seg in enriched.get("segments", []):
        sp = seg.get("speaker", "UNKNOWN")
        if sp != current_speaker:
            if current_speaker:
                speaker_segments.append({
                    "speaker": current_speaker, "start": current_start,
                    "end": current_end, "text": " ".join(current_text).strip()
                })
            current_speaker, current_text = sp, [seg["text"].strip()]
            current_start, current_end = seg["start"], seg["end"]
        else:
            current_text.append(seg["text"].strip())
            current_end = seg["end"]
    if current_speaker:
        speaker_segments.append({
            "speaker": current_speaker, "start": current_start,
            "end": current_end, "text": " ".join(current_text).strip()
        })

    output = {
        "pipeline": "raw",
        "source_file": b2_path,
        "processed_file": edited_b2_path,
        "filename": filename,
        "duration_seconds": round(duration, 2),
        "language": whisper_result.get("language", "unknown"),
        "speakers": speakers,
        "speaker_embeddings": embeddings,
        "full_text": whisper_result.get("text", "").strip(),
        "processing": {
            "lut": lut_path.name if lut_path.exists() else None,
            "anamorphic_desqueeze": anamorphic,
            "video_codec": "H.264",
            "original_size_mb": round(orig_size),
            "processed_size_mb": round(proc_size),
        },
        "speaker_segments": speaker_segments,
        "segments": [{
            "start": s["start"], "end": s["end"],
            "text": s["text"].strip(),
            "speaker": s.get("speaker", "UNKNOWN"),
            "words": [{
                "word": w["word"].strip(), "start": w["start"], "end": w["end"],
                "confidence": round(w.get("probability", 0), 3),
                "speaker": w.get("speaker", "UNKNOWN")
            } for w in s.get("words", [])]
        } for s in enriched.get("segments", [])]
    }

    with open(output_file, "w") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    srt_path = OUTPUT_DIR / f"{stem}.speakers.srt"
    with open(srt_path, "w") as f:
        for i, seg in enumerate(speaker_segments, 1):
            f.write(f"{i}\n{format_srt_time(seg['start'])} --> {format_srt_time(seg['end'])}\n"
                    f"[{seg['speaker']}] {seg['text']}\n\n")

    # Clean up
    video_path.unlink(missing_ok=True)
    processed_path.unlink(missing_ok=True)
    audio_path.unlink(missing_ok=True)

    total_words = sum(len(s.get("words", [])) for s in output["segments"])
    print(f"\n  ✓ Complete: {total_words} words, {len(speakers)} speakers")
    print(f"  {orig_size:.0f}MB → {proc_size:.0f}MB ({proc_size/orig_size*100:.0f}%)")


def list_videos(folder: str) -> list:
    result = subprocess.run(
        ["b2", "ls", "--recursive", f"b2://{BUCKET}/{folder}/"],
        capture_output=True, text=True
    )
    return [l.strip() for l in result.stdout.strip().split("\n")
            if l.strip() and any(l.lower().endswith(e) for e in [".mp4", ".mov", ".mkv", ".webm", ".avi"])]


def main():
    args = parse_args()

    WORK_DIR.mkdir(parents=True, exist_ok=True)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    target = args.b2_path

    if any(target.lower().endswith(ext) for ext in [".mp4", ".mov", ".mkv", ".webm", ".avi"]):
        videos = [target]
    else:
        print(f"Listing videos in: {target}")
        videos = list_videos(target)

    print(f"Found {len(videos)} video(s)")
    lut_file = CAMERA_LUTS.get(args.camera, CAMERA_LUTS.get("default"))
    print(f"Camera: {args.camera} → LUT: {lut_file or 'none'}")
    if args.anamorphic:
        print(f"Anamorphic: enabled (1.33x desqueeze)")
    if args.skip_transcribe:
        print(f"Transcription: skipped")
    print()

    for video in videos:
        try:
            process_video(video, camera=args.camera, anamorphic=args.anamorphic,
                          skip_transcribe=args.skip_transcribe)
        except Exception as e:
            print(f"  ✗ Error: {e}")
            for f in WORK_DIR.iterdir():
                f.unlink(missing_ok=True)

    print("\n=== Pipeline B complete ===")


if __name__ == "__main__":
    main()
