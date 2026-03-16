# Phase 4: Tech Debt + Shared Infrastructure - Context

**Gathered:** 2026-03-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Resolve v1.0 governance debt (alumniContinuum missing from GOVERNED_TYPES in sanity.config.ts) and extract surfaceOn + GOVERNED_TYPES as shared constants before all subsequent schema work. All governed document types display correct badges and actions; surfaceOn is a single shared definition used across all content types including Arkah.

</domain>

<decisions>
## Implementation Decisions

### surfaceOn editor experience
- surfaceOn field placed inside a "Distribution" field group on all schemas receiving it
- Distribution group is always visible (not collapsed)
- Generic description: "Which ecosystem sites should display this content" — not per-type
- Medikah kept in the site options list (already in essay data; removing would orphan existing values)

### surfaceOn site values
- Arkah added as 7th site: title "Arkah", value "arkah"
- All labels standardized to brand names: Hector H. Lopez, BeNeXT, Futuro, NeXT, Arkah, Mitikah, Medikah
- Site ordering follows brand hierarchy: Hector H. Lopez > BeNeXT > Futuro > NeXT > Arkah > Mitikah > Medikah
- String values unchanged: hectorhlopez, benext, futuro, next, arkah, mitikah, medikah

### Constants extraction scope
- GOVERNED_TYPES extracted to `lib/constants.ts`, imported by both `sanity.config.ts` and `deskStructure.ts`
- BILINGUAL_TYPES also moved to `lib/constants.ts` alongside GOVERNED_TYPES
- SURFACE_SITES exported from `lib/constants.ts` as standalone constant (used by surfaceOnField.ts, batch scripts, dashboard, GROQ audits)
- groupedDocTypes stays in `deskStructure.ts` (desk-specific, no cross-file usage)

### alumniContinuum data safety
- GROQ audit runs BEFORE adding alumniContinuum to GOVERNED_TYPES — find docs with missing governance fields
- Patch existing alumniContinuum documents with defaults before enabling badges
- Default narrativeOwner: `benext`
- Default platformTier: `canonical`
- Default archivalStatus: Claude's discretion (likely `archival` based on type purpose)

### Claude's Discretion
- Exact file structure within `lib/constants.ts` (type exports, naming conventions)
- GROQ audit query shape and patching approach for alumniContinuum
- How surfaceOnField.ts imports from constants vs defines inline
- Whether essay.ts Distribution group also wraps existing surfaceOn or stays loose for backward compatibility

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Governance architecture
- `.planning/research/ARCHITECTURE.md` — Anti-Pattern 5 (duplicated GOVERNED_TYPES), surfaceOn field extension pattern (Feature 2), shared constant extraction approach
- `.planning/research/PITFALLS.md` — Pitfall 6 (surfaceOn casing drift), Pitfall 11 (alumniContinuum missing governance data side effects)
- `.planning/codebase/CONCERNS.md` — Duplicated GOVERNED_TYPES constant issue and fix approach

### Existing patterns
- `.planning/codebase/CONVENTIONS.md` — UPPER_SNAKE_CASE for config objects/sets, file naming conventions
- `.planning/codebase/STRUCTURE.md` — How to add governed types (4-step checklist at line 210)
- `.planning/codebase/ARCHITECTURE.md` — GOVERNED_TYPES Set role in badge/action registration

### Requirements
- `.planning/REQUIREMENTS.md` — SCHM-01 through SCHM-04, SCHM-08

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `schemaTypes/essay.ts` (line 92): Existing surfaceOn definition with grid layout — extract and replace with shared import
- `schemaTypes/blocks/governanceBlock.ts`: Pattern for shared field exports (array of defineField) — surfaceOnField follows same pattern but as single field
- `components/views/GovernanceView.tsx` (line 93): Already reads `data.surfaceOn` and renders site badges — no changes needed when new types get surfaceOn
- `components/previews/LivePreview.tsx` (line 22): Queries surfaceOn in GROQ — works automatically for new types

### Established Patterns
- Governance fields use exported array spread into schema `fields` — surfaceOnField should be a single exported `defineField()` call
- Constants use `UPPER_SNAKE_CASE` with `new Set()` for type membership checks
- Field groups exist on some types (e.g., video has groups) — Distribution group is a new addition

### Integration Points
- `sanity.config.ts` line 38: GOVERNED_TYPES Set — badge and action registration
- `deskStructure.ts` line 21: GOVERNED_TYPES Set — view pane assignment
- `sanity.config.ts` line 53: BILINGUAL_TYPES Set — language badge registration
- Essay, video, podcast, podcastEpisode, keynote, news schemas — all receive surfaceOnField import

</code_context>

<specifics>
## Specific Ideas

- Brand hierarchy ordering reflects the ecosystem's organizational structure: personal brand (Hector) first, then institutional entities in decreasing activity/prominence
- Labels should feel like "which brand" not "which URL" — editors think in entities, not domains

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-tech-debt-shared-infrastructure*
*Context gathered: 2026-03-16*
