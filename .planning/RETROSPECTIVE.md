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

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.0 | ~3 | 3 | Initial milestone — established baseline |

### Top Lessons (Verified Across Milestones)

1. Dual registration points (deskStructure.ts + sanity.config.ts) are error-prone — consider consolidation
2. Update checkboxes in ROADMAP.md and REQUIREMENTS.md during execution, not after
