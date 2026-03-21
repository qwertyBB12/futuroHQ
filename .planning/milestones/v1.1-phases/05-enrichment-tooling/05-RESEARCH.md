# Phase 5: Enrichment Tooling - Research

**Researched:** 2026-03-16
**Domain:** Sanity Studio v5 — desk structure GROQ filters, dashboard widgets, document form wrappers, batch scripts
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **Completeness rules:** Per-type field checklist approach — each tracked type has a defined list of required fields. A document is "complete" when all checklist fields have values.
- **Checklists defined in `lib/completeness.ts`** — single source of truth importable by dashboard widget, progress bar, desk filters, and batch scripts.
- **Tracked types:** `alumni`, `collaborator`, `ledgerPerson`, `video`, `podcastEpisode`.
- **Deep validation:** bio must have >50 chars, image must have asset reference, arrays must have >0 items — not just top-level presence.
- **"Needs Enrichment" lists nested** under each tracked type in its current tier (e.g., Daily > Videos > [All Videos | Needs Enrichment]).
- **Static title "Needs Enrichment"** — no dynamic count in the desk title.
- **Only the 5 tracked types** get the nested structure; other types keep their current flat list.
- **Enrichment-opened documents** use the same view tabs as regular lists — no separate Enrichment view tab.
- **Dashboard widget:** per-type progress bars (name, bar, percentage, counts), Copper (#B17E68) fill, fetch-on-load only (no real-time listener), placed after EcosystemHealthWidget, uses existing glassPanel/glassCard styling.
- **Progress bar banner:** appears on ALL documents of tracked types. When 100% complete, shows a green "Complete" state. Live update as editor fills in fields using Sanity form value. Injected above the form.

### Claude's Discretion

- Exact GROQ filter queries for "Needs Enrichment" desk lists
- Progress bar component implementation details (styled-components vs inline styles)
- Batch script chunking strategy (rate-limit-safe, ~25 req/s, ~100 mutations/transaction per ENRH-04)
- How to access current document field values in the banner component (`useFormValue` vs document props)
- Deep validation thresholds per field type (exact char counts, array minimums)

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ENRH-01 | Filtered desk lists showing incomplete records per content type using GROQ null/empty filters | GROQ filter patterns in `deskStructure.ts`, `S.documentList().filter()` API confirmed in existing codebase |
| ENRH-02 | Completeness dashboard widget showing field completion gaps across all content types via GROQ count() aggregation | EcosystemHealthWidget is the direct reference pattern; `count()` with multiple fetch confirmed working |
| ENRH-03 | Per-document completeness progress bar rendered above form fields via components.input API | `useFormValue([])` confirmed in `SeoGeneratorInput.tsx`; `ObjectInputProps` pattern established |
| ENRH-04 | Batch update scripts via Sanity client for bulk field population with rate-limit-safe chunking (25 req/s, ~100 mutations/transaction) | Existing scripts use `@sanity/client` `.patch().set().commit()` pattern; chunking strategy is Claude's discretion |
</phase_requirements>

---

## Summary

Phase 5 builds four enrichment tooling features onto an existing Sanity Studio v5 codebase with well-established patterns. The codebase already contains every prerequisite: a working dashboard widget pattern (`EcosystemHealthWidget`), a custom input component with `useFormValue` access (`SeoGeneratorInput`), GROQ-filtered desk lists (`Writer's Desk` tier), and a robust batch script infrastructure (`scripts/`). Research confirms that all four requirements map directly to existing patterns — no new libraries or APIs are needed.

The central design element is `lib/completeness.ts` (new file), which defines per-type field checklists and deep validation logic. This file is imported by the dashboard widget, the progress bar banner, the desk GROQ filters, and the batch scripts. The "single source of truth" pattern is already established by `lib/constants.ts`.

The one area requiring careful implementation decisions is the progress bar banner (ENRH-03). Sanity v5 supports wrapping the document form via the `document.components` key in `sanity.config.ts` using a `FormWrapper` component that calls `renderDefault(props)` inside, plus prepends custom UI above it. The `useFormValue([])` hook (already used in `SeoGeneratorInput`) gives real-time access to the full current document, enabling live recalculation as fields are filled.

**Primary recommendation:** Follow EcosystemHealthWidget (widget), SeoGeneratorInput (form hook), and backfill-governance.ts + populate scripts (batch) as direct code reference patterns. Build `lib/completeness.ts` first — all other deliverables depend on it.

---

## Standard Stack

### Core (already installed — no new packages needed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `sanity` | ^5.13.0 | Studio framework, `useFormValue`, `useClient`, schema tools | Platform |
| `@sanity/client` | ^6.29.1 | Batch scripts — `.patch().set().commit()`, `.transaction()` | Platform |
| `@sanity/ui` | (bundled with sanity) | `Stack`, `Flex`, `Text`, `Card`, `Box` in progress bar banner | Established project pattern |

### No new packages required

All tooling is built using the project's existing dependencies. The batch scripts use `@sanity/client` which is already in `package.json`. The banner and widget use `sanity` hooks and `@sanity/ui` components, both already available.

---

## Architecture Patterns

### Recommended File Layout (new files only)

```
lib/
└── completeness.ts           ← NEW — single source of truth for field checklists

components/
├── dashboard/
│   └── EnrichmentProgressWidget.tsx   ← NEW — ENRH-02
└── inputs/
    └── CompletenessInput.tsx          ← NEW — ENRH-03 (document form wrapper)

scripts/
└── batch-enrich.ts                    ← NEW — ENRH-04 (batch update script)

deskStructure.ts               ← MODIFIED — add nested lists for ENRH-01
sanity.config.ts               ← MODIFIED — register CompletenessInput as form wrapper
components/dashboard/DashboardLayout.tsx  ← MODIFIED — add EnrichmentProgressWidget
```

### Pattern 1: `lib/completeness.ts` — Central Checklist Definition

**What:** Exports `COMPLETENESS_CONFIG` — a record keyed by type name, each entry listing the fields to check and the validation rule for each field. Also exports a `checkCompleteness(doc, type)` utility that runs the checks and returns `{completed, total, missingFields}`.

**When to use:** Imported everywhere completeness is needed (GROQ filter generation, widget queries, banner display, batch scripts).

**Example:**
```typescript
// lib/completeness.ts
// Source: project pattern from lib/constants.ts (UPPER_SNAKE_CASE, Set/Record pattern)

export type FieldCheck = {
  field: string          // top-level field name
  label: string          // human-readable name for banner display
  validate: (value: unknown) => boolean
}

export type CompletenessConfig = Record<string, FieldCheck[]>

export const COMPLETENESS_CONFIG: CompletenessConfig = {
  alumni: [
    {field: 'bio', label: 'Bio', validate: (v) => typeof v === 'string' && v.trim().length > 50},
    {field: 'media', label: 'Photo', validate: (v) => Array.isArray(v) && v.length > 0},
    {field: 'cohortYear', label: 'Cohort Year', validate: (v) => typeof v === 'number' && v > 0},
    {field: 'generation', label: 'Generation', validate: (v) => typeof v === 'string' && v.length > 0},
    {field: 'slug', label: 'Slug', validate: (v) => Boolean((v as any)?.current)},
  ],
  collaborator: [
    {field: 'bio', label: 'Bio', validate: (v) => typeof v === 'string' && v.trim().length > 50},
    {field: 'logo', label: 'Logo', validate: (v) => Boolean((v as any)?.asset?._ref)},
    {field: 'orgType', label: 'Org Type', validate: (v) => typeof v === 'string' && v.length > 0},
  ],
  ledgerPerson: [
    {field: 'openingPortrait', label: 'Opening Portrait', validate: (v) => typeof v === 'string' && v.trim().length > 50},
    {field: 'currentTitle', label: 'Current Title', validate: (v) => typeof v === 'string' && v.length > 0},
    {field: 'organization', label: 'Organization', validate: (v) => typeof v === 'string' && v.length > 0},
  ],
  video: [
    {field: 'thumbnailImage', label: 'Thumbnail', validate: (v) => Boolean((v as any)?.asset?._ref)},
    {field: 'description', label: 'Description', validate: (v) => typeof v === 'string' && v.trim().length > 0},
    {field: 'tags', label: 'Tags', validate: (v) => Array.isArray(v) && v.length > 0},
    {field: 'seo', label: 'SEO', validate: (v) => Boolean((v as any)?.metaDescription)},
  ],
  podcastEpisode: [
    {field: 'description', label: 'Description', validate: (v) => typeof v === 'string' && v.trim().length > 0},
    {field: 'audioEmbed', label: 'Audio Embed', validate: (v) => Boolean(v)},
    {field: 'tags', label: 'Tags', validate: (v) => Array.isArray(v) && v.length > 0},
    {field: 'episodeNumber', label: 'Episode Number', validate: (v) => typeof v === 'number' && v > 0},
  ],
}

/** Returns {completed, total, missingFields} for a document */
export function checkCompleteness(doc: Record<string, unknown>, schemaType: string) {
  const checks = COMPLETENESS_CONFIG[schemaType] ?? []
  const missingFields: string[] = []
  let completed = 0
  for (const check of checks) {
    if (check.validate(doc[check.field])) {
      completed++
    } else {
      missingFields.push(check.label)
    }
  }
  return {completed, total: checks.length, missingFields}
}
```

### Pattern 2: ENRH-01 — Nested Desk Lists with GROQ Filter

**What:** Replace the `listWithPreview(schemaType, title)` call for each tracked type with a nested list containing "All [Type]" and "Needs Enrichment" children.

**When to use:** Only for the 5 tracked types: `alumni`, `collaborator`, `ledgerPerson`, `video`, `podcastEpisode`.

**Reference in codebase:** The `Writer's Desk` filter at line 106-117 of `deskStructure.ts` uses `S.documentList().filter().params()`. The `listWithPreview` helper at line 60-73 shows the full child chain.

```typescript
// deskStructure.ts
// Source: existing deskStructure.ts listWithPreview helper + Writer's Desk filter pattern

const listWithEnrichment = (schemaType: string, title: string, missingFilter: string) =>
  S.listItem()
    .title(title)
    .schemaType(schemaType)
    .child(
      S.list()
        .title(title)
        .items([
          // All documents (unchanged)
          S.listItem()
            .title(`All ${title}`)
            .schemaType(schemaType)
            .child(
              S.documentTypeList(schemaType)
                .title(`All ${title}`)
                .child((documentId) =>
                  S.document()
                    .schemaType(schemaType)
                    .documentId(documentId)
                    .views(documentViews(schemaType)),
                ),
            ),
          // Needs Enrichment filtered list
          S.listItem()
            .title('Needs Enrichment')
            .schemaType(schemaType)
            .child(
              S.documentList()
                .title('Needs Enrichment')
                .schemaType(schemaType)
                .filter(missingFilter)
                .child((documentId) =>
                  S.document()
                    .schemaType(schemaType)
                    .documentId(documentId)
                    .views(documentViews(schemaType)),
                ),
            ),
        ]),
    )
```

**GROQ filter patterns** for each tracked type (draft-excluded — operate on published documents):

```groq
// alumni — missing bio, photo, cohortYear, or generation
_type == "alumni" && !(_id in path("drafts.**")) && (
  !defined(bio) || length(bio) <= 50 ||
  !defined(media) || length(media) == 0 ||
  !defined(cohortYear) ||
  !defined(generation)
)

// collaborator — missing bio, logo, or orgType
_type == "collaborator" && !(_id in path("drafts.**")) && (
  !defined(bio) || length(bio) <= 50 ||
  !defined(logo) || !defined(logo.asset) ||
  !defined(orgType)
)

// ledgerPerson — missing openingPortrait, currentTitle, or organization
_type == "ledgerPerson" && !(_id in path("drafts.**")) && (
  !defined(openingPortrait) || length(openingPortrait) <= 50 ||
  !defined(currentTitle) ||
  !defined(organization)
)

// video — missing thumbnailImage, description, tags, or seo.metaDescription
_type == "video" && !(_id in path("drafts.**")) && (
  !defined(thumbnailImage) || !defined(thumbnailImage.asset) ||
  !defined(description) || description == "" ||
  !defined(tags) || length(tags) == 0 ||
  !defined(seo) || !defined(seo.metaDescription)
)

// podcastEpisode — missing description, audioEmbed, tags, or episodeNumber
_type == "podcastEpisode" && !(_id in path("drafts.**")) && (
  !defined(description) || description == "" ||
  !defined(audioEmbed) ||
  !defined(tags) || length(tags) == 0 ||
  !defined(episodeNumber)
)
```

### Pattern 3: ENRH-02 — EnrichmentProgressWidget

**What:** Dashboard widget in `components/dashboard/` following the EcosystemHealthWidget pattern exactly. Fetches total and complete counts per tracked type using `count()` GROQ queries. Renders one row per type with Copper progress bar.

**When to use:** Added to `DashboardLayout.tsx` grid after EcosystemHealthWidget.

**Reference:** `components/dashboard/EcosystemHealthWidget.tsx` — same `useClient` + `useEffect` + `glassPanel`/`glassCard` structure.

```typescript
// components/dashboard/EnrichmentProgressWidget.tsx
// Source: EcosystemHealthWidget.tsx pattern

import {useEffect, useState} from 'react'
import {useClient} from 'sanity'
import {Stack, Heading, Text, Flex, Box} from '@sanity/ui'
import {glassPanel, glassCard} from './glassStyles'

const COPPER = '#B17E68'
const SURFACE_RAISED = '#1A1714'

type TypeProgress = {
  type: string
  label: string
  total: number
  complete: number
}

const TRACKED_TYPES = [
  {type: 'alumni', label: 'Alumni', missingFilter: `!defined(bio) || length(bio) <= 50 || !defined(media) || length(media) == 0`},
  // ... per type
]

export default function EnrichmentProgressWidget() {
  const client = useClient({apiVersion: '2024-10-23'})
  const [progress, setProgress] = useState<TypeProgress[]>([])

  useEffect(() => {
    const fetchProgress = async () => {
      const results = await Promise.all(
        TRACKED_TYPES.map(async ({type, label, missingFilter}) => {
          const total = await client.fetch<number>(
            `count(*[_type == $type && !(_id in path("drafts.**"))])`,
            {type},
          )
          const incomplete = await client.fetch<number>(
            `count(*[_type == $type && !(_id in path("drafts.**")) && (${missingFilter})])`,
            {type},
          )
          return {type, label, total, complete: total - incomplete}
        }),
      )
      setProgress(results)
    }
    fetchProgress()
  }, [client])

  return (
    <div style={{...glassPanel, padding: 24}}>
      <Stack space={4}>
        <Heading size={1} style={{fontFamily: "'Oswald', sans-serif", textTransform: 'uppercase', letterSpacing: '0.05em'}}>
          Enrichment Progress
        </Heading>
        <Stack space={3}>
          {progress.map(({type, label, total, complete}) => {
            const pct = total > 0 ? Math.round((complete / total) * 100) : 0
            return (
              <div key={type} style={{...glassCard, padding: 14}}>
                <Stack space={2}>
                  <Flex justify="space-between" align="center">
                    <Text size={1} weight="semibold" style={{fontFamily: "'Oswald', sans-serif", textTransform: 'uppercase'}}>
                      {label}
                    </Text>
                    <Text size={1} muted>{complete}/{total} ({pct}%)</Text>
                  </Flex>
                  {/* Progress bar */}
                  <Box style={{background: SURFACE_RAISED, borderRadius: 4, height: 6, overflow: 'hidden'}}>
                    <Box style={{width: `${pct}%`, height: '100%', background: COPPER, borderRadius: 4, transition: 'width 0.4s ease'}} />
                  </Box>
                </Stack>
              </div>
            )
          })}
        </Stack>
      </Stack>
    </div>
  )
}
```

**DashboardLayout.tsx integration** — add after the bottom-row EcosystemHealthWidget:

```typescript
// In the bottom Grid row, add EnrichmentProgressWidget next to EcosystemHealthWidget
<Grid columns={[1, 1, 2]} gap={4}>
  <EcosystemHealthWidget />
  <EnrichmentProgressWidget />  {/* NEW — replaces SeoHealthWidget in position */}
</Grid>
```

Note: The dashboard currently places `SeoHealthWidget` next to `EcosystemHealthWidget`. The CONTEXT.md says EnrichmentProgressWidget goes "after EcosystemHealthWidget." The planner should confirm whether this means adding a new row or replacing SeoHealthWidget's grid slot.

### Pattern 4: ENRH-03 — CompletenessInput (Document Form Wrapper)

**What:** A component registered as `document.components.unstable_formComponents.form` (or via `document.components` in Sanity v5) that wraps the document form with a banner above it. Reads current form values via `useFormValue([])`. Recalculates completeness on every render.

**Access method — confirmed from SeoGeneratorInput.tsx:**

```typescript
// Source: components/inputs/SeoGeneratorInput.tsx line 14
import {useFormValue} from 'sanity'
import type {SanityDocument} from 'sanity'
const doc = useFormValue([]) as SanityDocument | null
```

`useFormValue([])` with an empty path array returns the entire current document object — confirmed in the existing codebase. This provides live reactive access that updates as the editor fills in fields.

**Registration in sanity.config.ts** — Sanity v5 supports document-level form wrapping via a `document.components` callback. The component receives `renderDefault(props)` to render the actual form. This is analogous to how `ObjectInputProps` components call `renderDefault`:

```typescript
// components/inputs/CompletenessInput.tsx
// Source: SeoGeneratorInput.tsx pattern for useFormValue and renderDefault

import {useFormValue} from 'sanity'
import type {SanityDocument} from 'sanity'
import type {DocumentLayoutProps} from 'sanity'
import {Stack, Card, Flex, Text, Box, Badge} from '@sanity/ui'
import {COMPLETENESS_CONFIG, checkCompleteness} from '../../lib/completeness'

const COPPER = '#B17E68'
const GREEN = '#3D9970'

export function CompletenessInput(props: DocumentLayoutProps) {
  const doc = useFormValue([]) as SanityDocument | null
  const schemaType = doc?._type as string | undefined

  if (!schemaType || !COMPLETENESS_CONFIG[schemaType]) {
    return <>{props.renderDefault(props)}</>
  }

  const {completed, total, missingFields} = checkCompleteness(
    doc as Record<string, unknown>,
    schemaType,
  )
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0
  const isComplete = pct === 100

  return (
    <Stack space={0}>
      {/* Banner */}
      <Card padding={3} tone={isComplete ? 'positive' : 'caution'} border style={{borderRadius: 0}}>
        <Stack space={2}>
          <Flex justify="space-between" align="center">
            <Text size={1} weight="semibold">
              {isComplete ? 'Complete' : `${completed}/${total} fields complete (${pct}%)`}
            </Text>
            {!isComplete && <Text size={0} muted>Missing: {missingFields.join(', ')}</Text>}
          </Flex>
          {!isComplete && (
            <Box style={{background: 'rgba(0,0,0,0.2)', borderRadius: 4, height: 4, overflow: 'hidden'}}>
              <Box style={{width: `${pct}%`, height: '100%', background: COPPER, borderRadius: 4}} />
            </Box>
          )}
        </Stack>
      </Card>
      {props.renderDefault(props)}
    </Stack>
  )
}
```

**Registration in sanity.config.ts** — Sanity v5 uses `document.components` for layout-level injection. The exact property path for form-level wrapping needs verification against Sanity v5 docs, but the established pattern for input-level wrapping is `components: {input: MyComponent}` on a field/type definition. The document-level equivalent uses `document.components` in the workspace config.

**Important:** The CONTEXT.md says "uses Sanity's document.components or form components API." Research confirms both approaches exist in Sanity v5:

1. **Field-level** (already in use): `components: {input: SeoGeneratorInput}` on the `seoBlock` object type — wraps only that field's input.
2. **Document-level**: Register via `document.components` in `sanity.config.ts` (like `document.badges` and `document.actions` callbacks) — wraps the entire document form.

The document.components approach injects for ALL documents of a type (or conditionally based on `context.schemaType`), which matches the requirement ("appears on ALL documents of tracked types").

### Pattern 5: ENRH-04 — Batch Enrichment Script

**What:** A TypeScript script in `scripts/` that reads incomplete documents for each tracked type and patches specified fields. Uses chunked transactions for rate-limit safety.

**Reference patterns:**
- `scripts/backfill-governance.ts` — basic fetch + sequential `.patch().set().commit()` loop
- `scripts/populate-new-alumni-bios.mjs` — fetch by name + `.patch().set().commit()`

**Rate-limit guidance from REQUIREMENTS.md:** ~25 req/s, ~100 mutations/transaction.

```typescript
// scripts/batch-enrich.ts
// Source: backfill-governance.ts + populate-new-alumni-bios.mjs patterns

import {config} from 'dotenv'
import {createClient} from '@sanity/client'

config({path: '.env.local', override: false})

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID || 'fo6n8ceo',
  dataset: process.env.SANITY_DATASET || 'production',
  token: process.env.SANITY_WRITE_TOKEN || '',
  apiVersion: '2024-10-23',
  useCdn: false,
})

/** Sleep to respect rate limits */
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Process an array in chunks with rate-limit-safe pausing */
async function processInChunks<T>(
  items: T[],
  chunkSize: number,
  handler: (chunk: T[]) => Promise<void>,
  delayMs = 1000,
) {
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize)
    await handler(chunk)
    if (i + chunkSize < items.length) {
      await sleep(delayMs)
    }
  }
}

async function run() {
  // Example: patch all alumni missing bio with placeholder
  const docs = await client.fetch<{_id: string; name: string}[]>(
    `*[_type == "alumni" && (!defined(bio) || length(bio) <= 50)]{_id, name}`,
  )
  console.log(`Found ${docs.length} alumni needing bio enrichment`)

  await processInChunks(docs, 25, async (chunk) => {
    const tx = client.transaction()
    for (const doc of chunk) {
      tx.patch(doc._id, (p) =>
        p.setIfMissing({bio: `[Bio needed for ${doc.name}]`}),
      )
    }
    await tx.commit()
    console.log(`Patched ${chunk.length} documents`)
  })

  console.log('Done.')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
```

**Transaction vs sequential commits:** Using `.transaction()` with multiple patches reduces round-trips and is more atomic than sequential `.commit()` calls. If the transaction fails mid-run, only the uncommitted chunk is affected — already-committed chunks are safe.

### Anti-Patterns to Avoid

- **Don't GROQ-filter on drafts for the "Needs Enrichment" desk list** — filter to published only using `!(_id in path("drafts.**"))`. Drafts in progress will appear incomplete by design.
- **Don't use a real-time listener in the widget** — the CONTEXT.md locked this as fetch-on-load only. `useEffect` + `client.fetch` (not `client.listen`) matches the EcosystemHealthWidget pattern.
- **Don't inline the completeness field checklist in each component** — everything reads from `lib/completeness.ts`. Divergence causes the GROQ filter, widget, and banner to show different completion states.
- **Don't import `lib/completeness.ts` in the batch script directly** — the batch script runs in Node and must be independent of the Studio runtime. Duplicate the field lists in the script or accept them as CLI parameters. Alternatively, use a shared JSON config that both can import.
- **Don't use `S.documentTypeList(schemaType).filter()` for the Needs Enrichment list** — use `S.documentList().schemaType(schemaType).filter()` which allows a custom filter string. `S.documentTypeList()` does not accept a `.filter()` modifier.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Progress bar HTML/CSS | Custom SVG or canvas progress bar | Inline `div` with `width: pct%` + CSS | Simple, no layout dependencies, matches glassCard aesthetic |
| Rate limiting in batch scripts | Custom throttle queue with promises | `sleep()` + fixed chunk size of 25 | Sanity's actual rate limit is generous for studio scripts; simple chunking is sufficient |
| Reactive document state in banner | Polling or Sanity `.listen()` | `useFormValue([])` from `sanity` | This hook is already proven in `SeoGeneratorInput.tsx` — it re-renders on every form change |
| Separate "completeness" GROQ queries per component | Duplicate query logic in widget, desk, and banner | Shared GROQ filter strings from `lib/completeness.ts` OR pass derived filters | Keeps GROQ and TypeScript validation logic in sync |

---

## Common Pitfalls

### Pitfall 1: `S.documentList().filter()` vs `S.documentTypeList()`

**What goes wrong:** `S.documentTypeList(schemaType)` does not support a `.filter()` modifier and will silently show all documents.
**Why it happens:** Two different structure builder methods exist — `documentTypeList` (auto-filters by type, no custom filter) and `documentList` (requires explicit filter, supports custom GROQ).
**How to avoid:** For the "Needs Enrichment" filtered list, always use `S.documentList().schemaType(schemaType).filter(groqFilter)`.
**Warning signs:** List shows all documents instead of incomplete ones; no TypeScript error.

### Pitfall 2: GROQ `length()` on array fields returns null for undefined arrays

**What goes wrong:** `length(tags) == 0` evaluates to `false` (not `true`) when `tags` is undefined. The correct filter is `!defined(tags) || length(tags) == 0`.
**Why it happens:** GROQ `length()` returns `null` for undefined values, and `null == 0` is false.
**How to avoid:** Always guard with `!defined(field) ||` before length checks.
**Warning signs:** Documents missing the field entirely don't appear in the "Needs Enrichment" list.

### Pitfall 3: `useFormValue([])` in a document-level component vs field input

**What goes wrong:** `useFormValue([])` is documented for use in custom input components (ObjectInputProps). Its behavior when used in a document layout component is structurally the same but the component registration path differs.
**Why it happens:** Sanity distinguishes between `components.input` (field level) and `document.components` (document level). Both support `useFormValue`.
**How to avoid:** Test the banner component in dev mode before committing — verify the hook returns the expected document shape.
**Warning signs:** Banner always shows 0 completed fields despite fields being filled in.

### Pitfall 4: lib/completeness.ts imported by batch script (Node.js runtime)

**What goes wrong:** If `lib/completeness.ts` imports from `sanity` or `@sanity/ui`, the batch script will fail with a module resolution error since those packages are browser/studio-only.
**Why it happens:** Batch scripts run in Node.js (via `tsx`) without the Studio runtime context.
**How to avoid:** Keep `lib/completeness.ts` pure TypeScript with no Studio imports. The validate functions use only vanilla JS. The batch script can then import the config directly.
**Warning signs:** `tsx scripts/batch-enrich.ts` throws "Cannot resolve module 'sanity'" or similar.

### Pitfall 5: Progress bar banner on `collaborator` and `ledgerPerson` (no governance fields)

**What goes wrong:** The `document.components` callback in `sanity.config.ts` checks `context.schemaType`. Both `collaborator` and `ledgerPerson` are NOT in `GOVERNED_TYPES` (per MEMORY.md). If the banner registration uses `GOVERNED_TYPES.has(schemaType)` as the guard, it will miss these two tracked types.
**Why it happens:** The 5 tracked enrichment types are NOT the same as `GOVERNED_TYPES`.
**How to avoid:** Define a separate `ENRICHMENT_TYPES` set in `lib/completeness.ts` (the 5 tracked types) and use that set as the guard in the `sanity.config.ts` registration callback.
**Warning signs:** Banner appears on all governed types but not on collaborator/ledgerPerson.

---

## Code Examples

### GROQ — Fetch complete vs total per type for dashboard widget

```typescript
// Source: EcosystemHealthWidget.tsx + confirmed GROQ patterns
const total = await client.fetch<number>(
  `count(*[_type == $type && !(_id in path("drafts.**"))])`,
  {type: 'alumni'},
)
const incomplete = await client.fetch<number>(
  `count(*[_type == "alumni" && !(_id in path("drafts.**")) && (
    !defined(bio) || length(bio) <= 50 ||
    !defined(media) || length(media) == 0 ||
    !defined(cohortYear) ||
    !defined(generation)
  )])`,
)
const complete = total - incomplete
```

### Desk — Replace `listWithPreview` with nested enrichment list for video

```typescript
// Source: deskStructure.ts listWithPreview helper pattern (lines 60-73)
// Before: listWithPreview('video', 'Videos')
// After:
S.listItem()
  .title('Videos')
  .schemaType('video')
  .child(
    S.list()
      .title('Videos')
      .items([
        S.listItem()
          .title('All Videos')
          .schemaType('video')
          .child(
            S.documentTypeList('video')
              .title('All Videos')
              .child((documentId) =>
                S.document().schemaType('video').documentId(documentId).views(documentViews('video')),
              ),
          ),
        S.listItem()
          .title('Needs Enrichment')
          .schemaType('video')
          .child(
            S.documentList()
              .title('Needs Enrichment')
              .schemaType('video')
              .filter(
                `_type == "video" && !(_id in path("drafts.**")) && (
                  !defined(thumbnailImage) || !defined(thumbnailImage.asset) ||
                  !defined(description) || description == "" ||
                  !defined(tags) || length(tags) == 0
                )`,
              )
              .child((documentId) =>
                S.document().schemaType('video').documentId(documentId).views(documentViews('video')),
              ),
          ),
      ]),
  )
```

### Batch script — transaction-based chunked update

```typescript
// Source: backfill-governance.ts pattern + transaction API from @sanity/client docs
async function processInChunks<T>(
  items: T[],
  chunkSize: number,
  handler: (chunk: T[]) => Promise<void>,
  delayMs = 1000,
) {
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize)
    await handler(chunk)
    if (i + chunkSize < items.length) {
      await new Promise((r) => setTimeout(r, delayMs))
    }
  }
}
// Usage: processInChunks(docs, 25, async (chunk) => { ... }, 1000)
```

### Banner — `useFormValue` live read with `checkCompleteness`

```typescript
// Source: SeoGeneratorInput.tsx line 14 (useFormValue pattern confirmed)
import {useFormValue} from 'sanity'
import type {SanityDocument} from 'sanity'
import {checkCompleteness, COMPLETENESS_CONFIG} from '../../lib/completeness'

// Inside component:
const doc = useFormValue([]) as SanityDocument | null
const schemaType = doc?._type as string | undefined
if (!schemaType || !COMPLETENESS_CONFIG[schemaType]) return null
const {completed, total, missingFields} = checkCompleteness(
  doc as Record<string, unknown>,
  schemaType,
)
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `S.documentTypeList().filter()` | `S.documentList().schemaType().filter()` | Sanity v3+ | Custom GROQ filters on desk lists require `S.documentList()`, not `S.documentTypeList()` |
| Per-component GROQ completeness | Centralized `lib/completeness.ts` | Design decision (Phase 5) | One change updates all surfaces simultaneously |
| Sequential `.commit()` in batch scripts | `.transaction()` with multiple patches | Available since @sanity/client v3 | Atomic chunk commits, fewer round-trips, safer on interruption |

---

## Open Questions

1. **Exact `document.components` property for form-level wrapping in Sanity v5**
   - What we know: `SeoGeneratorInput` wraps a field via `components: {input: ...}` on the schema type. Sanity v5 has a `document.components` key in workspace config (like `document.badges`, `document.actions`).
   - What's unclear: The exact TypeScript type for the document-level form wrapper component props in Sanity v5.13.0.
   - Recommendation: Look up `DocumentLayoutProps` or similar in `node_modules/sanity/lib/index.d.ts` during implementation. If document-level wrapping isn't cleanly available, fall back to a custom `seoBlock`-style: add a synthetic "banner" object field to each tracked type's schema with `components: {input: CompletenessInput}` pinned at the top. Less elegant but guaranteed to work.

2. **`lib/completeness.ts` consumed by both browser (Studio) and Node.js (batch scripts)**
   - What we know: The file must be pure TypeScript with no Studio imports to run in Node.
   - What's unclear: Whether the field validation thresholds (bio >50 chars, etc.) match what the planner will specify.
   - Recommendation: Keep the validate functions as pure JS lambdas. The planner specifies exact thresholds; researcher recommends bio >50 chars, arrays >0, image = `asset._ref` present.

3. **Dashboard grid placement for EnrichmentProgressWidget**
   - What we know: CONTEXT.md says "placed after EcosystemHealthWidget." DashboardLayout currently places `SeoHealthWidget` next to `EcosystemHealthWidget` in the same row.
   - What's unclear: Does "after" mean same row (replacing SeoHealthWidget) or a new row below?
   - Recommendation: Add as a new grid row immediately after the current "bottom row" (EcosystemHealthWidget + SeoHealthWidget). This preserves existing widgets and gives Enrichment Progress its own visual prominence.

---

## Validation Architecture

> `nyquist_validation` is `true` in `.planning/config.json` — section included.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None detected in project |
| Config file | None — Wave 0 must create infrastructure if tests are written |
| Quick run command | N/A — no test runner configured |
| Full suite command | N/A |

**Note:** `components/structure/STRUCTURE.md` confirms "No test files or test framework detected in this project." For this phase, the "Nyquist validation" strategy is manual smoke-testing — running the dev server and verifying each feature. Automated tests are not a prerequisite.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Validation Method |
|--------|----------|-----------|-------------------|
| ENRH-01 | "Needs Enrichment" list shows only incomplete documents | manual-smoke | Open desk for each tracked type, verify list contains only docs missing required fields |
| ENRH-02 | Dashboard widget shows per-type completion % | manual-smoke | Open dashboard, verify widget renders; edit a doc to add missing field, refresh, verify count changes |
| ENRH-03 | Progress bar banner recalculates as fields filled | manual-smoke | Open a tracked-type doc, fill in missing fields one at a time, verify banner updates live |
| ENRH-04 | Batch script updates docs without partial failures | manual-smoke | Run script in dry-run mode first (log-only), then run against staging dataset |

### Sampling Rate

- **Per task commit:** Manually run `npx sanity dev` and spot-check the affected surface
- **Per wave merge:** Full walkthrough of all four ENRH deliverables in dev environment
- **Phase gate:** All four ENRH requirements demonstrably working before `/gsd:verify-work`

### Wave 0 Gaps

None — no test infrastructure needed for this phase. Validation is all manual smoke-testing via the running studio.

---

## Sources

### Primary (HIGH confidence)
- `components/dashboard/EcosystemHealthWidget.tsx` — direct reference for widget pattern (GROQ count(), useClient, glassPanel, fetch-on-load)
- `components/inputs/SeoGeneratorInput.tsx` — confirmed `useFormValue([])` access pattern for full document
- `deskStructure.ts` — confirmed `S.documentList().filter()` with GROQ params pattern (Writer's Desk tier)
- `scripts/backfill-governance.ts` — confirmed `@sanity/client` `.patch().set().commit()` batch pattern
- `lib/constants.ts` — confirmed file location, naming convention, and export pattern for shared constants
- `sanity.config.ts` — confirmed `document.badges` callback pattern (parallel to `document.components`)
- `schemaTypes/alumni.ts`, `video.ts`, `collaborator.ts`, `ledgerPerson.ts`, `podcastEpisode.ts` — confirmed field names for GROQ filters and completeness checks

### Secondary (MEDIUM confidence)
- Sanity v5 `document.components` API: known to exist in the Sanity v3+ architecture, used by `@sanity/assist` plugin (visible in `node_modules/@sanity/assist/src/assistDocument/AssistDocumentLayout.tsx`); exact TypeScript props for the wrapper component should be verified during implementation
- `@sanity/client` `.transaction()` API: standard API documented in official Sanity client; pattern extends existing `.patch().commit()` style

### Tertiary (LOW confidence)
- Exact TypeScript type name for document-level form wrapper component props in Sanity 5.13 — needs implementation-time verification against type definitions

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already in package.json, no new dependencies
- Architecture patterns: HIGH — all patterns confirmed in existing codebase files
- GROQ filters: HIGH — confirmed Sanity GROQ syntax from existing queries in codebase
- document.components form wrapper API: MEDIUM — usage confirmed in @sanity/assist internals; exact props type needs implementation verification
- Pitfalls: HIGH — derived from direct reading of schemas, deskStructure, and existing patterns

**Research date:** 2026-03-16
**Valid until:** 2026-04-16 (stable platform — Sanity v5 API changes slowly)
