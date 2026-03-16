# Feature Landscape

**Domain:** Sanity Studio v5 — Content enrichment tooling, cross-site surfacing, video asset pipeline
**Researched:** 2026-03-16
**Milestone:** v1.1 Content Production & Media Pipeline

---

## Table Stakes

Features without which this milestone is incomplete or the content production workflow is unusable.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Filtered desk lists for incomplete records | Editors need to find and work on incomplete docs without manual hunting | Low | GROQ filter `field == null` on documentList; built into Structure Builder API |
| surfaceOn field on video, podcast, podcastEpisode, keynote, news | Essays already have it; other content types are invisible to frontend routing without it | Low | String array, same pattern as existing essays; add Arkah as 7th option |
| Video schema B2/Bunny fields: b2Key, cdnUrl, duration, resolution, thumbnailUrl | Without these fields, video content cannot reference self-hosted assets; Wistia migration has no landing zone | Medium | Additive fields; Wistia embedUrl stays for backwards compatibility during transition |
| alumniContinuum added to GOVERNED_TYPES | v1.0 debt: missing badges and document actions on this type | Low | Single line change in sanity.config.ts; blocks all entity-governance on this type until fixed |
| Person/alumni reference field on video documents | Alumni profile pages need to surface videos per person; no cross-reference = no alumni detail page enrichment | Low | Array of references to person + alumni types |
| Batch update scripts via Sanity client | Populating 27 empty ledgerPerson docs, alumni bios, collaborator details by hand in Studio is prohibitive at scale | Medium | CLI scripts using Sanity JS client transactions; max 25 req/s, chunk to ~100 mutations/transaction |
| Content completeness tracking via GROQ-powered dashboard widget | Editors need to see total completeness at a glance without running Vision queries manually | Medium | Custom React widget on existing Dashboard tool; GROQ aggregation queries per type; already have dashboard component infrastructure |

---

## Differentiators

Features that make the content production workflow substantially faster or more powerful for this specific ecosystem.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Cloudflare Worker event-driven B2→Sanity sync | Uploads to B2 automatically create/update Sanity document fields (cdnUrl, duration, thumbnailUrl) without manual data entry | High | CF Worker triggered on B2 PUT event via webhook proxy; calls Sanity Mutations API; eliminates manual field population for 50-200 videos |
| Bunny CDN custom asset source in Studio | Editors can browse and select from Bunny Storage Zone directly in image/file fields — no copy-pasting CDN URLs | High | Must implement Sanity Custom Asset Source API (`AssetFromSource` with `kind: 'url'`); no existing community plugin for Bunny; requires building from plugin-template-asset-source |
| Enrichment-view desk section (dedicated) | Separate desk section showing only incomplete/draft records grouped by type — "what needs work today" | Medium | New deskStructure section with GROQ-filtered documentLists per content type; filtered on null thumbnail, empty bio, missing seo, etc. |
| Per-type completeness progress bar in dashboard | Percentage complete per content type (e.g., "Videos: 43/84 have thumbnails") surfaced as dashboard widget | Medium | GROQ `count()` queries comparing total vs. with-field; rendered as simple bar chart or stat list in existing DashboardLayout |
| surfaceOn field with multi-select grid UI | Visual checkbox grid for 6 sites (not raw string input) — prevents typos and misrouted content | Low | Custom input component or `list` option with checkboxes; already used in essay schema in grid layout |

---

## Anti-Features

Features to explicitly NOT build in this milestone.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Mux video integration | Mux charges per stored minute and per streaming minute; this ecosystem already decided on B2+Bunny for cost control | Use B2 for storage, Bunny Stream for delivery if transcoding is needed; store playbackId on video schema only if Bunny Stream (not Mux) is adopted |
| Native Sanity file asset upload for videos | Sanity charges for asset storage and bandwidth; uploading 50-200 videos to Sanity's own asset pipeline defeats the self-hosting goal | Store in B2, reference via cdnUrl field; use Sanity only for metadata |
| Full in-Studio batch edit UI (multi-select, inline edit) | Sanity has no native batch edit UI — building one requires custom pane with complex state management; Sanity GitHub issues #4971 and #8243 show this is a long-standing open feature request with no timeline | Use CLI scripts for bulk field population; Studio UI for individual record editing |
| Draft-to-publish batch action | Batch publishing (Issue #2239 in sanity/sanity) is not natively supported; a custom action that publishes multiple drafts would need complex coordination across document states | Publish individually in Studio; automate via mutations API in scripts only |
| Medikah site in surfaceOn | Explicitly out of scope for this milestone | Add Medikah as a separate, deliberate decision in a future milestone |
| Video transcoding pipeline in Cloudflare Worker | CF Workers have a 128MB memory limit and CPU time limits — cannot run FFmpeg/transcoding in-Worker | Do transcoding at upload time via Bunny Stream or a separate server-side process; Worker handles metadata sync only |
| Separate "staging" surfaceOn values | Routing to staging vs. production sites adds schema complexity and confuses editors | Use Sanity datasets (production/staging) to separate concerns; surfaceOn should reference live site identifiers only |

---

## Feature Dependencies

```
alumniContinuum GOVERNED_TYPES fix
  → (no dependencies, prerequisite for nothing else but must ship in this milestone)

surfaceOn field extension (video, podcast, podcastEpisode, keynote, news)
  → Requires: existing surfaceOn string array pattern from essays (already built)
  → Blocks: frontend queries on those types for cross-site routing

Person/alumni tagging on video
  → Requires: person and alumni types (already exist)
  → Blocks: alumni profile page surfacing videos

Video schema B2/Bunny fields
  → Requires: decision on Bunny Storage Zone vs. Bunny Stream setup
  → Blocks: Cloudflare Worker sync (Worker needs target fields to write to)
  → Blocks: Bunny custom asset source (asset source resolves to cdnUrl field)

Cloudflare Worker B2→Sanity sync
  → Requires: Video schema B2/Bunny fields exist in production schema
  → Requires: Backblaze B2 bucket + Cloudflare Worker + CF B2 webhook proxy (backblaze-b2-samples/cloudflare-b2-proxy)
  → Requires: Sanity write token (scoped to video type, stored as CF Worker secret)

Bunny CDN custom asset source
  → Requires: Bunny Storage Zone API credentials
  → Requires: cdnUrl/b2Key fields on schema (so selection writes to correct fields)
  → Independent of: Cloudflare Worker sync (two separate paths to populating the same fields)

Enrichment-view desk section
  → Requires: knowing which fields are "completeness signals" per type (define before building)
  → Blocks: nothing (purely additive to UX)

Completeness dashboard widget
  → Requires: agreed completeness definition per type (same signals as enrichment desk view)
  → Requires: existing DashboardLayout infrastructure (already exists)
  → Independent of: enrichment desk section (parallel build)

Batch update scripts
  → Requires: correct schema fields to exist in production before running
  → Rate limit: 25 req/s; use deferred visibility for bulk imports; chunk to ~100 mutations/transaction
```

---

## MVP Recommendation

Build in this order to unblock data entry and pipeline work as fast as possible:

1. **alumniContinuum GOVERNED_TYPES fix** — single-line debt fix; do it first, it's been carried since v1.0
2. **Video schema B2/Bunny fields** — schema must land in production before any pipeline or sync work
3. **surfaceOn field extension** — extends existing proven pattern; low risk, high cross-site value
4. **Person/alumni tagging on video** — additive reference field; low effort, unlocks alumni surfacing
5. **Enrichment-view desk section** — build filtered lists so data entry in step 6 is efficient
6. **Batch update scripts** — populate alumni photos/bios, collaborator details, video metadata
7. **Completeness dashboard widget** — validates data entry progress, motivates completion
8. **Cloudflare Worker B2→Sanity sync** — highest complexity; needs all schema fields settled first
9. **Bunny CDN custom asset source** — polish step; editors can do without it while pipeline is being built

**Defer from MVP:**
- Bunny custom asset source can be deferred if Worker sync is automated (editors don't need to manually browse Bunny)
- Full transcoding pipeline (Bunny Stream) only if playback quality becomes an issue post-migration

---

## Completeness Signal Definitions

These must be agreed upon before building the enrichment desk view and dashboard widget.

| Type | Incomplete When |
|------|----------------|
| `video` | Missing: `thumbnail`, `description`, `seo`, `tags`, `surfaceOn`, `cdnUrl` (post-migration) |
| `podcast` / `podcastEpisode` | Missing: `thumbnail`, `description`, `seo`, `tags`, `surfaceOn` |
| `alumni` | Missing: `photo`, `bio`, `cohortYear` |
| `ledgerPerson` | All fields empty (27 known empty documents) |
| `collaborator` | Missing: `photo`, `bio`, `organization` |
| `keynote` | Missing: `seo`, `tags`, `surfaceOn` |
| `news` | Missing: `seo`, `tags`, `surfaceOn` |

---

## Sources

- Sanity Structure Builder API (GROQ filters on documentList): https://www.sanity.io/docs/studio/structure-builder-reference
- Sanity Custom Asset Source API: https://www.sanity.io/docs/studio/custom-asset-sources
- Sanity custom asset source template: https://github.com/sanity-io/plugin-template-asset-source
- Sanity batch mutation best practices: https://www.sanity.io/answers/best-practices-for-creating-updating-multiple-documents-in-sanity-using-js-client-and-p-throttle
- Sanity technical limits (25 req/s mutation rate): https://www.sanity.io/docs/content-lake/technical-limits
- Batch publish open issue: https://github.com/sanity-io/sanity/issues/2239
- Bulk edit UI open issue: https://github.com/sanity-io/sanity/issues/4971
- Cloudflare Worker + Backblaze B2 webhook proxy: https://github.com/backblaze-b2-samples/cloudflare-b2-proxy
- Backblaze B2 + Bunny CDN free egress partnership: https://bunny.net/blog/bunny-net-partners-with-backblaze-for-free/
- Bunny CDN B2 integration guide: https://support.bunny.net/hc/en-us/articles/360018649972-How-to-speed-up-your-Backblaze-B2-file-delivery-with-Bunny-CDN
- GROQ null field filtering pattern: https://www.sanity.io/docs/content-lake/query-cheat-sheet
- Dynamically group list items with GROQ filter: https://www.sanity.io/docs/studio/dynamically-group-list-items-with-a-groq-filter

**Confidence:** MEDIUM-HIGH on Sanity patterns (well-documented official sources). LOW on Bunny custom asset source (no community Sanity plugin exists; must build from template). MEDIUM on Cloudflare Worker sync architecture (backblaze samples exist but Sanity-specific wiring is custom).
