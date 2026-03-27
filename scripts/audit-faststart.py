#!/usr/bin/env python3
"""
audit-faststart.py — Check whether MP4 files have the MOOV atom before MDAT.

Progressive streaming ("faststart") requires the MOOV atom to appear at the
start of the file so browsers can begin playback without downloading the
entire file. This script detects atom order by binary-parsing box headers —
ffprobe does not expose atom order in its output.

Usage:
    python3 scripts/audit-faststart.py /path/to/directory
    python3 scripts/audit-faststart.py --file /path/to/single.mp4

Exit codes:
    0 — All scanned files have faststart (MOOV before MDAT)
    1 — One or more files lack faststart, or an error occurred
"""

import argparse
import struct
import sys
from pathlib import Path


# ---------------------------------------------------------------------------
# Core detection
# ---------------------------------------------------------------------------

def has_faststart(file_path: Path) -> bool:
    """
    Return True if the MP4 MOOV atom appears before the MDAT atom.

    Reads only box headers (8 bytes each), seeking over box content.
    Handles:
    - size == 0: box extends to EOF — treated as non-faststart
    - size == 1: 64-bit extended size in next 8 bytes
    - size < 8 (and not 0 or 1): malformed — return False
    - IOError / struct.error: return False

    Args:
        file_path: Path to the MP4 file to check.

    Returns:
        True if MOOV atom is found before MDAT atom, False otherwise.
    """
    try:
        with open(file_path, "rb") as f:
            while True:
                header = f.read(8)
                if len(header) < 8:
                    # EOF or truncated file — no MOOV found before here
                    return False

                size = struct.unpack(">I", header[:4])[0]
                box_type = header[4:8].decode("ascii", errors="replace")

                if box_type == "moov":
                    return True
                if box_type == "mdat":
                    return False

                if size == 0:
                    # Box extends to EOF — no MOOV found
                    return False

                if size == 1:
                    # 64-bit extended size: next 8 bytes hold actual size
                    ext = f.read(8)
                    if len(ext) < 8:
                        return False
                    actual_size = struct.unpack(">Q", ext)[0]
                    # Seek past box content (total header is 16 bytes: 4+4+8)
                    f.seek(actual_size - 16, 1)
                else:
                    if size < 8:
                        # Malformed box — stop parsing
                        return False
                    # Seek past box content (header already read: 8 bytes)
                    f.seek(size - 8, 1)

    except (IOError, struct.error, OSError):
        return False


# ---------------------------------------------------------------------------
# Directory scanner
# ---------------------------------------------------------------------------

def audit_directory(dir_path: Path) -> dict:
    """
    Scan all .mp4 files in a directory tree for faststart compliance.

    Args:
        dir_path: Root directory to scan recursively.

    Returns:
        Dict with keys:
        - "pass": list of Path objects that have faststart
        - "fail": list of Path objects that lack faststart
        - "error": list of Path objects that could not be read
    """
    results = {"pass": [], "fail": [], "error": []}

    mp4_files = sorted(dir_path.rglob("*.mp4"))
    if not mp4_files:
        mp4_files = sorted(dir_path.rglob("*.MP4"))

    for mp4_file in mp4_files:
        try:
            if has_faststart(mp4_file):
                results["pass"].append(mp4_file)
            else:
                results["fail"].append(mp4_file)
        except Exception:
            results["error"].append(mp4_file)

    return results


# ---------------------------------------------------------------------------
# CLI output helpers
# ---------------------------------------------------------------------------

def _format_size(path: Path) -> str:
    """Return human-readable file size, or '?' if unreadable."""
    try:
        size = path.stat().st_size
        for unit in ("B", "KB", "MB", "GB"):
            if size < 1024:
                return f"{size:.1f} {unit}"
            size /= 1024
        return f"{size:.1f} TB"
    except OSError:
        return "?"


def _print_table(results: dict) -> None:
    """Print a formatted results table to stdout."""
    all_files = (
        [(p, "PASS") for p in results["pass"]]
        + [(p, "FAIL") for p in results["fail"]]
        + [(p, "ERROR") for p in results["error"]]
    )

    if not all_files:
        print("No MP4 files found.")
        return

    # Header
    print(f"\n{'File':<60} {'Status':<8} {'Size'}")
    print("-" * 80)

    for path, status in sorted(all_files, key=lambda x: x[0]):
        name = str(path)
        size_str = _format_size(path)
        print(f"{name:<60} {status:<8} {size_str}")

    # Summary
    total = len(all_files)
    n_pass = len(results["pass"])
    n_fail = len(results["fail"])
    n_err = len(results["error"])
    print("-" * 80)
    print(f"Total: {total}  PASS: {n_pass}  FAIL: {n_fail}  ERROR: {n_err}")


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main() -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Audit MP4 files for faststart (MOOV atom before MDAT). "
            "Files without faststart buffer slowly in browsers."
        ),
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=(
            "Examples:\n"
            "  python3 scripts/audit-faststart.py /path/to/directory\n"
            "  python3 scripts/audit-faststart.py --file /path/to/video.mp4\n"
        ),
    )

    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument(
        "directory",
        nargs="?",
        type=Path,
        help="Directory to scan recursively for MP4 files",
    )
    group.add_argument(
        "--file",
        type=Path,
        metavar="PATH",
        help="Single MP4 file to check",
    )

    args = parser.parse_args()

    if args.file:
        # Single-file mode
        path = args.file
        if not path.exists():
            print(f"ERROR: File not found: {path}", file=sys.stderr)
            return 1

        result = has_faststart(path)
        status = "PASS" if result else "FAIL"
        size_str = _format_size(path)
        print(f"{path}  {status}  {size_str}")
        return 0 if result else 1

    else:
        # Directory mode
        dir_path = args.directory
        if not dir_path or not dir_path.is_dir():
            print(f"ERROR: Not a directory: {dir_path}", file=sys.stderr)
            return 1

        results = audit_directory(dir_path)
        _print_table(results)

        # Exit 1 if any failures or errors
        if results["fail"] or results["error"]:
            return 1
        return 0


if __name__ == "__main__":
    sys.exit(main())
