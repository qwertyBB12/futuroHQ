# Phase 7: Video Schema B2/Bunny Fields - Context

**Gathered:** 2026-03-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Extend the video schema with B2/Bunny storage fields and a videoSource migration-tracking enum. Editors can manually enter B2/Bunny metadata while the automated pipeline (Phase 8) is being built. Existing wistia-based videos must not break. Completeness checks updated to be source-aware.

</domain>

<decisions>
## Implementation Decisions

### Field group design
- B2/Bunny fields live in a field group — Claude's discretion on name and placement (separate "Storage" group or within existing "Distribution" group)
- Group is NOT collapsed by default — always visible in the form
- videoUrl validation (currently required) — Claude's discretion on conditional logic (likely required only when wistia, optional when b2)

### Source transition UX
- videoSource enum: `wistia | b2`
- New videos default to `b2` (initialValue: 'b2') — the ecosystem is transitioning off Wistia
- Existing videos without videoSource treated as wistia in UI conditional logic (null = wistia)
- Conditional field visibility: when videoSource is 'b2', hide wistia-specific fields (videoUrl, platform). When 'wistia' or null, hide B2/Bunny fields. Clean form showing only relevant fields.
- No backfill migration needed for existing videos — null handling in hidden logic suffices

### Completeness integration
- Storage-complete for B2 videos: `cdnUrl` populated (single field check)
- Source-aware completeness: wistia videos check `videoUrl`, b2 videos check `cdnUrl`
- Existing completeness checks (thumbnail, description, tags, seo, featuredIn) remain unchanged
- GROQ_FILTERS for video updated to be source-aware

### Claude's Discretion
- Exact field group name and placement within the video schema
- videoUrl conditional validation implementation
- B2/Bunny field labels and descriptions
- Whether to extract B2 fields as a shared block (like surfaceOnField) or define inline in video.ts
- GROQ filter syntax for source-aware completeness checks

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` — SCHM-05 (B2/Bunny fields: b2Key, cdnUrl, duration, resolution, thumbnailUrl in collapsible group), SCHM-06 (videoSource enum wistia|b2 defaulting to wistia)

### Video schema (primary modification target)
- `schemaTypes/video.ts` — Current video schema with videoUrl (required), platform, duration, thumbnailImage, legacyVlog block, surfaceOnField, featuredInField, governanceFields

### Completeness system
- `lib/completeness.ts` — COMPLETENESS_CONFIG (video has 5 checks: thumbnail, description, tags, seo, featuredIn), GROQ_FILTERS, checkCompleteness function — must be updated with source-aware logic

### Prior phase patterns
- `.planning/phases/04-tech-debt-shared-infrastructure/04-CONTEXT.md` — Shared field extraction pattern (surfaceOnField in `schemaTypes/blocks/`), constants in `lib/constants.ts`
- `.planning/phases/05-enrichment-tooling/05-CONTEXT.md` — Completeness config design, deep validation, GROQ filter pattern
- `.planning/phases/06-person-tagging-data-entry/06-CONTEXT.md` — featuredInField shared extraction pattern

### Shared infrastructure
- `lib/constants.ts` — GOVERNED_TYPES, BILINGUAL_TYPES, SURFACE_SITES
- `schemaTypes/blocks/surfaceOnField.ts` — Pattern for shared field definitions
- `schemaTypes/blocks/featuredInField.ts` — Another shared field pattern
- `components/inputs/CompletenessInput.tsx` — Per-document completeness banner (needs source-aware support)
- `components/dashboard/EnrichmentProgressWidget.tsx` — Dashboard widget (will reflect updated GROQ_FILTERS automatically)
- `deskStructure.ts` — "Needs Enrichment" desk lists (video filter needs source-aware update)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `schemaTypes/blocks/surfaceOnField.ts` + `featuredInField.ts`: Pattern for shared field definitions — B2 fields could follow the same extraction pattern
- `lib/completeness.ts`: Existing checkCompleteness function and GROQ_FILTERS — extend with source-aware branching
- `schemaTypes/video.ts`: Already has `groups: [{name: 'distribution', title: 'Distribution'}]` — can add a second group for storage

### Established Patterns
- Shared fields: `defineField()` exported from `schemaTypes/blocks/` and spread or imported into schema `fields` arrays
- Conditional field visibility: `hidden: ({document}) => condition` used extensively (e.g., Spanish title hidden when language doesn't include 'es')
- Collapsible groups: `options: {collapsible: true, collapsed: true}` on object fields (legacyVlog uses this)
- Deep validation in completeness: functions check type + value, not just presence

### Integration Points
- `schemaTypes/video.ts`: Primary target — add videoSource field, B2/Bunny fields, conditional hidden logic
- `lib/completeness.ts`: Update video checks to branch on videoSource, update GROQ_FILTERS
- `components/inputs/CompletenessInput.tsx`: May need update if completeness check signature changes (currently calls `checkCompleteness(doc, schemaType)`)
- `deskStructure.ts`: Video "Needs Enrichment" GROQ filter needs source-aware update

</code_context>

<specifics>
## Specific Ideas

- The transition is FROM Wistia TO B2/Bunny — new videos default to b2, not wistia
- SCHM-06 requirement says "defaults to wistia" but user decision overrides: new videos default to b2 since that's the migration direction
- The success criterion mentions `bunnyVideoId` but the actual field set from SCHM-05 is b2Key, cdnUrl, duration, resolution, thumbnailUrl — use `cdnUrl` as the storage-complete indicator
- Existing 84 videos have no videoSource value — treat null as wistia in all conditional logic, no batch migration needed

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 07-video-schema-b2-bunny-fields*
*Context gathered: 2026-03-16*
