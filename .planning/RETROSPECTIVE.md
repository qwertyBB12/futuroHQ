# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — Security & Content Architecture Pass

**Shipped:** 2026-03-08
**Phases:** 3 | **Plans:** 6 | **Sessions:** ~3

### What Was Built
- Env var guards with disabled states on SeoGeneratorInput and GenerateAIDerivativesAction
- Dual-workspace Sanity config (production + staging) with automated Netlify deploy webhook
- Consolidated reference-based tags on socialPost, curatedPost, vlog (eliminated dual tag system)
- Keynote promoted to canonical speech hub; video schema cleaned of 5 keynote-specific fields
- Site settings singletons for all 7 ecosystem entities
- alumniContinuum committed as visible governed type

### What Worked
- Phased approach (safety → infrastructure → schema) allowed each phase to build on the previous
- Schema description fields as inline documentation for type separation rationale — lightweight, visible in AI Assist
- Human-action checkpoints for external config (Sanity Manage webhook) — clear handoff protocol
- sharedConfig extraction pattern for dual-workspace config — zero duplication

### What Was Inefficient
- Phase 3 ROADMAP.md plan checkboxes not updated during execution — created stale state
- REQUIREMENTS.md checkboxes for SCHM-01–05 never updated from Pending to Complete during phase execution
- alumniContinuum added to deskStructure.ts GOVERNED_TYPES but missed in sanity.config.ts GOVERNED_TYPES — dual registration points are error-prone

### Patterns Established
- `SANITY_STUDIO_` prefix for all browser-exposed env vars (Sanity convention)
- Toast notifications via `@sanity/ui useToast` for async document action feedback
- sharedConfig spread pattern for multi-workspace `defineConfig` arrays
- Hub pattern: canonical type with reference fields to related content types
- Per-entity singleton pattern for site settings

### Key Lessons
1. GOVERNED_TYPES exists in two places (deskStructure.ts for view panes, sanity.config.ts for badges/actions) — must update both when adding governed types
2. `sanity` package does not re-export `useToast` — always import from `@sanity/ui` directly
3. Schema extract requires `--workspace production` flag with multi-workspace configs
4. Sanity preserves data in content lake when schema fields are removed — safe to remove string tags without migration

### Cost Observations
- Model mix: ~30% opus, ~70% sonnet (executor agents used sonnet)
- Sessions: ~3 (one per phase roughly)
- Notable: Most plans executed in 2-8 minutes — minimal overhead from GSD workflow

---

## Milestone: v1.1 — Content Production & Media Pipeline

**Shipped:** 2026-03-21
**Phases:** 5 | **Plans:** 10 | **Tasks:** 18 | **Sessions:** ~5
**Timeline:** 13 days (2026-03-08 → 2026-03-21)
**Scope:** 90 files changed, +18,063 / -2,523 lines

### What Was Built
- GOVERNED_TYPES + BILINGUAL_TYPES + SURFACE_SITES extracted to lib/constants.ts — single source of truth
- surfaceOn field propagated to all 6 content types with Arkah as 7th site
- Pure TypeScript completeness system (lib/completeness.ts) for 5 enrichment-tracked types
- Filtered "Needs Enrichment" desk lists using S.documentList().filter() with GROQ
- Dashboard enrichment widget with Copper progress bars + per-doc completeness banner
- batch-enrich CLI script with chunked transactions for bulk field population
- Bidirectional person-content tagging (featuredIn/featuredContent) across 10 document types
- Alumni featured field migration + 3 JSON-driven batch population scripts
- Video schema B2/Bunny storage fields with videoSource enum and conditional visibility
- bunnyStatus readOnly pipeline-tracking field with completeness awareness
- Cloudflare Worker (benext-media-worker) with HMAC validation and Sanity draft creation
- Bunny CDN asset source browser component in Studio with Civic Modern styling

### What Worked
- Wave-based parallel execution for Phase 8 — independent plans ran concurrently
- Enrichment tooling before data entry — completeness system made data gaps visible and trackable
- Pure TypeScript for lib/completeness.ts — shared between Studio runtime and Node.js batch scripts
- GOVERNED_TYPES consolidation in Phase 4 prevented badge/action divergence for all subsequent work
- Human-action checkpoints for infrastructure setup (B2, Bunny CDN, Worker deploy) — clean handoff

### What Was Inefficient
- Phase 5 and 8 roadmap checkboxes not always updated during execution (stale progress table)
- 08-02 Worker checkpoint created cross-repo dependency — orchestrator context had to track benext-media-worker state
- @portabletext/editor broken source map caused black-screen Studio — took investigation time unrelated to milestone work

### Patterns Established
- `S.documentList().filter()` for filtered desk lists (NOT `S.documentTypeList().filter()` which silently ignores)
- `aws4fetch` for S3-compatible API calls in Cloudflare Workers (AWS SDK broken since Jan 2025)
- Constant-time HMAC comparison via charCodeAt XOR loop in Workers
- lib/constants.ts as canonical type registry imported by both config and desk structure
- JSON-driven data templates (committed) with runtime data gitignored for batch population

### Key Lessons
1. S.documentList().filter() vs S.documentTypeList().filter() is a critical Sanity API distinction — the latter silently ignores GROQ filters
2. aws4fetch is the only reliable S3 client for Cloudflare Workers — @aws-sdk fails at bundle time
3. lib/completeness.ts pure TypeScript (no Studio imports) enables shared usage between runtime and CLI
4. Cross-repo Worker code creates orchestration complexity — consider monorepo or clear interface contracts
5. @portabletext/editor source map bug blocks Vite dev server — delete .map file as workaround

### Cost Observations
- Model mix: ~20% opus (planning), ~80% sonnet (execution agents)
- Sessions: ~5 across 13 days
- Notable: 10 plans averaging ~4 min/plan execution time — GSD overhead minimal

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Plans | Key Change |
|-----------|----------|--------|-------|------------|
| v1.0 | ~3 | 3 | 6 | Initial milestone — established baseline |
| v1.1 | ~5 | 5 | 10 | Wave-based parallel execution, cross-repo Worker |

### Top Lessons (Verified Across Milestones)

1. Dual registration points resolved — lib/constants.ts is now the single source of truth (v1.0 lesson → v1.1 fix)
2. Update checkboxes in ROADMAP.md and REQUIREMENTS.md during execution, not after (still recurring in v1.1)
3. Pure TypeScript for shared logic enables Studio + CLI reuse (v1.1 pattern)
4. Human-action checkpoints work well for infrastructure setup — clear protocol across both milestones
