# Requirements: Autori Mandatum

**Defined:** 2026-03-21
**Core Value:** Every component must either work correctly or be gracefully disabled — no silent failures, no orphaned experiments, no schema ambiguity.

## v1.2 Requirements

Requirements for Pipeline Completion & Content Metadata milestone. Each maps to roadmap phases.

### Transcript Integration

- [x] **TRANS-01**: Video schema has fullText (text) and speakerSegments (array of {speaker, start, end, text}) fields
- [x] **TRANS-02**: Batch script ingests .enriched.json files and patches video documents with transcript data
- [x] **TRANS-03**: Transcript fields display readably in Studio (collapsible, read-only speaker segments)

### Video Pipeline

- [x] **VPIPE-01**: Batch script matches B2 files to Sanity video documents and patches b2Key, cdnUrl, bunnyStatus (thumbnailUrl covered by VMETA-03; resolution deferred)
- [x] **VPIPE-02**: All existing video documents have b2Key and cdnUrl populated
- [x] **VPIPE-03**: Video completeness config updated to require transcript + B2 fields

### Video Metadata

- [ ] **VMETA-01**: Batch script populates missing video descriptions from transcript summaries
- [ ] **VMETA-02**: All videos have tags assigned
- [ ] **VMETA-03**: All videos have thumbnailUrl or thumbnailImage populated

### Podcast

- [x] **POD-01**: PodcastEpisode schema has transcript field (fullText + speakerSegments, same as video)
- [x] **POD-02**: PodcastEpisode schema has externalLinks array (platform + url pairs)
- [x] **POD-03**: Podcast completeness added to enrichment system
- [ ] **POD-04**: Batch script populates missing podcast episode metadata

### Content Tagging

- [ ] **TAG-01**: All content types with tags field have tags assigned (opEds gap: 15/17)
- [ ] **TAG-02**: Tag taxonomy reviewed — no orphan or duplicate tags

## Future Requirements

### Transcript Enhancements

- **TRANS-F01**: Speaker name mapping (SPEAKER_00 → actual person names via voice embeddings)
- **TRANS-F02**: Searchable transcript index across all videos
- **TRANS-F03**: Timestamp-linked video playback from transcript segments

### Media Pipeline

- **VPIPE-F01**: Automated clip extraction pipeline (speaker clips, dialogue clips) integrated into Sanity
- **VPIPE-F02**: Video transcoding via Bunny Stream for adaptive bitrate

## Out of Scope

| Feature | Reason |
|---------|--------|
| Wistia file download/transfer | Videos already migrated to B2 |
| Video transcoding in CF Worker | 128MB memory limit; use Bunny Stream if needed |
| Frontend video player changes | Studio-side only this milestone |
| Medikah content | Excluded until separate milestone |
| Speaker voice matching across videos | Complex ML task, future milestone |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| TRANS-01 | Phase 9 | Complete |
| TRANS-02 | Phase 10 | Complete |
| TRANS-03 | Phase 9 | Complete |
| VPIPE-01 | Phase 10 | Complete |
| VPIPE-02 | Phase 10 | Complete |
| VPIPE-03 | Phase 10 | Complete |
| VMETA-01 | Phase 11 | Pending |
| VMETA-02 | Phase 11 | Pending |
| VMETA-03 | Phase 11 | Pending |
| POD-01 | Phase 9 | Complete |
| POD-02 | Phase 9 | Complete |
| POD-03 | Phase 9 | Complete |
| POD-04 | Phase 12 | Pending |
| TAG-01 | Phase 12 | Pending |
| TAG-02 | Phase 12 | Pending |

**Coverage:**
- v1.2 requirements: 15 total
- Mapped to phases: 15
- Unmapped: 0

---
*Requirements defined: 2026-03-21*
*Last updated: 2026-03-21 — VPIPE-01 narrowed (removed thumbnailUrl, resolution; covered by VMETA-03)*
