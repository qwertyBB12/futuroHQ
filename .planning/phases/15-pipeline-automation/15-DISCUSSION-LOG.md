# Phase 15: Pipeline Automation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-26
**Phase:** 15-pipeline-automation
**Areas discussed:** Orchestration approach, B2 upload structure, Sanity document creation, Error handling & resume

---

## Orchestration Approach

| Option | Description | Selected |
|--------|-------------|----------|
| Single Python orchestrator | New pipeline.py that imports/calls existing scripts as modules — one command, one process, shared state | :white_check_mark: |
| Shell wrapper script | Bash script calling each Python script sequentially, passing output paths between them | |
| Extend process-raw-video.py | Add all stages to the existing script | |

**User's choice:** Single Python orchestrator
**Notes:** None

### Integration Method

| Option | Description | Selected |
|--------|-------------|----------|
| Import as modules | Refactor key functions into importable form, orchestrator calls directly | :white_check_mark: |
| Subprocess calls | Call each script via subprocess.run() | |

**User's choice:** Import as modules

### Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Single file + folder support | Accept both single raw file path and folder path | :white_check_mark: |
| Single file only | One raw file per invocation | |

**User's choice:** Single file + folder support

### CLI Flags

| Option | Description | Selected |
|--------|-------------|----------|
| Inherit + extend | Carry forward --camera, --anamorphic, --skip-transcribe; add --skip-upload, --skip-sanity, --dry-run/--live | :white_check_mark: |
| Minimal flags only | Only --camera and --dry-run/--live | |

**User's choice:** Inherit + extend

---

## B2 Upload Structure

### Processed File Location

| Option | Description | Selected |
|--------|-------------|----------|
| Flat edited/ folder | Keep current pattern: Futuro MMXXV/edited/C3460.mp4 | |
| Mirror raw structure | Futuro MMXXV/edited/card-1/Day 1/C3460.mp4 | |
| You decide | Claude picks based on existing patterns | :white_check_mark: |

**User's choice:** You decide (Claude's discretion)

### Clip Location

| Option | Description | Selected |
|--------|-------------|----------|
| Dedicated clips/ folder | Futuro MMXXV/clips/{stem}/{clip}.mp4 — clean separation | :white_check_mark: |
| Keep under raw path | Clips stay under raw video's directory | |

**User's choice:** Dedicated clips/ folder

### Metadata Files

| Option | Description | Selected |
|--------|-------------|----------|
| Local only | Transcripts + manifests stay in clean-studio repo, committed to git | :white_check_mark: |
| Upload to B2 too | Upload .enriched.json and manifest.json to B2 | |

**User's choice:** Local only (in clean-studio repo, committed to git)
**Notes:** User specified "local and on sanity clean studio" — transcripts/manifests committed to the repo, not uploaded to B2.

---

## Sanity Document Creation

### Video Doc Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-create with diarization data | Create docs from B2 key + CDN URL + enriched JSON, derive person tags from diarization | :white_check_mark: |
| Require VIDEO_MAP entry | Manual mapping before pipeline creates docs | |
| Create shell docs, tag later | Minimal docs with no person tags | |

**User's choice:** Auto-create with diarization data

### Clip Documents

| Option | Description | Selected |
|--------|-------------|----------|
| Both video + clip docs | Create full-length video doc AND individual clip docs | :white_check_mark: |
| Full video only | Only create full-length video doc | |

**User's choice:** Both video + clip docs

### API Approach

| Option | Description | Selected |
|--------|-------------|----------|
| Python REST API | Direct HTTP with SANITY_TOKEN, same as populate-sanity-videos.py | :white_check_mark: |
| TypeScript client | @sanity/client in a separate TypeScript step | |

**User's choice:** Python REST API

### Draft vs Publish

| Option | Description | Selected |
|--------|-------------|----------|
| Always draft | Create as drafts, user publishes manually in Studio | :white_check_mark: |
| Auto-publish | Create and immediately publish | |

**User's choice:** Always draft

---

## Error Handling & Resume

### Failure Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Stop + report | Stop at failed step, print clear error with context | :white_check_mark: |
| Skip + continue | Log error, skip failed file, continue with next | |
| Retry once, then stop | Retry failed step once, then stop | |

**User's choice:** Stop + report (single file mode)

### Batch Failure

| Option | Description | Selected |
|--------|-------------|----------|
| Continue + report all | Log failed file, continue with remaining, summary at end | :white_check_mark: |
| Stop at first failure | Stop entire batch at first failure | |

**User's choice:** Continue + report all (batch mode)

### Resume Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Skip-flags for resume | Use --skip-transcribe, --skip-upload etc. as manual resume | :white_check_mark: |
| Checkpoint state file | Write .state JSON tracking completed steps | |
| No resume — full re-run | Always re-run full pipeline | |

**User's choice:** Skip-flags for resume

---

## Claude's Discretion

- Processed file upload path in B2 (flat vs mirrored)
- Internal module refactoring strategy
- GROQ queries and Sanity API patterns
- Person tag derivation from diarization
- Console output format

## Deferred Ideas

None — discussion stayed within phase scope
