# Phase 13: Sanity Data Integrity - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix incorrect CDN URLs and person tag references on existing clip and full-length video Sanity documents. This is a data correction phase — audit what's wrong, derive correct values from B2 ground truth, patch documents, and verify zero failures. No new features, no schema changes, no new pipeline capabilities.

</domain>

<decisions>
## Implementation Decisions

### Audit Strategy
- **D-01:** Audit checks three signals per document: HTTP 200 status, content-type is video/mp4, and content-length > 0. Issues could manifest in any of these ways.
- **D-02:** Audit output is console table (for quick human review) + JSON file (for downstream fix script to consume).
- **D-03:** Single-pass audit covers both clips and full-length video documents — no separate runs.

### URL Fix Approach
- **D-04:** B2 file listing is the single source of truth for correct CDN URLs. List actual files in B2 bucket, match to Sanity docs by filename stem/pattern, rebuild cdnUrl from actual B2 keys.
- **D-05:** For clips specifically, list actual clip files under the clips/ folder in B2 — these are ground truth from extract-speaker-clips.py.
- **D-06:** One fix script handles both clips and full-length videos with type-aware logic. Consistent with single-pass audit.

### Person Tag Correction
- **D-07:** Cross-reference diarization output (.enriched.json speaker segments) AND VIDEO_MAP (populate-sanity-videos.py filename→person mappings) to derive correct featuredIn references.
- **D-08:** Unmatched speakers are flagged for manual review in the audit output — no auto-creation of placeholder person documents.
- **D-09:** Fix updates featuredIn on both clips and full-length videos for consistency.

### Patch Execution
- **D-10:** Dry-run → review → live workflow. Always run --dry-run first, review output, then re-run with --live. Same pattern as existing populate-sanity-videos.py.
- **D-11:** Patches target any document with videoSource == "b2" — both drafts and published, regardless of current publish state.
- **D-12:** Verification is re-running the same audit script after patches. Success = zero failures.

### Claude's Discretion
- Script language choice (Python vs TypeScript) — use whatever fits best given existing patterns
- GROQ query structure for fetching video/clip documents
- Batch size and rate limiting for Sanity API patches
- B2 listing method (b2 CLI vs API)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Pipeline Scripts
- `scripts/populate-sanity-videos.py` — Contains VIDEO_MAP (filename→person mappings), CDN_BASE constant, Sanity API patterns. The --dry-run/--live pattern to follow.
- `scripts/extract-speaker-clips.py` — Created the clip files in B2. Shows naming conventions and clip directory structure.
- `scripts/ingest-transcripts.ts` — Matches videos by b2Key stem, patches fullText/speakerSegments. Shows TypeScript Sanity client pattern.

### Transcript Data
- `transcripts/*.enriched.json` — Diarization output with speaker segments. Source for speaker identification.

### Schema
- `schemaTypes/video.ts` — Video document schema (cdnUrl, b2Key, featuredIn, videoSource fields)

### Project Context
- `.planning/REQUIREMENTS.md` — DINT-01, DINT-02, DINT-03 requirements with acceptance criteria
- `.planning/ROADMAP.md` — Phase 13 success criteria (especially criterion 4: re-audit returns zero failures)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `populate-sanity-videos.py` — Has Sanity API client setup, CDN_BASE constant, VIDEO_MAP, and --dry-run/--live CLI pattern. Fix script should follow this pattern.
- `ingest-transcripts.ts` — Has Sanity client setup in TypeScript, b2Key matching logic, chunked patching with rate limiting.
- `extract-speaker-clips.py` — Has B2 download logic via `b2` CLI, clip naming conventions.

### Established Patterns
- Sanity API: Direct REST API calls in Python (populate-sanity-videos.py), @sanity/client in TypeScript (ingest-transcripts.ts)
- B2 access: Via `b2` CLI tool (`b2 file download`, `b2 ls`)
- CDN URL pattern: `https://benext.b-cdn.net/{b2_path}`
- Document matching: By b2Key filename stem

### Integration Points
- Sanity Content Lake: Project `fo6n8ceo`, dataset `production`
- B2 bucket: `hector-ecosystem-archive-prod`
- Bunny CDN: `benext.b-cdn.net` (fronts B2)
- Local directories: `transcripts/` (enriched JSON), `clips/` (local clip copies)

</code_context>

<specifics>
## Specific Ideas

- All 26 B2 video documents are currently draft-only (created by populate-sanity-videos.py in Phase 10)
- Known issue: clip documents have CDN URLs that don't match actual B2 filenames
- GROQ count() returns stale numbers due to CDN cache — use direct fetch to confirm document state

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 13-sanity-data-integrity*
*Context gathered: 2026-03-26*
