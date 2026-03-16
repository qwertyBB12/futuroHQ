# Phase 6: Person Tagging + Data Entry - Context

**Gathered:** 2026-03-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Add a `featuredIn` person/org reference array field to all content types (video, essay, podcast, podcastEpisode, keynote, opEd, news) and a reverse `featuredContent` field on all people types (alumni, collaborator, ledgerPerson). Populate all incomplete alumni, collaborator, and ledgerPerson records to 100% completeness. Consolidate alumni's separate featuredEssays/featuredVideos into the new unified featuredContent field.

</domain>

<decisions>
## Implementation Decisions

### featuredIn field on content types
- Field name: `featuredIn` (internal), label: "Featured In" in Studio
- References all four people types: alumni, person, ledgerPerson, collaborator
- Array of references: `[{ type: 'reference', to: [{ type: 'alumni' }, { type: 'person' }, { type: 'ledgerPerson' }, { type: 'collaborator' }] }]`
- Added to ALL content types: video, essay, podcast, podcastEpisode, keynote, opEd, news
- Placement in video form: after `tags`, before `seo`
- Same relative placement on other content types (after tags, before SEO or governance)

### featuredContent reverse field on people types
- Field name: `featuredContent`, label: "Featured Content"
- References content types: video, essay, podcast, podcastEpisode, keynote, opEd, news
- Added to: alumni, collaborator, ledgerPerson
- On alumni: REPLACES existing `featuredEssays` and `featuredVideos` fields — consolidate into single `featuredContent` array
- Requires data migration: move existing featuredEssays/featuredVideos references into featuredContent, then remove old fields

### Completeness config expansion
- Add `featuredIn` as a completeness check on video (5th check, alongside thumbnail, description, tags, SEO)
- Add all content types getting `featuredIn` to COMPLETENESS_CONFIG: essay, podcast, podcastEpisode, keynote, opEd, news
- Each newly tracked content type gets `featuredIn` as a completeness check (plus any existing checks for types already tracked like podcastEpisode)
- This expands ENRICHMENT_TYPES significantly — dashboard widget, desk lists, and completeness banner will cover more types

### Data sourcing strategy
- Hybrid approach: batch scripts for structured data, manual Studio editing for subjective fields
- Batch scripts consume user-provided CSV/JSON data files
- Data file location: Claude's discretion (likely `.data/` gitignored for personal data safety, or `scripts/data/` for non-sensitive structured data)
- Alumni: batch script for cohortYear, generation, country; manual for bios, photos
- Collaborator: full data including logos — user has images ready
- LedgerPerson: user will provide data files for all 27 empty docs covering currentTitle, organization, and openingPortrait (>50 chars)

### LedgerPerson data population
- All three completeness fields (openingPortrait >50 chars, currentTitle, organization) will be populated for all 27 empty docs
- User confirms data availability for all 27 records
- Batch script approach with user-provided data file

### Claude's Discretion
- Exact data file format (CSV vs JSON) and directory structure
- How to handle the alumni featuredEssays/featuredVideos migration (patch script approach)
- Whether to extract featuredIn as a shared field definition (like surfaceOnField pattern) or define inline per schema
- COMPLETENESS_CONFIG check definitions for newly tracked content types beyond featuredIn
- Ordering of new fields relative to existing fields on people type schemas

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` — SCHM-07 (video person reference field), DATA-01 (alumni data), DATA-02 (collaborator data), DATA-03 (ledgerPerson data)

### Completeness system
- `lib/completeness.ts` — COMPLETENESS_CONFIG, ENRICHMENT_TYPES, GROQ_FILTERS, checkCompleteness function — must be updated with new types and featuredIn checks
- `lib/constants.ts` — GOVERNED_TYPES, BILINGUAL_TYPES, SURFACE_SITES shared constants

### Schemas to modify
- `schemaTypes/video.ts` — Add featuredIn field after tags (line 141), before seo
- `schemaTypes/alumni.ts` — Replace featuredEssays (line 112) and featuredVideos (line 119) with featuredContent; data migration needed
- `schemaTypes/collaborator.ts` — Add featuredContent field
- `schemaTypes/ledgerPerson.ts` — Add featuredContent field
- `schemaTypes/essay.ts` — Add featuredIn field
- `schemaTypes/podcast.ts` — Add featuredIn field
- `schemaTypes/podcastEpisode.ts` — Add featuredIn field
- `schemaTypes/keynote.ts` — Add featuredIn field
- `schemaTypes/opEd.ts` — Add featuredIn field
- `schemaTypes/news.ts` — Add featuredIn field

### Prior phase patterns
- `.planning/phases/04-tech-debt-shared-infrastructure/04-CONTEXT.md` — surfaceOnField shared extraction pattern, lib/constants.ts approach
- `.planning/phases/05-enrichment-tooling/05-CONTEXT.md` — Completeness config design, enrichment dashboard widget, batch script conventions

### Enrichment tooling (integration points)
- `components/dashboard/EnrichmentProgressWidget.tsx` — Dashboard widget that will need to display new tracked types
- `components/inputs/CompletenessInput.tsx` — Per-document completeness banner that needs to support new types
- `deskStructure.ts` — "Needs Enrichment" desk lists need new type entries
- `scripts/batch-enrich.ts` — Existing batch script pattern for data population

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `schemaTypes/blocks/surfaceOnField.ts`: Pattern for shared field extraction — featuredIn could follow the same pattern as a shared `featuredInField` definition
- `lib/completeness.ts`: Existing COMPLETENESS_CONFIG structure handles per-type field checklists with deep validation — extend, don't replace
- `scripts/batch-enrich.ts`: Existing batch script with chunked transactions and rate limiting — reuse pattern for data population scripts
- `components/dashboard/EnrichmentProgressWidget.tsx`: Already renders per-type progress bars — will automatically pick up new ENRICHMENT_TYPES

### Established Patterns
- Shared fields exported from `schemaTypes/blocks/` as `defineField()` calls spread into schema `fields` arrays
- COMPLETENESS_CONFIG uses deep validation functions (not just presence checks)
- GROQ_FILTERS parallel COMPLETENESS_CONFIG for server-side filtering
- Batch scripts use Sanity client with `createOrReplace` in chunked transactions

### Integration Points
- `lib/completeness.ts` COMPLETENESS_CONFIG: Add new type entries and featuredIn checks
- `lib/completeness.ts` GROQ_FILTERS: Add corresponding GROQ filter strings for new types
- `deskStructure.ts`: Add "Needs Enrichment" filtered lists for newly tracked content types
- `sanity.config.ts`: No changes needed — completeness banner already registers globally via COMPLETENESS_CONFIG check

</code_context>

<specifics>
## Specific Ideas

- `featuredIn` references all four people types (alumni, person, ledgerPerson, collaborator) for maximum cross-referencing flexibility
- The reverse `featuredContent` on people types creates bidirectional linking — editors can see from both directions
- Alumni's existing `featuredEssays` + `featuredVideos` should be consolidated into the unified `featuredContent` — cleaner schema, one field instead of two
- User will prepare data files for batch population — scripts should expect CSV/JSON input

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 06-person-tagging-data-entry*
*Context gathered: 2026-03-16*
