# Requirements: Autori Mandatum v1.1

**Defined:** 2026-03-16
**Core Value:** Every component must either work correctly or be gracefully disabled — no silent failures, no orphaned experiments, no schema ambiguity.

## v1.1 Requirements

Requirements for Content Production & Media Pipeline milestone. Each maps to roadmap phases.

### Schema & Infrastructure

- [ ] **SCHM-01**: alumniContinuum added to GOVERNED_TYPES in sanity.config.ts so badges and document actions render correctly
- [ ] **SCHM-02**: surfaceOn field extracted from essay.ts into shared reusable definition (like governanceFields pattern)
- [ ] **SCHM-03**: surfaceOn field added to video, podcast, podcastEpisode, keynote, news schemas
- [ ] **SCHM-04**: Arkah added to surfaceOn site options list as 7th site value
- [ ] **SCHM-05**: Video schema has B2/Bunny fields: b2Key, cdnUrl, duration, resolution, thumbnailUrl in a collapsible field group
- [ ] **SCHM-06**: Video schema has videoSource enum field (wistia | b2) for migration tracking
- [ ] **SCHM-07**: Video documents have person/alumni reference array field for cross-site profile surfacing
- [ ] **SCHM-08**: GOVERNED_TYPES extracted to shared lib/constants.ts used by both sanity.config.ts and deskStructure.ts

### Enrichment Tooling

- [ ] **ENRH-01**: Filtered desk lists showing incomplete records per content type using GROQ null/empty filters
- [ ] **ENRH-02**: Completeness dashboard widget showing field completion gaps across all content types via GROQ count() aggregation
- [ ] **ENRH-03**: Per-document completeness progress bar rendered above form fields via components.input API
- [ ] **ENRH-04**: Batch update scripts via Sanity client for bulk field population with rate-limit-safe chunking (25 req/s, ~100 mutations/transaction)

### Data Entry

- [ ] **DATA-01**: All alumni records have photos, bios, and cohort details populated
- [ ] **DATA-02**: All collaborator records have photos, bios, and organization details populated
- [ ] **DATA-03**: All 27 empty ledgerPerson documents populated with available data

### Media Pipeline

- [ ] **MDIA-01**: Backblaze B2 bucket configured with CORS rules validated against Bunny CDN pull zone
- [ ] **MDIA-02**: Bunny CDN pull zone configured and validated with B2 origin (Block Root Path Access enabled)
- [ ] **MDIA-03**: Cloudflare Worker receives B2 upload event notifications and writes metadata to Sanity video draft documents
- [ ] **MDIA-04**: Bunny CDN custom asset source plugin in Studio for browsing and selecting from Bunny Storage Zone

## Future Requirements

Deferred to next milestone. Tracked but not in current roadmap.

### Content Metadata

- **CMTA-01**: All video records have descriptions, thumbnails, and tags populated
- **CMTA-02**: All podcast/podcastEpisode records have descriptions, thumbnails, and tags populated
- **CMTA-03**: All keynote and news records have complete metadata

### Additional Features

- **FEAT-01**: Bunny Stream transcoding pipeline (if raw MP4 quality proves insufficient)
- **FEAT-02**: Medikah added to surfaceOn site options

## Out of Scope

| Feature | Reason |
|---------|--------|
| Mux video integration | B2+Bunny chosen for cost control; Mux charges per stored/streamed minute |
| Native Sanity video upload | Defeats self-hosting goal; Sanity charges for asset storage/bandwidth |
| In-Studio batch edit UI | Sanity has no native batch edit (issues #4971, #8243); CLI scripts are the correct pattern |
| Video transcoding in CF Worker | 128MB memory limit; use Bunny Stream or separate server if needed |
| Medikah in surfaceOn | Explicitly excluded from this milestone |
| Separate staging surfaceOn values | Use Sanity datasets for env separation, not schema values |
| Deployment migration (Netlify → CF Pages) | Separate effort outside this milestone |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SCHM-01 | — | Pending |
| SCHM-02 | — | Pending |
| SCHM-03 | — | Pending |
| SCHM-04 | — | Pending |
| SCHM-05 | — | Pending |
| SCHM-06 | — | Pending |
| SCHM-07 | — | Pending |
| SCHM-08 | — | Pending |
| ENRH-01 | — | Pending |
| ENRH-02 | — | Pending |
| ENRH-03 | — | Pending |
| ENRH-04 | — | Pending |
| DATA-01 | — | Pending |
| DATA-02 | — | Pending |
| DATA-03 | — | Pending |
| MDIA-01 | — | Pending |
| MDIA-02 | — | Pending |
| MDIA-03 | — | Pending |
| MDIA-04 | — | Pending |

**Coverage:**
- v1.1 requirements: 19 total
- Mapped to phases: 0
- Unmapped: 19

---
*Requirements defined: 2026-03-16*
*Last updated: 2026-03-16 after initial definition*
