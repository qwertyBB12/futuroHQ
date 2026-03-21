---
phase: 09-transcript-podcast-schema
plan: 02
subsystem: enrichment
tags: [completeness, podcast, transcript, enrichment, groq]
dependency_graph:
  requires: []
  provides: [podcastEpisode-transcript-completeness, podcastEpisode-externalLinks-completeness, video-transcript-completeness]
  affects: [deskStructure.ts, GROQ_FILTERS, Needs Enrichment desk lists]
tech_stack:
  added: []
  patterns: [completeness-tracking, groq-filters]
key_files:
  modified:
    - lib/completeness.ts
decisions:
  - Track transcript (fullText) as required field on both podcastEpisode and video types
  - Track externalLinks as required field on podcastEpisode type only
metrics:
  duration: "~1 minute"
  completed_date: "2026-03-21"
  tasks_completed: 1
  files_modified: 1
requirements: [POD-03]
---

# Phase 09 Plan 02: Completeness Tracking for Transcript and External Links Summary

**One-liner:** Added transcript (fullText) and externalLinks completeness checks to podcastEpisode (7 total fields) and transcript check to video (6 total fields) with matching GROQ filters for Needs Enrichment desk lists.

## What Was Built

Updated `lib/completeness.ts` to track two new required fields for podcast episodes and one new required field for videos:

- **podcastEpisode.fullText (Transcript)** — validates the field is a non-empty string
- **podcastEpisode.externalLinks (External Links)** — validates the field is a non-empty array
- **video.fullText (Transcript)** — validates the field is a non-empty string

Both COMPLETENESS_CONFIG entries and GROQ_FILTERS were updated for `podcastEpisode` and `video`. The GROQ filters power the Needs Enrichment filtered desk lists in deskStructure.ts, so podcast episodes and videos missing transcripts (or podcast episodes missing platform links) will now surface automatically in the enrichment workflow.

## Tasks Completed

| Task | Name | Commit | Files Modified |
|------|------|--------|----------------|
| 1 | Add transcript and externalLinks to completeness config and GROQ filters | 8c2af17 | lib/completeness.ts |

## Verification

- `grep -c "fullText" lib/completeness.ts` → 4 (2 config + 2 GROQ) ✓
- `grep -c "externalLinks" lib/completeness.ts` → 2 (1 config + 1 GROQ) ✓
- `grep "Transcript" lib/completeness.ts` → labels in video and podcastEpisode configs ✓
- `grep "External Links" lib/completeness.ts` → label in podcastEpisode config ✓

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all completeness checks are wired to real field names that will be populated by upstream plan 09-01 (transcript/externalLinks schema fields on podcastEpisode and fullText on video).

## Self-Check: PASSED

- lib/completeness.ts exists with all required changes
- Commit 8c2af17 exists and contains the modifications
- All original podcastEpisode checks preserved (description, audioEmbed, tags, episodeNumber, featuredIn)
- All original video checks preserved (thumbnailImage, description, tags, seo, featuredIn)
