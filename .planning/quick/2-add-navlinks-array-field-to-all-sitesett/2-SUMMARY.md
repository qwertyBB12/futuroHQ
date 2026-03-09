---
phase: quick
plan: 2
subsystem: schema / content-lake
tags: [navLinks, siteSettings, bilingual, navigation]
dependency_graph:
  requires: [siteSettings schemas]
  provides: [navLinks field, structured navigation data]
  affects: [all frontend sites consuming siteSettings]
tech_stack:
  added: []
  patterns: [navLinkItem object type with bilingual labels]
key_files:
  created: []
  modified:
    - schemaTypes/siteSettings_futuro.ts
    - schemaTypes/siteSettings_benext.ts
    - schemaTypes/siteSettings_hector.ts
    - schemaTypes/siteSettings_arkah.ts
    - schemaTypes/siteSettings_next.ts
    - schemaTypes/siteSettings_mitikah.ts
    - schemaTypes/siteSettings_medikah.ts
    - schema.json
decisions:
  - navLinkItem uses _key with site-prefix pattern (e.g., futuro-about) for stable keys
  - All 7 schemas get identical field definition for consistency even though only 5 have data
metrics:
  duration: 3min
  completed: 2026-03-09
---

# Quick Task 2: Add navLinks Array Field to All siteSettings Schemas

Structured bilingual navLinks array (label, labelEs, href) added to all 7 siteSettings schemas and populated for 5 active sites via Sanity API mutations.

## Tasks Completed

| # | Task | Commit | Key Changes |
|---|------|--------|-------------|
| 1 | Add navLinks field to 7 schemas | 3286d85 | Identical navLinks array with navLinkItem objects added after siteTitle |
| 2 | Populate data for 5 sites + deploy | 0b46c49 | 29 total nav links across 5 sites, studio deployed |

## What Was Done

### Task 1: Schema Changes
Added `navLinks` array field to all 7 siteSettings schemas (`_futuro`, `_benext`, `_hector`, `_arkah`, `_next`, `_mitikah`, `_medikah`). Each navLinkItem has:
- `label` (string, required) -- English navigation label
- `labelEs` (string) -- Spanish variant
- `href` (string, required) -- URL path

Field placed immediately after `siteTitle` in every file per plan specification.

### Task 2: Data Population + Deploy
Patched 5 production documents via Sanity HTTP API:
- **siteSettings_futuro**: 7 links (About, Programs, Alumni, Impact, Journal, Support, Contact)
- **siteSettings_benext**: 6 links (About, Programs, Collaborators, Alumni, Signal, Contact)
- **siteSettings_hector**: 6 links (Essays, Keynotes, Reflections, Publications, Projects, About)
- **siteSettings_arkah**: 4 links (Home, Platform, About, Contact)
- **siteSettings_next**: 6 links (About, Certifications, Institutions, Verify, Essays, Contact)

All items include Spanish translations. Studio deployed to https://futuro-hub-studio.sanity.studio/.

## Deviations from Plan

None -- plan executed exactly as written.

## GROQ Query for Frontends

```groq
*[_type == "siteSettings_futuro"][0]{
  navLinks[]{label, labelEs, href}
}
```

## Self-Check: PASSED

- All 7 schema files contain navLinks field
- Commits 3286d85 and 0b46c49 verified in git log
- 5 production documents confirmed with correct link counts via GROQ
- Studio deployed successfully
