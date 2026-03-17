---
phase: 08-media-pipeline-infrastructure
plan: "02"
subsystem: cloudflare-worker
tags: [cloudflare-worker, b2, bunny-cdn, sanity-mutations, hmac, infrastructure]
dependency_graph:
  requires: [07-01-SUMMARY.md]
  provides: [benext-media-worker repo, HMAC webhook validation, Sanity draft creation, B2+Bunny setup docs]
  affects: [video pipeline, Sanity video documents]
tech_stack:
  added: [wrangler v4, @cloudflare/workers-types, Web Crypto API (HMAC-SHA256)]
  patterns: [raw fetch to Sanity Mutations API, constant-time HMAC comparison, B2 S3-compatible webhooks]
key_files:
  created:
    - /Users/hectorhlopez/projects/benext-media-worker/src/index.ts
    - /Users/hectorhlopez/projects/benext-media-worker/src/hmac.ts
    - /Users/hectorhlopez/projects/benext-media-worker/src/sanity.ts
    - /Users/hectorhlopez/projects/benext-media-worker/wrangler.toml
    - /Users/hectorhlopez/projects/benext-media-worker/package.json
    - /Users/hectorhlopez/projects/benext-media-worker/tsconfig.json
    - /Users/hectorhlopez/projects/benext-media-worker/.gitignore
    - /Users/hectorhlopez/projects/benext-media-worker/docs/infrastructure-setup.md
    - /Users/hectorhlopez/projects/benext-media-worker/scripts/validate-cors.sh
    - /Users/hectorhlopez/projects/benext-media-worker/scripts/validate-cdn.sh
  modified: []
decisions:
  - "No @sanity/client dependency — raw fetch to Sanity Mutations API minimizes Worker bundle size (25.47 KiB gzipped)"
  - "No aws4fetch dependency — Worker receives webhooks only, does not make B2 API calls"
  - "Constant-time HMAC comparison using charCodeAt XOR loop — prevents timing attacks on webhook validation"
  - "Default governance fields set in Worker (narrativeOwner hector, platformTier canonical, archivalStatus archival) — editors only fill in editorial fields before publishing"
  - "videos/ prefix + extension whitelist filtering — prevents non-video B2 uploads from creating spurious Sanity drafts"
metrics:
  duration: 3min
  completed_date: "2026-03-17"
  tasks_completed: 2
  tasks_total: 3
  files_created: 10
  files_modified: 0
  checkpoint_reached: "Task 3 — human-verify for infrastructure configuration and E2E pipeline test"
---

# Phase 8 Plan 2: Cloudflare Worker — B2 Event Bridge Summary

**One-liner:** Deployable Cloudflare Worker repo with HMAC-validated B2 webhook handler that auto-creates draft Sanity video documents from B2 upload events.

---

## What Was Built

A new git repository at `/Users/hectorhlopez/projects/benext-media-worker/` containing a production-ready Cloudflare Worker that serves as the B2 → Sanity event bridge in the media pipeline.

### Core Worker (`src/index.ts`)

The main fetch handler:
- Rejects non-POST requests with 405
- Reads raw request body for HMAC validation before parsing
- Validates `X-Bz-Event-Notification-Signature: v1={hex}` using `B2_HMAC_SECRET`
- Returns 401 immediately on invalid signature
- Filters events: only processes objects with `videos/` prefix and video extensions (`mp4`, `mov`, `webm`, `mkv`, `avi`)
- Derives human-readable title from filename (`my-keynote-speech.mp4` → `my keynote speech`)
- Constructs CDN URL: `https://${BUNNY_CDN_HOSTNAME}/${objectKey}`
- Calls `createVideoDraft()` for each qualifying upload
- Returns JSON response with all processed keys and document IDs

### HMAC Validation (`src/hmac.ts`)

- Parses B2's `v1={hex}` signature format
- Uses `crypto.subtle` (Web Crypto API, native in Workers runtime — no dependencies)
- Constant-time comparison via charCodeAt XOR loop to prevent timing attacks

### Sanity Client (`src/sanity.ts`)

- Creates draft video documents via `POST /v2024-01-01/data/mutate/production`
- Document ID format: `drafts.{crypto.randomUUID()}`
- Populates: `title`, `videoSource: 'b2'`, `b2Key`, `cdnUrl`, `bunnyStatus: 'processing'`
- Sets governance defaults: `narrativeOwner: 'hector'`, `platformTier: 'canonical'`, `archivalStatus: 'archival'`, `videoFormat: 'longform'`, `language: ['en']`
- Uses Bearer token auth (`SANITY_TOKEN` secret)
- Returns `{documentId, success, error?}` — errors logged but do not crash the Worker

### Infrastructure Documentation (`docs/infrastructure-setup.md`)

Step-by-step guide covering:
1. B2 bucket creation with CORS rules for Bunny CDN origin
2. Bunny CDN pull zone setup with B2 origin URL and Block Root Path Access
3. Cloudflare Worker deployment and secret management
4. B2 Event Notification rule with HMAC secret generation
5. End-to-end test: B2 upload → Worker logs → Sanity draft query → CDN playback verification

### Validation Scripts

- `scripts/validate-cors.sh` — Preflight OPTIONS request to B2 origin, checks for `access-control-allow-origin` header
- `scripts/validate-cdn.sh` — Tests root path blocking (403/404) and B2 reachability via CDN (non-existent file returns 404, not 403)

---

## Verification

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | PASS (0 errors) |
| `wrangler deploy --dry-run` | PASS (25.47 KiB bundle) |
| `validateHmac` import in index.ts | PASS |
| `createVideoDraft` import in index.ts | PASS |
| `fo6n8ceo` project ID in sanity.ts | PASS |
| validate-cors.sh syntax check | PASS |
| validate-cdn.sh syntax check | PASS |

---

## Checkpoint Reached

**Task 3 (human-verify):** Infrastructure configuration and E2E pipeline test requires the user to:
1. Create B2 bucket with CORS rules
2. Create Bunny CDN pull zone with B2 origin
3. Run validation scripts
4. Deploy Worker and set secrets via `wrangler secret put`
5. Configure B2 Event Notification rule
6. Upload test video and verify Sanity draft creation + CDN playback

See `/Users/hectorhlopez/projects/benext-media-worker/docs/infrastructure-setup.md` for complete steps.

---

## Deviations from Plan

None — plan executed exactly as written.

---

## Self-Check: PASSED

Files verified:
- /Users/hectorhlopez/projects/benext-media-worker/src/index.ts — FOUND
- /Users/hectorhlopez/projects/benext-media-worker/src/hmac.ts — FOUND
- /Users/hectorhlopez/projects/benext-media-worker/src/sanity.ts — FOUND
- /Users/hectorhlopez/projects/benext-media-worker/wrangler.toml — FOUND
- /Users/hectorhlopez/projects/benext-media-worker/docs/infrastructure-setup.md — FOUND
- /Users/hectorhlopez/projects/benext-media-worker/scripts/validate-cors.sh — FOUND
- /Users/hectorhlopez/projects/benext-media-worker/scripts/validate-cdn.sh — FOUND

Commits verified:
- f71e9ba: feat(08-02): initial Worker scaffolding with HMAC validation and Sanity client
- 5f033df: docs(08-02): add infrastructure setup guide and validation scripts
