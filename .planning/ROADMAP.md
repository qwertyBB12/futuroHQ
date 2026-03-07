# Roadmap: Autori Mandatum — Security & Content Architecture Pass

## Overview

A three-phase hardening pass that moves from immediate safety fixes (AI endpoint guards) through infrastructure foundations (staging dataset, automated deploys) to schema debt resolution (tag consolidation, type unification, site settings). Each phase delivers independently verifiable improvements. Phase 2 establishes the staging dataset that Phase 3 uses for safe schema experimentation.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Safety Guards** - AI endpoint components fail gracefully when env vars are missing
- [ ] **Phase 2: Infrastructure** - Staging dataset, dataset switching, and automated deploy pipeline
- [ ] **Phase 3: Schema Consolidation** - Resolve dual tags, person type overlap, keynote duplication, missing site settings, and experimental types

## Phase Details

### Phase 1: Safety Guards
**Goal**: Every AI-powered component either works correctly or shows a clear disabled state — no silent failures
**Depends on**: Nothing (first phase)
**Requirements**: SAFE-01, SAFE-02
**Success Criteria** (what must be TRUE):
  1. Opening a document with SeoGeneratorInput when `AI_SEO_GENERATOR_ENDPOINT` is unset shows a disabled/unavailable state instead of failing silently or throwing errors
  2. The GenerateAIDerivativesAction is hidden or visibly disabled in the document actions menu when `SANITY_STUDIO_AI_ENDPOINT` is unset
  3. Both components function normally when their respective env vars are configured
**Plans**: TBD

Plans:
- [ ] 01-01: AI endpoint guard implementation

### Phase 2: Infrastructure
**Goal**: Developers can safely experiment with schema changes on a staging dataset, and content publishes automatically trigger site deploys
**Depends on**: Phase 1
**Requirements**: INFR-01, INFR-02, INFR-03, INFR-04
**Success Criteria** (what must be TRUE):
  1. A `staging` dataset exists in the Sanity project and can be selected from within the Studio UI
  2. Switching datasets in the Studio does not require code changes or redeployment
  3. Publishing a document in the production dataset automatically triggers a Netlify build via webhook
  4. The manual TriggerDeployAction still works as a fallback alongside the automated webhook
**Plans**: TBD

Plans:
- [ ] 02-01: Staging dataset and dataset switcher
- [ ] 02-02: Automated deploy webhook

### Phase 3: Schema Consolidation
**Goal**: Schema debt resolved — every document type has a clear, non-overlapping purpose and all entities have proper configuration
**Depends on**: Phase 2
**Requirements**: SCHM-01, SCHM-02, SCHM-03, SCHM-04, SCHM-05
**Success Criteria** (what must be TRUE):
  1. Content schemas use only `tags_ref` (reference to tag documents) — legacy string `tags` fields are removed from all schema definitions
  2. Person-like types (person, alumni, ledgerPerson) have a documented rationale: either unified into fewer types with conditional fieldsets, or explicitly kept separate with written justification
  3. Keynote content has a single canonical representation — either the `keynote` type or `video` with `contentCategory: 'keynote'`, not both
  4. Every entity (hector, benext, futuro, next, mitikah, medikah, arkah) has a site settings document type registered in the schema
  5. `alumniContinuum` is either committed with documented purpose and proper desk structure placement, or removed from the schema registry
**Plans**: TBD

Plans:
- [ ] 03-01: Tag system consolidation
- [ ] 03-02: Person types and keynote resolution
- [ ] 03-03: Site settings and experimental type cleanup

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Safety Guards | 0/1 | Not started | - |
| 2. Infrastructure | 0/2 | Not started | - |
| 3. Schema Consolidation | 0/3 | Not started | - |
