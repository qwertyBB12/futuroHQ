# Requirements: Autori Mandatum — Security & Content Architecture Pass

**Defined:** 2026-03-07
**Core Value:** Every component must either work correctly or be gracefully disabled — no silent failures, no orphaned experiments, no schema ambiguity.

## v1 Requirements

Requirements for this hardening pass. Each maps to roadmap phases.

### Safety

- [x] **SAFE-01**: SeoGeneratorInput gracefully disables when `AI_SEO_GENERATOR_ENDPOINT` env var is not set — no silent failures, clear UI indication
- [x] **SAFE-02**: GenerateAIDerivativesAction gracefully disables when `SANITY_STUDIO_AI_ENDPOINT` env var is not set — action hidden or shows disabled state

### Infrastructure

- [x] **INFR-01**: Staging dataset (`staging`) created via Sanity CLI with documented workflow
- [x] **INFR-02**: Studio config supports dataset switching between production and staging for development
- [x] **INFR-03**: Sanity webhook configured to trigger Netlify build automatically on document publish
- [x] **INFR-04**: TriggerDeployAction retained as manual fallback alongside automated webhook

### Schema Cleanup

- [ ] **SCHM-01**: All schemas migrated from string `tags` arrays to `tags_ref` references; legacy `tags` field removed from schemas
- [ ] **SCHM-02**: Person types (person, alumni, ledgerPerson) evaluated for unification — either unified with conditional fieldsets or documented as intentionally separate with clear rationale
- [ ] **SCHM-03**: Keynote duplication resolved — single canonical representation chosen between `keynote` type and `video` with `contentCategory: 'keynote'`
- [ ] **SCHM-04**: Site settings documents created for all entities (hector, benext, arkah, next, mitikah, medikah) — not just Futuro
- [ ] **SCHM-05**: alumniContinuum experimental type either committed with clear purpose and documentation, or archived/removed from schema registry

## v2 Requirements

None — this is a finite hardening pass, not an ongoing feature project.

## Out of Scope

| Feature | Reason |
|---------|--------|
| New content types or features | Hardening pass only — no new functionality |
| Frontend changes on consuming sites | Studio-side only; frontends adapt to schema changes independently |
| Content migration between datasets | Staging is for schema experimentation, not content duplication |
| Dashboard or theme redesign | Visual layer is stable and recently completed |
| AI endpoint implementation | Endpoints will be configured separately; this project adds guards only |
| Data migration for tag consolidation | Schema change only; existing string tags data left in place for frontend migration |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SAFE-01 | Phase 1: Safety Guards | Complete |
| SAFE-02 | Phase 1: Safety Guards | Complete |
| INFR-01 | Phase 2: Infrastructure | Complete |
| INFR-02 | Phase 2: Infrastructure | Complete |
| INFR-03 | Phase 2: Infrastructure | Complete |
| INFR-04 | Phase 2: Infrastructure | Complete |
| SCHM-01 | Phase 3: Schema Consolidation | Pending |
| SCHM-02 | Phase 3: Schema Consolidation | Pending |
| SCHM-03 | Phase 3: Schema Consolidation | Pending |
| SCHM-04 | Phase 3: Schema Consolidation | Pending |
| SCHM-05 | Phase 3: Schema Consolidation | Pending |

**Coverage:**
- v1 requirements: 11 total
- Mapped to phases: 11
- Unmapped: 0

---
*Requirements defined: 2026-03-07*
*Last updated: 2026-03-07 after roadmap creation*
