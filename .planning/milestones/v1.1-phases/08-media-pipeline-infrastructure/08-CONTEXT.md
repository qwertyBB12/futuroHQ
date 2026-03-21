# Phase 8: Media Pipeline Infrastructure - Context

**Gathered:** 2026-03-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the end-to-end video pipeline: configure B2 bucket with CORS rules for Bunny CDN, set up Bunny CDN pull zone, develop a Cloudflare Worker that receives B2 upload event notifications and creates draft Sanity video documents with metadata populated, and add a bunnyStatus schema field for pipeline tracking. The Worker lives in a separate repo. Upload entry point is manual (B2 Console/CLI) — no in-Studio upload UI this phase.

</domain>

<decisions>
## Implementation Decisions

### Upload entry point
- Manual upload via B2 web console or CLI (rclone/b2) — no in-Studio upload button this phase
- Every B2 upload creates a brand-new Sanity draft (no matching/patching existing docs)
- B2 path convention: `videos/{year}/filename.mp4` (e.g., `videos/2026/my-keynote.mp4`)
- Draft title derived from filename without extension (e.g., `my-keynote-speech.mp4` → `my-keynote-speech`). Editor cleans up before publishing.

### Worker trigger & flow
- B2 Event Notifications (webhook) trigger the Cloudflare Worker on object creation — no polling
- HMAC signature validation on incoming B2 webhooks — prevents spoofed requests
- Worker populates extended field set: b2Key, cdnUrl (constructed from Bunny pull zone URL + path), videoSource: 'b2', title (from filename), duration, resolution (requires media analysis in Worker)
- bunnyStatus enum field added to video schema: `processing | ready | error` — Worker sets 'processing' on create, 'ready' after CDN validation
- `aws4fetch` for any B2 API calls from Worker (not @aws-sdk — broken in Workers since Jan 2025)

### Repo & deployment topology
- Cloudflare Worker lives in a **separate repo** (e.g., `benext-media-worker`) — not in clean-studio
- Deploy via `wrangler deploy` from local machine — no CI/CD pipeline this phase
- Secrets managed via `wrangler secret put` (SANITY_TOKEN, B2_HMAC_SECRET, etc.)
- B2 bucket config, Bunny CDN setup docs, and config scripts live in the Worker repo's `docs/` or `scripts/`
- bunnyStatus field and any schema additions go in clean-studio (this repo) as part of Phase 8

### Claude's Discretion
- Exact B2 Event Notification rule configuration (filter prefix, event types)
- How duration/resolution are extracted in the Worker (ffprobe via Wasm, or metadata from B2 object headers)
- CDN URL construction pattern (exact Bunny pull zone hostname)
- Worker error handling and retry strategy
- Whether bunnyStatus field is in the existing 'storage' group or a new group
- CORS rule specifics for B2 bucket (exact origins, headers, methods)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` — MDIA-01 (B2 CORS), MDIA-02 (Bunny CDN pull zone), MDIA-03 (Worker → Sanity sync), MDIA-04 (Bunny asset source plugin)

### Video schema (modification target for bunnyStatus)
- `schemaTypes/video.ts` — Current video schema with B2/Bunny storage fields (b2Key, cdnUrl, duration, resolution, thumbnailUrl, videoSource) from Phase 7

### Prior phase context
- `.planning/phases/07-video-schema-b2-bunny-fields/07-CONTEXT.md` — B2 field decisions, conditional visibility logic, completeness integration
- `.planning/phases/07-video-schema-b2-bunny-fields/07-01-SUMMARY.md` — What Phase 7 actually built

### Completeness system
- `lib/completeness.ts` — Source-aware completeness checks, GROQ_FILTERS — may need bunnyStatus integration

### Studio config (for asset source plugin registration)
- `sanity.config.ts` — Plugin registration, sharedConfig pattern, workspace structure

### Project decisions
- `.planning/PROJECT.md` — Key decisions table: B2 + Bunny CDN pull zone (not Bunny Stream), aws4fetch in Worker, Cloudflare Worker for B2→Sanity sync

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `schemaTypes/video.ts` — B2/Bunny storage fields already defined (Phase 7): b2Key, cdnUrl, resolution, thumbnailUrl, duration in 'storage' group with conditional visibility on `videoSource === 'b2'`
- `lib/completeness.ts` — Source-aware completeness system, GROQ_FILTERS.video already handles B2 vs wistia branching
- `sanity.config.ts` — Plugin array in sharedConfig where asset source plugin would register
- `sanity-plugin-media` — Already registered; Bunny asset source would be a separate plugin alongside it

### Established Patterns
- Field groups: `{name: 'storage', title: 'B2/Bunny Storage'}` exists on video — bunnyStatus could join this group
- Conditional visibility: `hidden: ({document}) => document?.videoSource !== 'b2'` pattern used by all B2 fields
- Plugin registration: plugins array in sharedConfig shared across both workspaces

### Integration Points
- `schemaTypes/video.ts` — Add bunnyStatus field to storage group
- `sanity.config.ts` — Register Bunny asset source plugin (MDIA-04)
- Worker repo (new) — Cloudflare Worker with wrangler.toml, B2 event handler, Sanity client calls
- B2 bucket — CORS configuration, event notification rules
- Bunny CDN — Pull zone configuration pointing to B2 origin

</code_context>

<specifics>
## Specific Ideas

- The ecosystem is transitioning FROM Wistia TO B2/Bunny — this pipeline replaces the manual Wistia workflow
- 50-200 existing videos will eventually migrate; this phase proves the pipeline with at least one real upload
- Success criterion #4 explicitly requires an end-to-end test: B2 upload → Worker fires → Sanity draft created → CDN URL plays back
- MDIA-04 (Bunny asset source panel) is a Studio-side deliverable even though most infrastructure is in the Worker repo
- bunnyStatus mentioned in success criterion #2 as a field the Worker populates

</specifics>

<deferred>
## Deferred Ideas

- In-Studio upload button (direct B2 upload from Studio) — future phase
- Automated Wistia-to-B2 migration script — future phase
- Thumbnail auto-generation from video frames — future phase
- CI/CD pipeline for Worker deployment (GitHub Actions) — future improvement

</deferred>

---

*Phase: 08-media-pipeline-infrastructure*
*Context gathered: 2026-03-17*
