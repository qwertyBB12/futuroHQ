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

**Entity:** Cross-cutting (serves Hector, BeNeXT, Futuro, NeXT, Mitikah, Medikah, Arkah)
**Domain:** Content management for the entire Hector H. Lopez ecosystem
**Tech Stack:** Sanity Studio v3 (4.10+), React 19, TypeScript, Tailwind v4
**Repository:** `/projects/clean-studio`
**Project ID:** `fo6n8ceo`
**Dataset:** `production`
**Studio URL:** hq.benextglobal.com

---

## Design System Alignment

**Aligned with:** `@hector-ecosystem/design-system` (Civic Modern)

### Palette — Warm Dark (no blue tint)
| Token | Hex | Role |
|-------|-----|------|
| Founder's Black | `#0E0E0E` | Primary background |
| Surface Raised | `#1A1714` | Cards, inputs |
| Surface Overlay | `#221F1A` | Hover states |
| Copper | `#B17E68` | Distinction, credentials, success |
| Vermillion | `#C84841` | Action, CTAs, brand primary |
| Vermillion Deep | `#813531` | Danger |
| Sandstone | `#F2E5D5` | Primary text on dark |
| Archival Slate | `#8B8985` | Muted text |
| Border Warm | `#2A2520` | Borders, dividers |

### Typography
| Role | Font | Weights |
|------|------|---------|
| Headings / Brand | Oswald | 300-700 |
| Body / UI | Mulish | 300-800 |
| Code / Mono | JetBrains Mono | 400-600 |

---

## Multi-Entity Awareness

This studio manages content for **7 entities**. The `narrativeOwner` governance field determines which entity's rules apply:

| `narrativeOwner` | Accent | Badge Color | Visual Treatment |
|-------------------|--------|-------------|-----------------|
| `hector` | Copper `#B17E68` | warning | Literary, warm, 8px radius |
| `benext` | Vermillion `#C84841` | primary | Institutional, energetic, 8px radius |
| `futuro` | Vermillion `#C84841` | primary | Community, warmest, 16px radius |
| `next` | Copper `#B17E68` | success | Precise, 0px radius |
| `mitikah` | Archival Slate `#8B8985` | warning | Maximum restraint, 0px radius |
| `medikah` | Teal `#2C7A8C` | success | Clinical, 4px radius |

Entity badges appear automatically on all governed document types.

---

## Features & Capabilities

### Plugins
- **structureTool** — Custom desk structure (7 sections)
- **visionTool** — GROQ query playground
- **@sanity/assist** — AI Assist (field-level AI, per-entity instructions)

### Document Badges (automatic on governed types)
- **EntityBadge** — Color-coded `narrativeOwner` label
- **PlatformTierBadge** — Canonical/Personal/Distribution/Institutional
- **ArchivalBadge** — Ephemeral/Archival/Alumni-Only
- **LanguageBadge** — EN/ES on bilingual types

### Document Actions (ecosystem workflows)
- **TriggerDeployAction** — Fires Netlify build hook (env: `SANITY_STUDIO_NETLIFY_BUILD_HOOK_URL`). NOTE: Studio itself now deploys to Cloudflare Pages (`hq.benextglobal.com`) — this hook may also need to be re-pointed at a Cloudflare deploy hook.
- **GenerateAIDerivativesAction** — AI summary/quotes/captions (env: `SANITY_STUDIO_AI_ENDPOINT`)
- **ArchiveAction** — One-click archive to alumni-only
- **SocialDistributeAction** — Send to social automation (env: `SANITY_STUDIO_SOCIAL_WEBHOOK_URL`)

### Dashboard (custom tool)
- **EcosystemHealthWidget** — Document counts per entity, draft/published totals
- **RecentActivityWidget** — Last 12 updated documents with entity color coding
- **QuickActionsWidget** — One-click create for common types
- **EcosystemSitesWidget** — All 7 sites with status (live/development/planned)

### Custom Components
- **MyNavbar** — Civic Modern branded navbar (Oswald title, logo)
- **StudioHead** — Custom favicons, meta, font preconnect
- **StudioLogo** — Brand favicon
- **LivePreview** — Real-time GROQ preview with schema-specific layouts
- **SeoGeneratorInput** — AI-powered SEO metadata
- **MediaBlockInput** — Media embed wrapper

---

## Schema Structure

### Document Types (33)

**Core Content:** `essay`, `video`, `podcast`, `podcastEpisode`, `opEd`, `curatedPost`, `socialPost`, `vlog` (legacy, hidden)

**People & Identity:** `person`, `alumni`, `alumniContinuum`, `ledgerPerson`, `collaborator`

**Projects & Events:** `project`, `futuroSummit`

**Companion Platform:** `alumniDream`, `alumniConversation`, `projectUpdate`, `participantConnection`

**NeXT Accreditation:** `accreditationRecord`, `credential`, `accreditationHourLog`

**Platform Business:** `pricingTier`, `usageRecord`

**Other:** `tag`, `siteSettings_futuro`, `news`, `impactMetric`, `enrollee`, `recruitmentAsset`, `keynote`

### Shared Building Blocks
- `mediaBlock` — Unified media embed (video/audio/image, platform-aware)
- `narrativeBlock` — Deep storytelling framework (12+ fields)
- `seoBlock` — SEO metadata with AI generator
- `commonMeta` — Shared metadata (publish, order, dates, AI derivatives, analytics)
- `governanceFields` — Multi-entity governance (narrativeOwner, platformTier, archivalStatus, postingEntity, conversionTracking)

---

## Project-Specific Rules

@project-specific

1. **Schema changes are high-impact** — Any field addition/removal/rename affects all frontends consuming this data.
2. **Governance fields are mandatory on content types** — `narrativeOwner`, `platformTier`, `archivalStatus` must be present on all content documents that use `governanceFields`.
3. **Bilingual support** — `essay`, `video`, `podcastEpisode`, `opEd` support `language` field (en/es).
4. **Legacy migration** — `vlog` type is hidden from desk but schema is registered. Do not delete.
5. **Dual tag system** — Legacy `tags` (string arrays) coexist with `tags_ref` (references). Prefer `tags_ref` for new work.
6. **`isFuturoHost` flag** — On `collaborator` type, filters `hostInstitution` dropdown on `futuroSummit`.
7. **AI SEO Generator** — `SeoGeneratorInput` requires `AI_SEO_GENERATOR_ENDPOINT` env var.
8. **Player color default** — `mediaBlock.playerColor` defaults to `#162931` (Midnight).

---

## File Structure

```
clean-studio/
├── sanity.config.ts              ← Master config (theme, plugins, badges, actions, tools)
├── deskStructure.ts              ← Desk organization (7 sections)
├── theme.ts                      ← buildLegacyTheme wrapper
├── palettes.ts                   ← Civic Modern token map
├── styles.css                    ← Global styles (Oswald + Mulish + warm dark)
├── tailwind.config.js            ← Tailwind v4 with ecosystem colors
├── schemaTypes/
│   ├── index.ts                  ← 33 type exports
│   ├── blocks/
│   │   ├── commonMeta.ts
│   │   └── governanceBlock.ts
│   ├── mediaBlock.ts
│   ├── narrativeBlock.ts
│   └── seoBlock.ts
├── components/
│   ├── MyNavbar.tsx              ← Civic Modern branded navbar
│   ├── StudioLogo.tsx
│   ├── StudioHead.tsx
│   ├── badges/
│   │   ├── EntityBadge.ts
│   │   ├── PlatformTierBadge.ts
│   │   ├── LanguageBadge.ts
│   │   └── ArchivalBadge.ts
│   ├── actions/
│   │   ├── TriggerDeployAction.ts
│   │   ├── GenerateAIDerivativesAction.ts
│   │   ├── ArchiveAction.ts
│   │   └── SocialDistributeAction.ts
│   ├── dashboard/
│   │   ├── DashboardLayout.tsx
│   │   ├── EcosystemHealthWidget.tsx
│   │   ├── RecentActivityWidget.tsx
│   │   ├── QuickActionsWidget.tsx
│   │   └── EcosystemSitesWidget.tsx
│   ├── inputs/
│   │   ├── MediaBlockInput.tsx
│   │   └── SeoGeneratorInput.tsx
│   ├── previews/
│   │   └── LivePreview.tsx
│   └── utils/
│       └── fetchSeoSuggestion.ts
└── CLAUDE.md                     ← You are here
```

---

## Deployment

**Studio host:** Cloudflare Pages, project `clean-studio` → `hq.benextglobal.com`.
**Git auto-deploy is OFF** for this project — pushes to `main` do NOT trigger a rebuild.

### Deploy steps (every schema or deskStructure change)

```bash
cd /Users/hectorhlopez/projects/clean-studio
pnpm run build                                          # sanity build → dist/
npx wrangler pages deploy dist --project-name=clean-studio --commit-dirty=true
```

That's it. The CF dashboard will return a deployment URL like `https://<hash>.clean-studio.pages.dev`; the custom domain `hq.benextglobal.com` updates within seconds.

### What NOT to do

- **Do NOT** run `sanity deploy` and call it shipped. That deploys to `futuro-hub-studio.sanity.studio` — a secondary Studio that Hector does not edit on. The canonical Studio is hq.benextglobal.com.
- **Do NOT** push to GitHub and assume Netlify will rebuild. Netlify has been retired; the `netlify.toml` and `SANITY_STUDIO_NETLIFY_BUILD_HOOK_URL` are historical only.
- **Do NOT** skip the build step. Wrangler deploys whatever is in `dist/` — without a fresh build, your changes won't ship.

### Confirm the deploy landed

```bash
curl -sSI https://hq.benextglobal.com | grep -i 'cf-ray'    # should return a fresh ray ID
```

If the Studio shows "Structure tool has crashed: Schema type with name X not found", a doc-type was referenced in `deskStructure.ts` (or elsewhere) but isn't registered in `schemaTypes/index.ts`. Most common cause: a schema archived to `schemaTypes/_deprecated/` without removing its desk reference.

---

## Environment Variables

| Variable | Purpose | Required |
|----------|---------|----------|
| `SANITY_STUDIO_NETLIFY_BUILD_HOOK_URL` | (Legacy) Netlify deploy trigger | Deprecated — Studio now deploys to Cloudflare Pages at hq.benextglobal.com. `netlify.toml` left for historical reference only. |
| `SANITY_STUDIO_SOCIAL_WEBHOOK_URL` | Social media automation (Make.com) | For social action |
| `SANITY_STUDIO_AI_ENDPOINT` | AI derivatives generation | For AI action |
| `AI_SEO_GENERATOR_ENDPOINT` | SEO metadata generation | For SEO input |
| `SANITY_STUDIO_FAVICON_VERSION` | Cache-busting favicon version | Optional |

---

## Desk Structure

```
Dashboard              ← Ecosystem command center (custom tool)
Projects & Events      ← project, futuroSummit
People & Collaborators ← person, alumni, ledgerPerson, collaborator
Media & Content        ← essay, video, podcast, podcastEpisode
Taxonomy & Settings    ← tag, siteSettings_futuro
Companion Platform     ← alumniDream, alumniConversation, projectUpdate, participantConnection
NeXT Accreditation     ← accreditationRecord, credential, accreditationHourLog
Platform Business      ← pricingTier, usageRecord
All Documents          ← Ungrouped fallback
```

---

## GROQ Pattern for Design Context

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

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Feb 2026 | Initial — governance layer alignment |
| 2.0 | Mar 2026 | Civic Modern theme alignment, AI Assist, Dashboard, Document Badges & Actions, Social distribution, ecosystem-wide optimization |
