# Phase 13: Sanity Data Integrity - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-26
**Phase:** 13-sanity-data-integrity
**Areas discussed:** Audit strategy, URL fix approach, Person tag correction, Patch execution

---

## Audit Strategy

### Q1: What should the audit check per document?

| Option | Description | Selected |
|--------|-------------|----------|
| HTTP 200 only | Fetch each cdnUrl and confirm HTTP 200. Fast, catches 404s. | |
| HTTP 200 + content-type | Check HTTP 200 AND content-type is video/mp4. | |
| HTTP 200 + file size | Check HTTP 200 and content-length > 0. | |

**User's choice:** All three checks — issues could manifest in any of these ways.
**Notes:** User noted "we may have issues along the lines of all three" — so the audit should check HTTP 200, content-type, and content-length together.

### Q2: How should audit results be reported?

| Option | Description | Selected |
|--------|-------------|----------|
| Console table + JSON | Print pass/fail table + write JSON for fix script | ✓ |
| Console only | Print to console only | |
| JSON file only | Write structured results to file only | |

**User's choice:** Console table + JSON
**Notes:** None

### Q3: Single pass or separate runs?

| Option | Description | Selected |
|--------|-------------|----------|
| Single pass | One script audits all video-type documents | ✓ |
| Separate passes | Separate audit for clips vs full-length | |

**User's choice:** Single pass
**Notes:** None

---

## URL Fix Approach

### Q1: How to derive correct CDN URLs?

| Option | Description | Selected |
|--------|-------------|----------|
| Re-read B2 file listing | List actual files in B2, match by stem, rebuild URLs | ✓ |
| Re-read manifests/enriched JSON | Use .enriched.json as source of truth | |
| Manual mapping file | Create JSON/CSV of doc ID → correct URL | |

**User's choice:** Re-read B2 file listing
**Notes:** None

### Q2: Where do correct clip filenames come from?

| Option | Description | Selected |
|--------|-------------|----------|
| Clip directories in B2 | List actual clip files in B2 clips/ folder | ✓ |
| Enriched JSON segments | Derive from speaker segments | |
| Local clips/ directory | Use local folder on disk | |

**User's choice:** Clip directories in B2
**Notes:** None

### Q3: One fix script or separate?

| Option | Description | Selected |
|--------|-------------|----------|
| One script, both types | Single script with type-aware logic | ✓ |
| Separate fix scripts | One for clips, one for full-length | |

**User's choice:** One script, both types
**Notes:** None

---

## Person Tag Correction

### Q1: Where should speaker→person mapping come from?

| Option | Description | Selected |
|--------|-------------|----------|
| Diarization + VIDEO_MAP | Cross-reference both sources together | ✓ |
| VIDEO_MAP only | Trust existing filename→person mapping | |
| Diarization output only | Use speaker labels from .enriched.json | |

**User's choice:** Diarization + VIDEO_MAP
**Notes:** None

### Q2: What to do with unmatched speakers?

| Option | Description | Selected |
|--------|-------------|----------|
| Flag for manual review | Log unmatched in audit output | ✓ |
| Skip silently | Leave featuredIn empty | |
| Create placeholder person | Auto-create minimal person doc | |

**User's choice:** Flag for manual review
**Notes:** None

### Q3: Fix clips only or both types?

| Option | Description | Selected |
|--------|-------------|----------|
| Both clips and full-length | Fix featuredIn on all video documents | ✓ |
| Clips only | Only what DINT-03 strictly asks for | |

**User's choice:** Both clips and full-length
**Notes:** None

---

## Patch Execution

### Q1: What workflow for applying fixes?

| Option | Description | Selected |
|--------|-------------|----------|
| Dry-run → review → live | Always dry-run first, review, then live | ✓ |
| Interactive per-document | Prompt for each document | |
| Direct apply with rollback | Apply immediately, log originals for revert | |

**User's choice:** Dry-run → review → live
**Notes:** None

### Q2: Patch drafts, published, or both?

| Option | Description | Selected |
|--------|-------------|----------|
| Drafts only | Only patch draft documents | |
| Both drafts and published | Patch whichever version exists | ✓ |
| Published only | Only patch published versions | |

**User's choice:** Both — any document with videoSource == "b2", whether draft or published
**Notes:** User specified "published or draft that originated on B2 Backblaze"

### Q3: How should re-audit verification work?

| Option | Description | Selected |
|--------|-------------|----------|
| Same audit script, zero failures | Re-run audit script, success = zero failures | ✓ |
| Separate verification script | Dedicated script checking URLs + person tags | |

**User's choice:** Same audit script, zero failures
**Notes:** None

---

## Claude's Discretion

- Script language choice (Python vs TypeScript)
- GROQ query structure
- Batch size and rate limiting
- B2 listing method

## Deferred Ideas

None — discussion stayed within phase scope
