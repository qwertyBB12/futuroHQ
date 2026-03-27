# Roadmap: Autori Mandatum

## Milestones

- Shipped **v1.0 Security & Content Architecture Pass** — Phases 1-3 (shipped 2026-03-08)
- Shipped **v1.1 Content Production & Media Pipeline** — Phases 4-8 (shipped 2026-03-21)
- Shipped **v1.3 Media Pipeline Integrity** — Phases 13-17 (shipped 2026-03-27)
- Paused **v1.2 Pipeline Completion & Content Metadata** — Phases 9-12 (9-10 complete, 11-12 ready to resume)

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

<details>
<summary>Shipped v1.3 Media Pipeline Integrity (Phases 13-17) — SHIPPED 2026-03-27</summary>

- [x] Phase 13: Sanity Data Integrity (4/4 plans) — completed 2026-03-26
- [x] Phase 14: Script Correctness (3/3 plans) — completed 2026-03-27
- [x] Phase 15: Pipeline Automation (2/2 plans) — completed 2026-03-27
- [x] Phase 16: Pipeline Documentation (1/1 plan) — completed 2026-03-26
- [x] Phase 17: Pipeline Path Fix & Tracking Cleanup (1/1 plan) — completed 2026-03-27

See: `.planning/milestones/v1.3-ROADMAP.md` for full details.

</details>

### Paused v1.2 Pipeline Completion & Content Metadata

**Milestone Goal:** Complete the media pipeline by integrating transcripts and B2/Bunny URLs into Sanity, fill remaining video/podcast metadata gaps, and finish content tagging across all types.

- [x] **Phase 9: Transcript & Podcast Schema** (2 plans) — completed 2026-03-21
- [x] **Phase 10: Video Pipeline Execution** (2 plans) — completed 2026-03-21
- [ ] **Phase 11: Video Metadata Completion** — Ready to resume (v1.3 complete)
- [ ] **Phase 12: Podcast Data + Content Tagging** — Ready to resume (v1.3 complete)

### Phase 11: Video Metadata Completion
**Goal**: Every video document has a description, at least one tag, and a thumbnail — no content gaps remain in video metadata
**Depends on**: Phase 10 (and v1.3 completion)
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
| 9. Transcript & Podcast Schema | v1.2 | 2/2 | Complete | 2026-03-21 |
| 10. Video Pipeline Execution | v1.2 | 2/2 | Complete | 2026-03-21 |
| 11. Video Metadata Completion | v1.2 | 0/? | Ready | - |
| 12. Podcast Data + Content Tagging | v1.2 | 0/? | Ready | - |
| 13. Sanity Data Integrity | v1.3 | 4/4 | Complete | 2026-03-26 |
| 14. Script Correctness | v1.3 | 3/3 | Complete | 2026-03-27 |
| 15. Pipeline Automation | v1.3 | 2/2 | Complete | 2026-03-27 |
| 16. Pipeline Documentation | v1.3 | 1/1 | Complete | 2026-03-26 |
| 17. Pipeline Path Fix & Tracking Cleanup | v1.3 | 1/1 | Complete | 2026-03-27 |
