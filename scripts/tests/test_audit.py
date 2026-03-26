"""
Unit tests for audit-sanity-integrity.py audit logic.
All tests use mock data — no live Sanity/B2 calls.

Imports audit module via importlib (handles hyphenated filename).
"""

import sys
import importlib.util
from pathlib import Path
import pytest

# Load audit module via importlib (filename has hyphens)
_AUDIT_PATH = Path(__file__).parent.parent / "audit-sanity-integrity.py"


def _load_audit():
    spec = importlib.util.spec_from_file_location("audit_sanity_integrity", _AUDIT_PATH)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


# Load once at module level so import errors surface clearly
audit = _load_audit()


# ============================================================
# B2 Cross-Reference Tests
# ============================================================

def test_b2_cross_reference(mock_b2_inventory, mock_sanity_docs):
    """
    Doc with b2Key NOT in B2 inventory -> check_url_integrity returns 'b2_not_found' issue.
    """
    # Find the doc with MISSING_FILE
    missing_doc = next(d for d in mock_sanity_docs if "MISSING_FILE" in d["b2Key"])
    result = audit.check_url_integrity(missing_doc, mock_b2_inventory)
    assert "b2_not_found" in result["issues"], (
        f"Expected 'b2_not_found' in issues, got: {result['issues']}"
    )


def test_b2_cross_reference_pass(mock_b2_inventory, mock_sanity_docs):
    """
    Doc with b2Key present in B2 inventory and correct cdnUrl -> no issues.
    """
    # Find the MMXIX longform doc with correct data
    correct_doc = next(d for d in mock_sanity_docs if d["_id"] == "drafts.mmxix-longform-correct")
    result = audit.check_url_integrity(correct_doc, mock_b2_inventory)
    assert result["issues"] == [], (
        f"Expected no issues for correct doc, got: {result['issues']}"
    )


# ============================================================
# CDN URL Formula Tests
# ============================================================

def test_cdnurl_formula(mock_b2_inventory, mock_sanity_docs):
    """
    Doc with b2Key present but cdnUrl pointing to wrong host ->
    check_url_integrity returns 'cdnurl_formula_mismatch' issue.
    """
    wrong_cdn_doc = next(d for d in mock_sanity_docs if d["_id"] == "drafts.wrong-cdnurl")
    result = audit.check_url_integrity(wrong_cdn_doc, mock_b2_inventory)
    assert "cdnurl_formula_mismatch" in result["issues"], (
        f"Expected 'cdnurl_formula_mismatch' in issues, got: {result['issues']}"
    )


def test_cdnurl_formula_with_spaces(mock_b2_inventory):
    """
    b2Key with spaces -> cdnUrl must use %20 encoding.
    Correct encoding produces no cdnurl issue.
    """
    # Add a b2Key with space to the inventory
    b2_key_with_space = "Futuro MMXIX/edited/HB ALISTAIR_ahq12.mp4"
    inventory_with_space = mock_b2_inventory | {b2_key_with_space}

    doc = {
        "_id": "test-space-encoding",
        "b2Key": b2_key_with_space,
        "cdnUrl": "https://benext.b-cdn.net/Futuro%20MMXIX/edited/HB%20ALISTAIR_ahq12.mp4",
        "featuredIn": [],
    }
    result = audit.check_url_integrity(doc, inventory_with_space)
    assert "cdnurl_formula_mismatch" not in result["issues"], (
        f"Space-encoded cdnUrl should not produce cdnurl_formula_mismatch, got: {result['issues']}"
    )


# ============================================================
# Single-Pass Document Categorization Tests
# ============================================================

def test_single_pass_coverage(mock_sanity_docs):
    """
    categorize_documents() returns all four category buckets.
    Each doc is routed to the correct category based on b2Key prefix.
    """
    categories = audit.categorize_documents(mock_sanity_docs)

    assert "mmxix_longform" in categories
    assert "mmxix_clips" in categories
    assert "mmxxv_longform" in categories
    assert "mmxxv_clips" in categories

    # Verify specific docs land in the right buckets
    mmxix_longform_ids = [d["_id"] for d in categories["mmxix_longform"]]
    mmxix_clips_ids = [d["_id"] for d in categories["mmxix_clips"]]
    mmxxv_clips_ids = [d["_id"] for d in categories["mmxxv_clips"]]
    mmxxv_longform_ids = [d["_id"] for d in categories["mmxxv_longform"]]

    # MMXIX longform: HB_ALISTAIR and MISSING_FILE (both in edited/) and WRONG_CDNURL
    assert "drafts.mmxix-longform-correct" in mmxix_longform_ids
    assert "drafts.missing-b2key" in mmxix_longform_ids

    # MMXIX clip: HB2_Laura
    assert "drafts.mmxix-clip-correct" in mmxix_clips_ids

    # MMXXV clip: C3460 clip
    assert "drafts.mmxxv-clip-wrong-tags" in mmxxv_clips_ids

    # MMXXV longform: C3460_processed
    assert "drafts.mmxxv-longform-mmxix-alumni" in mmxxv_longform_ids


# ============================================================
# Person Tag Detection Tests (D-07 compliance)
# ============================================================

def test_person_tag_detection_mmxxv_clip(mock_sanity_docs, mock_video_map, mmxix_alumni_slugs, mock_enriched_json_dir):
    """
    MMXXV clip doc + enriched JSON with empty named_speakers ->
    check_person_tags returns 'wrong_person_tags' issue.

    Per D-07: reads enriched JSON, finds no named_speakers, concludes
    featuredIn refs are unverifiable.
    """
    mmxxv_clip_doc = next(
        d for d in mock_sanity_docs if d["_id"] == "drafts.mmxxv-clip-wrong-tags"
    )
    # Build person_slug_map from the docs
    person_slug_map = audit.build_person_slug_map(mock_sanity_docs)

    result = audit.check_person_tags(
        mmxxv_clip_doc,
        mock_video_map,
        mmxix_alumni_slugs,
        person_slug_map,
        enriched_dir=mock_enriched_json_dir,
    )
    assert "wrong_person_tags" in result["issues"], (
        f"Expected 'wrong_person_tags' for MMXXV clip with empty named_speakers, got: {result['issues']}"
    )


def test_person_tag_ok_mmxix(mock_sanity_docs, mock_video_map, mmxix_alumni_slugs, mock_enriched_json_dir):
    """
    MMXIX clip doc with correct VIDEO_MAP-derived person refs ->
    check_person_tags returns no issues.
    """
    mmxix_clip_doc = next(
        d for d in mock_sanity_docs if d["_id"] == "drafts.mmxix-clip-correct"
    )
    person_slug_map = audit.build_person_slug_map(mock_sanity_docs)

    result = audit.check_person_tags(
        mmxix_clip_doc,
        mock_video_map,
        mmxix_alumni_slugs,
        person_slug_map,
        enriched_dir=mock_enriched_json_dir,
    )
    # MMXIX clips with correct VIDEO_MAP refs should have no person tag issues
    assert "wrong_person_tags" not in result["issues"], (
        f"MMXIX clip with correct tags should not be flagged, got: {result['issues']}"
    )
    assert "person_tag_mismatch" not in result["issues"], (
        f"MMXIX clip with correct tags should not have mismatch, got: {result['issues']}"
    )


def test_mmxxv_longform_mmxix_alumni_flagged(mock_sanity_docs, mock_video_map, mmxix_alumni_slugs, mock_enriched_json_dir):
    """
    MMXXV longform doc with an MMXIX-only alumni ref ->
    check_person_tags returns 'mmxix_alumni_in_mmxxv' flag.
    """
    mmxxv_longform_doc = next(
        d for d in mock_sanity_docs if d["_id"] == "drafts.mmxxv-longform-mmxix-alumni"
    )
    person_slug_map = audit.build_person_slug_map(mock_sanity_docs)

    result = audit.check_person_tags(
        mmxxv_longform_doc,
        mock_video_map,
        mmxix_alumni_slugs,
        person_slug_map,
        enriched_dir=mock_enriched_json_dir,
    )
    assert "mmxix_alumni_in_mmxxv" in result["issues"], (
        f"Expected 'mmxix_alumni_in_mmxxv' for MMXXV longform with MMXIX alumni, got: {result['issues']}"
    )


def test_person_tag_mmxxv_clip_with_named_speakers(mock_video_map, mmxix_alumni_slugs, tmp_path):
    """
    MMXXV clip doc + enriched JSON WITH named_speakers ->
    check_person_tags compares named_speakers against featuredIn slugs.
    If featuredIn matches the named speaker slugs, no wrong_person_tags issue.

    This tests the D-07 cross-reference path works for future-state where
    MMXXV speakers have been identified.
    """
    # Create a temporary enriched dir with a C3461 file that HAS named speakers
    enriched_dir = tmp_path / "enriched"
    enriched_dir.mkdir()
    enriched_data = {
        "speakers": {"SPEAKER_00": {"segments": []}},
        "named_speakers": {"SPEAKER_00": "laura-miller"},  # Identified speaker
    }
    (enriched_dir / "C3461.enriched.json").write_text(
        __import__("json").dumps(enriched_data)
    )

    # Create a doc whose featuredIn correctly matches the named speaker
    doc_matching = {
        "_id": "drafts.mmxxv-clip-named-speaker-match",
        "_type": "video",
        "title": "MMXXV Clip C3461 — Named Speaker",
        "videoFormat": "clip",
        "b2Key": "Futuro MMXXV/clips/C3461/SPEAKER_00_00m00s-00m30s.mp4",
        "cdnUrl": "https://benext.b-cdn.net/Futuro%20MMXXV/clips/C3461/SPEAKER_00_00m00s-00m30s.mp4",
        "videoSource": "b2",
        "featuredIn": [
            {"_id": "alumni-laura-miller", "_type": "alumni", "slug": {"current": "laura-miller"}, "name": "Laura Miller"}
        ],
    }
    person_slug_map = {"drafts.mmxxv-clip-named-speaker-match": ["laura-miller"]}

    result = audit.check_person_tags(
        doc_matching,
        mock_video_map,
        mmxix_alumni_slugs,
        person_slug_map,
        enriched_dir=enriched_dir,
    )
    # When named_speakers matches featuredIn, should NOT return wrong_person_tags
    assert "wrong_person_tags" not in result["issues"], (
        f"MMXXV clip with matching named_speakers should not be flagged, got: {result['issues']}"
    )


# ============================================================
# Gap Closure Tests (Plan 13-03)
# ============================================================

def test_mmxxv_clip_cleared_featuredin_is_pending_identification(mock_sanity_docs, mock_video_map, mmxix_alumni_slugs, mock_enriched_json_dir):
    """
    MMXXV clip with featuredIn=[] and no named_speakers ->
    check_person_tags returns 'pending_identification' (not 'wrong_person_tags'),
    with action='informational'.

    This is the gap fix: cleared clips that have no refs AND no enriched speakers
    are not failures — they are awaiting speaker identification.
    """
    cleared_doc = next(
        d for d in mock_sanity_docs if d["_id"] == "drafts.mmxxv-clip-cleared"
    )
    person_slug_map = audit.build_person_slug_map(mock_sanity_docs)

    result = audit.check_person_tags(
        cleared_doc,
        mock_video_map,
        mmxix_alumni_slugs,
        person_slug_map,
        enriched_dir=mock_enriched_json_dir,
    )
    assert "pending_identification" in result["issues"], (
        f"Expected 'pending_identification' for cleared MMXXV clip, got: {result['issues']}"
    )
    assert "wrong_person_tags" not in result["issues"], (
        f"Cleared MMXXV clip must NOT be flagged as wrong_person_tags, got: {result['issues']}"
    )
    assert result.get("action") == "informational", (
        f"Expected action='informational', got: {result.get('action')}"
    )


def test_mmxxv_clip_featuredin_present_no_named_speakers_still_wrong(mock_sanity_docs, mock_video_map, mmxix_alumni_slugs, mock_enriched_json_dir):
    """
    MMXXV clip with featuredIn=[some refs] and no named_speakers ->
    check_person_tags still returns 'wrong_person_tags' (unverifiable refs are present).

    The cleared-clip path only applies when featuredIn is also empty.
    """
    wrong_tag_doc = next(
        d for d in mock_sanity_docs if d["_id"] == "drafts.mmxxv-clip-wrong-tags"
    )
    person_slug_map = audit.build_person_slug_map(mock_sanity_docs)

    result = audit.check_person_tags(
        wrong_tag_doc,
        mock_video_map,
        mmxix_alumni_slugs,
        person_slug_map,
        enriched_dir=mock_enriched_json_dir,
    )
    assert "wrong_person_tags" in result["issues"], (
        f"MMXXV clip with unverifiable refs still present should be 'wrong_person_tags', got: {result['issues']}"
    )
    assert "pending_identification" not in result["issues"], (
        f"wrong_person_tags doc must NOT also be pending_identification, got: {result['issues']}"
    )


def test_mmxix_clip_subset_match_no_issues(mock_sanity_docs, mock_video_map, mmxix_alumni_slugs, mock_enriched_json_dir):
    """
    MMXIX clip where VIDEO_MAP expected_slugs is a SUBSET of actual_slugs ->
    check_person_tags returns NO issues.

    The extra hector-h-lopez host ref is acceptable — only absence of expected
    people triggers person_tag_mismatch.
    """
    clip_with_host = next(
        d for d in mock_sanity_docs if d["_id"] == "drafts.mmxix-clip-with-host"
    )
    person_slug_map = audit.build_person_slug_map(mock_sanity_docs)

    result = audit.check_person_tags(
        clip_with_host,
        mock_video_map,
        mmxix_alumni_slugs,
        person_slug_map,
        enriched_dir=mock_enriched_json_dir,
    )
    assert result["issues"] == [], (
        f"MMXIX clip with extra host ref should have no issues (subset match), got: {result['issues']}"
    )


def test_mmxix_clip_missing_expected_person_flagged(mock_video_map, mmxix_alumni_slugs, mock_enriched_json_dir):
    """
    MMXIX clip where VIDEO_MAP expected_slugs is NOT a subset of actual_slugs ->
    check_person_tags returns 'person_tag_mismatch'.

    e.g., VIDEO_MAP says ['laura-miller'] but featuredIn has ['hector-h-lopez'] only.
    """
    doc_missing_person = {
        "_id": "drafts.mmxix-clip-missing-person",
        "_type": "video",
        "title": "Laura Miller — MMXIX Clip (wrong tags)",
        "videoFormat": "clip",
        "b2Key": "Futuro MMXIX/clips/HB2_Laura/SPEAKER_00_01m00s-02m00s.mp4",
        "cdnUrl": "https://benext.b-cdn.net/Futuro%20MMXIX/clips/HB2_Laura/SPEAKER_00_01m00s-02m00s.mp4",
        "videoSource": "b2",
        "featuredIn": [
            # Only host — expected laura-miller is missing
            {"_id": "person-hector", "_type": "person", "slug": {"current": "hector-h-lopez"}, "name": "Hector H. Lopez"},
        ],
    }
    person_slug_map = audit.build_person_slug_map([doc_missing_person])

    result = audit.check_person_tags(
        doc_missing_person,
        mock_video_map,
        mmxix_alumni_slugs,
        person_slug_map,
        enriched_dir=mock_enriched_json_dir,
    )
    assert "person_tag_mismatch" in result["issues"], (
        f"MMXIX clip missing expected VIDEO_MAP person must be 'person_tag_mismatch', got: {result['issues']}"
    )


def test_mmxix_longform_subset_match_no_issues(mock_video_map, mmxix_alumni_slugs, mock_enriched_json_dir, mock_b2_inventory):
    """
    MMXIX longform where VIDEO_MAP expected_slugs is a SUBSET of actual_slugs ->
    check_person_tags returns NO issues.

    e.g., VIDEO_MAP says ['alistair-coll'] and Sanity has ['alistair-coll', 'hector-h-lopez'].
    """
    doc_longform_with_host = {
        "_id": "drafts.mmxix-longform-with-host",
        "_type": "video",
        "title": "Alistair Coll — MMXIX Longform (with host)",
        "videoFormat": "longform",
        "b2Key": "Futuro MMXIX/edited/HB_ALISTAIR_ahq12.mp4",
        "cdnUrl": "https://benext.b-cdn.net/Futuro%20MMXIX/edited/HB_ALISTAIR_ahq12.mp4",
        "videoSource": "b2",
        "featuredIn": [
            {"_id": "alumni-alistair-coll", "_type": "alumni", "slug": {"current": "alistair-coll"}, "name": "Alistair Coll"},
            {"_id": "person-hector", "_type": "person", "slug": {"current": "hector-h-lopez"}, "name": "Hector H. Lopez"},
        ],
    }
    person_slug_map = audit.build_person_slug_map([doc_longform_with_host])

    result = audit.check_person_tags(
        doc_longform_with_host,
        mock_video_map,
        mmxix_alumni_slugs,
        person_slug_map,
        enriched_dir=mock_enriched_json_dir,
    )
    assert result["issues"] == [], (
        f"MMXIX longform with extra host ref should have no issues (subset match), got: {result['issues']}"
    )
