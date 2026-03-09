---
phase: quick
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - schemaTypes/siteSettings_futuro.ts
  - schemaTypes/siteSettings_hector.ts
  - schemaTypes/siteSettings_benext.ts
  - schemaTypes/siteSettings_next.ts
  - schemaTypes/siteSettings_mitikah.ts
  - schemaTypes/siteSettings_medikah.ts
  - schemaTypes/siteSettings_arkah.ts
autonomous: true
requirements: [BILINGUAL-SITE-SETTINGS]
must_haves:
  truths:
    - "Each siteSettings schema has metaDescriptionEs field after metaDescription"
    - "Each siteSettings schema has footerCopyEs field after footerCopy"
    - "Each siteSettings schema has copyEs field inside globalCta object after copy"
    - "Studio builds without errors after schema changes"
  artifacts:
    - path: "schemaTypes/siteSettings_futuro.ts"
      provides: "Bilingual Es fields for Futuro"
      contains: "metaDescriptionEs"
    - path: "schemaTypes/siteSettings_hector.ts"
      provides: "Bilingual Es fields for Hector"
      contains: "metaDescriptionEs"
    - path: "schemaTypes/siteSettings_benext.ts"
      provides: "Bilingual Es fields for BeNeXT"
      contains: "metaDescriptionEs"
    - path: "schemaTypes/siteSettings_next.ts"
      provides: "Bilingual Es fields for NeXT"
      contains: "metaDescriptionEs"
    - path: "schemaTypes/siteSettings_mitikah.ts"
      provides: "Bilingual Es fields for Mitikah"
      contains: "metaDescriptionEs"
    - path: "schemaTypes/siteSettings_medikah.ts"
      provides: "Bilingual Es fields for Medikah"
      contains: "metaDescriptionEs"
    - path: "schemaTypes/siteSettings_arkah.ts"
      provides: "Bilingual Es fields for Arkah"
      contains: "metaDescriptionEs"
  key_links: []
---

<objective>
Add Spanish (Es-suffixed) bilingual fields to all 7 siteSettings schemas so every entity site can serve localized metadata, footer copy, and CTA text.

Purpose: Enable bilingual content management for all ecosystem sites, not just Futuro.
Output: 7 updated siteSettings schema files with `metaDescriptionEs`, `footerCopyEs`, and `globalCta.copyEs` fields.
</objective>

<execution_context>
@/Users/hectorhlopez/.claude/get-shit-done/workflows/execute-plan.md
@/Users/hectorhlopez/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@schemaTypes/siteSettings_futuro.ts (reference pattern — all 7 are structurally identical)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add Es-suffixed bilingual fields to all 7 siteSettings schemas</name>
  <files>
    schemaTypes/siteSettings_futuro.ts,
    schemaTypes/siteSettings_hector.ts,
    schemaTypes/siteSettings_benext.ts,
    schemaTypes/siteSettings_next.ts,
    schemaTypes/siteSettings_mitikah.ts,
    schemaTypes/siteSettings_medikah.ts,
    schemaTypes/siteSettings_arkah.ts
  </files>
  <action>
For each of the 7 siteSettings schema files, add three Es-suffixed fields. Place each Es field immediately after its English counterpart.

1. After `metaDescription` field, add:
```typescript
defineField({
  name: 'metaDescriptionEs',
  title: 'Meta Description (ES)',
  type: 'text',
  rows: 3,
  description: 'Spanish variant — default SEO description applied when pages do not provide their own',
}),
```

2. Inside the `globalCta` object, after the `copy` field, add:
```typescript
defineField({
  name: 'copyEs',
  title: 'CTA Copy (ES)',
  type: 'string',
  description: 'Spanish variant — button or link copy for the CTA',
}),
```

3. After `footerCopy` field, add:
```typescript
defineField({
  name: 'footerCopyEs',
  title: 'Footer Copy (ES)',
  type: 'text',
  rows: 3,
  description: 'Spanish variant — reusable footer text such as mission statements or legal language',
}),
```

Do NOT add Es variants for: `siteTitle` (structural/brand), `defaultSocialImage` (visual), `socialLinks` (URLs), `globalCta.url` (URLs are language-agnostic).

All 7 files get the exact same 3 new fields. The only differences between files are the existing `name` and entity-specific strings (title, description entity name references, preview prepare fallback title).
  </action>
  <verify>
    <automated>cd /Users/hectorhlopez/projects/clean-studio && npx sanity schema extract --enforce-required-fields 2>&1 | tail -5</automated>
  </verify>
  <done>All 7 siteSettings schemas contain metaDescriptionEs, footerCopyEs, and globalCta.copyEs fields. Studio schema extracts without errors.</done>
</task>

</tasks>

<verification>
- `grep -l "metaDescriptionEs" schemaTypes/siteSettings_*.ts | wc -l` returns 7
- `grep -l "footerCopyEs" schemaTypes/siteSettings_*.ts | wc -l` returns 7
- `grep -l "copyEs" schemaTypes/siteSettings_*.ts | wc -l` returns 7
- `npx sanity schema extract` completes without errors
</verification>

<success_criteria>
All 7 siteSettings schemas have 3 new Es-suffixed fields each (metaDescriptionEs, footerCopyEs, globalCta.copyEs), placed immediately after their English counterparts, and the studio builds successfully.
</success_criteria>

<output>
After completion, create `.planning/quick/1-add-es-suffixed-bilingual-fields-to-all-/1-SUMMARY.md`
</output>
