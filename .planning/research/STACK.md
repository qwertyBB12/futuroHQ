# Technology Stack

**Project:** Autori Mandatum — v1.1 Content Production & Media Pipeline
**Researched:** 2026-03-16
**Milestone scope:** B2+Bunny CDN video pipeline, Cloudflare Worker B2→Sanity sync, Sanity Studio enrichment tooling

---

## Existing Stack (Do Not Change)

| Technology | Version | Role |
|------------|---------|------|
| sanity | ^5.13.0 | Studio framework |
| @sanity/client | ^6.29.1 | Content Lake mutations, used in scripts |
| @sanity/assist | ^5.0.4 | AI Assist plugin |
| react / react-dom | ^19.2.3 | Studio React baseline |
| styled-components | ^6.1.18 | Sanity UI peer dep |
| typescript | ^5.8 | Type safety |
| tailwindcss | ^4.1.14 | Studio custom CSS |

No changes to this list. All new additions are additive.

---

## New Stack Additions

### 1. Cloudflare Worker: B2 Event → Sanity Sync

The Worker is a standalone project (`clean-worker-b2sync/`), not part of the Studio repo. It receives Backblaze B2 event notifications when a video is uploaded, then writes metadata into the Sanity content lake via HTTPS mutation.

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| wrangler | ^4.x (4.73.0 current) | Cloudflare Worker CLI — dev, deploy, secrets | Official CF toolchain; v4 current as of March 2026 |
| aws4fetch | ^1.x | Sign S3-compatible requests to B2 from Worker | Compact (2.5kb gzip), no Node.js deps — works natively in V8 Workers runtime; @aws-sdk/client-s3 has known Node.js compat breaks in Workers (reported Jan 2025 v3.729.0) |
| @sanity/client | ^6.x | Write metadata to Sanity from Worker | Lightweight HTTP wrapper; Worker uses token-authenticated mutations |

**Worker project is NOT in the Studio repo.** Create as a sibling repo or monorepo package. It only needs `wrangler` (devDep) and `aws4fetch` + `@sanity/client` (deps).

**Why not @aws-sdk/client-s3 in the Worker:** AWS SDK v3 relies on Node.js internals (`node:fs`, streaming APIs) that are unavailable in the V8 isolate. `aws4fetch` is the Cloudflare-idiomatic replacement — it uses `SubtleCrypto` for signing and the native `fetch` API. Backblaze's own B2+Cloudflare samples use this pattern.

**B2 event trigger mechanism:** Backblaze B2 native Event Notifications (GA as of 2024) can fire an HTTP POST webhook on `b2:ObjectCreated:Upload`. The Worker receives this, extracts bucket/key/size/contentType, then calls `@sanity/client` to patch the target video document. No polling needed.

### 2. Studio Scripts: B2 Upload + Bunny Sync

These run locally (Node.js scripts), not inside the Studio bundle. They live in `scripts/` in the Studio repo — the same directory where existing migration scripts already live.

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| @aws-sdk/client-s3 | ^3.x | Upload video files to Backblaze B2 from local scripts | Full Node.js SDK is fine in local scripts; B2 S3-compatible endpoint supported |
| bunnycdn-stream | ^1.x | Create video objects in Bunny Stream library and get playback URLs | Lightweight TypeScript wrapper for Bunny Stream REST API; actively maintained community lib |

**Why bunnycdn-stream over bunny-sdk-typescript:** `bunny-sdk-typescript` (v0.0.31, last published ~March 2025) covers the full Bunny API surface but is in maintenance mode (its own README redirects to a separate package). `bunnycdn-stream` is focused on Stream API operations only — which is all that's needed — and is the most-referenced community option. The Bunny Stream API is a simple REST API; if `bunnycdn-stream` introduces friction, direct `fetch` calls to `https://video.bunnycdn.com/library/{id}/videos` are a viable fallback with zero dependencies.

**Why not @bunny.net/storage-sdk:** That package targets Bunny Edge Storage (file hosting), not Bunny Stream (video hosting/transcoding). Different product, different API.

### 3. Studio Plugin: Bulk Enrichment Operations

This runs inside the Studio as a Sanity plugin.

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| sanity-plugin-bulk-actions-table | ^1.x | Table view with checkbox selection and batch publish/unpublish/delete | Official Sanity ecosystem plugin (listed on sanity.io/plugins); avoids building custom multi-select from scratch in React 19 |

**What this replaces:** Building a custom bulk-action UI would require hooking into Studio's document list rendering, handling selection state across route changes, and wiring `@sanity/client` transactions manually. The plugin handles all of this and is maintained against the v5 Studio API.

**Scope:** Add only for types with high-volume enrichment work: `video`, `alumni`, `ledgerPerson`, `collaborator`. Do not enable globally — it adds a table-view toggle button to document lists.

### 4. Studio: Custom Enrichment Dashboard Widget

This lives in `components/dashboard/` in the Studio repo — same pattern as existing widgets (EcosystemHealthWidget, RecentActivityWidget). No new npm dependency needed. Uses the already-installed `@sanity/dashboard` (it's a peer dep of the existing dashboard setup) and `@sanity/client` for GROQ queries.

**Implementation pattern:**
- GROQ query counts documents missing required fields (e.g., `_type == "video" && !defined(bunnyVideoId)`)
- Result renders as a per-type completeness bar (number complete / total)
- Leverages existing `useClient()` hook from `sanity` package — already available in Studio context

No new dependencies. Pure React + GROQ + existing client.

### 5. Studio Schema: Video B2/Bunny Fields

Schema fields only — no new library needed. Additions to `schemaTypes/video.ts`:

```typescript
// B2 storage reference
{ name: 'b2FileKey', type: 'string', title: 'B2 File Key', readOnly: true }
{ name: 'b2BucketName', type: 'string', title: 'B2 Bucket', readOnly: true }

// Bunny Stream playback
{ name: 'bunnyVideoId', type: 'string', title: 'Bunny Video ID', readOnly: true }
{ name: 'bunnyLibraryId', type: 'string', title: 'Bunny Library ID', readOnly: true }
{ name: 'bunnyPlayerUrl', type: 'url', title: 'Bunny Player URL' }
{ name: 'videoDurationSeconds', type: 'number', title: 'Duration (sec)', readOnly: true }
```

`readOnly: true` on B2/Bunny machine-populated fields prevents accidental overwrite in Studio UI.

### 6. Studio Desk Structure: Filtered Lists

No new library. Uses Sanity Structure Builder's native GROQ filter capability — already part of `sanity` package:

```typescript
S.documentList()
  .title('Videos Missing Bunny ID')
  .filter('_type == "video" && !defined(bunnyVideoId)')
```

Add enrichment sub-sections under existing desk sections. Pattern is documented in official Sanity Structure Builder Reference.

---

## Alternatives Considered and Rejected

| Category | Recommended | Rejected | Why Rejected |
|----------|-------------|----------|--------------|
| Worker S3 signing | aws4fetch | @aws-sdk/client-s3 in Worker | Node.js dep breaks in V8 isolate; confirmed incompatibility in CF community Jan 2025 |
| Bunny Stream client | bunnycdn-stream | bunny-sdk-typescript | bunny-sdk-typescript is maintenance mode; broader surface area than needed |
| Bunny Stream client | bunnycdn-stream | @bunny.net/storage-sdk | Wrong product — Edge Storage != Stream |
| Bulk editing | sanity-plugin-bulk-actions-table | Custom multi-select component | Would require weeks of custom React work duplicating what plugin already does |
| B2 event mechanism | B2 native Event Notifications | Polling from Worker cron | Event-driven is more immediate and avoids unnecessary reads against B2 API |
| Worker language | TypeScript (wrangler default) | Hono framework | Hono adds value for multi-route Workers; this Worker has one endpoint — overkill |

---

## Installation

### Studio repo (clean-studio)

```bash
# Bulk actions plugin (enrichment tooling)
npm install sanity-plugin-bulk-actions-table

# Local B2 upload scripts (devDep — not in Studio bundle)
npm install -D @aws-sdk/client-s3

# Local Bunny Stream scripts (devDep — not in Studio bundle)
npm install -D bunnycdn-stream
```

Note: `@aws-sdk/client-s3` and `bunnycdn-stream` are devDependencies because they run only in local scripts via `tsx`, not in the compiled Studio browser bundle.

### Cloudflare Worker repo (clean-worker-b2sync — separate)

```bash
npm create cloudflare@latest clean-worker-b2sync -- --type hello-world
cd clean-worker-b2sync
npm install aws4fetch @sanity/client
npm install -D wrangler
```

---

## Environment Variables

### Studio repo (.env.local)

| Variable | Purpose | Used By |
|----------|---------|---------|
| `B2_APPLICATION_KEY_ID` | B2 auth key ID | scripts/upload-to-b2.ts |
| `B2_APPLICATION_KEY` | B2 auth key secret | scripts/upload-to-b2.ts |
| `B2_BUCKET_NAME` | Target bucket name | scripts/upload-to-b2.ts |
| `B2_ENDPOINT` | B2 S3 endpoint (e.g. s3.us-west-002.backblazeb2.com) | scripts/upload-to-b2.ts |
| `BUNNY_STREAM_API_KEY` | Bunny Stream API access key | scripts/sync-to-bunny.ts |
| `BUNNY_LIBRARY_ID` | Bunny Stream library ID | scripts/sync-to-bunny.ts |
| `SANITY_TOKEN` | Sanity write token for script mutations | scripts/* |

These go in `.env.local` (already gitignored via Sanity's .gitignore defaults). They are NOT `SANITY_STUDIO_` prefixed because they are server-side scripts only — they must NOT be exposed to the browser bundle.

### Cloudflare Worker (wrangler secrets)

| Variable | Purpose |
|----------|---------|
| `B2_APPLICATION_KEY_ID` | Verify inbound B2 webhook signatures |
| `B2_APPLICATION_KEY` | Sign requests back to B2 if needed |
| `SANITY_PROJECT_ID` | `fo6n8ceo` |
| `SANITY_DATASET` | `production` |
| `SANITY_TOKEN` | Sanity write token (scoped to video patch only) |

Set via `wrangler secret put VAR_NAME` — never committed to source.

---

## Confidence Assessment

| Decision | Confidence | Source |
|----------|------------|--------|
| aws4fetch for Worker | HIGH | Backblaze official B2+CF samples use it; Cloudflare R2 docs explicitly recommend it |
| wrangler v4.x | HIGH | npm shows 4.73.0 current as of 2026-03-16 |
| B2 native Event Notifications | HIGH | Backblaze official docs, GA feature |
| @aws-sdk/client-s3 compatibility issues in Workers | HIGH | CF community confirmed regression in v3.729.0 (Jan 2025) |
| bunnycdn-stream for local scripts | MEDIUM | Community package, TypeScript, actively used — but Bunny REST API is simple enough to use directly if issues arise |
| sanity-plugin-bulk-actions-table v5 compat | MEDIUM | Listed on sanity.io/plugins exchange; GitHub shows React 19 usage — verify against current Studio version before installing |
| bunny-sdk-typescript maintenance mode | MEDIUM | README on GitHub redirects to separate package; last publish ~March 2025 |

---

## Sources

- [Backblaze: Use the AWS SDK for JS V3 with B2](https://www.backblaze.com/docs/cloud-storage-use-the-aws-sdk-for-javascript-v3-with-backblaze-b2)
- [Backblaze: Use a Cloudflare Worker to Send Notifications on B2 Events](https://www.backblaze.com/blog/use-a-cloudflare-worker-to-send-notifications-on-backblaze-b2-events/)
- [Backblaze: Deliver Private B2 Content Through Cloudflare CDN](https://www.backblaze.com/docs/cloud-storage-deliver-private-backblaze-b2-content-through-cloudflare-cdn)
- [Backblaze: B2 Event Notifications Reference](https://www.backblaze.com/docs/cloud-storage-event-notifications-reference-guide)
- [GitHub: backblaze-b2-samples/cloudflare-b2](https://github.com/backblaze-b2-samples/cloudflare-b2)
- [Cloudflare: aws4fetch R2 example](https://developers.cloudflare.com/r2/examples/aws/aws4fetch/)
- [GitHub: mhart/aws4fetch](https://github.com/mhart/aws4fetch)
- [Cloudflare Workers: Install/Update Wrangler](https://developers.cloudflare.com/workers/wrangler/install-and-update/)
- [CF Community: @aws-sdk/client-s3 v3.729.0 breaks R2 S3 API (Jan 2025)](https://community.cloudflare.com/t/aws-sdk-client-s3-v3-729-0-breaks-uploadpart-and-putobject-r2-s3-api-compatibility/758637)
- [npm: bunnycdn-stream](https://www.npmjs.com/package/bunnycdn-stream)
- [Bunny Stream API Reference](https://docs.bunny.net/reference/stream-api-overview)
- [Bunny: Resumable & Pre-Signed Upload API](https://bunny.net/blog/bunny-stream-introducing-pre-signed-and-resumable-uploads/)
- [Sanity: Custom Document Badges](https://www.sanity.io/docs/studio/custom-document-badges)
- [Sanity: Structure Builder — GROQ Filter Lists](https://www.sanity.io/docs/studio/dynamically-group-list-items-with-a-groq-filter)
- [Sanity: Document Actions API](https://www.sanity.io/docs/studio/document-actions-api)
- [GitHub: contentwrap/sanity-plugin-bulk-actions-table](https://github.com/contentwrap/sanity-plugin-bulk-actions-table)
- [Sanity: Batch patch commits best practices](https://www.sanity.io/answers/running-a-patch-commit-to-a-set-of-documents-at-once-in-sanity-io-using-a-bulk-deletion-script-)
- [Cavelab: Moving videos to Bunny Stream (Jan 2025)](https://blog.cavelab.dev/2025/01/bunny-stream/)
