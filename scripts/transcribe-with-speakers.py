#!/usr/bin/env python3
"""
B2 Video Transcription + Speaker Diarization Pipeline
Downloads video → extracts audio → runs Whisper + pyannote → saves enriched transcript
Outputs: JSON with word-level timestamps, speaker labels, and speaker embeddings

Usage:
    python3 scripts/transcribe-with-speakers.py "Futuro MMXIX/edited"
    python3 scripts/transcribe-with-speakers.py "Futuro MMXIX/edited/HB2_OAS PARTNER 4K_ahq12.mp4"
"""

import sys
import os
import json
import subprocess
import time
from pathlib import Path

# Lazy imports for heavy libs
_pipeline = None
_whisper_model = None

HF_TOKEN = os.environ.get("HF_TOKEN")
BUCKET = "hector-ecosystem-archive-prod"
WORK_DIR = Path("/tmp/b2-transcribe")
OUTPUT_DIR = Path("/Users/hectorhlopez/projects/clean-studio/transcripts")
WHISPER_MODEL_NAME = "medium"


def _require_hf_token():
    if not HF_TOKEN:
        print("ERROR: HF_TOKEN environment variable not set.", file=sys.stderr)
        print("  export HF_TOKEN='hf_...'", file=sys.stderr)
        print("  Get token from https://huggingface.co/settings/tokens", file=sys.stderr)
        sys.exit(1)


def get_diarization_pipeline():
    _require_hf_token()
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
            print("  Using Apple GPU (MPS)")
    return _pipeline


def get_whisper_model():
    global _whisper_model
    if _whisper_model is None:
        import whisper
        print(f"  Loading Whisper {WHISPER_MODEL_NAME} model...")
        _whisper_model = whisper.load_model(WHISPER_MODEL_NAME)
    return _whisper_model


def download_from_b2(b2_path: str, local_path: Path) -> bool:
    result = subprocess.run(
        ["b2", "file", "download", f"b2://{BUCKET}/{b2_path}", str(local_path)],
        capture_output=True, text=True
    )
    return result.returncode == 0


def extract_audio(video_path: Path, audio_path: Path) -> float:
    subprocess.run(
        ["ffmpeg", "-i", str(video_path), "-vn", "-acodec", "pcm_s16le",
         "-ar", "16000", "-ac", "1", str(audio_path), "-y", "-loglevel", "error"],
        check=True
    )
    # Get duration
    result = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "csv=p=0", str(audio_path)],
        capture_output=True, text=True
    )
    return float(result.stdout.strip())


def run_diarization(audio_path: Path) -> list:
    """Run speaker diarization, return list of {start, end, speaker}"""
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

    # Extract speaker embeddings for future voice matching
    embeddings = {}
    if result.speaker_embeddings is not None:
        for i, label in enumerate(annotation.labels()):
            if i < len(result.speaker_embeddings):
                embeddings[label] = result.speaker_embeddings[i].tolist()

    return segments, embeddings, list(annotation.labels())


def run_whisper(audio_path: Path) -> dict:
    """Run Whisper transcription with word-level timestamps"""
    model = get_whisper_model()
    result = model.transcribe(
        str(audio_path),
        word_timestamps=True,
        verbose=False
    )
    return result


def assign_speakers_to_words(whisper_result: dict, diarization_segments: list) -> dict:
    """Merge Whisper word timestamps with speaker diarization labels"""
    for segment in whisper_result.get("segments", []):
        for word in segment.get("words", []):
            word_mid = (word["start"] + word["end"]) / 2
            # Find which speaker is talking at this word's midpoint
            word["speaker"] = "UNKNOWN"
            for dseg in diarization_segments:
                if dseg["start"] <= word_mid <= dseg["end"]:
                    word["speaker"] = dseg["speaker"]
                    break

        # Assign speaker to segment based on majority vote of words
        speakers = [w.get("speaker", "UNKNOWN") for w in segment.get("words", [])]
        if speakers:
            segment["speaker"] = max(set(speakers), key=speakers.count)

    return whisper_result


def generate_speaker_segments(enriched_result: dict) -> list:
    """Generate contiguous speaker segments with their text"""
    speaker_segments = []
    current_speaker = None
    current_text = []
    current_start = 0
    current_end = 0

    for segment in enriched_result.get("segments", []):
        speaker = segment.get("speaker", "UNKNOWN")
        if speaker != current_speaker:
            if current_speaker is not None:
                speaker_segments.append({
                    "speaker": current_speaker,
                    "start": current_start,
                    "end": current_end,
                    "text": " ".join(current_text).strip()
                })
            current_speaker = speaker
            current_text = [segment["text"].strip()]
            current_start = segment["start"]
            current_end = segment["end"]
        else:
            current_text.append(segment["text"].strip())
            current_end = segment["end"]

    if current_speaker is not None:
        speaker_segments.append({
            "speaker": current_speaker,
            "start": current_start,
            "end": current_end,
            "text": " ".join(current_text).strip()
        })

    return speaker_segments


def process_video(b2_path: str):
    filename = os.path.basename(b2_path)
    stem = os.path.splitext(filename)[0]

    # Skip if enriched transcript already exists
    output_file = OUTPUT_DIR / f"{stem}.enriched.json"
    if output_file.exists():
        print(f"SKIP: {filename} (enriched transcript exists)")
        return

    print(f"\n{'='*50}")
    print(f"Processing: {filename}")
    print(f"{'='*50}")

    video_path = WORK_DIR / filename
    audio_path = WORK_DIR / f"{stem}.wav"

    # Step 1: Download
    print(f"  [1/5] Downloading from B2...")
    start = time.time()
    if not download_from_b2(b2_path, video_path):
        print(f"  ✗ Download failed")
        return
    print(f"  Downloaded in {time.time()-start:.0f}s")

    # Step 2: Extract audio
    print(f"  [2/5] Extracting audio...")
    duration = extract_audio(video_path, audio_path)
    print(f"  Audio: {duration:.0f}s ({duration/60:.1f} min)")

    # Step 3: Transcribe with Whisper
    print(f"  [3/5] Transcribing with Whisper...")
    start = time.time()
    whisper_result = run_whisper(audio_path)
    whisper_time = time.time() - start
    print(f"  Transcribed in {whisper_time:.0f}s ({duration/whisper_time:.1f}x realtime)")
    print(f"  Language: {whisper_result.get('language', '?')}")

    # Step 4: Speaker diarization
    print(f"  [4/5] Running speaker diarization...")
    start = time.time()
    diar_segments, embeddings, speakers = run_diarization(audio_path)
    diar_time = time.time() - start
    print(f"  Diarized in {diar_time:.0f}s — {len(speakers)} speaker(s): {', '.join(speakers)}")

    # Step 5: Merge and save
    print(f"  [5/5] Merging transcription + speakers...")
    enriched = assign_speakers_to_words(whisper_result, diar_segments)
    speaker_segments = generate_speaker_segments(enriched)

    # Build output
    output = {
        "pipeline": "transcribe-only",
        "source_file": b2_path,
        "filename": filename,
        "duration_seconds": round(duration, 2),
        "language": whisper_result.get("language", "unknown"),
        "speakers": speakers,
        "speaker_embeddings": embeddings,
        "full_text": whisper_result.get("text", "").strip(),
        "speaker_segments": speaker_segments,
        "segments": [{
            "start": s["start"],
            "end": s["end"],
            "text": s["text"].strip(),
            "speaker": s.get("speaker", "UNKNOWN"),
            "words": [{
                "word": w["word"].strip(),
                "start": w["start"],
                "end": w["end"],
                "confidence": round(w.get("probability", 0), 3),
                "speaker": w.get("speaker", "UNKNOWN")
            } for w in s.get("words", [])]
        } for s in enriched.get("segments", [])]
    }

    # Save enriched JSON
    with open(output_file, "w") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    # Save SRT with speaker labels
    srt_path = OUTPUT_DIR / f"{stem}.speakers.srt"
    with open(srt_path, "w") as f:
        for i, seg in enumerate(speaker_segments, 1):
            start_time = format_srt_time(seg["start"])
            end_time = format_srt_time(seg["end"])
            f.write(f"{i}\n{start_time} --> {end_time}\n[{seg['speaker']}] {seg['text']}\n\n")

    # Clean up
    video_path.unlink(missing_ok=True)
    audio_path.unlink(missing_ok=True)

    # Report
    total_words = sum(len(s.get("words", [])) for s in output["segments"])
    print(f"  ✓ Done: {total_words} words, {len(speakers)} speakers")
    print(f"  Files: {stem}.enriched.json, {stem}.speakers.srt")

    # Print speaker summary
    for seg in speaker_segments:
        preview = seg["text"][:80] + "..." if len(seg["text"]) > 80 else seg["text"]
        print(f"    [{seg['speaker']}] {seg['start']:.0f}s-{seg['end']:.0f}s: {preview}")


def format_srt_time(seconds: float) -> str:
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    ms = int((seconds % 1) * 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def list_videos(folder: str) -> list:
    """List video files in B2 folder"""
    result = subprocess.run(
        ["b2", "ls", "--recursive", f"b2://{BUCKET}/{folder}/"],
        capture_output=True, text=True
    )
    videos = []
    for line in result.stdout.strip().split("\n"):
        if line and any(line.lower().endswith(ext) for ext in [".mp4", ".mov", ".mkv", ".webm", ".avi"]):
            videos.append(line.strip())
    return videos


def main():
    WORK_DIR.mkdir(parents=True, exist_ok=True)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    target = sys.argv[1] if len(sys.argv) > 1 else "Futuro MMXIX/edited"

    # Check if target is a single file or folder
    if any(target.lower().endswith(ext) for ext in [".mp4", ".mov", ".mkv", ".webm", ".avi"]):
        videos = [target]
    else:
        print(f"Listing videos in: {target}")
        videos = list_videos(target)

    print(f"Found {len(videos)} video(s) to process")
    print(f"Output: {OUTPUT_DIR}")
    print()

    for video in videos:
        try:
            process_video(video)
        except Exception as e:
            print(f"  ✗ Error processing {video}: {e}")
            # Clean up on error
            for f in WORK_DIR.iterdir():
                f.unlink(missing_ok=True)

    print("\n=== Pipeline complete ===")


if __name__ == "__main__":
    main()
