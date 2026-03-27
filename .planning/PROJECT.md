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
- ✓ Zero-failure B2/Sanity integrity audit across 240 video documents — v1.3
- ✓ CRF-18-only FFmpeg encoding with per-camera LUT profiles and faststart — v1.3
- ✓ Single-command pipeline orchestrator (encode → transcribe → diarize → clip → B2 → Sanity) — v1.3
- ✓ Dynamic clip B2 path routing for all event types — v1.3
- ✓ Full pipeline documentation (architecture, usage guide, troubleshooting) — v1.3

### Active

- [ ] Video metadata completion: descriptions, thumbnails, tags (v1.2 Phase 11)
- [ ] Podcast episode metadata population (v1.2 Phase 12)
- [ ] Content tag taxonomy audit and cleanup (v1.2 Phase 12)

## Current State

Shipped v1.3 Media Pipeline Integrity on 2026-03-27. The B2-to-Sanity video pipeline is now fully automated and verified.

**Ready to resume:** v1.2 Phases 11-12 (Video Metadata Completion + Podcast Data & Content Tagging) — previously blocked by v1.3, now unblocked.

### Out of Scope

- Medikah site — excluded until separate milestone
- Frontend changes on consuming sites — studio-side only
- Deployment migration (Netlify → Cloudflare Pages) — separate effort
- Content migration between datasets — staging is for schema experimentation
- Mux video integration — B2+Bunny chosen for cost control
- Video transcoding in CF Worker — 128MB memory limit; use Bunny Stream if needed

## Context

**Current State (post-v1.3):**
- Sanity Studio v5.13.0, React 19, TypeScript
- Deployed at hq.benextglobal.com (Netlify)
- Content lake: project `fo6n8ceo`, datasets `production` + `staging`
- 6 active sites: hectorhlopez.com, benextglobal.com, futuro.ngo, next.ngo, arkah.co, mitikah
- 144 files changed across v1.1-v1.3, +30,067 / -2,611 lines
- Enrichment system: 5 tracked types with completeness indicators and filtered desk lists
- Media pipeline: fully automated B2 → Bunny CDN → Cloudflare Worker → Sanity draft documents
- Pipeline orchestrator: `pipeline.py` single command (encode → transcribe → diarize → clip extract → B2 upload → Sanity doc creation)
- Pipeline scripts: CRF-18-only encoding, per-camera LUT profiles (Sony A6700, Canon R5, GoPro), argparse CLI, faststart on all outputs
- Pipeline integrity: zero-failure audit across 240 B2 video documents, TDD test suite (26+ tests)
- Pipeline documentation: full architecture doc, Quick Start guide, flags reference, troubleshooting (docs/MEDIA-PIPELINE.md)
- Batch tooling: populate-alumni.ts, populate-collaborators.ts, populate-ledger.ts, batch-enrich.ts, ingest-transcripts.ts
- Cross-site surfacing: surfaceOn on all content types, bidirectional person tagging

**Content gaps (remaining):**
- Video content metadata: descriptions, thumbnails, tags incomplete
- Podcast/podcastEpisode metadata incomplete
- Actual video migration from Wistia to B2/Bunny not yet executed
- Transcription pipeline: 26/26 B2 videos have fullText + speakerSegments (Phase 09 schema + Phase 10 ingestion complete)

**Known tech debt:**
- Pre-existing TypeScript errors in `migrations/` and `scripts/` directories
- `seoBlock.ts` InitialValueResolverContext.document type error (pre-existing)
- `@portabletext/editor` broken source map crashes Vite dev server (workaround: delete .map file)
- gopro-hero7-protune.cube LUT file not yet created (registered in CAMERA_LUTS but absent — graceful fallback)

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
| CRF 18 only encoding (no bitrate flags) | Simpler, consistent quality; bitrate overrides caused issues | ✓ Good — clean output across camera profiles |
| Explicit --anamorphic flag (no auto-detect) | Auto-detection was unreliable; explicit opt-in is safer | ✓ Good — clear user intent |
| importlib for hyphenated Python filenames | Avoids renaming existing scripts; preserves CLI ergonomics | ✓ Good — clean module loading |
| Sanity drafts only (no auto-publish) | Editorial review required before pipeline output goes live | ✓ Good — safe default for automation |
| Dynamic event prefix from B2 path | Hardcoded CLIPS_B2_PREFIX broke non-MMXXV events | ✓ Good — all events route correctly |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-27 after v1.3 milestone*
