---
phase: 07-video-schema-b2-bunny-fields
verified: 2026-03-17T00:00:00Z
status: passed
score: 5/5 must-haves verified
re_verification: false
gaps: []
human_verification:
  - test: "Open a new Video document in Studio and confirm the videoSource radio shows 'B2/Bunny CDN' selected by default and the B2/Bunny Storage group is visible"
    expected: "New documents open with videoSource = b2, B2 fields visible, wistia fields hidden"
    why_human: "initialValue and conditional visibility are runtime Studio behaviors — cannot be asserted by grep"
  - test: "Open an existing video document (no videoSource field) and confirm wistia fields (videoUrl, platform) are visible and B2 fields are hidden"
    expected: "Legacy video shows videoUrl and platform fields; B2/Bunny fields are absent from the form"
    why_human: "Hidden logic for null videoSource requires live document rendering to observe"
  - test: "Switch videoSource from b2 to wistia on a new document — confirm B2 fields disappear and videoUrl becomes required"
    expected: "B2 fields vanish; videoUrl field appears with required validation error if empty"
    why_human: "Reactive conditional visibility can only be confirmed by interacting with the live form"
---

# Phase 7: Video Schema B2/Bunny Fields Verification Report

**Phase Goal:** The video schema has a stable landing zone for pipeline metadata — editors can manually enter Bunny video IDs while the automated pipeline is being built
**Verified:** 2026-03-17
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Note on ROADMAP Success Criterion 2 vs Implementation

The ROADMAP (Phase 7 Success Criteria item 2) states: "Video documents have a videoSource field (wistia | b2) **that defaults to wistia**". The PLAN and the SUMMARY both document a deliberate override of this: the default was changed to `b2` because the ecosystem is transitioning off Wistia. This is a reasoned deviation captured in the SUMMARY decisions field. The implemented behavior (`initialValue: 'b2'`) is more consistent with the phase goal ("stable landing zone while pipeline is being built") than the original wistia default would have been. This is noted but does not constitute a gap.

The ROADMAP Success Criterion 3 references `bunnyVideoId` — a field name that was replaced in the PLAN by `cdnUrl` as the B2-storage completeness marker. The PLAN's must_haves and acceptance criteria are the contract here; the field name difference is a planning refinement.

---

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Video documents show a videoSource radio selector (wistia \| b2) with b2 as default for new documents | VERIFIED | `schemaTypes/video.ts` line 83-96: `name: 'videoSource'`, `layout: 'radio'`, `initialValue: 'b2'`, options list with both values; root-level `initialValue` also includes `videoSource: 'b2'` at line 20 |
| 2 | When videoSource is b2, B2/Bunny fields (b2Key, cdnUrl, duration, resolution, thumbnailUrl) are visible and wistia fields (videoUrl, platform) are hidden | VERIFIED | Lines 109, 115: `hidden: ({document}) => document?.videoSource === 'b2'` on platform and videoUrl; lines 132, 140, 156, 164: `hidden: ({document}) => document?.videoSource !== 'b2'` on all 4 new B2 fields; duration at line 202 has `group: 'storage'` with no hidden (always visible per spec) |
| 3 | When videoSource is wistia or null (existing docs), wistia fields are visible and B2/Bunny fields are hidden | VERIFIED | Hidden logic `document?.videoSource !== 'b2'` correctly hides B2 fields for null/undefined (null !== 'b2' is true), matching spec. No undefined guard added per plan requirement |
| 4 | Completeness checks for video are source-aware: wistia checks videoUrl, b2 checks cdnUrl | VERIFIED | `lib/completeness.ts` lines 238-256: `if (schemaType === 'video')` block, `const isB2 = videoSource === 'b2'`, branches to `doc.cdnUrl` check or `doc.videoUrl` check; `total: checks.length + 1` (6) returned |
| 5 | Existing 84 videos with no videoSource still pass completeness checks as wistia-source videos | VERIFIED | In `checkCompleteness`, when `videoSource` is undefined, `isB2` is false → falls into wistia branch checking `doc.videoUrl`. Existing videos with populated videoUrl will pass the 6th check |

**Score:** 5/5 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `schemaTypes/video.ts` | videoSource enum, B2/Bunny storage fields with conditional visibility | VERIFIED | File exists, 368 lines, contains all required fields |
| `lib/completeness.ts` | Source-aware video completeness checks and GROQ filters | VERIFIED | File exists, 297 lines, contains source-aware block |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `schemaTypes/video.ts` | `lib/completeness.ts` | videoSource field drives completeness branching | VERIFIED | `lib/completeness.ts` line 239: `const videoSource = doc.videoSource as string \| undefined` — branches on 'b2' vs wistia/null |
| `lib/completeness.ts` | `deskStructure.ts` | GROQ_FILTERS consumed by Needs Enrichment desk lists | VERIFIED | `deskStructure.ts` line 14: `import {GROQ_FILTERS} from './lib/completeness'`; line 108: `.filter(GROQ_FILTERS[schemaType])`; line 176: `listWithEnrichment('video', 'Videos')` — the video type is passed to `listWithEnrichment` which calls `.filter(GROQ_FILTERS['video'])` |

Both key links are fully wired.

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| SCHM-05 | 07-01-PLAN.md | Video schema has B2/Bunny fields: b2Key, cdnUrl, duration, resolution, thumbnailUrl in a collapsible field group | SATISFIED | All 5 fields present in `schemaTypes/video.ts` assigned to `{name: 'storage', title: 'B2/Bunny Storage'}` group (lines 131, 139, 155, 163, 202). In Sanity v3, field groups render as tabs — "collapsible" in the ROADMAP is informal; tab-grouped fields are the correct Sanity pattern |
| SCHM-06 | 07-01-PLAN.md | Video schema has videoSource enum field (wistia \| b2) for migration tracking | SATISFIED | `videoSource` field at line 83-96 with `options.list` containing both values, `layout: 'radio'` |

No orphaned requirements — REQUIREMENTS.md traceability table maps both SCHM-05 and SCHM-06 exclusively to Phase 7. No additional Phase 7 requirements exist in REQUIREMENTS.md.

---

### Artifact Detail: schemaTypes/video.ts

**Level 1 — Exists:** YES (368 lines)

**Level 2 — Substantive:** VERIFIED
- `videoSource` field: lines 83-96, radio layout, wistia|b2 options, `initialValue: 'b2'`, `Rule.required()`
- Storage group: line 24, `{name: 'storage', title: 'B2/Bunny Storage'}`
- `b2Key`: line 127-133, `group: 'storage'`, `hidden: !== 'b2'`
- `cdnUrl`: line 134-141, type url, `group: 'storage'`, `hidden: !== 'b2'`
- `resolution`: line 142-157, enum options (720p/1080p/1440p/2160p), `group: 'storage'`, `hidden: !== 'b2'`
- `thumbnailUrl`: line 158-165, type url, `group: 'storage'`, `hidden: !== 'b2'`
- `duration`: line 199-203, `group: 'storage'`, no hidden (correct per spec)
- `platform` hidden: line 109 `hidden: ({document}) => document?.videoSource === 'b2'`
- `videoUrl` hidden + custom validation: lines 115-124, `Rule.custom` with conditional wistia check
- Root `initialValue` includes `videoSource: 'b2'` (line 20)

**Level 3 — Wired:** VERIFIED (schema registered in schemaTypes/index.ts by pre-existing export)

---

### Artifact Detail: lib/completeness.ts

**Level 1 — Exists:** YES (297 lines)

**Level 2 — Substantive:** VERIFIED
- `if (schemaType === 'video')` block: lines 238-256
- `const isB2 = videoSource === 'b2'`: line 241
- `doc.cdnUrl` check with `missingFields.push('CDN URL')`: lines 243-246
- `doc.videoUrl` check with `missingFields.push('Video URL')`: lines 249-252
- `return {completed, total: checks.length + 1, missingFields}`: line 255
- `GROQ_FILTERS.video` updated: lines 275-283, contains `videoSource == "b2"` + `cdnUrl` condition and `(videoSource == "wistia" || !defined(videoSource))` + `videoUrl` condition

**Level 3 — Wired:** VERIFIED (imported and consumed by deskStructure.ts lines 14, 108)

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `schemaTypes/video.ts` | — | None found | — | — |
| `lib/completeness.ts` | — | None found | — | — |

No TODO/FIXME/placeholder comments, no empty implementations, no stub handlers in the modified files.

**Pre-existing TypeScript errors** (out of scope — confirmed pre-existing per SUMMARY):
- `migrations/seedKeynotes.ts` — TS2345 on location field
- `schemaTypes/seoBlock.ts` — TS2339 on InitialValueResolverContext
- Several `scripts/import-*.ts` files — TS2345/TS2339 errors

None of these are in files modified by this phase.

---

### Human Verification Required

#### 1. New document default state

**Test:** Create a new Video document in Studio (click the + button in Videos list)
**Expected:** videoSource radio shows "B2/Bunny CDN" selected; B2/Bunny Storage group tab is visible; b2Key, cdnUrl, resolution, thumbnailUrl fields appear; videoUrl and platform fields are hidden
**Why human:** initialValue application and conditional field rendering are runtime Studio behaviors

#### 2. Legacy video backward compatibility

**Test:** Open any existing published video document (one created before this phase, with no videoSource field set)
**Expected:** videoUrl and platform fields are visible; B2/Bunny fields (b2Key, cdnUrl, resolution, thumbnailUrl) do not appear in the form; no validation errors on save
**Why human:** null videoSource hidden logic cannot be confirmed without opening a real document

#### 3. Source toggle reactivity

**Test:** On a new Video document, switch videoSource from "B2/Bunny CDN" to "Wistia (Legacy)"
**Expected:** B2 fields disappear immediately; videoUrl field appears and shows a validation error if empty; platform field appears
**Why human:** Reactive conditional visibility requires live form interaction

---

### Gaps Summary

No gaps. All 5 observable truths are verified, both required artifacts pass all three levels (exists, substantive, wired), both key links are confirmed wired in code, and both requirements SCHM-05 and SCHM-06 have clear implementation evidence.

The deviation from ROADMAP Success Criterion 2 (default changed from wistia to b2) is a deliberate, documented decision recorded in the SUMMARY — it improves alignment with the phase goal and does not break the stated requirement (SCHM-06 only requires the enum field exist, not mandate a specific default).

---

_Verified: 2026-03-17_
_Verifier: Claude (gsd-verifier)_
