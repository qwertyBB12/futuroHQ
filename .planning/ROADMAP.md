# Roadmap: Autori Mandatum

## Milestones

- Shipped **v1.0 Security & Content Architecture Pass** — Phases 1-3 (shipped 2026-03-08)
- Shipped **v1.1 Content Production & Media Pipeline** — Phases 4-8 (shipped 2026-03-21)
- Active **v1.2 Pipeline Completion & Content Metadata** — Phases 9-12

## Phases

<details>
<summary>Shipped v1.0 Security & Content Architecture Pass (Phases 1-3) — SHIPPED 2026-03-08</summary>

- [x] Phase 1: Safety Guards (1/1 plans) — completed 2026-03-08
- [x] Phase 2: Infrastructure (2/2 plans) — completed 2026-03-08
- [x] Phase 3: Schema Consolidation (3/3 plans) — completed 2026-03-08

See: `.planning/milestones/v1.0-ROADMAP.md` for full details.

</details>

<details>
<summary>Shipped v1.1 Content Production & Media Pipeline (Phases 4-8) — SHIPPED 2026-03-21</summary>

- [x] Phase 4: Tech Debt + Shared Infrastructure (2/2 plans) — completed 2026-03-16
- [x] Phase 5: Enrichment Tooling (2/2 plans) — completed 2026-03-16
- [x] Phase 6: Person Tagging + Data Entry (2/2 plans) — completed 2026-03-16
- [x] Phase 7: Video Schema B2/Bunny Fields (1/1 plan) — completed 2026-03-17
- [x] Phase 8: Media Pipeline Infrastructure (3/3 plans) — completed 2026-03-21

See: `.planning/milestones/v1.1-ROADMAP.md` for full details.

</details>

### Active v1.2 Pipeline Completion & Content Metadata

**Milestone Goal:** Complete the media pipeline by integrating transcripts and B2/Bunny URLs into Sanity, fill remaining video/podcast metadata gaps, and finish content tagging across all types.

- [x] **Phase 9: Transcript & Podcast Schema** (2 plans) - Add transcript fields to video/podcast, podcast completeness tracking, externalLinks (completed 2026-03-21)
- [ ] **Phase 10: Video Pipeline Execution** - Run B2/Bunny URL population + transcript ingestion batch scripts, update completeness config
- [ ] **Phase 11: Video Metadata Completion** - Populate missing descriptions, thumbnails, and tags on all video documents
- [ ] **Phase 12: Podcast Data + Content Tagging** - Populate podcast episode metadata, close opEd tag gaps, audit tag taxonomy

## Phase Details

### Phase 9: Transcript & Podcast Schema
**Goal**: Video and podcast documents have transcript fields and podcast has external platform links — schema is ready to accept pipeline output
**Depends on**: Phase 8 (media pipeline infrastructure)
**Requirements**: TRANS-01, TRANS-03, POD-01, POD-02, POD-03
**Plans**: 2 plans
Plans:
- [x] 09-01-PLAN.md — Transcript block, custom component, video + podcastEpisode schema updates, externalLinks
- [x] 09-02-PLAN.md — Podcast + video completeness tracking for transcript and externalLinks fields
**Success Criteria** (what must be TRUE):
  1. A video document in Studio shows fullText and speakerSegments fields — speakerSegments renders as a collapsible, read-only list of speaker/time/text rows
  2. A podcastEpisode document shows the same transcript field structure as video
  3. A podcastEpisode document shows an externalLinks array where editors can add platform + URL pairs
  4. Podcast episodes appear in the enrichment system's completeness tracking with missing-transcript and missing-externalLinks as trackable gaps

### Phase 10: Video Pipeline Execution
**Goal**: All existing video documents have B2/Bunny URLs and transcript data populated, and completeness config reflects the new required fields
**Depends on**: Phase 9
**Requirements**: VPIPE-01, VPIPE-02, TRANS-02, VPIPE-03
**Success Criteria** (what must be TRUE):
  1. Running the B2 match script patches all video documents with b2Key, cdnUrl, thumbnailUrl, and resolution — no manual edits required
  2. Every video document in Studio shows a populated cdnUrl field (none empty)
  3. Running the transcript ingestion script patches video documents with fullText and speakerSegments from .enriched.json files
  4. Video completeness config requires transcript + B2 fields, so videos missing transcript or b2Key appear in the Needs Enrichment desk list
**Plans**: TBD

### Phase 11: Video Metadata Completion
**Goal**: Every video document has a description, at least one tag, and a thumbnail — no content gaps remain in video metadata
**Depends on**: Phase 10
**Requirements**: VMETA-01, VMETA-02, VMETA-03
**Success Criteria** (what must be TRUE):
  1. A batch script generates descriptions for videos missing them by summarizing transcript text — descriptions are populated in Sanity without manual drafting
  2. Every video document has at least one tag assigned (verified by GROQ count query returning 0 untagged)
  3. Every video document has thumbnailUrl or thumbnailImage populated (no video shows as missing thumbnail in completeness view)
**Plans**: TBD

### Phase 12: Podcast Data + Content Tagging
**Goal**: Podcast episode metadata is fully populated and all content types have complete tag coverage with a clean, audited taxonomy
**Depends on**: Phase 11
**Requirements**: POD-04, TAG-01, TAG-02
**Success Criteria** (what must be TRUE):
  1. Podcast episode documents have titles, descriptions, duration, and externalLinks populated via batch script
  2. All opEd documents (17/17) have at least one tag assigned — the 2-doc gap is closed
  3. A GROQ audit of the tag collection shows no orphan tags (tags with zero content references) and no duplicate tag labels
**Plans**: TBD

## Progress

**Execution Order:** 9 → 10 → 11 → 12

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Safety Guards | v1.0 | 1/1 | Complete | 2026-03-08 |
| 2. Infrastructure | v1.0 | 2/2 | Complete | 2026-03-08 |
| 3. Schema Consolidation | v1.0 | 3/3 | Complete | 2026-03-08 |
| 4. Tech Debt + Shared Infrastructure | v1.1 | 2/2 | Complete | 2026-03-16 |
| 5. Enrichment Tooling | v1.1 | 2/2 | Complete | 2026-03-16 |
| 6. Person Tagging + Data Entry | v1.1 | 2/2 | Complete | 2026-03-16 |
| 7. Video Schema B2/Bunny Fields | v1.1 | 1/1 | Complete | 2026-03-17 |
| 8. Media Pipeline Infrastructure | v1.1 | 3/3 | Complete | 2026-03-21 |
| 9. Transcript & Podcast Schema | v1.2 | 2/2 | Complete   | 2026-03-21 |
| 10. Video Pipeline Execution | v1.2 | 0/? | Not started | - |
| 11. Video Metadata Completion | v1.2 | 0/? | Not started | - |
| 12. Podcast Data + Content Tagging | v1.2 | 0/? | Not started | - |
