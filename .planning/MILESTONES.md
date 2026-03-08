# Milestones

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
