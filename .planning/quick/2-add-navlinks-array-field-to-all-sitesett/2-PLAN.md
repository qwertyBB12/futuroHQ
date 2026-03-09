---
phase: quick
plan: 2
type: execute
wave: 1
depends_on: []
files_modified:
  - schemaTypes/siteSettings_futuro.ts
  - schemaTypes/siteSettings_benext.ts
  - schemaTypes/siteSettings_hector.ts
  - schemaTypes/siteSettings_arkah.ts
  - schemaTypes/siteSettings_next.ts
  - schemaTypes/siteSettings_mitikah.ts
  - schemaTypes/siteSettings_medikah.ts
autonomous: true
requirements: [NAVLINKS]
must_haves:
  truths:
    - "All 7 siteSettings schemas have a navLinks array field after siteTitle"
    - "Each navLink item has label (required), labelEs, href (required)"
    - "5 sites (futuro, benext, hector, arkah, next) have navLinks data populated in production"
    - "Studio deploys successfully with the new field"
  artifacts:
    - path: "schemaTypes/siteSettings_futuro.ts"
      contains: "navLinks"
    - path: "schemaTypes/siteSettings_benext.ts"
      contains: "navLinks"
    - path: "schemaTypes/siteSettings_hector.ts"
      contains: "navLinks"
    - path: "schemaTypes/siteSettings_arkah.ts"
      contains: "navLinks"
    - path: "schemaTypes/siteSettings_next.ts"
      contains: "navLinks"
    - path: "schemaTypes/siteSettings_mitikah.ts"
      contains: "navLinks"
    - path: "schemaTypes/siteSettings_medikah.ts"
      contains: "navLinks"
  key_links:
    - from: "navLinks schema field"
      to: "Sanity Content Lake"
      via: "MCP mutation patches"
      pattern: "navLinks.*navLinkItem"
---

<objective>
Add a `navLinks` array field to all 7 siteSettings schemas and populate navigation data for 5 sites via Sanity MCP mutations, then deploy.

Purpose: Enable frontend sites to pull structured navigation from Sanity instead of hardcoding nav items.
Output: Updated schemas with navLinks field, populated data in production dataset, deployed studio.
</objective>

<execution_context>
@/Users/hectorhlopez/.claude/get-shit-done/workflows/execute-plan.md
@/Users/hectorhlopez/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@schemaTypes/siteSettings_futuro.ts
@schemaTypes/siteSettings_benext.ts
@schemaTypes/siteSettings_hector.ts
@schemaTypes/siteSettings_arkah.ts
@schemaTypes/siteSettings_next.ts
@schemaTypes/siteSettings_mitikah.ts
@schemaTypes/siteSettings_medikah.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add navLinks array field to all 7 siteSettings schemas</name>
  <files>schemaTypes/siteSettings_futuro.ts, schemaTypes/siteSettings_benext.ts, schemaTypes/siteSettings_hector.ts, schemaTypes/siteSettings_arkah.ts, schemaTypes/siteSettings_next.ts, schemaTypes/siteSettings_mitikah.ts, schemaTypes/siteSettings_medikah.ts</files>
  <action>
Add a `navLinks` array field to each of the 7 siteSettings schema files. Insert it immediately after the `siteTitle` field in every file.

The field definition (identical in all 7 files):

```typescript
defineField({
  name: 'navLinks',
  title: 'Navigation Links',
  type: 'array',
  description: 'Ordered list of navigation links rendered in the site header',
  of: [
    {
      name: 'navLinkItem',
      title: 'Nav Link',
      type: 'object',
      fields: [
        defineField({
          name: 'label',
          title: 'Label',
          type: 'string',
          description: 'English navigation label',
          validation: Rule => Rule.required(),
        }),
        defineField({
          name: 'labelEs',
          title: 'Label (ES)',
          type: 'string',
          description: 'Spanish variant — navigation label',
        }),
        defineField({
          name: 'href',
          title: 'Link Path',
          type: 'string',
          description: 'URL path or full URL for the navigation link',
          validation: Rule => Rule.required(),
        }),
      ],
    },
  ],
}),
```

After editing all 7 files, run `npx sanity schema extract` (or `npx tsc --noEmit`) to verify no TypeScript errors.
  </action>
  <verify>
    <automated>cd /Users/hectorhlopez/projects/clean-studio && npx tsc --noEmit 2>&1 | tail -20</automated>
  </verify>
  <done>All 7 siteSettings schemas contain navLinks array field after siteTitle. TypeScript compiles cleanly.</done>
</task>

<task type="auto">
  <name>Task 2: Populate navLinks data for 5 sites via Sanity MCP and deploy</name>
  <files></files>
  <action>
Use Sanity MCP tools to populate navLinks data in production. Project ID: fo6n8ceo, Dataset: production.

**Step 1 — Query for document IDs:**
Use Sanity MCP to run GROQ query:
```groq
*[_type in ["siteSettings_futuro", "siteSettings_benext", "siteSettings_hector", "siteSettings_arkah", "siteSettings_next"]]{ _id, _type }
```

**Step 2 — Patch each document** with its navLinks array using the Sanity MCP mutation tool. Use `set` operation on `navLinks` field for each document.

Each array item must have `_type: "navLinkItem"` and a `_key` string.

**siteSettings_futuro navLinks:**
- About / Acerca de / /about
- Programs / Programas / /programs
- Alumni / Egresados / /alumni
- Impact / Impacto / /impact
- Journal / Diario / /journal
- Support / Apoyar / /support
- Contact / Contacto / /contact

**siteSettings_benext navLinks:**
- About / Acerca de / /about
- Programs / Programas / /programs
- Collaborators / Colaboradores / /collaborators
- Alumni / Egresados / /alumni
- Signal / Senal / /signal
- Contact / Contacto / /contact

**siteSettings_hector navLinks:**
- Essays / Ensayos / /essays
- Keynotes / Conferencias / /keynotes
- Reflections / Reflexiones / /reflections
- Publications / Publicaciones / /publications
- Projects / Proyectos / /projects
- About / Acerca de / /about

**siteSettings_arkah navLinks:**
- Home / Inicio / /
- Platform / Plataforma / /platform
- About / Acerca de / /about
- Contact / Contacto / /contact

**siteSettings_next navLinks:**
- About / Acerca de / /about
- Certifications / Certificaciones / /certifications
- Institutions / Instituciones / /institutions
- Verify / Verificar / /verify
- Essays / Ensayos / /essays
- Contact / Contacto / /contact

**Step 3 — Deploy the studio:**
Run `npx sanity deploy` from the project root to deploy the updated studio to hq.benextglobal.com.
  </action>
  <verify>
    <automated>cd /Users/hectorhlopez/projects/clean-studio && npx sanity graphql list 2>&1 | head -5 || echo "Verify via MCP query instead"</automated>
  </verify>
  <done>All 5 siteSettings documents have navLinks arrays populated in production. Studio deployed to hq.benextglobal.com.</done>
</task>

</tasks>

<verification>
- All 7 schema files contain `navLinks` field after `siteTitle`
- TypeScript compiles without errors
- GROQ query confirms navLinks data exists for 5 sites:
  `*[_type in ["siteSettings_futuro","siteSettings_benext","siteSettings_hector","siteSettings_arkah","siteSettings_next"]]{_type, "linkCount": count(navLinks)}`
- Studio deployed successfully
</verification>

<success_criteria>
- 7 schema files updated with navLinks array field
- 5 production documents populated with navigation data
- Studio deployed to hq.benextglobal.com
</success_criteria>

<output>
After completion, create `.planning/quick/2-add-navlinks-array-field-to-all-sitesett/2-SUMMARY.md`
</output>
