# Roadmap: Autori Mandatum

## Milestones

- Shipped **v1.0 Security & Content Architecture Pass** — Phases 1-3 (shipped 2026-03-08)
- Shipped **v1.1 Content Production & Media Pipeline** — Phases 4-8 (shipped 2026-03-21)
- Paused **v1.2 Pipeline Completion & Content Metadata** — Phases 9-12 (9-10 complete, 11-12 blocked by v1.3)
- Active **v1.3 Media Pipeline Integrity** — Phases 13-16

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
<summary>Paused v1.2 Pipeline Completion & Content Metadata (Phases 9-12) — Phases 11-12 blocked by v1.3</summary>

**Milestone Goal:** Complete the media pipeline by integrating transcripts and B2/Bunny URLs into Sanity, fill remaining video/podcast metadata gaps, and finish content tagging across all types.

- [x] **Phase 9: Transcript & Podcast Schema** (2 plans) - Add transcript fields to video/podcast, podcast completeness tracking, externalLinks (completed 2026-03-21)
- [x] **Phase 10: Video Pipeline Execution** (2 plans) - Transcript ingestion script + completeness b2Key update, then run live + verify all 26 videos (completed 2026-03-21)
- [ ] **Phase 11: Video Metadata Completion** - Blocked until v1.3 completes
- [ ] **Phase 12: Podcast Data + Content Tagging** - Blocked until v1.3 completes

</details>

### Active v1.3 Media Pipeline Integrity

**Milestone Goal:** Fix all data integrity issues in the B2-to-Sanity video pipeline and automate the end-to-end flow from raw video to tagged, streamable Sanity documents.

- [x] **Phase 13: Sanity Data Integrity** - Fix clip CDN URL mismatches and person tag references in existing Sanity documents (gap closure in progress) (completed 2026-03-26)
- [ ] **Phase 14: Script Correctness** - Fix encoding, camera profiles, anamorphic desqueeze, and transcription chain in pipeline scripts
- [ ] **Phase 15: Pipeline Automation** - Wire all scripts into a single end-to-end command with correct B2 upload structure and Sanity sync
- [ ] **Phase 16: Pipeline Documentation** - Document full architecture and step-by-step usage guide

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
**Plans**: 2 plans
Plans:
- [x] 10-01-PLAN.md — Create transcript ingestion script (matches enriched JSON to video docs by b2Key stem), add b2Key to completeness config
- [x] 10-02-PLAN.md — Run ingestion script live, verify all 26 B2 videos have b2Key + cdnUrl + fullText + speakerSegments, user confirms in Studio
**Success Criteria** (what must be TRUE):
  1. Running the B2 match script patches all video documents with b2Key, cdnUrl, thumbnailUrl, and resolution — no manual edits required
  2. Every video document in Studio shows a populated cdnUrl field (none empty)
  3. Running the transcript ingestion script patches video documents with fullText and speakerSegments from .enriched.json files
  4. Video completeness config requires transcript + B2 fields, so videos missing transcript or b2Key appear in the Needs Enrichment desk list

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

### Phase 13: Sanity Data Integrity
**Goal**: All clip and full-length video Sanity documents have correct, working CDN URLs and accurate person tag references — no mismatches between Sanity and actual B2 storage
**Depends on**: Phase 10
**Requirements**: DINT-01, DINT-02, DINT-03
**Success Criteria** (what must be TRUE):
  1. Every clip document's cdnUrl loads successfully via HTTP (no 404s or wrong-file responses) — verified by a script that reads each URL
  2. Every full-length video document's cdnUrl returns the correct video (URL matches the b2Key filename pattern in B2)
  3. Speaker clip documents have featuredIn person references that match the actual speakers identified in the transcript diarization output
  4. A re-run of the URL audit script returns zero failures after patches are applied
**Plans**: 4 plans
Plans:
- [x] 13-01-PLAN.md — Audit script + test suite (B2 cross-reference, cdnUrl formula, person tag detection)
- [x] 13-02-PLAN.md — Fix script + live audit-fix-reaudit cycle (clear wrong MMXXV tags, verify zero failures)
- [x] 13-03-PLAN.md — Gap closure: fix audit logic for MMXXV pending_identification and MMXIX subset comparison
- [x] 13-04-PLAN.md — Gap closure: live re-audit + GROQ verification confirming zero failures

### Phase 14: Script Correctness
**Goal**: The pipeline scripts (process-raw-video.py, extract-speaker-clips.py, extract-dialogue-clips.py) produce correctly encoded, web-optimized output for all supported camera profiles
**Depends on**: Phase 13
**Requirements**: VENC-01, VENC-02, VENC-03, PIPE-01, PIPE-02, PIPE-03, PIPE-04
**Success Criteria** (what must be TRUE):
  1. Processing a raw Sony A6700 S-Log 3 file produces a web-playable MP4 that starts buffering immediately in a browser (MOOV atom at file start confirmed by ffprobe)
  2. Processing a raw Canon R5 Canon Log 3 file applies the correct LUT and produces visually correct color output
  3. Processing a 1.33x anamorphic source file produces output at the correct desqueezed aspect ratio (e.g. 16:9 from 4:3 anamorphic source)
  4. Running the pipeline on a raw video file produces a .enriched.json transcript with speaker-labeled segments alongside the processed video
  5. All processed output uses CRF 18, H.264, slow preset — confirmed by ffprobe on output files
**Plans**: 3 plans
Plans:
- [ ] 14-01-PLAN.md — Fix FFmpeg encoding (pure CRF 18), argparse CLI (--camera, --anamorphic, --skip-transcribe), dead code removal
- [x] 14-02-PLAN.md — HF_TOKEN env var, transcribe output format alignment, faststart on clip extraction
- [x] 14-03-PLAN.md — Standalone faststart audit script (has_faststart binary parser + CLI)
**UI hint**: no

### Phase 15: Pipeline Automation
**Goal**: A single command takes a raw video through the full chain — compress, filter, transcode, transcribe, diarize, extract clips, upload to B2, and create/update Sanity documents
**Depends on**: Phase 14
**Requirements**: AUTO-01, AUTO-02, AUTO-03, AUTO-04
**Success Criteria** (what must be TRUE):
  1. Running one command (or script) on a raw video file produces processed video, transcript, clips, B2 uploads, and draft Sanity documents — no intermediate manual steps required
  2. Clip extraction reads filenames from the per-video manifest file — no speaker numbering assumptions are hardcoded
  3. Processed files and clips appear in B2 under the expected folder structure (e.g. mmxxv/processed/, mmxxv/clips/)
  4. Newly processed video and clip Sanity documents have cdnUrl, b2Key, and featuredIn fields populated correctly on creation
**Plans**: TBD

### Phase 16: Pipeline Documentation
**Goal**: The full pipeline is documented well enough that a new raw video can be processed correctly without referring to script source code
**Depends on**: Phase 15
**Requirements**: DOCS-01, DOCS-02
**Success Criteria** (what must be TRUE):
  1. A written document describes what each script does, what inputs it takes, what outputs it produces, and where each component runs (local machine vs. B2 vs. CF Worker vs. Sanity)
  2. Following the documented steps (or single command) for a new raw video produces a correct Sanity document with working CDN URL — no debugging required
**Plans**: TBD

## Progress

**Execution Order:** 9 → 10 → [11-12 blocked] → 13 → 14 → 15 → 16 → [resume 11 → 12]

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
| 11. Video Metadata Completion | v1.2 | 0/? | Blocked (v1.3) | - |
| 12. Podcast Data + Content Tagging | v1.2 | 0/? | Blocked (v1.3) | - |
| 13. Sanity Data Integrity | v1.3 | 4/4 | Complete    | 2026-03-27 |
| 14. Script Correctness | v1.3 | 2/3 | In Progress|  |
| 15. Pipeline Automation | v1.3 | 0/? | Not started | - |
| 16. Pipeline Documentation | v1.3 | 0/? | Not started | - |
