# Roadmap: Autori Mandatum

## Milestones

- Shipped **v1.0 Security & Content Architecture Pass** — Phases 1-3 (shipped 2026-03-08)
- **v1.1 Content Production & Media Pipeline** — Phases 4-8 (in progress)

## Phases

<details>
<summary>Shipped v1.0 Security & Content Architecture Pass (Phases 1-3) — SHIPPED 2026-03-08</summary>

- [x] Phase 1: Safety Guards (1/1 plans) — completed 2026-03-08
- [x] Phase 2: Infrastructure (2/2 plans) — completed 2026-03-08
- [x] Phase 3: Schema Consolidation (3/3 plans) — completed 2026-03-08

See: `.planning/milestones/v1.0-ROADMAP.md` for full details.

</details>

### v1.1 Content Production & Media Pipeline (In Progress)

**Milestone Goal:** Make the studio content-production-ready — build enrichment tooling, extend cross-site surfacing, integrate self-hosted video pipeline, and populate all incomplete records to 100%.

- [x] **Phase 4: Tech Debt + Shared Infrastructure** - Resolve v1.0 governance debt and extract surfaceOn + GOVERNED_TYPES as shared constants before all subsequent schema work (completed 2026-03-16)
- [ ] **Phase 5: Enrichment Tooling** - Build completeness indicators, filtered desk lists, and enrichment dashboard widget so data entry is trackable and efficient
- [x] **Phase 6: Person Tagging + Data Entry** - Add alumni reference field to video and populate all incomplete alumni, collaborator, and ledgerPerson records (completed 2026-03-16)
- [x] **Phase 7: Video Schema B2/Bunny Fields** - Extend video schema with B2/Bunny storage fields and migration-tracking enum before pipeline infrastructure is built (completed 2026-03-17)
- [ ] **Phase 8: Media Pipeline Infrastructure** - Configure B2 + Bunny CDN and deploy Cloudflare Worker that auto-creates Sanity draft documents on video upload

## Phase Details

### Phase 4: Tech Debt + Shared Infrastructure
**Goal**: All governed document types have correct badges and actions; surfaceOn is a single shared definition used across all content types including Arkah
**Depends on**: Nothing (first phase of v1.1)
**Requirements**: SCHM-01, SCHM-02, SCHM-03, SCHM-04, SCHM-08
**Success Criteria** (what must be TRUE):
  1. alumniContinuum documents display EntityBadge, PlatformTierBadge, and ArchivalBadge in the Studio — matching behavior of all other governed types
  2. video, podcast, podcastEpisode, keynote, and news documents each have a surfaceOn field with working multi-select grid UI
  3. Arkah appears as a selectable option in the surfaceOn grid on all content types including essay
  4. GOVERNED_TYPES is defined once in lib/constants.ts and imported by both sanity.config.ts and deskStructure.ts — no divergence possible
**Plans**: 2 plans

Plans:
- [ ] 04-01-PLAN.md — Extract constants to lib/constants.ts, create shared surfaceOnField, update imports
- [ ] 04-02-PLAN.md — Propagate surfaceOnField to 6 schemas, patch alumniContinuum governance data

### Phase 5: Enrichment Tooling
**Goal**: Editors can see exactly which records are incomplete and navigate directly to them — no hunting, no Vision queries required
**Depends on**: Phase 4
**Requirements**: ENRH-01, ENRH-02, ENRH-03, ENRH-04
**Success Criteria** (what must be TRUE):
  1. Each governed content type in the desk has a "Needs Enrichment" filtered list showing only documents missing required fields
  2. The dashboard displays a per-type completion percentage widget that updates in real time as records are edited
  3. Opening any video or alumni document shows a completeness progress bar above the form fields indicating which fields are missing
  4. A batch script can populate fields across multiple documents with rate-limit-safe chunking — no partial updates on interruption
**Plans**: 2 plans

Plans:
- [ ] 05-01-PLAN.md — Create lib/completeness.ts central config and add "Needs Enrichment" filtered desk lists
- [ ] 05-02-PLAN.md — Build enrichment dashboard widget, per-document completeness banner, and batch update script

### Phase 6: Person Tagging + Data Entry
**Goal**: All alumni, collaborator, and ledgerPerson records are fully populated and videos are tagged with the people who appear in them
**Depends on**: Phase 5
**Requirements**: SCHM-07, DATA-01, DATA-02, DATA-03
**Success Criteria** (what must be TRUE):
  1. Video documents have a person/alumni reference array field visible in the Studio form
  2. All alumni records display photos, bios, and cohort details — the enrichment dashboard shows 100% completion for alumni
  3. All collaborator records have photos, bios, and organization details populated
  4. All 27 previously-empty ledgerPerson documents have data — the "Needs Enrichment" filtered list for ledgerPerson is empty
**Plans**: 2 plans

Plans:
- [ ] 06-01-PLAN.md — Create shared featuredIn/featuredContent fields, update 12 schemas, expand completeness system and desk structure
- [ ] 06-02-PLAN.md — Alumni migration script, data population scripts with JSON templates, Studio verification

### Phase 7: Video Schema B2/Bunny Fields
**Goal**: The video schema has a stable landing zone for pipeline metadata — editors can manually enter Bunny video IDs while the automated pipeline is being built
**Depends on**: Phase 6
**Requirements**: SCHM-05, SCHM-06
**Success Criteria** (what must be TRUE):
  1. Video documents have a collapsible "B2/Bunny Storage" field group containing b2Key, cdnUrl, duration, resolution, and thumbnailUrl fields
  2. Video documents have a videoSource field (wistia | b2) that defaults to wistia — existing videos are not broken
  3. Completeness checks updated so videos with populated bunnyVideoId register as storage-complete in the enrichment dashboard
**Plans**: 1 plan

Plans:
- [ ] 07-01-PLAN.md — Add videoSource enum, B2/Bunny storage fields with conditional visibility, source-aware completeness checks

### Phase 8: Media Pipeline Infrastructure
**Goal**: Uploading a video to B2 automatically creates a draft Sanity document with CDN URL and metadata populated — the pipeline is end-to-end tested
**Depends on**: Phase 7
**Requirements**: MDIA-01, MDIA-02, MDIA-03, MDIA-04
**Success Criteria** (what must be TRUE):
  1. B2 bucket has CORS rules validated against Bunny CDN pull zone — videos play back from CDN URL without CORS errors
  2. Uploading a file to B2 triggers a Cloudflare Worker that creates or patches a draft video document in Sanity with b2Key, cdnUrl, and bunnyStatus populated
  3. Studio editors can browse and select assets from the Bunny Storage Zone via a custom asset source panel
  4. At least one real video upload completes the full pipeline: B2 upload → Worker fires → Sanity draft created → CDN URL plays back
**Plans**: 3 plans

Plans:
- [ ] 08-01-PLAN.md — Add bunnyStatus pipeline-tracking field to video schema and update completeness system
- [ ] 08-02-PLAN.md — Create Cloudflare Worker repo with B2 webhook handler, Sanity draft creation, infrastructure docs and validation scripts
- [ ] 08-03-PLAN.md — Build Bunny CDN custom asset source plugin for Studio editors to browse and select CDN-hosted videos

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Safety Guards | v1.0 | 1/1 | Complete | 2026-03-08 |
| 2. Infrastructure | v1.0 | 2/2 | Complete | 2026-03-08 |
| 3. Schema Consolidation | v1.0 | 3/3 | Complete | 2026-03-08 |
| 4. Tech Debt + Shared Infrastructure | 2/2 | Complete   | 2026-03-16 | - |
| 5. Enrichment Tooling | 1/2 | In Progress|  | - |
| 6. Person Tagging + Data Entry | 2/2 | Complete   | 2026-03-17 | - |
| 7. Video Schema B2/Bunny Fields | 1/1 | Complete   | 2026-03-17 | - |
| 8. Media Pipeline Infrastructure | 1/3 | In Progress|  | - |
