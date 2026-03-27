# Phase 16: Pipeline Documentation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-27
**Phase:** 16-pipeline-documentation
**Areas discussed:** Document scope, Architecture detail, Usage guide style, Audience & tone

---

## Document Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Update in place | Revise MEDIA-PIPELINE.md to reflect Phase 14/15 changes and add usage guide. Single source of truth in docs/. | ✓ |
| Replace with two docs | Split into PIPELINE-ARCHITECTURE.md and PIPELINE-USAGE.md. Retire old file. | |
| You decide | Claude picks the doc structure | |

**User's choice:** Update in place
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Keep current state section | Useful reference, manually updated when processing batches | |
| Remove current state | Doc stays evergreen — architecture and usage only | |
| You decide | Claude decides based on long-term usefulness | ✓ |

**User's choice:** You decide
**Notes:** None

---

## Architecture Detail

| Option | Description | Selected |
|--------|-------------|----------|
| Enhanced text diagram | Expand ASCII flow to show pipeline.py stages, B2, CF Worker, Sanity — readable in any editor | ✓ |
| Mermaid diagram | Mermaid flowchart syntax — renders on GitHub but harder to read raw | |
| You decide | Claude picks diagram style | |

**User's choice:** Enhanced text diagram
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Per-script detail | Each script gets subsection with purpose, inputs, outputs, flags, env vars | |
| Table + orchestrator focus | Keep script summary table, detail pipeline.py only | |
| You decide | Claude decides right level of detail per script | ✓ |

**User's choice:** You decide
**Notes:** None

---

## Usage Guide Style

| Option | Description | Selected |
|--------|-------------|----------|
| Quick-start + reference | Short quick-start (one command for common case) + reference table of all flags | ✓ |
| Step-by-step walkthrough | Numbered steps through full pipeline from raw to published Sanity doc | |
| Examples-driven | Real command examples for each scenario | |

**User's choice:** Quick-start + reference
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, brief section | Short troubleshooting section with 3-5 most common issues | ✓ |
| No | Errors are self-explanatory from script output | |
| You decide | Claude decides based on pipeline error-proneness | |

**User's choice:** Yes, brief troubleshooting section
**Notes:** None

---

## Audience & Tone

| Option | Description | Selected |
|--------|-------------|----------|
| Just you | Assumes familiarity with B2/Bunny/Sanity ecosystem | |
| Future collaborators | Includes brief context on ecosystem, why pipeline exists | ✓ |
| You decide | Claude picks audience level | |

**User's choice:** Future collaborators
**Notes:** None

---

## Claude's Discretion

- Whether to keep/remove/restructure the current state snapshot section
- Per-script documentation depth (table vs subsections)
- Diagram complexity and layout
- Section ordering within the updated doc
- Whether to add a prerequisites/setup section

## Deferred Ideas

None — discussion stayed within phase scope
