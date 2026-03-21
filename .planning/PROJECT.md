# Autori Mandatum — Sanity Studio HQ

## What This Is

The centralized Sanity Studio v5 (Autori Mandatum) serving 6 active sites in the Hector H. Lopez ecosystem (hectorhlopez.com, benextglobal.com, futuro.ngo, next.ngo, arkah.co, mitikah — Medikah excluded). Manages 33+ document types with multi-entity governance, custom dashboard, AI-powered components, enrichment tooling, cross-site content surfacing, and self-hosted B2/Bunny CDN media pipeline. Hardened in v1.0, production-tooled in v1.1.

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
- ✓ GOVERNED_TYPES extracted to lib/constants.ts, alumniContinuum badge bug fixed — v1.1
- ✓ surfaceOn field extended to all content types (7 sites including Arkah) — v1.1
- ✓ Enrichment tooling: completeness indicators, filtered desk lists, batch-enrich CLI, dashboard widget — v1.1
- ✓ Bidirectional person-content tagging across 10 document types — v1.1
- ✓ Video schema B2/Bunny fields (videoSource, b2Key, cdnUrl, bunnyStatus, resolution, thumbnailUrl, duration) — v1.1
- ✓ Media pipeline: B2 + Bunny CDN + Cloudflare Worker sync into Sanity — v1.1
- ✓ Bunny CDN asset source browser in Studio — v1.1
- ✓ Data entry tooling: batch population scripts with JSON-driven templates — v1.1

### Active

(None — awaiting v1.2 milestone definition)

### Out of Scope

- Medikah site — excluded until separate milestone
- Frontend changes on consuming sites — studio-side only
- Deployment migration (Netlify → Cloudflare Pages) — separate effort
- Content migration between datasets — staging is for schema experimentation
- Mux video integration — B2+Bunny chosen for cost control
- Video transcoding in CF Worker — 128MB memory limit; use Bunny Stream if needed

## Context

**Current State (post-v1.1):**
- Sanity Studio v5.13.0, React 19, TypeScript
- Deployed at hq.benextglobal.com (Netlify)
- Content lake: project `fo6n8ceo`, datasets `production` + `staging`
- 6 active sites: hectorhlopez.com, benextglobal.com, futuro.ngo, next.ngo, arkah.co, mitikah
- 90 files changed across v1.1, +18,063 / -2,523 lines
- Enrichment system: 5 tracked types with completeness indicators and filtered desk lists
- Media pipeline: B2 → Bunny CDN → Cloudflare Worker → Sanity draft documents
- Batch tooling: populate-alumni.ts, populate-collaborators.ts, populate-ledger.ts, batch-enrich.ts
- Cross-site surfacing: surfaceOn on all content types, bidirectional person tagging

**Content gaps (remaining):**
- Video content metadata: descriptions, thumbnails, tags incomplete
- Podcast/podcastEpisode metadata incomplete
- Actual video migration from Wistia to B2/Bunny not yet executed
- Transcription pipeline output not yet integrated into Sanity

**Known tech debt:**
- Pre-existing TypeScript errors in `migrations/` and `scripts/` directories
- `seoBlock.ts` InitialValueResolverContext.document type error (pre-existing)
- `@portabletext/editor` broken source map crashes Vite dev server (workaround: delete .map file)

## Constraints

- **Tech stack**: Sanity Studio v5.13.0, React 19, TypeScript — no framework changes
- **Dataset**: Production dataset must remain untouched during schema experiments (use staging)
- **Backwards compatibility**: Schema changes must not break existing frontends consuming the content lake
- **Deployment**: Netlify static hosting, CSP headers configured in netlify.toml

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Guard AI components rather than remove them | Endpoints will be configured later; components should gracefully degrade | ✓ Good — clear disabled states with guidance text |
| Keep TriggerDeployAction as manual fallback | Emergency deploys need a manual option alongside automated webhook | ✓ Good — coexists with webhook without interference |
| Dataset switcher in Studio UI | Developers need easy way to toggle between production and staging | ✓ Good — basePath routing, shared config extraction |
| useToast from @sanity/ui not sanity | sanity package does not re-export useToast | ✓ Good — discovered via TypeScript compilation |
| SANITY_STUDIO_ prefix for all browser env vars | Sanity only exposes SANITY_STUDIO_ prefixed vars to browser bundle | ✓ Good — fixed silent SEO failure |
| Remove string tags, rename tags_ref to tags | Cleaner API surface; data preserved in content lake | ✓ Good — consistent reference pattern |
| Person types intentionally separate | person (public), alumni (program graduates), ledgerPerson (narrative intelligence) serve distinct purposes | ✓ Good — documented in schema descriptions |
| Keynote as canonical hub type | Single source of truth with cross-references to video/essay/podcast | ✓ Good — eliminates contentCategory overlap |
| Webhook scoped to production only | Staging publishes should not trigger deploys | ✓ Good — clean separation |
| B2 + Bunny CDN for self-hosted video | Replace Wistia dependency; control hosting costs; enable alumni tagging | ✓ Good — pipeline built and tested |
| Cloudflare Worker for B2→Sanity sync | Serverless, event-driven; aligns with upcoming CF Pages migration | ✓ Good — HMAC-validated, governance defaults |
| surfaceOn as string array (not references) | Simple, frontend-queryable, no join needed; matches existing essay pattern | ✓ Good — propagated to all content types |
| Enrichment tooling before data entry | Build tools first so data entry is efficient and trackable | ✓ Good — completeness system drives data entry |
| aws4fetch (not @aws-sdk) in CF Worker | AWS SDK broken in Workers since Jan 2025 | ✓ Good — lightweight, working |
| S.documentList().filter() for desk lists | S.documentTypeList().filter() silently ignores the filter | ✓ Good — critical Sanity API distinction |
| lib/completeness.ts kept pure TypeScript | No Studio imports for Node.js batch script compatibility | ✓ Good — shared between Studio and CLI |

---
*Last updated: 2026-03-21 after v1.1 milestone completion*
