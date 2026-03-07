# Autori Mandatum — Security & Content Architecture Pass

## What This Is

A hardening and architectural cleanup pass on the existing Sanity Studio v5 (Autori Mandatum) that serves 6+ sites in the Hector H. Lopez ecosystem. No new features — this project fixes infrastructure gaps identified in an audit: silent failures from unconfigured AI endpoints, lack of a staging dataset, manual deploy workflows, and schema debt (dual tags, redundant person types, keynote duplication, incomplete site settings, experimental types).

## Core Value

Every component in the studio must either work correctly or be gracefully disabled — no silent failures, no orphaned experiments, no schema ambiguity.

## Requirements

### Validated

- Studio serves 7 entities via governance fields (narrativeOwner, platformTier, archivalStatus) — existing
- 33 document types + 3 shared object types registered and functioning — existing
- Custom dashboard with ecosystem health, recent activity, quick actions, site status — existing
- Document badges (Entity, PlatformTier, Archival, Language) rendering correctly — existing
- Document actions (Deploy, AI Derivatives, Archive, Social Distribute) registered — existing
- Civic Modern theme (warm dark palette, Oswald/Mulish/JetBrains Mono) applied — existing
- SEO metadata standardized to `seo` field across all content types — existing
- View panes (Preview, Governance, References, SEO Audit) on governed types — existing
- Content lake populated: 179 content docs with SEO, tags on essays/videos/podcasts — existing

### Active

- [ ] AI endpoint components guard against missing env vars (C2)
- [ ] Staging dataset exists with dataset switching in Studio (H4)
- [ ] Sanity webhook triggers Netlify builds on publish; manual action kept as fallback (H7)
- [ ] Dual tag system consolidated to references only (M1)
- [ ] Person types (person, alumni, ledgerPerson) evaluated for unification (M2)
- [ ] Keynote duplication resolved between keynote type and video contentCategory (M3)
- [ ] Site settings documents exist for all entities, not just Futuro (M4)
- [ ] alumniContinuum experimental type committed or archived (M6)

### Out of Scope

- New content types or features — this is a hardening pass only
- Frontend changes on consuming sites — studio-side only
- Content migration between datasets — staging is for schema experimentation
- Redesigning the dashboard or theme — visual layer is stable

## Context

- Single Sanity Studio instance deployed at hq.benextglobal.com (Netlify)
- Content lake: project `fo6n8ceo`, dataset `production`
- 7 entities: Hector, BeNeXT, Futuro, NeXT, Mitikah, Medikah, Arkah
- AI endpoints (SEO generator, AI derivatives) are env vars that may or may not be configured in all environments
- TriggerDeployAction currently fires a Netlify build hook manually; no automated webhook exists
- Dual tag system: legacy `tags` (string arrays) coexist with `tags_ref` (references to `tag` documents)
- Three person-like types exist: `person` (public profiles), `alumni` (program graduates), `ledgerPerson` (minimal records)
- `keynote` type overlaps with `video` documents that have `contentCategory: 'keynote'`
- Only `siteSettings_futuro` exists; other entities lack site settings documents
- `alumniContinuum` is experimental, overlaps with `alumniDream`

## Constraints

- **Tech stack**: Sanity Studio v5.13.0, React 19, TypeScript — no framework changes
- **Dataset**: Production dataset must remain untouched during schema experiments (hence staging)
- **Backwards compatibility**: Schema changes must not break existing frontends consuming the content lake
- **Deployment**: Netlify static hosting, CSP headers already configured in netlify.toml

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Guard AI components rather than remove them | Endpoints will be configured later; components should gracefully degrade | -- Pending |
| Keep TriggerDeployAction as manual fallback | Emergency deploys need a manual option alongside automated webhook | -- Pending |
| Dataset switcher in Studio UI | Developers need easy way to toggle between production and staging | -- Pending |
| Include medium items as later phases | Complete architectural cleanup in one project rather than fragmenting | -- Pending |

---
*Last updated: 2026-03-07 after initialization*
