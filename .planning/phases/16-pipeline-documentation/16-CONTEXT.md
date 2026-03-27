# Phase 16: Pipeline Documentation - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Update the existing `docs/MEDIA-PIPELINE.md` to reflect all Phase 14 (script correctness) and Phase 15 (pipeline automation) changes, and add a usage guide section so that a new raw video can be processed correctly without reading script source code. Single document, single source of truth. No new pipeline features, no schema changes.

</domain>

<decisions>
## Implementation Decisions

### Document Structure
- **D-01:** Update `docs/MEDIA-PIPELINE.md` in place. No new files — single source of truth for the entire pipeline.
- **D-02:** Current state section (processing counts, pending work) — Claude's discretion on whether to keep, remove, or convert to a less maintenance-heavy format.

### Architecture Section
- **D-03:** Enhanced text/ASCII diagram (not Mermaid) showing the full pipeline.py orchestrator flow including B2 paths, CF Worker, and Sanity document creation. Must stay readable in any editor or terminal.
- **D-04:** Fix outdated content: remove bitrate cap references (CRF 18 only per Phase 14), add pipeline.py orchestrator (Phase 15), update compression settings table, reflect current script flags.

### Script Documentation Depth
- **D-05:** Claude's discretion on per-script detail level. Pipeline.py is the main entry point and should get the most detail. Supporting scripts documented proportionally to how often they're used standalone.

### Usage Guide
- **D-06:** Quick-start section (the one command for common case) followed by a reference table of all flags and options. Not a step-by-step walkthrough.
- **D-07:** Include a brief troubleshooting section covering the 3-5 most common issues (missing env vars, ffmpeg not found, B2 auth, mid-pipeline failures, resume strategy).

### Audience & Tone
- **D-08:** Written for future collaborators — includes brief context on what the ecosystem is, why B2/Bunny/Sanity, and what each component does. Assumes technical competence but not familiarity with this specific setup.

### Claude's Discretion
- Whether to keep/remove/restructure the current state snapshot section
- Per-script documentation depth (table vs subsections)
- Diagram complexity and layout
- Ordering of sections within the updated doc
- Whether to add a prerequisites/setup section (Python deps, env vars, B2 CLI auth)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing Documentation (primary update target)
- `docs/MEDIA-PIPELINE.md` — Current pipeline doc. Update target. Contains architecture overview, B2 structure, camera profiles, LUTs, compression settings, script table, Sanity schema, current state. Outdated in several areas post-Phase 14/15.

### Pipeline Scripts (source of truth for behavior)
- `scripts/pipeline.py` — Phase 15 orchestrator. Main entry point for end-to-end processing. All flags and stages documented here.
- `scripts/process-raw-video.py` — Encode + transcribe + diarize. Updated in Phase 14 with --camera, --anamorphic, CRF-only encoding.
- `scripts/extract-speaker-clips.py` — Clip extraction from diarized video.
- `scripts/extract-dialogue-clips.py` — Multi-speaker dialogue clip extraction.
- `scripts/populate-sanity-videos.py` — Sanity document creation via REST API.
- `scripts/transcribe-with-speakers.py` — Standalone re-transcription tool.
- `scripts/audit-faststart.py` — Phase 14 faststart audit tool.
- `scripts/audit-sanity-integrity.py` — Phase 13 integrity audit.

### LUT Files
- `luts/` directory — All .cube LUT files for camera profiles

### Prior Phase Context
- `.planning/phases/14-script-correctness/14-CONTEXT.md` — Encoding decisions (CRF 18, --camera, --anamorphic, HF_TOKEN)
- `.planning/phases/15-pipeline-automation/15-CONTEXT.md` — Orchestrator decisions (pipeline.py, B2 upload paths, Sanity doc creation, --dry-run/--live)

### Requirements
- `.planning/REQUIREMENTS.md` — DOCS-01 (architecture doc), DOCS-02 (step-by-step usage)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `docs/MEDIA-PIPELINE.md` — 170 lines of existing documentation. ~70% still accurate. Camera profiles, LUTs, B2 bucket structure sections are mostly correct. Compression settings and script table need updates.

### Established Patterns
- Documentation lives in `docs/` directory
- Text/ASCII diagrams used for architecture visualization
- Markdown tables for structured reference data (scripts, settings, camera profiles)

### Integration Points
- `docs/MEDIA-PIPELINE.md` is the only pipeline doc — all references point here
- CLAUDE.md references the pipeline scripts but not the doc itself
- Script docstrings and argparse help text complement but don't replace the doc

</code_context>

<specifics>
## Specific Ideas

- Compression settings table still shows bitrate cap (18 Mbps max 25 Mbps) — must be updated to CRF 18 only
- pipeline.py orchestrator is the major Phase 15 addition that needs to be the centerpiece of the usage guide
- Camera flag examples already in the doc are good — expand with pipeline.py equivalents
- The "Pending Work" checklist at the bottom is useful context for collaborators

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 16-pipeline-documentation*
*Context gathered: 2026-03-27*
