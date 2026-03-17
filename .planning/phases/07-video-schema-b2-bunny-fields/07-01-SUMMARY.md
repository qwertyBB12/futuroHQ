---
phase: 07-video-schema-b2-bunny-fields
plan: 01
subsystem: schema
tags: [video, b2, bunny, completeness, migration]
dependency_graph:
  requires: []
  provides: [videoSource-field, b2-storage-fields, source-aware-completeness]
  affects: [schemaTypes/video.ts, lib/completeness.ts, deskStructure.ts (via GROQ_FILTERS)]
tech_stack:
  added: []
  patterns: [conditional-field-visibility, custom-validation, source-aware-completeness]
key_files:
  created: []
  modified:
    - schemaTypes/video.ts
    - lib/completeness.ts
decisions:
  - "videoSource defaults to b2 for new documents (overriding SCHM-06 which said wistia) — ecosystem is transitioning off Wistia"
  - "B2/Bunny fields hidden via document?.videoSource !== 'b2' (no undefined guard) — null/undefined correctly treated as wistia"
  - "videoUrl validation replaced with custom Rule.custom to allow b2 videos without videoUrl"
  - "duration field assigned to storage group per SCHM-05 (5 total: b2Key, cdnUrl, duration, resolution, thumbnailUrl)"
  - "Source-aware 6th check added outside COMPLETENESS_CONFIG via schemaType === 'video' branch in checkCompleteness — preserves pure FieldCheck interface"
metrics:
  duration: ~2 min
  completed: "2026-03-17"
  tasks: 2
  files: 2
---

# Phase 7 Plan 01: Video Schema B2/Bunny Fields Summary

videoSource migration enum (wistia|b2) and 5 B2/Bunny storage fields added to video schema with conditional visibility, plus source-aware completeness checks branching on videoSource.

## Tasks Completed

| # | Task | Commit | Files Modified |
|---|------|--------|----------------|
| 1 | Add videoSource enum and B2/Bunny storage fields to video schema | 8d87c88 | schemaTypes/video.ts |
| 2 | Update completeness system with source-aware video checks | fba8771 | lib/completeness.ts |

## Changes Made

### schemaTypes/video.ts

- Added second field group `{name: 'storage', title: 'B2/Bunny Storage'}`
- Added `videoSource` field (radio, wistia|b2) with `initialValue: 'b2'`, placed after `videoFormat`
- Added 4 new storage fields: `b2Key` (string), `cdnUrl` (url), `resolution` (string enum), `thumbnailUrl` (url) — all `group: 'storage'`, all `hidden: ({document}) => document?.videoSource !== 'b2'`
- Assigned existing `duration` field to `group: 'storage'` (SCHM-05: 5 total storage fields)
- Added `hidden: ({document}) => document?.videoSource === 'b2'` to `platform` and `videoUrl`
- Replaced `Rule.required()` on `videoUrl` with `Rule.custom(...)` — required only when `videoSource !== 'b2'`
- Updated `initialValue` to include `videoSource: 'b2'`

### lib/completeness.ts

- Added source-aware 6th check in `checkCompleteness` via `if (schemaType === 'video')` block
- B2 videos (`videoSource === 'b2'`) check `doc.cdnUrl` — missing pushes `'CDN URL'` to missingFields
- Wistia/null videos check `doc.videoUrl` — missing pushes `'Video URL'` to missingFields
- Video total becomes `checks.length + 1` (6 total)
- Updated `GROQ_FILTERS.video` to include source-aware storage conditions (b2 checks cdnUrl, wistia/null checks videoUrl)

## Deviations from Plan

None — plan executed exactly as written.

## Existing Issues (Pre-existing, Out of Scope)

TypeScript errors in `migrations/`, `scripts/`, and `schemaTypes/seoBlock.ts` pre-existed before this plan and are unrelated to these changes. Logged in deferred-items.md.

## Self-Check

### Files

- [x] schemaTypes/video.ts — contains videoSource, b2Key, cdnUrl, resolution, thumbnailUrl, storage group, updated initialValue
- [x] lib/completeness.ts — contains source-aware video block, updated GROQ_FILTERS

### Commits

- [x] 8d87c88 — feat(07-01): add videoSource enum and B2/Bunny storage fields to video schema
- [x] fba8771 — feat(07-01): update completeness system with source-aware video checks

## Self-Check: PASSED
