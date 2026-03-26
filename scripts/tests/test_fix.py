"""
Unit tests for fix-sanity-integrity.py fix logic.
All tests use mock data — no live Sanity/B2 calls.

Imports fix module via importlib (handles hyphenated filename).
"""

import json
import sys
import importlib.util
from pathlib import Path
from unittest.mock import patch, MagicMock
import pytest

# Load fix module via importlib (filename has hyphens)
_FIX_PATH = Path(__file__).parent.parent / "fix-sanity-integrity.py"


def _load_fix():
    spec = importlib.util.spec_from_file_location("fix_sanity_integrity", _FIX_PATH)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


# Load once at module level so import errors surface clearly
fix = _load_fix()


# ============================================================
# load_audit_results Tests
# ============================================================

def test_load_audit_results(tmp_path):
    """
    Given a tmp JSON file with valid audit structure,
    load_audit_results(path) returns dict with "failures" key.
    """
    audit_data = {
        "generated": "2026-03-26T22:00:00Z",
        "summary": {
            "total_docs": 240,
            "url_failures": 0,
            "person_tag_issues": 68,
            "manual_review_count": 9,
        },
        "failures": [
            {
                "doc_id": "drafts.abc",
                "title": "Test Clip",
                "b2Key": "Futuro MMXXV/clips/C3460/SPEAKER_00.mp4",
                "issues": ["wrong_person_tags"],
                "details": {"action": "clear_and_flag"},
            }
        ],
        "manual_review": [
            {
                "doc_id": "drafts.xyz",
                "title": "MMXXV Longform",
                "b2Key": "Futuro MMXXV/edited/card-1/Day 1/C3460_processed.mp4",
                "reason": "MMXXV longform has MMXIX-era alumni reference",
            }
        ],
    }
    audit_file = tmp_path / "integrity-audit.json"
    audit_file.write_text(json.dumps(audit_data))

    result = fix.load_audit_results(str(audit_file))
    assert "failures" in result, "load_audit_results should return dict with 'failures' key"
    assert "summary" in result, "load_audit_results should return dict with 'summary' key"
    assert result["summary"]["total_docs"] == 240


def test_load_audit_missing_file():
    """
    Given a nonexistent path, load_audit_results raises FileNotFoundError.
    """
    with pytest.raises(FileNotFoundError):
        fix.load_audit_results("/nonexistent/path/integrity-audit.json")


# ============================================================
# build_fix_plan Tests
# ============================================================

def test_build_fix_plan_clear_person_tags():
    """
    Given audit data with a failure with 'wrong_person_tags' issue,
    build_fix_plan() returns a list containing the correct clear_featured_in action.
    """
    audit_data = {
        "failures": [
            {
                "doc_id": "drafts.abc",
                "title": "Test Clip",
                "b2Key": "Futuro MMXXV/clips/C3460/SPEAKER_00.mp4",
                "issues": ["wrong_person_tags"],
                "details": {"action": "clear_and_flag"},
            }
        ],
        "manual_review": [],
    }

    fix_plan = fix.build_fix_plan(audit_data)
    assert len(fix_plan) == 1, f"Expected 1 fix action, got {len(fix_plan)}"
    action = fix_plan[0]
    assert action["doc_id"] == "drafts.abc"
    assert action["patches"] == {"featuredIn": []}
    assert action["action"] == "clear_featured_in"


def test_build_fix_plan_cdnurl_fix():
    """
    Given a failure with 'cdnurl_formula_mismatch' and a b2Key with spaces,
    fix plan contains correct CDN URL with %20 encoding.
    """
    b2_key = "Futuro MMXIX/edited/HB ALISTAIR_ahq12.mp4"
    audit_data = {
        "failures": [
            {
                "doc_id": "drafts.cdnurl-broken",
                "title": "Broken CDN URL Doc",
                "b2Key": b2_key,
                "issues": ["cdnurl_formula_mismatch"],
                "details": {},
            }
        ],
        "manual_review": [],
    }

    fix_plan = fix.build_fix_plan(audit_data)
    assert len(fix_plan) == 1, f"Expected 1 fix action, got {len(fix_plan)}"
    action = fix_plan[0]
    assert action["action"] == "fix_cdnurl"
    expected_cdn = "https://benext.b-cdn.net/Futuro%20MMXIX/edited/HB%20ALISTAIR_ahq12.mp4"
    assert action["patches"]["cdnUrl"] == expected_cdn, (
        f"Expected cdnUrl={expected_cdn!r}, got {action['patches'].get('cdnUrl')!r}"
    )


def test_build_fix_plan_skips_manual_review():
    """
    Given audit data with manual_review items,
    build_fix_plan() returns NO fix actions for those doc_ids.
    Per D-08: manual_review items are report-only, no auto-patching.
    """
    manual_doc_id = "drafts.mmxxv-longform-review"
    audit_data = {
        "failures": [],
        "manual_review": [
            {
                "doc_id": manual_doc_id,
                "title": "MMXXV Longform",
                "b2Key": "Futuro MMXXV/edited/card-1/Day 1/C3460_processed.mp4",
                "reason": "MMXXV longform has MMXIX-era alumni reference: ['alistair-coll']",
            }
        ],
    }

    fix_plan = fix.build_fix_plan(audit_data)
    fix_doc_ids = [a["doc_id"] for a in fix_plan]
    assert manual_doc_id not in fix_doc_ids, (
        f"Manual review doc {manual_doc_id!r} should NOT be in fix plan, got: {fix_doc_ids}"
    )
    assert len(fix_plan) == 0, f"Expected empty fix plan for manual-review-only data, got: {fix_plan}"


# ============================================================
# apply_fixes Tests
# ============================================================

def test_dry_run_guard():
    """
    apply_fixes(fix_plan, dry_run=True) does NOT call patch_sanity_document
    (mock it and assert not called).
    """
    fix_plan = [
        {"doc_id": "drafts.abc", "patches": {"featuredIn": []}, "action": "clear_featured_in"},
        {"doc_id": "drafts.def", "patches": {"featuredIn": []}, "action": "clear_featured_in"},
    ]

    with patch.object(fix, "patch_sanity_document") as mock_patch:
        result = fix.apply_fixes(fix_plan, dry_run=True)
        mock_patch.assert_not_called(), (
            "patch_sanity_document should NOT be called in dry_run mode"
        )
    # Should return dict with applied, skipped, failed counts
    assert "applied" in result
    assert "skipped" in result
    assert "failed" in result


def test_apply_fixes_live_calls_patch():
    """
    apply_fixes(fix_plan, dry_run=False) calls patch_sanity_document for each fix action.
    """
    fix_plan = [
        {"doc_id": "drafts.abc", "patches": {"featuredIn": []}, "action": "clear_featured_in"},
    ]

    with patch.object(fix, "patch_sanity_document", return_value=True) as mock_patch:
        result = fix.apply_fixes(fix_plan, dry_run=False)
        mock_patch.assert_called_once_with("drafts.abc", {"featuredIn": []}, dry_run=False)

    assert result["applied"] == 1
    assert result["failed"] == 0


# ============================================================
# Gap Closure Tests (Plan 13-03)
# ============================================================

def test_build_fix_plan_person_tag_mismatch_flags_for_review():
    """
    Given audit data with a failure containing 'person_tag_mismatch',
    build_fix_plan() returns action='flag_person_mismatch' with patches=None.
    Per D-08: MMXIX person tag mismatches are flagged for review, no auto-patch.
    """
    audit_data = {
        "failures": [
            {
                "doc_id": "drafts.mmxix-clip-mismatch",
                "title": "Laura Miller — MMXIX Clip (mismatch)",
                "b2Key": "Futuro MMXIX/clips/HB2_Laura/SPEAKER_00_01m00s-02m00s.mp4",
                "issues": ["person_tag_mismatch"],
                "details": {"action": "review"},
            }
        ],
        "manual_review": [],
    }

    fix_plan = fix.build_fix_plan(audit_data)
    assert len(fix_plan) == 1, f"Expected 1 fix action for person_tag_mismatch, got {len(fix_plan)}"
    action = fix_plan[0]
    assert action["doc_id"] == "drafts.mmxix-clip-mismatch"
    assert action["patches"] is None, (
        f"person_tag_mismatch must have patches=None (no auto-patch), got: {action['patches']}"
    )
    assert action["action"] == "flag_person_mismatch", (
        f"Expected action='flag_person_mismatch', got: {action['action']}"
    )


def test_build_fix_plan_pending_identification_skipped():
    """
    Given audit data with a failure containing 'pending_identification',
    build_fix_plan() returns NO action (informational items should not appear in failures,
    but if they somehow do, they must be skipped gracefully).
    """
    audit_data = {
        "failures": [
            {
                "doc_id": "drafts.mmxxv-clip-cleared",
                "title": "MMXXV Clip C3460 — Cleared",
                "b2Key": "Futuro MMXXV/clips/C3460/SPEAKER_01_00m30s-01m00s.mp4",
                "issues": ["pending_identification"],
                "details": {"action": "informational"},
            }
        ],
        "manual_review": [],
    }

    fix_plan = fix.build_fix_plan(audit_data)
    assert len(fix_plan) == 0, (
        f"pending_identification items must be skipped by fix script, got: {fix_plan}"
    )
