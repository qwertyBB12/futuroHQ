# Autori Mandatum — Sanity Studio HQ

## What This Is

The centralized Sanity Studio v5 (Autori Mandatum) serving 6 active sites in the Hector H. Lopez ecosystem (hectorhlopez.com, benextglobal.com, futuro.ngo, next.ngo, arkah.co, mitikah — Medikah excluded). Manages 33+ document types with multi-entity governance, custom dashboard, AI-powered components, and automated deploy pipeline. Hardened in v1.0; now entering content production phase with enrichment tooling, cross-site content surfacing, and self-hosted media pipeline.

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

- [ ] Enrichment tooling — completeness indicators, filtered desk lists, batch operations, enrichment dashboard
- [ ] Data entry — populate all alumni photos/bios, collaborator details, content metadata (descriptions, thumbnails, tags)
- [ ] surfaceOn field extended from essays to all content types (video, podcast, podcastEpisode, keynote, news) with Arkah added
- [ ] Media pipeline — Backblaze B2 + Bunny CDN integration with Cloudflare Worker sync into Sanity
- [ ] Video schema enhanced with B2/Bunny fields (replacing Wistia for existing, adding new videos)
- [ ] Person/alumni tagging on video content for cross-site alumni profile surfacing
- [ ] Fix alumniContinuum missing from GOVERNED_TYPES (v1.0 carried debt)

### Out of Scope

- Medikah site — excluded from this milestone
- Frontend changes on consuming sites — studio-side only (frontends query surfaceOn independently)
- Deployment migration (Netlify → Cloudflare Pages) — separate effort
- Redesigning the dashboard theme — visual layer is stable (enrichment dashboard is additive)
- Content migration between datasets — staging is for schema experimentation

## Current Milestone: v1.1 Content Production & Media Pipeline

**Goal:** Make the studio content-production-ready — build enrichment tooling, extend cross-site surfacing, integrate self-hosted video pipeline, and populate all incomplete records to 100%.

**Target features:**
- Enrichment tooling (completeness indicators, filtered lists, batch ops, dashboard)
- Full data entry across alumni, collaborators, and content metadata
- surfaceOn field on all content types (6 sites including Arkah, excluding Medikah)
- Backblaze B2 + Bunny CDN media pipeline with Cloudflare Worker sync
- Video schema B2/Bunny fields (migrating from Wistia + adding new)
- Person/alumni tagging on videos for cross-site profile surfacing

## Context

**Current State (post-v1.0):**
- Sanity Studio v5.13.0, React 19, TypeScript
- Deployed at hq.benextglobal.com (Netlify, migrating to Cloudflare Pages separately)
- Content lake: project `fo6n8ceo`, datasets `production` + `staging`
- 6 active sites: hectorhlopez.com, benextglobal.com, futuro.ngo, next.ngo, arkah.co, mitikah (future build)
- Medikah excluded from this milestone
- Dual-workspace config with basePath routing (/production, /staging)
- Automated Netlify deploy webhook on production publish
- All content schemas use reference-based tags
- Keynote is the canonical speech type
- Site settings singletons for all 7 entities (with bilingual fields + navLinks added post-v1.0)
- surfaceOn exists on essays only — string array with grid layout, 6 sites (missing Arkah)
- Video content currently uses Wistia/embed URLs — 50-200 videos to migrate to B2/Bunny

**Content gaps (to be filled in this milestone):**
- Alumni records: photos, bios, cohort details incomplete
- Collaborator details: missing across many records
- Content metadata: descriptions, thumbnails, tags incomplete on videos/podcasts
- 27 empty ledgerPerson documents

**Known tech debt:**
- alumniContinuum missing from `sanity.config.ts` GOVERNED_TYPES (no badges/actions) — FIX IN THIS MILESTONE
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
| B2 + Bunny CDN for self-hosted video | Replace Wistia dependency; control hosting costs; enable alumni tagging | — Pending |
| Cloudflare Worker for B2→Sanity sync | Serverless, event-driven; aligns with upcoming CF Pages migration | — Pending |
| surfaceOn as string array (not references) | Simple, frontend-queryable, no join needed; matches existing essay pattern | — Pending |
| Enrichment tooling before data entry | Build tools first so data entry is efficient and trackable | — Pending |

---
*Last updated: 2026-03-16 after v1.1 milestone start*
