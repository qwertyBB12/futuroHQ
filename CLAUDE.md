# BENEXT GLOBAL HQ STUDIO
## Project-Specific Agent Instructions

---

## Governance Integration

@extends /.governance/guides/07-design-language.md

This is the Sanity Studio serving all entities in the ecosystem. Schema changes affect every frontend.

**Always read first:**
1. `/.governance/CLAUDE.md` (global instructions)
2. `/.governance/quick-ref/forbidden.md` (absolute rules)
3. `/.governance/schemas/sanity-briefing.md` (schema overview)
4. This file (studio-specific)

---

## Project Context

**Entity:** Cross-cutting (serves Héctor, BeNeXT, Futuro, NeXT, Mítikah, Medikah)
**Domain:** Content management for the entire Héctor H. López ecosystem
**Tech Stack:** Sanity Studio v3, React, TypeScript
**Repository:** `/projects/clean-studio`
**Project ID:** `fo6n8ceo`
**Dataset:** `production`
**Studio URL:** hq.benextglobal.com

---

## Multi-Entity Awareness

This studio manages content for **all 6 entities**. The `narrativeOwner` governance field on content documents determines which entity's rules apply:

| `narrativeOwner` Value | Entity Guide | Accent | Visual Treatment |
|------------------------|-------------|--------|-----------------|
| `Hector` | `01-hector-lopez.md` | Gold `#D4AF37` | Literary, warm |
| `BeNeXT` | `02-benext-global.md` | Coral `#E8735A` | Institutional, energetic |
| `Futuro` | `03-futuro.md` | Slate `#8A8D91` | Community, warmest |
| `NeXT` | `04-next.md` | Gold `#D4AF37` | Precise, 0px radius |
| `Mitikah` | `05-mitikah.md` | Slate `#8A8D91` | Maximum restraint, 0px radius |
| `Medikah` | `06-medikah.md` | Teal `#2C7A8C` | Clinical, 4px radius |

When modifying schemas that affect content display, ensure the frontend can apply the correct vessel tokens based on `narrativeOwner`.

---

## Schema Structure

### Document Types (21)

**People & Identity:**
`person`, `alumni`, `alumniContinuum`, `ledgerPerson`, `collaborator`

**Projects & Events:**
`project`, `futuroSummit`

**Media & Content:**
`essay`, `video`, `podcast`, `podcastEpisode`, `opEd`, `curatedPost`, `socialPost`, `vlog` (legacy, hidden)

**Taxonomy & Settings:**
`tag`, `siteSettings_futuro`

### Shared Building Blocks
- `mediaBlock` — Unified media embed (video/audio/image, platform-aware)
- `narrativeBlock` — Deep storytelling framework (12+ fields)
- `seoBlock` — SEO metadata with AI generator (`SeoGeneratorInput`)
- `commonMeta` — Shared metadata (publish, order, dates, AI derivatives, analytics)
- `governanceFields` — Multi-entity content governance (narrativeOwner, platformTier, archivalStatus, postingEntity, conversionTracking)

---

## Project-Specific Rules

@project-specific

1. **Schema changes are high-impact** — Any field addition/removal/rename affects all frontends consuming this data. Coordinate changes.
2. **Governance fields are mandatory on content types** — `narrativeOwner`, `platformTier`, `archivalStatus` must be present on all content documents that use `governanceFields`.
3. **Bilingual support** — `essay`, `video`, `podcastEpisode`, `opEd` support `language` field (en/es). Video has conditional `titleEs`/`descriptionEs` fields.
4. **Legacy migration** — `vlog` type is hidden from desk structure but schema is registered. `video` type has `legacyVlog` read-only field for migrated data. Do not delete `vlog` schema.
5. **Dual tag system** — Legacy `tags` (string arrays) coexist with `tags_ref` (references to `tag` documents). Prefer `tags_ref` for new work. Do not remove legacy `tags` fields.
6. **`isFuturoHost` flag** — On `collaborator` type, used to filter `hostInstitution` on `futuroSummit`. Only collaborators marked as Futuro hosts appear in the dropdown.
7. **AI SEO Generator** — `SeoGeneratorInput` component requires `AI_SEO_GENERATOR_ENDPOINT` environment variable. Falls back gracefully if not set.
8. **Player color default** — `mediaBlock.playerColor` defaults to `#1B2A41` (Midnight Blue). This is intentional brand alignment.

---

## File Structure

```
clean-studio/
├── sanity.config.ts         ← Studio config (project fo6n8ceo, custom theme)
├── deskStructure.ts         ← Desk organization (4 sections)
├── schemaTypes/
│   ├── [document types]     ← 17 document schemas
│   ├── mediaBlock.ts        ← Shared media object
│   ├── narrativeBlock.ts    ← Shared narrative object
│   ├── seoBlock.ts          ← Shared SEO object
│   └── blocks/
│       ├── commonMeta.ts    ← Shared metadata fields
│       └── governanceBlock.ts ← Governance fields
├── components/
│   ├── inputs/
│   │   ├── MediaBlockInput.tsx
│   │   └── SeoGeneratorInput.tsx
│   └── previews/
│       └── LivePreview.tsx
├── theme.ts                 ← Custom studio theme
└── CLAUDE.md                ← You are here
```

---

## Desk Structure

```
Projects & Events     → project, futuroSummit
People & Collaborators → person, alumni, alumniContinuum, ledgerPerson, collaborator
Media & Content       → essay, video, podcast, podcastEpisode, curatedPost, socialPost
Taxonomy & Settings   → tag, siteSettings_futuro
```

---

## GROQ Pattern for Design Context

Frontends should query `designContext` alongside content:

```groq
*[_type == "essay" && slug.current == $slug][0] {
  title,
  body,
  language,
  "designContext": {
    "vessel": narrativeOwner,
    "tier": platformTier,
    "archival": archivalStatus,
    "tags": tags_ref[]->{ label, slug, color }
  }
}
```

---

## Webhooks

- **Netlify build hooks** — Triggered on `document.publish` / `document.update`
- **Make scenario hooks** — Automation workflows

Configured in Sanity Manage, not in code. See `sanity.config.ts` comments.

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Feb 2026 | Initial — governance layer alignment |
