# Phase 5: Enrichment Tooling - Context

**Gathered:** 2026-03-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Build completeness indicators, filtered desk lists, an enrichment dashboard widget, and batch update scripts so editors can see exactly which records are incomplete and navigate directly to them — no hunting, no Vision queries required.

</domain>

<decisions>
## Implementation Decisions

### Completeness rules
- Per-type field checklist approach: each tracked type has a defined list of required fields — a document is "complete" when all checklist fields have values
- Checklists defined in `lib/completeness.ts` as a shared constants file, next to `lib/constants.ts` — single source of truth importable by dashboard widget, progress bar, desk filters, and batch scripts
- Tracked types for this phase: alumni, collaborator, ledgerPerson, video, podcastEpisode (the types with known content gaps per PROJECT.md)
- Deep validation for field checks: bio must have >50 chars, image must have asset reference, arrays must have >0 items — not just top-level presence

### Desk integration
- "Needs Enrichment" filtered lists nested under each tracked type in its current tier (e.g., Daily > Videos > [All Videos | Needs Enrichment])
- Static title "Needs Enrichment" — no dynamic count in the desk title (counts come from the dashboard widget)
- Only the 5 tracked types get the nested structure; other types keep their current flat list
- Enrichment-opened documents use the same view tabs as regular lists (Content, Preview, Governance, References, SEO) — no separate Enrichment view tab

### Dashboard widget
- Per-type progress bars: one row per tracked type showing type name, progress bar, percentage, and counts (e.g., "23/28 complete")
- Copper (#B17E68) fill color on dark background — consistent with Civic Modern palette, not entity-specific colors
- Fetch on dashboard load only (no real-time listener) — matches EcosystemHealthWidget pattern, enrichment data changes slowly
- Placed after EcosystemHealthWidget in the dashboard grid (second widget, prominent position for v1.1 workflow)
- Uses existing glassPanel/glassCard styling from glassStyles.ts

### Progress bar UX
- Banner above form fields showing "X/Y fields complete (Z%)" with a progress bar and comma-separated list of missing field names
- Banner appears on ALL documents of tracked types — when 100% complete, shows a green "Complete" state for positive confirmation
- Live update: banner recalculates as editor fills in fields using Sanity form value from document props — immediate feedback loop
- Uses Sanity's document.components or form components API to inject above the form

### Claude's Discretion
- Exact GROQ filter queries for "Needs Enrichment" desk lists
- Progress bar component implementation details (styled-components vs inline styles)
- Batch script chunking strategy (rate-limit-safe, ~25 req/s, ~100 mutations/transaction per ENRH-04)
- How to access current document field values in the banner component (useFormValue vs document props)
- Deep validation thresholds per field type (exact char counts, array minimums)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` — ENRH-01 through ENRH-04: filtered desk lists, completeness dashboard, per-document progress bar, batch update scripts

### Existing patterns
- `.planning/codebase/CONVENTIONS.md` — Dashboard widget pattern (glassPanel, useClient, GROQ), badge/action patterns, file naming conventions
- `.planning/codebase/STRUCTURE.md` — Where to add new dashboard widgets (DashboardLayout.tsx grid), new custom inputs (components.input API), desk structure helpers
- `.planning/codebase/ARCHITECTURE.md` — GOVERNED_TYPES role, document component registration in sanity.config.ts

### Prior phase context
- `.planning/phases/04-tech-debt-shared-infrastructure/04-CONTEXT.md` — Constants extracted to lib/constants.ts (GOVERNED_TYPES, SURFACE_SITES, BILINGUAL_TYPES); surfaceOn field pattern; governance field spread pattern

### Key source files
- `lib/constants.ts` — Shared constants (GOVERNED_TYPES, SURFACE_SITES) that completeness.ts sits alongside
- `components/dashboard/EcosystemHealthWidget.tsx` — Reference pattern for the enrichment widget (GROQ count(), glassPanel, entity grid)
- `components/dashboard/glassStyles.ts` — Shared glass morphism CSS for dashboard widgets
- `components/dashboard/DashboardLayout.tsx` — Where to register the new widget in the grid
- `deskStructure.ts` — Desk navigation structure with listWithPreview helper and GROQ filter patterns (Writer's Desk)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `components/dashboard/glassStyles.ts`: glassPanel and glassCard CSS objects — use for enrichment widget styling
- `components/dashboard/EcosystemHealthWidget.tsx`: Pattern for GROQ-driven dashboard widgets with entity grid layout
- `deskStructure.ts` > `listWithPreview()`: Helper for document list items with view tabs — extend for nested enrichment lists
- `lib/constants.ts`: GOVERNED_TYPES Set — enrichment tracked types are a subset; completeness.ts can import from here

### Established Patterns
- Dashboard widgets: `useClient({apiVersion: '2024-10-23'})` + `useEffect` fetch + `glassPanel` styling
- Desk structure: GROQ filter-based document lists (Writer's Desk pattern with `S.documentList().filter()`)
- Document components: `sanity.config.ts` registers badges/actions via `document.badges` and `document.actions` callbacks — similar pattern for `document.components` or form wrapping
- Constants: `UPPER_SNAKE_CASE` with `new Set()` for membership checks

### Integration Points
- `sanity.config.ts`: Register completeness banner component via document form wrapper
- `deskStructure.ts`: Modify listWithPreview for tracked types to include nested "All" + "Needs Enrichment" children
- `components/dashboard/DashboardLayout.tsx`: Add EnrichmentProgressWidget to the dashboard grid after EcosystemHealthWidget
- `lib/completeness.ts` (new): Central completeness config imported by widget, banner, desk filters, and batch scripts

</code_context>

<specifics>
## Specific Ideas

- Progress bars should feel like the EcosystemHealthWidget — same Oswald headings, same glassCard aesthetic, Copper fill bars
- The banner at the top of documents should provide immediate, satisfying feedback as editors fill in fields — "one more field and you're done" motivation
- Deep validation means the system catches "technically present but useless" fields (e.g., a 3-word bio doesn't count as complete)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-enrichment-tooling*
*Context gathered: 2026-03-16*
