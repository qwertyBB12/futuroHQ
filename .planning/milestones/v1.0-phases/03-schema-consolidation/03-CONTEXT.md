# Phase 3: Schema Consolidation - Context

**Gathered:** 2026-03-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Resolve schema debt across 5 requirements: consolidate dual tag system to references only, document person type separation rationale, choose keynote canonical representation, create site settings for all 7 entities, and commit or archive alumniContinuum. Schema definitions only — no content data migration, no new content types, no frontend changes.

</domain>

<decisions>
## Implementation Decisions

### Tag consolidation
- Standardize field name to `tags` everywhere (reference to tag documents)
- Remove legacy string `tags` fields from schemas that have dual fields (socialPost, curatedPost, vlog)
- Rename `tags_ref` to `tags` on schemas that currently have both field names
- Leave video's nested legacyYouTubeData object untouched — don't modify legacy nested object internals
- Don't add tags to schemas that currently lack them — only fix existing dual-tag debt
- Existing string tag data stays in content lake (Sanity preserves data on schema field removal)

### Person types
- Keep all three types separate: person, alumni, ledgerPerson
- Document rationale in each type's `description` field in defineType():
  - `person`: Simple public profiles (name, role, bio, photo) — cross-entity identity records
  - `alumni`: Futuro/BeNeXT program graduates with Companion Platform integration (30+ fields)
  - `ledgerPerson`: Vanguard Ledger narrative intelligence dossiers (soulmarks, doctrine, alignment grids)
- Leave person and ledgerPerson ungoverned (no governanceFields) — they are cross-cutting identity records, not multi-entity content. Document this as intentional.

### Keynote resolution
- `keynote` type is the canonical representation — keynotes are events first, videos second
- Remove keynote-specific conditional fields from video schema: speechText, linkedEssay, linkedReflection, linkedPodcastEpisode, keynoteVenue
- Remove 'keynote' from video's contentCategory options list
- Enrich keynote type with fields migrated from video: speechText (rich text), linkedVideo (reference to video), linkedEssay (reference to essay), linkedPodcastEpisode (reference to podcastEpisode)
- Keynote becomes the hub connecting all representations of a speech (video, essay, podcast)

### Site settings
- Create 6 new site settings types following siteSettings_futuro pattern: siteSettings_hector, siteSettings_benext, siteSettings_next, siteSettings_mitikah, siteSettings_medikah, siteSettings_arkah
- Same base field structure: siteTitle, metaDescription, defaultSocialImage, globalCta, socialLinks, footerCopy
- Place all 7 in the existing "Taxonomy & Settings" desk section, grouped together

### alumniContinuum
- Keep and commit — has clear purpose: curated alumni-only content with access level scoping
- Unhide from desk structure (remove from hidden types list)
- Add to Companion Platform section in desk structure
- Update schema description to remove "pending review" language

### Claude's Discretion
- Exact ordering of fields when enriching keynote type
- Whether to add AI Assist instructions to new site settings types
- Desk structure sub-grouping for site settings (flat list vs nested)

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches for all implementation details.

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `governanceFields` (blocks/governanceBlock.ts): Shared governance field spread — used on alumni, keynote, alumniContinuum but NOT person/ledgerPerson
- `commonMeta` (blocks/commonMeta.ts): Shared metadata fields — used on alumniContinuum
- `siteSettings_futuro`: Template for all new entity settings types
- `tag.ts`: Tag document type already has description noting preference for references over string tags

### Established Patterns
- Schema descriptions include AI Assist instructions (narrativeOwner defaults, tone guidance) — follow this for new/updated types
- Conditional field visibility via `hidden: ({ document }) => ...` — used on video's keynote fields
- `defineType`/`defineField` from sanity — standard across all schemas
- Desk structure uses `listWithPreview` helper and `S.documentTypeListItem` for organization

### Integration Points
- `schemaTypes/index.ts`: Must register new siteSettings types
- `deskStructure.ts`: Must update hidden list (remove alumniContinuum), add siteSettings to Taxonomy & Settings, add alumniContinuum to Companion Platform
- `deskStructure.ts` GOVERNED_TYPES and hiddenTypes sets: alumniContinuum needs to move from hidden to visible

</code_context>

<deferred>
## Deferred Ideas

- 27 empty ledgerPerson documents need content enrichment — content task, not schema task
- Adding tags to schemas that currently lack them (alumniDream, project, futuroSummit, etc.) — future enhancement if needed

</deferred>

---

*Phase: 03-schema-consolidation*
*Context gathered: 2026-03-08*
