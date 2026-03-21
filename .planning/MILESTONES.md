# Milestones

## v1.1 Content Production & Media Pipeline (Shipped: 2026-03-21)

**Phases completed:** 5 phases, 10 plans, 18 tasks

**Key accomplishments:**

- GOVERNED_TYPES extracted to lib/constants.ts as single source of truth, fixing alumniContinuum badge divergence bug; SURFACE_SITES with Arkah added; surfaceOnField.ts ready for Plan 02 propagation
- One-liner:
- Pure TypeScript completeness config (lib/completeness.ts) plus nested Needs Enrichment filtered desk lists for all 5 tracked types using S.documentList().filter() with draft-excluded GROQ
- Dashboard progress widget (Copper bars), live per-doc completeness banner (caution/positive tones), and batch-enrich CLI script with chunked transactions for all 5 tracked types
- Bidirectional person-content tagging schema via shared featuredIn/featuredContent reference fields on all 10 tracked types with expanded completeness tracking and desk structure
- Alumni featured field migration + 3 JSON-driven batch population scripts with data templates committed, runtime data gitignored
- readOnly bunnyStatus pipeline-tracking field added to video schema; B2 video completeness now requires bunnyStatus=ready in both runtime checks and GROQ desk filters
- One-liner:
- Custom asset source component lets Studio editors browse and select B2/Bunny CDN-hosted videos via a searchable grid panel styled with Civic Modern tokens

---

## v1.0 Security & Content Architecture Pass (Shipped: 2026-03-08)

**Phases completed:** 3 phases, 6 plans, 9 tasks
**Timeline:** 1 day (2026-03-07 → 2026-03-08)
**Git range:** 2442ed3..3a3e10a (21 commits, 37 files changed, +2,533/-156)

**Key accomplishments:**

1. Fixed SEO env var prefix bug and added toast feedback to AI components (SeoGeneratorInput, GenerateAIDerivativesAction)
2. Dual-workspace config with staging dataset for risk-free schema experimentation
3. Automated Netlify deploy webhook on production publish with manual TriggerDeployAction fallback
4. Consolidated dual tag system (string → reference) on socialPost, curatedPost, vlog
5. Promoted keynote as canonical speech hub with cross-references; cleaned video schema
6. Created site settings for all 7 entities; committed alumniContinuum as governed type

**Known tech debt (accepted):**

- alumniContinuum missing from sanity.config.ts GOVERNED_TYPES (no badges/actions)
- Pre-existing TypeScript errors in migrations/ and scripts/ directories

**Archives:** `.planning/milestones/v1.0-ROADMAP.md`, `.planning/milestones/v1.0-REQUIREMENTS.md`, `.planning/milestones/v1.0-MILESTONE-AUDIT.md`

---
