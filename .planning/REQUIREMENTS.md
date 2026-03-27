# Requirements: Autori Mandatum

**Defined:** 2026-03-26
**Core Value:** Every component must either work correctly or be gracefully disabled — no silent failures, no orphaned experiments, no schema ambiguity.

## v1.3 Requirements

Requirements for Media Pipeline Integrity milestone. Each maps to roadmap phases.

### Data Integrity

- [x] **DINT-01**: All clip Sanity documents have correct CDN URLs matching actual B2 filenames (verified by loading each URL)
- [x] **DINT-02**: All full-length video Sanity documents have correct and working cdnUrl values
- [x] **DINT-03**: Speaker clip documents have correct featuredIn references (person tags matching actual speakers)

### Video Encoding

- [ ] **VENC-01**: process-raw-video.py outputs files with faststart encoding (MOOV atom at file start for progressive streaming)
- [x] **VENC-02**: Existing processed files that lack faststart are re-encoded or flagged for re-processing
- [ ] **VENC-03**: All pipeline output files use consistent, correct FFmpeg settings (CRF 18, H.264, slow preset, web-optimized)

### Pipeline Processing

- [ ] **PIPE-01**: process-raw-video.py correctly applies LUT, vignette, brightness adjustment, and audio passthrough for each camera profile
- [ ] **PIPE-02**: Pipeline handles multiple camera profiles (Sony A6700 S-Log 3, Canon R5 Canon Log 3, GoPro ProTune Flat) with correct LUT selection
- [ ] **PIPE-03**: Pipeline detects and applies anamorphic desqueeze (1.33x) when needed
- [x] **PIPE-04**: Processed video is automatically transcribed (Whisper) and diarized (pyannote) with enriched JSON output

### Pipeline Automation

- [x] **AUTO-01**: Single command processes raw video through the full chain: compress → LUT/filter → transcode → transcribe → diarize → clip extract
- [x] **AUTO-02**: Clip extraction uses per-manifest filenames (no assumptions about speaker numbering)
- [x] **AUTO-03**: Processed files and clips are uploaded to B2 in correct folder structure
- [x] **AUTO-04**: Sanity documents are created/updated from pipeline output with correct CDN URLs and person tags

### Documentation

- [ ] **DOCS-01**: Full pipeline architecture documented: which script does what, data flow, where each component runs
- [ ] **DOCS-02**: Pipeline includes clear instructions for processing new raw video (step-by-step or single-command)

## v1.2 Carried Requirements (blocked until v1.3 completes)

### Video Metadata

- **VMETA-01**: Batch script populates missing video descriptions from transcript summaries
- **VMETA-02**: All videos have tags assigned
- **VMETA-03**: All videos have thumbnailUrl or thumbnailImage populated

### Podcast & Tagging

- **POD-04**: Batch script populates missing podcast episode metadata
- **TAG-01**: All content types with tags field have tags assigned
- **TAG-02**: Tag taxonomy reviewed — no orphan or duplicate tags

## Future Requirements

### Pipeline Enhancements

- **PIPE-F01**: Voice profile database — match speakers across videos automatically
- **PIPE-F02**: EDL/XML timeline generation for DaVinci import
- **PIPE-F03**: Alumni editing portals — raw footage browsable, clip flagging
- **PIPE-F04**: Face recognition from extracted frames + alumni photos
- **PIPE-F05**: AI story arc generation from transcripts

## Out of Scope

| Feature | Reason |
|---------|--------|
| Wistia migration | Videos already on B2 — Wistia is legacy |
| Video transcoding in CF Worker | 128MB memory limit; process locally or use Bunny Stream |
| Frontend video player changes | Studio-side and scripts only this milestone |
| DaVinci Resolve automation | Future milestone — scripting API exists but is a separate effort |
| Bunny Stream adaptive bitrate | Cost optimization decision; current CDN delivery is sufficient |
| Processing remaining 370 raw files | Processing capacity is a runtime task, not a code/pipeline fix — use the corrected pipeline to process manually |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| DINT-01 | Phase 13 | Complete |
| DINT-02 | Phase 13 | Complete |
| DINT-03 | Phase 13 | Complete |
| VENC-01 | Phase 14 | Pending |
| VENC-02 | Phase 14 | Complete |
| VENC-03 | Phase 14 | Pending |
| PIPE-01 | Phase 14 | Pending |
| PIPE-02 | Phase 14 | Pending |
| PIPE-03 | Phase 14 | Pending |
| PIPE-04 | Phase 14 | Complete |
| AUTO-01 | Phase 15 | Complete |
| AUTO-02 | Phase 15 | Complete |
| AUTO-03 | Phase 15 | Complete |
| AUTO-04 | Phase 15 | Complete |
| DOCS-01 | Phase 16 | Pending |
| DOCS-02 | Phase 16 | Pending |

**Coverage:**
- v1.3 requirements: 16 total
- Mapped to phases: 16
- Unmapped: 0

---
*Requirements defined: 2026-03-26*
*Last updated: 2026-03-26 — traceability mapped after roadmap creation*
