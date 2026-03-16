# Project Research Summary

**Project:** Autori Mandatum — v1.1 Content Production & Media Pipeline
**Domain:** Sanity Studio v5 — content enrichment tooling, cross-site routing, and self-hosted media pipeline
**Researched:** 2026-03-16
**Confidence:** HIGH (stack, architecture, pitfalls from official sources); MEDIUM (Bunny custom asset source — no community plugin exists)

## Executive Summary

This milestone extends an existing, well-structured Sanity Studio v5 codebase in two primary directions: completing the content enrichment layer (completeness tracking, filtered desk views, batch scripts) and building a self-hosted video pipeline using Backblaze B2 for storage and Bunny CDN for delivery, synchronized to Sanity via a Cloudflare Worker event bridge. All new work is additive — no existing schema fields are renamed or removed, and no existing components are replaced. The highest-complexity work (the Cloudflare Worker) has clear precedent via official Backblaze samples and depends only on schema fields that are added earlier in the same milestone.

The recommended approach sequences schema work before infrastructure: add B2/Bunny fields to the video schema first, then build the Cloudflare Worker that writes to those fields. All enrichment tooling (completeness bars, filtered desk lists, dashboard widget) depends on a finalized definition of what "complete" means per document type — so surfaceOn must be standardized across all types before completeness checks are written. This dependency chain is strict: surfaceOn → completeness definition → enrichment tooling → batch scripts → Worker (parallel with schema fields).

The critical risk is infrastructure misconfiguration rather than code complexity. CORS on B2's S3-compatible API endpoint, Cloudflare ToS restrictions on video proxying, and the Bunny Storage vs. Bunny Stream architecture distinction must each be resolved before writing any pipeline code. Sanity-side risks center on silent failures: schema renames breaking frontend queries without errors, `defined()` returning true on empty arrays, and batch mutations hitting the 25 req/s rate limit mid-operation with partial updates.

## Key Findings

### Recommended Stack

The existing stack (Sanity v5.13.0, React 19, TypeScript, Tailwind v4) requires no changes. Three additive dependencies land in the Studio repo as devDependencies: `@aws-sdk/client-s3` and `bunnycdn-stream` for local scripts only (not bundled in Studio), and `sanity-plugin-bulk-actions-table` as a Studio plugin for bulk operations on `video`, `alumni`, `ledgerPerson`, `collaborator`. The Cloudflare Worker is a separate repo (not in clean-studio) using `wrangler`, `aws4fetch`, and `@sanity/client`.

**Core technologies:**
- `aws4fetch`: Worker-side S3 signing — uses SubtleCrypto (V8-native); `@aws-sdk/client-s3` confirmed broken in Workers since Jan 2025 (Node.js dep regression)
- `@aws-sdk/client-s3`: Local script uploads to B2 — full Node.js SDK is fine in script context
- `bunnycdn-stream`: Local scripts for Bunny Stream API calls — focused library; direct REST calls are viable fallback if it causes friction
- `sanity-plugin-bulk-actions-table`: Table-view bulk operations in Studio — avoids weeks of custom multi-select React work
- `wrangler v4.x`: Cloudflare Worker CLI — v4.73.0 current as of 2026-03-16
- B2 native Event Notifications (GA 2024): webhook-based upload events, no polling required

### Expected Features

**Must have (table stakes):**
- Filtered desk lists for incomplete records — editors need zero-hunt access to documents needing work
- `surfaceOn` field on video, podcast, podcastEpisode, keynote, news — required for cross-site frontend routing; essays already have it
- Video schema B2/Bunny fields (b2Key, b2Bucket, bunnyVideoId, bunnyLibraryId, bunnyStatus) — landing zone for pipeline metadata; blocks all subsequent pipeline work
- `alumniContinuum` added to GOVERNED_TYPES — v1.0 debt that blocks entity governance on that type
- Person/alumni reference field on video — enables alumni profile pages to surface videos
- Batch update scripts — populating 27 empty ledgerPerson docs and enriching alumni/collaborator data at scale is not feasible manually
- Content completeness dashboard widget — editors need progress visibility without running Vision queries

**Should have (competitive differentiators):**
- Cloudflare Worker event-driven B2→Sanity sync — eliminates manual field population for 50-200 videos; highest-effort but highest leverage
- Enrichment-view dedicated desk section — surfaced "work queue" per type; faster data entry workflow
- `surfaceOn` multi-select grid UI — prevents typo-based routing failures; already proven on essay schema
- Per-type completeness progress bars in dashboard — percentage complete per type, not just raw counts

**Defer (v2+):**
- Bunny CDN custom asset source in Studio — useful polish but not needed if Worker sync automates CDN URL population
- Full Bunny Stream transcoding pipeline — only warranted if raw MP4 playback quality proves insufficient post-migration
- Medikah in surfaceOn — explicitly out of scope for this milestone
- Separate staging surfaceOn values — manage via Sanity datasets, not schema

### Architecture Approach

The architecture follows the existing Studio's established layered pattern: additive schema fields, additive desk items, and new components that slot into existing infrastructure (dashboard widget grid, `components.input` wrapper API). The only external system boundary introduced is the Cloudflare Worker, which is stateless — it translates B2 and Bunny webhooks into Sanity Mutations API calls and holds no state of its own. All pipeline state lives in the Sanity Content Lake.

**Major components:**
1. `surfaceOnField` shared export (`schemaTypes/blocks/surfaceOnField.ts`) — single source of truth for all 6+ schema types; eliminates casing/typo drift
2. `makeCompletenessInput(fields)` factory + `CompletenessBar` component — per-type document-level progress bar rendered above the Sanity form via `components.input` API
3. `EnrichmentWidget` (`components/dashboard/EnrichmentWidget.tsx`) — GROQ `count()` queries per type, slots into existing `DashboardLayout` grid
4. Filtered desk list items in `deskStructure.ts` — GROQ-filtered `S.documentList()` items appended to existing type sections; no structural changes
5. `GOVERNED_TYPES` shared constant (`lib/constants.ts`) — resolves the divergence between `sanity.config.ts` and `deskStructure.ts` sets
6. Cloudflare Worker (`workers/b2-sanity-sync/`) — external to Studio; receives B2 ObjectCreated + Bunny encoding webhooks, writes draft video documents to Sanity via mutation API

### Critical Pitfalls

1. **Schema rename without migration breaks all frontends silently** — GROQ returns null on old field names with no error. Use expand-contract pattern: add new field alongside old, migrate data, then remove old. Never rename a field in a single deploy. Applies to any B2/Bunny field introduced during migration from Wistia.

2. **Cloudflare Worker proxying video streams violates ToS** — Cloudflare's free tier prohibits serving video content. Worker must handle ONLY upload event → Sanity mutation and presigned URL generation. All video playback must go through Bunny CDN pull zone directly.

3. **CORS misconfiguration on B2 S3-compatible API endpoint** — B2 has separate CORS rules for its native and S3-compatible API surfaces. Bunny caches non-CORS responses, so a stale cache after fixing B2 will still break playback. Set CORS before any video migration; test with `curl -H "Origin: ..."` against CDN URL before proceeding.

4. **Bunny Storage vs. Bunny Stream architecture mismatch** — These are entirely different products (S3-like CDN vs. transcoding pipeline with proprietary API). The chosen architecture is B2 + Bunny CDN pull zone (Bunny Storage pattern). Do not introduce Bunny Stream in this milestone — it would make the B2 + Cloudflare Worker sync pattern incompatible.

5. **GROQ `defined()` returns true on empty arrays** — completeness metrics will show inflated completion percentages if array fields are checked with `defined()` rather than `count(fieldName) > 0`. Applies to all enrichment dashboard GROQ queries. String fields require `defined() && fieldName != ""`.

## Implications for Roadmap

Based on combined research, the dependency chain points to a strict 5-phase sequence. Phases 1-3 are Studio-only work (low risk, fast feedback). Phase 4 is schema-only (staging-safe). Phase 5 is infrastructure (highest risk, last).

### Phase 1: Tech Debt Resolution + Shared Infrastructure

**Rationale:** The `alumniContinuum` GOVERNED_TYPES omission and the inline `surfaceOn` definition are prerequisites for all subsequent phases. `surfaceOn` must be extracted to a shared constant before 5 more types adopt it (otherwise casing drift accumulates). The `GOVERNED_TYPES` divergence between `sanity.config.ts` and `deskStructure.ts` must be resolved now before more types are added. These are the lowest-risk changes with the highest downstream leverage.

**Delivers:** Consistent governance on all document types; single-source `surfaceOnField`; `lib/constants.ts` with shared GOVERNED_TYPES

**Addresses:** alumniContinuum GOVERNED_TYPES debt, surfaceOn extension to video/podcast/podcastEpisode/keynote/news, Arkah added as 7th site option

**Avoids:** surfaceOn casing/typo drift (Pitfall 6), GOVERNED_TYPES set divergence (Pitfall 5 architectural pattern in ARCHITECTURE.md Anti-Pattern 5)

### Phase 2: Enrichment Tooling — Completeness Tracking

**Rationale:** surfaceOn must land in production (Phase 1) before completeness definitions are finalized and built — surfaceOn is a required signal in completeness checks for video, keynote, and news. The `makeCompletenessInput` factory and `EnrichmentWidget` can be built in parallel after Phase 1 deploys.

**Delivers:** Per-document completeness bar above each form (video, alumni priority), filtered "Needs Enrichment" desk lists per type, enrichment dashboard widget with per-type completion percentages

**Uses:** `CompletenessBar` component, `makeCompletenessInput` factory, `useClient` + GROQ `count()` queries, existing `DashboardLayout` infrastructure

**Implements:** Architecture components 2, 3, 4 from research

**Avoids:** `defined()` empty array false positives (Pitfall 9), completeness checks built before surfaceOn exists

### Phase 3: Person/Alumni Tagging + Batch Scripts

**Rationale:** Schema fields must exist in production before batch scripts populate them. Phase 3 adds the `featuredIn` reference field to video and runs batch enrichment scripts for ledgerPerson (27 empty docs), alumni photos/bios, and collaborator details. Batch scripts validate that Phase 2's completeness tooling works correctly — a filled document should register as complete.

**Delivers:** `featuredIn` field on video enabling alumni profile cross-surfacing; 27 ledgerPerson docs populated; alumni and collaborator enrichment complete; completeness dashboard shows real progress

**Addresses:** Person/alumni tagging (table stakes), batch update scripts (table stakes)

**Avoids:** Rate limit partial updates (Pitfall 5 — chunk to 100 mutations/transaction, 50ms delay, use `visibility: 'async'`), orphaned references on alumni deletion (Pitfall 14)

### Phase 4: Video Schema B2/Bunny Fields

**Rationale:** Schema fields must deploy to production before the Cloudflare Worker can write to them. Adding the fields first (with `readOnly: true` on machine-populated fields) lets editors manually enter `bunnyVideoId` for videos while the Worker is being built, enabling an incremental migration. A `videoSource` enum field prevents Wistia data from being orphaned during transition.

**Delivers:** b2Key, b2Bucket, bunnyVideoId, bunnyLibraryId, bunnyStatus fields on video schema; `videoSource` enum for migration tracking; updated completeness definition including `bunnyVideoId`

**Avoids:** Wistia data orphaned without fallback (Pitfall 7), frontends breaking on unmigrated videos

### Phase 5: Cloudflare Worker + CDN Infrastructure

**Rationale:** This is the highest-complexity, highest-risk phase. It requires all schema fields from Phase 4 to exist in production. Infrastructure must be validated (CORS, B2 bucket, Bunny pull zone, CF Worker secrets) before any video migration begins. The Worker is deployed independently of the Studio.

**Delivers:** Automated B2→Sanity draft document creation on video upload; Bunny webhook updating `bunnyStatus` on encoding completion; end-to-end tested pipeline for new video uploads

**Uses:** `aws4fetch` for B2 signature validation, `@sanity/client` for mutations, `wrangler` for deployment

**Avoids:** ToS violation from Worker proxying video (Pitfall 2), CORS misconfiguration blocking playback (Pitfall 3), Bunny Storage vs. Stream architecture mismatch (Pitfall 4), CF free plan CPU timeout (Pitfall 8 — upgrade to paid plan)

### Phase Ordering Rationale

- Phase 1 before everything: surfaceOn and GOVERNED_TYPES are cross-cutting; getting them wrong now multiplies errors across all subsequent work
- Phase 2 before Phase 3: enrichment tooling validates batch script results — you need to see completion percentages update correctly after running scripts
- Phase 3 before Phase 4: running batch scripts on an enriched schema (with surfaceOn, tags, seo settled) avoids re-running after schema changes
- Phase 4 before Phase 5: Worker has no fields to write to without Phase 4 deployed; schema stability is the Worker's only dependency
- Phase 5 last: no Studio code depends on the Worker; it's infrastructure that enhances an already-functional workflow

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 5 (Cloudflare Worker):** HMAC signature validation specifics, B2 bucket notification rule configuration, CF Worker free vs. paid plan cost-benefit. Backblaze samples exist but Sanity-specific wiring is custom. Recommend `/gsd:research-phase` before building.
- **Phase 4 (video schema migration):** Wistia→B2 migration strategy depends on the current Wistia field names in production schema — audit existing video documents before designing `videoSource` enum and coalesce strategy.

Phases with standard patterns (skip research-phase):
- **Phase 1:** Pure schema extract + shared constant — well-documented Sanity patterns, no novel decisions
- **Phase 2:** `components.input` wrapper API + GROQ `count()` — both documented in official Sanity guides; Architecture research provides exact code patterns
- **Phase 3:** Reference field addition + batch scripts — established Sanity client patterns; rate limit handling is fully documented

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Official sources for all core decisions; aws4fetch/B2 incompatibility confirmed in CF community Jan 2025 |
| Features | MEDIUM-HIGH | Sanity-side patterns well-documented; Bunny custom asset source (deferred) has no community plugin |
| Architecture | HIGH | Based on direct codebase reading + official Sanity/Backblaze/Bunny docs; patterns verified against existing Studio code |
| Pitfalls | HIGH | All critical pitfalls sourced from official documentation (Sanity, Backblaze, Cloudflare); confirmed via GitHub issues and community answers |

**Overall confidence:** HIGH for Phases 1-4 (pure Sanity/schema work). MEDIUM for Phase 5 (Cloudflare Worker — official samples exist but custom Sanity wiring is uncharted).

### Gaps to Address

- **Bunny custom asset source:** No community Sanity plugin exists; if this moves out of deferred status, must build from `plugin-template-asset-source`. Treat as a full research task before planning.
- **Existing Wistia field names in production schema:** Research did not audit the exact current video schema field names (wistiaId? wistiaEmbedUrl? videoUrl?). The `videoSource` migration strategy in Phase 4 depends on these. Run GROQ audit before finalizing Phase 4 schema plan.
- **`bunnycdn-stream` v5 compatibility:** Community package; verify it works with current Bunny Stream API before committing to it in scripts. The Bunny REST API is simple enough that direct fetch calls are always a zero-dependency fallback.
- **sanity-plugin-bulk-actions-table React 19 / Sanity v5.13 compatibility:** Listed on sanity.io/plugins exchange with React 19 usage shown, but version-pinning should be confirmed before installing.

## Sources

### Primary (HIGH confidence)
- Backblaze B2 Event Notifications docs (GA Oct 2024) — webhook trigger mechanism, HMAC validation
- Backblaze: Use a Cloudflare Worker to Send Notifications on B2 Events — Worker architecture pattern
- Cloudflare Workers Platform Limits — CPU time limits, free vs. paid plan, subrequest limits
- Cloudflare: aws4fetch R2 example — `aws4fetch` as idiomatic replacement for AWS SDK in Workers
- Sanity Studio v5 Form Components Reference — `components.input` API for completeness wrappers
- Sanity Structure Builder Reference — GROQ-filtered `documentList()` pattern
- Sanity Technical Limits — 25 req/s mutation rate limit, 4MB body limit
- Sanity GROQ null handling — `defined()` behavior on empty arrays
- Backblaze: CORS Rules for Cloud Storage — S3-compatible vs. native API CORS separation
- Backblaze: B2 + Bunny CDN Integration — pull zone setup, Block Root Path Access setting

### Secondary (MEDIUM confidence)
- npm: bunnycdn-stream — actively maintained community TypeScript wrapper for Bunny Stream REST API
- GitHub: contentwrap/sanity-plugin-bulk-actions-table — React 19 usage shown, listed on plugin exchange
- Cavelab: Moving videos to Bunny Stream (Jan 2025) — real-world B2+Bunny pipeline account
- Bunny.net Stream: Tips, Tricks, and Gotchas — HLS token authentication and segment 403 behavior

### Tertiary (LOW confidence)
- Cloudflare ToS video streaming restriction — referenced in Backblaze/Cloudflare docs but ToS language itself not directly quoted; treat as confirmed but verify before production use

---
*Research completed: 2026-03-16*
*Ready for roadmap: yes*
