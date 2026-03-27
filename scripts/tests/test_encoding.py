"""
Tests for encoding-related scripts: audit-faststart.py and related utilities.
Uses synthetic MP4 byte sequences — no real video files needed.
"""

import importlib.util
import struct
import sys
from pathlib import Path

import pytest

# ---------------------------------------------------------------------------
# Import has_faststart from audit-faststart.py via importlib
# (the script is not a package, so we load it dynamically)
# ---------------------------------------------------------------------------

def _load_audit_faststart():
    script_path = Path(__file__).parent.parent / "audit-faststart.py"
    spec = importlib.util.spec_from_file_location("audit_faststart", script_path)
    audit_mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(audit_mod)
    return audit_mod


# Lazy-load so import errors surface as test failures, not collection failures
_audit_mod = None


def _get_has_faststart():
    global _audit_mod
    if _audit_mod is None:
        _audit_mod = _load_audit_faststart()
    return _audit_mod.has_faststart


# ---------------------------------------------------------------------------
# Helpers — build synthetic MP4 box sequences
# ---------------------------------------------------------------------------

def _make_box(box_type: str, size: int) -> bytes:
    """Create an MP4 box header with zero-padded content."""
    assert size >= 8, "box size must be at least 8 (header only)"
    header = struct.pack(">I", size) + box_type.encode("ascii")
    padding = b"\x00" * (size - 8)
    return header + padding


def _make_extended_box(box_type: str, actual_size: int) -> bytes:
    """Create an MP4 box with 64-bit extended size (size field == 1)."""
    # Layout: [4-byte size=1][4-byte type][8-byte actual_size][padding]
    assert actual_size >= 16, "extended box actual_size must be at least 16"
    header = struct.pack(">I", 1) + box_type.encode("ascii") + struct.pack(">Q", actual_size)
    padding = b"\x00" * (actual_size - 16)
    return header + padding


# ---------------------------------------------------------------------------
# TestFaststart — unit tests for has_faststart()
# ---------------------------------------------------------------------------

class TestFaststart:
    def test_faststart_moov_first(self, tmp_path):
        """MOOV before MDAT → faststart, returns True."""
        has_faststart = _get_has_faststart()
        f = tmp_path / "moov_first.mp4"
        f.write_bytes(
            _make_box("ftyp", 16) + _make_box("moov", 24) + _make_box("mdat", 32)
        )
        assert has_faststart(f) is True

    def test_faststart_mdat_first(self, tmp_path):
        """MDAT before MOOV → not faststart, returns False."""
        has_faststart = _get_has_faststart()
        f = tmp_path / "mdat_first.mp4"
        f.write_bytes(
            _make_box("ftyp", 16) + _make_box("mdat", 32) + _make_box("moov", 24)
        )
        assert has_faststart(f) is False

    def test_faststart_extended_size(self, tmp_path):
        """Extended size (size==1) box is skipped correctly; MOOV found after it → True."""
        has_faststart = _get_has_faststart()
        f = tmp_path / "extended.mp4"
        # ftyp(16) + free with extended size(32) + moov(24) + mdat(32)
        f.write_bytes(
            _make_box("ftyp", 16)
            + _make_extended_box("free", 32)
            + _make_box("moov", 24)
            + _make_box("mdat", 32)
        )
        assert has_faststart(f) is True

    def test_faststart_empty_file(self, tmp_path):
        """Empty file → returns False (no atoms found)."""
        has_faststart = _get_has_faststart()
        f = tmp_path / "empty.mp4"
        f.write_bytes(b"")
        assert has_faststart(f) is False

    def test_faststart_malformed(self, tmp_path):
        """File with only 4 bytes → returns False (incomplete header)."""
        has_faststart = _get_has_faststart()
        f = tmp_path / "bad.mp4"
        f.write_bytes(b"\x00\x01\x02\x03")
        assert has_faststart(f) is False

    def test_faststart_no_moov_no_mdat(self, tmp_path):
        """File with only ftyp box → returns False (no moov or mdat)."""
        has_faststart = _get_has_faststart()
        f = tmp_path / "ftyp_only.mp4"
        f.write_bytes(_make_box("ftyp", 16))
        assert has_faststart(f) is False
