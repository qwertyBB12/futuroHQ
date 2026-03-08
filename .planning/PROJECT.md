# Autori Mandatum — Sanity Studio HQ

## What This Is

The centralized Sanity Studio v5 (Autori Mandatum) serving 7 sites in the Hector H. Lopez ecosystem. Manages 33+ document types with multi-entity governance, custom dashboard, AI-powered components, and automated deploy pipeline. Hardened in v1.0 with env var guards, staging infrastructure, and schema consolidation.

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
- AI endpoint components guard against missing env vars — v1.0
- Staging dataset exists with dataset switching in Studio — v1.0
- Sanity webhook triggers Netlify builds on publish; manual action kept as fallback — v1.0
- Dual tag system consolidated to references only — v1.0
- Person types documented as intentionally separate with clear rationale — v1.0
- Keynote duplication resolved: keynote is canonical speech hub — v1.0
- Site settings documents exist for all 7 entities — v1.0
- alumniContinuum committed as governed type with clear purpose — v1.0

### Active

(None — define requirements in next milestone via `/gsd:new-milestone`)

### Out of Scope

- New content types or features — hardening pass only (v1.0 decision)
- Frontend changes on consuming sites — studio-side only
- Content migration between datasets — staging is for schema experimentation
- Redesigning the dashboard or theme — visual layer is stable

## Context

**Current State (post-v1.0):**
- Sanity Studio v5.13.0, React 19, TypeScript
- Deployed at hq.benextglobal.com (Netlify)
- Content lake: project `fo6n8ceo`, datasets `production` + `staging`
- 7 entities: Hector, BeNeXT, Futuro, NeXT, Mitikah, Medikah, Arkah
- Dual-workspace config with basePath routing (/production, /staging)
- Automated Netlify deploy webhook on production publish
- All content schemas use reference-based tags (no legacy string tags in schema)
- Keynote is the canonical speech type; video schema cleaned of keynote fields
- Site settings singletons for all 7 entities
- 37 files changed, +2,533/-156 lines in v1.0

**Known tech debt:**
- alumniContinuum missing from `sanity.config.ts` GOVERNED_TYPES (no badges/actions)
- Pre-existing TypeScript errors in `migrations/` and `scripts/` directories
- `seoBlock.ts` InitialValueResolverContext.document type error (pre-existing)

## Constraints

- **Tech stack**: Sanity Studio v5.13.0, React 19, TypeScript — no framework changes
- **Dataset**: Production dataset must remain untouched during schema experiments (use staging)
- **Backwards compatibility**: Schema changes must not break existing frontends consuming the content lake
- **Deployment**: Netlify static hosting, CSP headers configured in netlify.toml

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Guard AI components rather than remove them | Endpoints will be configured later; components should gracefully degrade | Good — clear disabled states with guidance text |
| Keep TriggerDeployAction as manual fallback | Emergency deploys need a manual option alongside automated webhook | Good — coexists with webhook without interference |
| Dataset switcher in Studio UI | Developers need easy way to toggle between production and staging | Good — basePath routing, shared config extraction |
| Include medium items as later phases | Complete architectural cleanup in one project rather than fragmenting | Good — all schema debt resolved in single pass |
| useToast from @sanity/ui not sanity | sanity package does not re-export useToast | Good — discovered via TypeScript compilation |
| SANITY_STUDIO_ prefix for all browser env vars | Sanity only exposes SANITY_STUDIO_ prefixed vars to browser bundle | Good — fixed silent SEO failure |
| Remove string tags, rename tags_ref to tags | Cleaner API surface; data preserved in content lake | Good — consistent reference pattern |
| Person types intentionally separate | person (public), alumni (program graduates), ledgerPerson (narrative intelligence) serve distinct purposes | Good — documented in schema descriptions |
| Keynote as canonical hub type | Single source of truth with cross-references to video/essay/podcast | Good — eliminates contentCategory overlap |
| Webhook scoped to production only | Staging publishes should not trigger deploys | Good — clean separation |

---
*Last updated: 2026-03-08 after v1.0 milestone*
