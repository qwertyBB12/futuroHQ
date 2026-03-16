# Domain Pitfalls

**Domain:** Sanity Studio v5 — content enrichment tooling, cross-site routing, and self-hosted media pipeline
**Researched:** 2026-03-16
**Milestone:** v1.1 Content Production & Media Pipeline

---

## Critical Pitfalls

Mistakes that cause rewrites, data loss, or broken production frontends.

---

### Pitfall 1: Schema Field Rename Without Content Migration Breaks All Consuming Frontends

**What goes wrong:** A field is renamed in the Sanity schema (e.g. `surfaceOn` changed to `surfacedOn`, or a video field renamed from `wistiaId` to `b2VideoId`) without first migrating existing documents. The schema change deploys immediately. Frontends querying the old field name silently receive `null` — no error, just missing data in production.

**Why it happens:** Sanity schema changes are decoupled from content. The studio renders the new field name, but all existing documents still have the old key. GROQ queries on frontends return null for the old key — and since GROQ does not throw on missing keys, the failure is invisible until content editors or users notice blank fields.

**Consequences:**
- All existing surfaceOn/video data disappears from frontends on deploy
- No error surfaced anywhere in the pipeline — silent null
- If many documents are affected (84 videos, 179 content docs) the rollback scope is large

**Prevention:**
1. Use the expand-contract pattern: add the new field alongside the old one; keep old field as `hidden: true, readOnly: true`
2. Deploy schema with both fields present
3. Run migration script to copy old values to new field across all documents
4. Update frontend GROQ queries to use new field (or use `coalesce(newField, oldField)` during transition)
5. Remove old field only after all frontends have deployed

**Detection:** Before any schema rename, grep all frontend repos for the old field name. Count affected documents with GROQ before touching schema.

**Phase:** Applies to surfaceOn extension (Phase: schema changes), video schema B2/Bunny migration (Phase: media pipeline)

---

### Pitfall 2: Cloudflare Worker Used to Proxy Video Streams (ToS Violation)

**What goes wrong:** A Cloudflare Worker is built to proxy B2 video files through Cloudflare's free tier CDN. Cloudflare's Terms of Service explicitly prohibit serving video or a disproportionate percentage of non-HTML content unless purchased as a paid add-on (Cloudflare Stream or equivalent). The account is suspended or the Worker is rate-limited/blocked.

**Why it happens:** The B2 + Cloudflare pattern is widely documented as a "free egress" solution, but the partnership exemption applies only to bandwidth egress fees from B2 — not to using Cloudflare as a video CDN. The Worker is used for upload notifications and auth, not video delivery itself.

**Consequences:**
- Production video delivery breaks if account is flagged
- Mitigation at that point requires emergency switch to Bunny CDN pull zone (which was the plan anyway but now under pressure)

**Prevention:**
- Use Cloudflare Worker ONLY for: upload event notification → Sanity mutation (writing metadata back after upload), and optionally for generating presigned upload URLs
- Use Bunny CDN pull zone (pointing at B2) for ALL video delivery — this is what the Backblaze/Bunny partnership is designed for
- Never route video playback requests through Cloudflare Worker

**Detection:** Any Worker route that passes `Content-Type: video/*` responses to end users is a violation risk.

**Phase:** Media pipeline architecture (Phase: B2/Bunny CDN setup)

---

### Pitfall 3: B2 + Bunny CDN CORS Misconfiguration Blocks Video Playback in Browser

**What goes wrong:** Videos upload and are accessible via direct URL, but embedded players on frontends throw CORS errors. The B2 bucket has CORS rules for the B2 Native API but not the S3-compatible API endpoint (or vice versa), or the Bunny pull zone origin headers are not configured to pass through CORS headers from B2.

**Why it happens:** B2 has two separate API surfaces — B2 Native API and S3-compatible API — and CORS rules must be applied to each independently. Bunny CDN caches responses including (or excluding) CORS headers. If a non-CORS response is cached first, subsequent CORS requests receive the cached non-CORS response even after fixing B2 settings.

**Consequences:**
- Video player embeds fail silently or show CORS errors in console
- HLS segment requests (`.ts` files) fail even if the `.m3u8` manifest loads
- Cache purge required on Bunny after fixing B2 CORS — can take time to propagate

**Prevention:**
1. Set CORS rules on B2 S3-compatible API endpoint explicitly (not just native API)
2. Allowed origins: include all frontend domains (hectorhlopez.com, benextglobal.com, futuro.ngo, next.ngo, arkah.co) plus localhost for development
3. Configure Bunny pull zone to forward `Access-Control-Allow-Origin` from origin
4. Test CORS before migrating any video — use `curl -H "Origin: https://hectorhlopez.com"` against the CDN URL
5. After any CORS change, purge Bunny cache for the affected paths

**Detection:** CORS error in browser devtools. `curl -I` response missing `Access-Control-Allow-Origin` header from CDN URL.

**Phase:** Phase 1 of media pipeline (infrastructure setup before any video migration)

---

### Pitfall 4: Bunny Stream vs Bunny Storage Architecture Mismatch

**What goes wrong:** The pipeline is built around Bunny Storage (raw file storage + pull zone) but later HLS transcoding, multiple resolutions, or DRM are needed. Or conversely, Bunny Stream is chosen but the Cloudflare Worker sync pattern doesn't match Stream's API (Stream uses its own upload API, not an S3-compatible interface).

**Why it happens:** Bunny offers two distinct products: Bunny Storage (S3-like object storage + CDN, no processing) and Bunny Stream (upload → transcode → HLS delivery, proprietary API). The B2 + Bunny integration documented by Backblaze uses Bunny CDN pull zones pointed at B2, which is a Bunny Storage pattern — not Bunny Stream.

**Consequences:**
- If using Bunny Storage: videos serve as raw MP4, no adaptive bitrate, no HLS. Fine for current needs but limits future capabilities.
- If using Bunny Stream: B2 is bypassed entirely (Stream has its own storage), the Cloudflare Worker sync pattern breaks, and Sanity schema fields need to store Stream GUIDs not B2 keys.

**Prevention:**
- Commit to one architecture before writing any schema fields:
  - **B2 + Bunny CDN (pull zone):** B2 is the source of truth, Bunny CDN serves the files. Cloudflare Worker handles upload events. Sanity stores B2 object key + Bunny CDN URL. Simple, predictable costs.
  - **Bunny Stream:** Upload directly to Bunny Stream API. No B2. Sanity stores Bunny Stream video GUID. Transcoding is automatic.
- The PROJECT.md decision is B2 + Bunny CDN — implement that pattern only. Do not mix Bunny Stream into this milestone.

**Detection:** If schema fields include both a B2 key and a Bunny Stream GUID, the architecture is mixed and must be resolved.

**Phase:** Schema design (before video schema B2/Bunny fields are added)

---

### Pitfall 5: Sanity Batch Mutations Exceed 4MB Request Body or 25 req/s Rate Limit

**What goes wrong:** The enrichment batch operations tool (bulk-setting surfaceOn, tags, or completing missing fields across 50-200 documents) sends mutations in a single transaction or in rapid fire. Either the 4MB request body limit or the 25 mutations/second rate limit is hit, causing 400 or 429 errors mid-batch. Documents are partially updated.

**Why it happens:** When building custom batch operation UI in the studio, it is tempting to gather all selected documents, build one large transaction, and submit. A single mutation for 200 documents with portable text fields can easily exceed 4MB. Alternatively, fire-and-forget loops without throttling hit the 25 req/s ceiling.

**Consequences:**
- Partial updates with no clear indication of which documents succeeded
- 429 rate limit blocks the entire project API for the rolling window period
- Enrichment dashboard shows inconsistent state

**Prevention:**
1. Batch mutations in chunks of 100 documents maximum per transaction
2. Target payload size: keep individual transactions under 500kB
3. Add 50ms delay between batch submissions (well under 25 req/s)
4. Use Sanity's CLI migration tooling for bulk operations outside the Studio UI — it handles batching and rate limits automatically
5. For Studio UI batch ops: show per-document progress, use `visibility: 'async'` for higher throughput, handle 429 with exponential backoff
6. Dry-run migrations on staging dataset before production

**Detection:** 429 HTTP response from Sanity API. Error message: "Request body exceeds 4000000 bytes".

**Phase:** Enrichment tooling build (batch operations component)

---

## Moderate Pitfalls

---

### Pitfall 6: surfaceOn as String Enum Allows Invalid Values, No Validation

**What goes wrong:** `surfaceOn` is implemented as a free-text string array or as an options list where new sites can be added without updating validation. A document is saved with `surfaceOn: ["hectorhlopez", "HECTORHLOPEZ"]` (casing inconsistency) or a typo like `"arkha"`. Frontends querying `*[surfaceOn[] match "arkah"]` return zero results for that document.

**Why it happens:** String arrays in Sanity have no type enforcement beyond the schema options list. Existing documents created before schema validation was added don't get retroactive validation. Copy-paste across schema files means some types get the updated options list and some don't.

**Consequences:**
- Content silently doesn't appear on a target site
- No error in studio or frontend — just missing content

**Prevention:**
1. Define the surfaceOn options list as a shared constant imported by all schema files — single source of truth
2. Use `options.list` with explicit `{ title, value }` pairs — not free text
3. Add a validation rule that checks all values are in the allowed set
4. After adding Arkah to the list, run a GROQ audit to find documents with invalid string values
5. Standardize casing: all values lowercase, hyphenated (e.g., `"hector-hlopez"` → check against existing essay pattern before changing)

**Detection:** GROQ audit: `*[defined(surfaceOn) && !(surfaceOn[] in ["hectorhlopez","benext","futuro","next","arkah","mitikah"])]{_id, _type, surfaceOn}`

**Phase:** surfaceOn field extension phase

---

### Pitfall 7: Video Schema Migration Orphans Wistia Data Without Fallback

**What goes wrong:** The video schema is updated to add B2/Bunny fields and the old `wistiaId`/embed fields are removed or hidden. Existing video documents still have their Wistia data in the content lake, but the studio no longer shows it. When frontends are updated, they query the new B2 fields which are null for unmigrated videos — breaking video playback.

**Why it happens:** Schema changes don't delete data. The content lake retains old fields indefinitely. But if old fields are hidden in the studio UI, editors cannot see which videos still need B2 migration. The migration status becomes invisible.

**Consequences:**
- Videos that haven't been migrated to B2/Bunny show as broken on frontends
- No way to track migration progress without direct GROQ queries
- 50-200 videos to migrate is a significant manual effort with no visibility

**Prevention:**
1. Add B2/Bunny fields to schema WITHOUT removing Wistia fields first
2. Add a `videoSource` enum field: `'wistia' | 'b2'` as the canonical indicator of which fields to use
3. Build a migration status view in the enrichment dashboard: count of videos by `videoSource`
4. Frontends use `coalesce(b2CdnUrl, wistiaEmbedUrl)` during transition period
5. Only hide/remove Wistia fields after `videoSource == 'b2'` on ALL documents

**Detection:** GROQ: `count(*[_type == "video" && videoSource == "b2"])` vs `count(*[_type == "video"])` — track ratio.

**Phase:** Video schema migration (before any Wistia field removal)

---

### Pitfall 8: Cloudflare Worker Subrequest Limits on Free Plan Block B2→Sanity Sync

**What goes wrong:** The Cloudflare Worker that handles B2 upload events and writes metadata back to Sanity makes two subrequests per invocation: one to validate/get upload metadata from B2, one to PATCH the Sanity document. On the Cloudflare free plan, the Worker has a 50 subrequest limit per invocation and 10ms CPU time. A Worker that chains fetch calls can exhaust CPU time on the free plan.

**Why it happens:** Cloudflare's free plan has a 10ms CPU time limit per invocation. The paid plan allows 50ms (Bundled) or up to 5 minutes. Waiting on network I/O does not count against CPU time, but any actual computation (JSON parsing, HMAC signing for B2 auth) does. Complex Workers on free plan can timeout.

**Consequences:**
- Sanity document not updated after B2 upload — metadata sync silently fails
- Worker logs show timeout errors not visible in Sanity Studio

**Prevention:**
1. Keep the B2→Sanity sync Worker minimal: receive event, extract key, fire one PATCH mutation to Sanity — no chaining
2. Use Cloudflare Workers paid plan (Bundled, $5/mo) for any Worker handling media pipeline sync
3. Instrument with `console.log` timestamps at each step during development to measure CPU time
4. Design the Worker to be idempotent — if it fails, the upload webhook can be retried manually

**Detection:** Worker invocation logs in Cloudflare dashboard showing `exceeded CPU time limit` or silent failures (no Sanity mutation appearing after confirmed B2 upload).

**Phase:** Cloudflare Worker build (media pipeline phase)

---

### Pitfall 9: GROQ Completeness Queries Return Incorrect Null vs Empty Array Results

**What goes wrong:** The enrichment dashboard tracks document completeness by checking for null/undefined fields. A field that was never set returns `null`. A field that was set and then unset (e.g., an array cleared by editor) returns `[]` (empty array). A completeness check of `defined(tags)` passes for `[]` — showing the document as complete when it has no tags.

**Why it happens:** GROQ's `defined()` returns `true` for empty arrays — an empty array is a defined value. `count(tags) > 0` is the correct check for "has content," but this distinction is easy to miss when building the dashboard GROQ queries.

**Consequences:**
- Completeness metrics show inflated completion percentages
- Documents with empty arrays appear complete in dashboard, miss data entry

**Prevention:**
1. For array fields: use `count(fieldName) > 0` not `defined(fieldName)` in completeness queries
2. For string fields: use `defined(fieldName) && fieldName != ""`
3. For image/file fields: use `defined(fieldName.asset)`
4. For reference fields: use `defined(fieldName._ref)`
5. Build a test document with every possible empty state and verify dashboard counts correctly before shipping

**Detection:** Create a test document in staging with all fields set to empty arrays/strings and verify it shows as incomplete in the dashboard.

**Phase:** Enrichment dashboard build

---

### Pitfall 10: React Hook Violations in Custom Document Action Components

**What goes wrong:** A custom document action (e.g., a batch enrichment action) conditionally calls React hooks based on document state. When Sanity's document edit state loads in multiple passes (null → loading → document), the action component is called with null `editState` first, and any conditional hook calls corrupt React's hook order.

**Why it happens:** Sanity calls document action resolvers before the document is fully loaded. If the action component uses `if (!editState) return null` before hook calls, React throws a "hooks called in different order" error. This is a documented Sanity Studio v3+ gotcha.

**Consequences:**
- Studio crashes or throws React errors when opening affected document types
- Error is not immediately obvious — looks like a Studio internal error

**Prevention:**
1. Always call all hooks unconditionally at the top of the component
2. Use early returns ONLY after all hooks have been called
3. Pass `editState` as a dependency to `useMemo`/`useCallback` rather than conditionally returning
4. Test each custom action by opening a document from scratch (not from a cached state)

**Detection:** React error: "Rendered more hooks than during the previous render" when opening a document with a custom action.

**Phase:** Enrichment tooling build (any custom document actions)

---

## Minor Pitfalls

---

### Pitfall 11: alumniContinuum Missing from GOVERNED_TYPES Has Side Effects

**What goes wrong:** Adding `alumniContinuum` to `GOVERNED_TYPES` in `sanity.config.ts` triggers document badges and actions for the first time on existing documents. If the document action components check `governanceFields` and some existing `alumniContinuum` documents have malformed/missing governance data, the actions may throw or render incorrectly.

**Prevention:**
- Before adding to GOVERNED_TYPES, run GROQ audit to confirm all `alumniContinuum` documents have valid `narrativeOwner`, `platformTier`, and `archivalStatus` values
- Fix any documents with missing governance fields before enabling badges/actions
- This is a small scope fix but must be done first in the milestone to avoid carrying the debt further

**Phase:** Phase 1 (tech debt resolution, before enrichment tooling)

---

### Pitfall 12: Backblaze B2 `Block Root Path Access` Not Enabled

**What goes wrong:** When Bunny CDN pull zone is configured with B2 as origin using S3 authentication, GET requests to the pull zone root path are passed as authenticated S3 API requests to B2. This can expose bucket listing or cause unexpected 403/404 responses that look like CORS or auth errors.

**Prevention:** Enable "Block Root Path Access" in Bunny pull zone security settings immediately during setup. Backblaze explicitly recommends this as a default security measure for the B2 + Bunny CDN integration.

**Phase:** Media pipeline infrastructure setup

---

### Pitfall 13: Bunny CDN Token Authentication Breaks HLS Segment Playback

**What goes wrong:** Bunny pull zone token authentication is enabled for security. The `.m3u8` playlist loads successfully (its URL is signed), but individual `.ts` segment URLs within the playlist are relative paths without tokens. Segment requests fail with 403.

**Why it happens:** HLS token authentication requires signing every segment URL in the manifest, not just the manifest itself. Bunny's token authentication for HLS requires either: (a) directory tokens that cover all files in a path, or (b) modifying the `.m3u8` to include absolute URLs with per-segment tokens — which requires a proxy or middleware.

**Prevention:**
- Use Bunny directory-based token authentication (covers all `.ts` files in the video directory) rather than per-file token signing
- If not using token auth: ensure pull zone is HTTPS-only and direct B2 origin is not publicly accessible (private bucket with Bunny as authorized accessor)
- Test HLS playback end-to-end in a real browser before shipping — segment failures are only visible in browser network tab, not in the manifest fetch

**Phase:** Media pipeline CDN configuration

---

### Pitfall 14: Person/Alumni Reference on Video Creates Orphaned References After Document Deletion

**What goes wrong:** Videos tag `person` or `alumni` documents via references. An alumni document is deleted (e.g., a withdrawn participant). All video documents referencing that alumni now have a dangling reference. GROQ returns `null` for the reference expansion. Frontend alumni profile pages may try to list videos that reference a now-deleted person, or video pages show missing person data.

**Prevention:**
1. Configure reference fields with `options.disableNew: true` to prevent accidental new-document creation from the video form
2. Use Sanity's "Referring documents" check before deleting any person/alumni — Studio shows this automatically but editors may ignore it
3. Frontend GROQ should always null-check reference expansions: `"persons": persons[]->{_id, name, slug}` returns empty array for deleted references, not an error — ensure frontend handles this gracefully

**Phase:** Person/alumni tagging on video (schema design)

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Tech debt fix (alumniContinuum) | Missing governance data on existing docs causes badge/action errors | Audit GROQ first, patch documents before enabling GOVERNED_TYPES |
| surfaceOn extension to new types | Invalid string values + casing inconsistency across 5 schema files | Shared constant for options list; single import |
| Enrichment dashboard GROQ | `defined()` passing on empty arrays inflates completion metrics | Use `count() > 0` for arrays, `defined() && != ""` for strings |
| Batch operations UI | Rate limit (25 req/s) + 4MB body limit causes partial updates | Chunk 100 docs/transaction, 50ms delay, show per-doc progress |
| B2/Bunny CDN infrastructure | CORS misconfiguration blocks HLS in browser | Set S3-API CORS on B2, verify Bunny passes CORS headers, test with curl before any migration |
| Video schema B2 fields | Wistia data orphaned, frontends break on unmigrated videos | Add `videoSource` enum, use `coalesce()` on frontends, remove Wistia fields last |
| Cloudflare Worker sync | ToS violation if Worker proxies video streams | Worker handles upload events + Sanity mutations ONLY; Bunny serves video |
| Cloudflare Worker sync | CPU time exceeded on free plan for complex sync logic | Keep Worker minimal; upgrade to paid plan for media pipeline |
| Custom document actions | Conditional hooks before all hooks declared causes React crash | Declare all hooks unconditionally; guard logic after hooks |
| HLS token auth on Bunny | Segment 403 after manifest loads | Use directory-based tokens or no token auth with private origin |

---

## Sources

- [Sanity: Important Considerations for Schema and Content Migrations](https://www.sanity.io/docs/content-lake/important-considerations-for-schema-and-content-migrations) — HIGH confidence (official docs)
- [Sanity: Technical Limits](https://www.sanity.io/docs/content-lake/technical-limits) — HIGH confidence (official docs)
- [Sanity: API Rate Limit Error and Batch Deletion](https://www.sanity.io/answers/api-rate-limit-error-and-waiting-time-for-batch-deletion) — HIGH confidence (official community)
- [Sanity: Batch create/update 100+ documents best practice](https://www.sanity.io/answers/best-practices-for-creating-updating-multiple-documents-in-sanity-using-js-client-and-p-throttle) — HIGH confidence (official community)
- [Sanity: Mutation API 4MB limit](https://www.sanity.io/answers/migration-api-mutation-error-request-body-exceeds-limit-of-4000000-bytes) — HIGH confidence (official community)
- [Sanity: Null handling in GROQ](https://www.sanity.io/learn/course/between-groq-and-a-hard-place/null-handling-and-prevention) — HIGH confidence (official learn)
- [Sanity: React Hook crash in document action](https://github.com/sanity-io/sanity/issues/1754) — HIGH confidence (official GitHub issue)
- [Backblaze: Rate Limiting Policy](https://www.backblaze.com/blog/rate-limiting-policy/) — HIGH confidence (official blog)
- [Backblaze: B2 + Bunny CDN Integration](https://www.backblaze.com/docs/cloud-storage-integrate-bunnynet-with-backblaze-b2) — HIGH confidence (official docs)
- [Backblaze: CORS Rules for Cloud Storage](https://www.backblaze.com/docs/cloud-storage-enable-and-manage-cors-rules) — HIGH confidence (official docs)
- [Backblaze: Cloudflare Worker for B2 Event Notifications](https://www.backblaze.com/blog/use-a-cloudflare-worker-to-send-notifications-on-backblaze-b2-events/) — HIGH confidence (official blog)
- [Cloudflare: Workers Platform Limits](https://developers.cloudflare.com/workers/platform/limits/) — HIGH confidence (official docs)
- [Cloudflare: ToS — video streaming restriction](https://www.backblaze.com/docs/cloud-storage-deliver-public-backblaze-b2-content-through-cloudflare-cdn) — MEDIUM confidence (referenced in Backblaze/Cloudflare docs)
- [Bunny.net Stream: Tips, Tricks, and Gotchas](https://lowendtalk.com/discussion/184961/bunny-net-stream-tips-tricks-and-gotchas) — MEDIUM confidence (community, corroborated by Bunny docs)
- [Bunny CDN: B2 delivery speed guide](https://support.bunny.net/hc/en-us/articles/360018649972-How-to-speed-up-your-Backblaze-B2-file-delivery-with-Bunny-CDN) — HIGH confidence (official Bunny support docs)
