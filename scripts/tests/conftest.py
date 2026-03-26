"""
Shared fixtures for audit and fix script unit tests.
All fixtures use mock data — no live Sanity/B2 calls.
"""

import json
import pytest
from pathlib import Path


@pytest.fixture
def mock_b2_inventory():
    """Set of known B2 paths (relative to bucket root, no bucket name prefix)."""
    return {
        "Futuro MMXIX/edited/HB_ALISTAIR_ahq12.mp4",
        "Futuro MMXIX/clips/HB2_Laura/SPEAKER_00_00m00s-01m00s.mp4",
        "Futuro MMXXV/clips/C3460/SPEAKER_00_00m00s-00m30s.mp4",
        "Futuro MMXXV/edited/card-1/Day 1/C3460_processed.mp4",
        # Deliberately NOT including this path to simulate a missing file:
        # "Futuro MMXIX/edited/MISSING_FILE.mp4"
    }


@pytest.fixture
def mock_sanity_docs():
    """
    List of dicts simulating GROQ query results for B2 video documents.
    Covers all major scenario categories for the audit.
    """
    return [
        # 1. MMXIX longform — correct b2Key, correct cdnUrl, correct person tags
        {
            "_id": "drafts.mmxix-longform-correct",
            "_type": "video",
            "title": "Alistair Coll — Futuro MMXIX Testimonial",
            "videoFormat": "longform",
            "b2Key": "Futuro MMXIX/edited/HB_ALISTAIR_ahq12.mp4",
            "cdnUrl": "https://benext.b-cdn.net/Futuro%20MMXIX/edited/HB_ALISTAIR_ahq12.mp4",
            "videoSource": "b2",
            "featuredIn": [
                {"_id": "alumni-alistair-coll", "_type": "alumni", "slug": {"current": "alistair-coll"}, "name": "Alistair Coll"}
            ],
        },
        # 2. MMXIX clip — correct tags (VIDEO_MAP-derived)
        {
            "_id": "drafts.mmxix-clip-correct",
            "_type": "video",
            "title": "Laura Miller — MMXIX Clip",
            "videoFormat": "clip",
            "b2Key": "Futuro MMXIX/clips/HB2_Laura/SPEAKER_00_00m00s-01m00s.mp4",
            "cdnUrl": "https://benext.b-cdn.net/Futuro%20MMXIX/clips/HB2_Laura/SPEAKER_00_00m00s-01m00s.mp4",
            "videoSource": "b2",
            "featuredIn": [
                {"_id": "alumni-laura-miller", "_type": "alumni", "slug": {"current": "laura-miller"}, "name": "Laura Miller"}
            ],
        },
        # 3. MMXXV clip — WRONG person tags (MMXIX alumni assigned to MMXXV SPEAKER_xx clip)
        {
            "_id": "drafts.mmxxv-clip-wrong-tags",
            "_type": "video",
            "title": "MMXXV Clip C3460 — Day 1",
            "videoFormat": "clip",
            "b2Key": "Futuro MMXXV/clips/C3460/SPEAKER_00_00m00s-00m30s.mp4",
            "cdnUrl": "https://benext.b-cdn.net/Futuro%20MMXXV/clips/C3460/SPEAKER_00_00m00s-00m30s.mp4",
            "videoSource": "b2",
            "featuredIn": [
                # WRONG: MMXIX alumna assigned to MMXXV clip
                {"_id": "alumni-alistair-coll", "_type": "alumni", "slug": {"current": "alistair-coll"}, "name": "Alistair Coll"}
            ],
        },
        # 4. Doc with MISSING b2Key in B2 (file does not exist)
        {
            "_id": "drafts.missing-b2key",
            "_type": "video",
            "title": "Missing File — Test",
            "videoFormat": "longform",
            "b2Key": "Futuro MMXIX/edited/MISSING_FILE.mp4",
            "cdnUrl": "https://benext.b-cdn.net/Futuro%20MMXIX/edited/MISSING_FILE.mp4",
            "videoSource": "b2",
            "featuredIn": [],
        },
        # 5. Doc with WRONG cdnUrl formula (b2Key correct but cdnUrl points to wrong host)
        {
            "_id": "drafts.wrong-cdnurl",
            "_type": "video",
            "title": "Wrong CDN URL — Test",
            "videoFormat": "longform",
            "b2Key": "Futuro MMXIX/edited/HB_ALISTAIR_ahq12.mp4",
            "cdnUrl": "https://wrong-cdn.net/something.mp4",
            "videoSource": "b2",
            "featuredIn": [
                {"_id": "alumni-alistair-coll", "_type": "alumni", "slug": {"current": "alistair-coll"}, "name": "Alistair Coll"}
            ],
        },
        # 6. MMXXV longform — has MMXIX-era alumni in featuredIn (flag for manual review)
        {
            "_id": "drafts.mmxxv-longform-mmxix-alumni",
            "_type": "video",
            "title": "Futuro MMXXV — Day 1, C3460",
            "videoFormat": "longform",
            "b2Key": "Futuro MMXXV/edited/card-1/Day 1/C3460_processed.mp4",
            "cdnUrl": "https://benext.b-cdn.net/Futuro%20MMXXV/edited/card-1/Day%201/C3460_processed.mp4",
            "videoSource": "b2",
            "featuredIn": [
                # MMXIX-era alumna in an MMXXV longform — should be flagged for review
                {"_id": "alumni-alistair-coll", "_type": "alumni", "slug": {"current": "alistair-coll"}, "name": "Alistair Coll"}
            ],
        },
    ]


@pytest.fixture
def mock_video_map():
    """Subset of VIDEO_MAP from populate-sanity-videos.py for testing."""
    return {
        "HB_ALISTAIR_ahq12.mp4": {
            "title": "Alistair Coll — Futuro MMXIX Testimonial",
            "alumni": ["alistair-coll"],
            "language": "en",
        },
        "HB2_Laura.mp4": {
            "title": "Laura Miller — Futuro MMXIX Testimonial",
            "alumni": ["laura-miller"],
            "language": "en",
        },
    }


@pytest.fixture
def mmxix_alumni_slugs():
    """Set of all known MMXIX alumni slugs from VIDEO_MAP."""
    return {
        "alistair-coll",
        "laura-miller",
        "nestor-gaytan",
        "felipe-eleta",
        "mateo-porras-bermudez",
        "pierina-diana",
        "ricardo-adames",
        "diego-hernandez",
        "diego-gordon",
        "mark-franklin",
        "maria-sofia",
        "samuel-rios",
        "santiago-ramirez-anguiano",
    }


@pytest.fixture
def mock_enriched_json_dir(tmp_path_factory):
    """
    Temporary directory with mock enriched JSON files.
    - C3460.enriched.json: empty named_speakers (typical MMXXV file)
    - HB2_Laura.enriched.json: has named_speakers (typical MMXIX file)
    """
    enriched_dir = tmp_path_factory.mktemp("enriched")

    # MMXXV file — no named speakers
    mmxxv_data = {
        "speakers": {"SPEAKER_00": {"segments": []}},
        "named_speakers": {},
    }
    (enriched_dir / "C3460.enriched.json").write_text(json.dumps(mmxxv_data))

    # MMXIX file — has named speakers
    mmxix_data = {
        "speakers": {"SPEAKER_00": {"segments": []}},
        "named_speakers": {"SPEAKER_00": "Laura Miller"},
    }
    (enriched_dir / "HB2_Laura.enriched.json").write_text(json.dumps(mmxix_data))

    return enriched_dir
