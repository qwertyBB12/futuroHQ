# Phase 4: Tech Debt + Shared Infrastructure — Research

**Researched:** 2026-03-16
**Domain:** Sanity Studio v5 schema refactoring — constants extraction, shared field definitions, governance data migration
**Confidence:** HIGH (all findings based on direct codebase reading + verified existing architecture docs)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**surfaceOn editor experience**
- surfaceOn field placed inside a "Distribution" field group on all schemas receiving it
- Distribution group is always visible (not collapsed)
- Generic description: "Which ecosystem sites should display this content" — not per-type
- Medikah kept in the site options list (already in essay data; removing would orphan existing values)

**surfaceOn site values**
- Arkah added as 7th site: title "Arkah", value "arkah"
- All labels standardized to brand names: Hector H. Lopez, BeNeXT, Futuro, NeXT, Arkah, Mitikah, Medikah
- Site ordering follows brand hierarchy: Hector H. Lopez > BeNeXT > Futuro > NeXT > Arkah > Mitikah > Medikah
- String values unchanged: hectorhlopez, benext, futuro, next, arkah, mitikah, medikah

**Constants extraction scope**
- GOVERNED_TYPES extracted to `lib/constants.ts`, imported by both `sanity.config.ts` and `deskStructure.ts`
- BILINGUAL_TYPES also moved to `lib/constants.ts` alongside GOVERNED_TYPES
- SURFACE_SITES exported from `lib/constants.ts` as standalone constant (used by surfaceOnField.ts, batch scripts, dashboard, GROQ audits)
- groupedDocTypes stays in `deskStructure.ts` (desk-specific, no cross-file usage)

**alumniContinuum data safety**
- GROQ audit runs BEFORE adding alumniContinuum to GOVERNED_TYPES — find docs with missing governance fields
- Patch existing alumniContinuum documents with defaults before enabling badges
- Default narrativeOwner: `benext`
- Default platformTier: `canonical`
- Default archivalStatus: `archival` (Claude's discretion — aligns with type's purpose)

### Claude's Discretion
- Exact file structure within `lib/constants.ts` (type exports, naming conventions)
- GROQ audit query shape and patching approach for alumniContinuum
- How surfaceOnField.ts imports from constants vs defines inline
- Whether essay.ts Distribution group also wraps existing surfaceOn or stays loose for backward compatibility

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SCHM-01 | alumniContinuum added to GOVERNED_TYPES in sanity.config.ts so badges and document actions render correctly | Codebase confirms alumniContinuum IS in deskStructure.ts GOVERNED_TYPES but NOT in sanity.config.ts GOVERNED_TYPES (line 38-50). Adding it is a one-line change after the data safety patch. |
| SCHM-02 | surfaceOn field extracted from essay.ts into shared reusable definition (like governanceFields pattern) | essay.ts line 92-108 has the inline definition to extract. Pattern: export named `defineField()` from `schemaTypes/blocks/surfaceOnField.ts`. |
| SCHM-03 | surfaceOn field added to video, podcast, podcastEpisode, keynote, news schemas | None of these 5 schemas currently have surfaceOn. All are confirmed missing via grep. All use `governanceFields` spread pattern — surfaceOnField follows same import style. |
| SCHM-04 | Arkah added to surfaceOn site options list as 7th site value | Current essay.ts surfaceOn has 6 sites (missing arkah). The extracted surfaceOnField.ts adds arkah at position 5 in the brand hierarchy. |
| SCHM-08 | GOVERNED_TYPES extracted to shared lib/constants.ts used by both sanity.config.ts and deskStructure.ts | lib/ directory does not yet exist — must be created. Both files currently define their own GOVERNED_TYPES Set. They have already diverged: deskStructure.ts includes alumniContinuum, sanity.config.ts does not. |
</phase_requirements>

---

## Summary

Phase 4 is a pure refactoring and data-safety phase with no new product features. It has three independent work streams: (1) extracting duplicated constants to a single source of truth, (2) creating a shared `surfaceOnField` and propagating it to five schemas, and (3) patching existing alumniContinuum documents with governance defaults before enabling badges and actions on that type.

All changes are additive or refactoring — nothing is removed, no frontends are broken, and no field renames occur. The highest-risk work is the alumniContinuum data patch: existing documents have governance fields in the schema (`...governanceFields` is spread) but the initial values differ from what the CONTEXT.md defaults specify. A GROQ audit must confirm the actual state before patching.

The constants extraction (`lib/constants.ts`) eliminates an already-realized divergence: `deskStructure.ts` already includes `alumniContinuum` in its GOVERNED_TYPES but `sanity.config.ts` does not — a live bug causing alumniContinuum documents to show the Governance and References view tabs but NOT the EntityBadge, PlatformTierBadge, or ArchivalBadge. After extraction, this class of divergence cannot recur.

**Primary recommendation:** Execute in three sequential steps — constants extraction first (establishes the shared file), then surfaceOnField extraction and propagation, then alumniContinuum data audit and GOVERNED_TYPES fix last (so the shared constants file is the target of the final change).

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| sanity | ^5.13.0 (current) | Studio framework, defineField/defineType/defineConfig | Project foundation — no alternatives |
| @sanity/icons | current | Icon set for field groups | All existing actions/badges use this |
| TypeScript | project default | Type safety for constants file | Entire codebase is TypeScript |

No new packages are required for this phase. All work is schema refactoring and constant extraction within the existing codebase.

---

## Architecture Patterns

### Recommended Project Structure Changes

```
clean-studio/
├── lib/                          ← NEW (must be created)
│   └── constants.ts              ← NEW: GOVERNED_TYPES, BILINGUAL_TYPES, SURFACE_SITES
├── schemaTypes/
│   ├── blocks/
│   │   ├── governanceBlock.ts    ← unchanged
│   │   ├── commonMeta.ts         ← unchanged
│   │   └── surfaceOnField.ts     ← NEW: exported surfaceOnField defineField
│   ├── essay.ts                  ← MODIFIED: replace inline surfaceOn + add Distribution group
│   ├── video.ts                  ← MODIFIED: add surfaceOnField + Distribution group
│   ├── podcast.ts                ← MODIFIED: add surfaceOnField + Distribution group
│   ├── podcastEpisode.ts         ← MODIFIED: add surfaceOnField + Distribution group
│   ├── keynote.ts                ← MODIFIED: add surfaceOnField + Distribution group
│   └── news.ts                   ← MODIFIED: add surfaceOnField + Distribution group
├── sanity.config.ts              ← MODIFIED: import GOVERNED_TYPES, BILINGUAL_TYPES from lib/constants.ts; add alumniContinuum
└── deskStructure.ts              ← MODIFIED: import GOVERNED_TYPES from lib/constants.ts (remove local definition)
```

### Pattern 1: lib/constants.ts Structure

**What:** Single source of truth for all cross-file constants.
**When to use:** Any constant referenced by 2+ files.

```typescript
// lib/constants.ts
// Source: existing sanity.config.ts lines 38-53 + deskStructure.ts lines 21-28

/**
 * Document types that participate in the governance layer.
 * Used by sanity.config.ts (badge/action registration) and deskStructure.ts (view pane assignment).
 * SINGLE SOURCE — adding a type here automatically enables badges, actions, AND view tabs.
 */
export const GOVERNED_TYPES = new Set([
  // Content
  'essay', 'video', 'podcast', 'podcastEpisode',
  'opEd', 'curatedPost', 'socialPost', 'news', 'keynote',
  // Programs
  'project', 'futuroSummit', 'alumni', 'alumniContinuum',  // ← alumniContinuum added
  // Companion
  'alumniDream', 'alumniConversation', 'projectUpdate', 'participantConnection',
  // Accreditation
  'accreditationRecord', 'credential', 'accreditationHourLog',
  // Platform Business
  'pricingTier', 'usageRecord',
])

/**
 * Document types that have a language field (EN/ES).
 * Used by sanity.config.ts for LanguageBadge registration.
 */
export const BILINGUAL_TYPES = new Set(['essay', 'video', 'podcastEpisode', 'opEd'])

/**
 * Canonical site option list for surfaceOn fields.
 * Brand hierarchy order: personal > institutional (decreasing activity/prominence).
 * SINGLE SOURCE — used by surfaceOnField.ts, batch scripts, GROQ audits.
 */
export const SURFACE_SITES = [
  {title: 'Hector H. Lopez', value: 'hectorhlopez'},
  {title: 'BeNeXT', value: 'benext'},
  {title: 'Futuro', value: 'futuro'},
  {title: 'NeXT', value: 'next'},
  {title: 'Arkah', value: 'arkah'},
  {title: 'Mitikah', value: 'mitikah'},
  {title: 'Medikah', value: 'medikah'},
] as const
```

**Import in sanity.config.ts:**
```typescript
import {GOVERNED_TYPES, BILINGUAL_TYPES} from './lib/constants'
// Remove the local const declarations
```

**Import in deskStructure.ts:**
```typescript
import {GOVERNED_TYPES} from './lib/constants'
// Remove the local const declaration
```

### Pattern 2: surfaceOnField Shared Export

**What:** Single `defineField()` call exported from `schemaTypes/blocks/surfaceOnField.ts`. Follows the same export shape as `governanceFields` but is a single field (not an array) because it is a single discrete field, not a block of related fields.

**When to use:** Any content schema that has a distribution use case.

```typescript
// schemaTypes/blocks/surfaceOnField.ts
// Source: extracted from essay.ts lines 92-108 + CONTEXT.md site value decisions
import {defineField} from 'sanity'
import {SURFACE_SITES} from '../../lib/constants'

/**
 * surfaceOn — which ecosystem sites should display this content.
 * Import and include in a 'distribution' field group.
 */
export const surfaceOnField = defineField({
  name: 'surfaceOn',
  title: 'Surface On',
  type: 'array',
  of: [{type: 'string'}],
  group: 'distribution',
  options: {
    list: SURFACE_SITES,
    layout: 'grid',
  },
  description: 'Which ecosystem sites should display this content',
})
```

**Usage in each receiving schema (adding field group):**
```typescript
import {surfaceOnField} from './blocks/surfaceOnField'

export default defineType({
  name: 'video',
  // ...
  groups: [
    {name: 'distribution', title: 'Distribution'},
    // ... existing groups if any
  ],
  fields: [
    // ... existing fields ...
    surfaceOnField,
    // ... governanceFields spread ...
  ],
})
```

**essay.ts special case:** essay currently has no `groups` array. Adding the Distribution group is additive and does not affect existing field layout for other fields. The inline `surfaceOn` definition in essay.ts (lines 92-108) is replaced by the import.

### Pattern 3: alumniContinuum Data Patch Sequence

**What:** Verify governance field state on existing documents, then patch with defaults, then add to GOVERNED_TYPES.
**When to use:** Any time a type is added to GOVERNED_TYPES retroactively.

```typescript
// Audit script — run via: npx sanity exec scripts/audit-alumni-continuum.ts --with-user-token
// Produces terminal output: list of document IDs with missing/null governance fields

import {createClient} from '@sanity/client'

const client = createClient({
  projectId: 'fo6n8ceo',
  dataset: 'production',
  apiVersion: '2024-10-23',
  token: process.env.SANITY_AUTH_TOKEN,
  useCdn: false,
})

// Step 1: audit
const docsNeedingPatch = await client.fetch(`
  *[_type == "alumniContinuum" && (
    !defined(narrativeOwner) ||
    !defined(platformTier) ||
    !defined(archivalStatus)
  )]{_id, narrativeOwner, platformTier, archivalStatus}
`)

// Step 2: patch with defaults
const transaction = client.transaction()
for (const doc of docsNeedingPatch) {
  transaction.patch(doc._id, {
    setIfMissing: {
      narrativeOwner: 'benext',
      platformTier: 'canonical',
      archivalStatus: 'archival',
    },
  })
}
await transaction.commit()
```

**Key:** Use `setIfMissing` (not `set`) so existing non-null values are preserved. Run on production dataset only after verifying the patch list.

### Anti-Patterns to Avoid

- **Local GOVERNED_TYPES after extraction:** Once `lib/constants.ts` exists, never define a local `GOVERNED_TYPES` const in any file. TypeScript will not warn on duplicate names across files.
- **surfaceOnField as a Sanity object type:** Do not wrap surfaceOn in `defineType({type: 'object', ...})`. The field is a plain string array — wrapping adds nesting that breaks all existing GROQ queries on essay.surfaceOn.
- **Adding Arkah to essay inline before extraction:** If essay.ts is touched to add Arkah before the extraction refactor, the extraction will need to be done in the same diff. Do the extraction first, then add Arkah in surfaceOnField.ts once.
- **Patching alumniContinuum after GOVERNED_TYPES change:** Adding the type to GOVERNED_TYPES causes badges to render immediately on save. If a document has no narrativeOwner, EntityBadge returns `null` (safe), but the patch should happen first for clean behavior.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Bulk document patching | Custom REST client | `@sanity/client` transaction API with `setIfMissing` | Handles batching, retries, correct API version |
| Validation of surfaceOn values | Custom validation logic | `options.list` with explicit `{title, value}` pairs | Sanity Studio enforces list values in the UI; free-text is not possible when layout is 'grid' |
| Constants file module | New build tooling | Plain TypeScript file in `lib/` | Zero overhead — TypeScript path resolution handles it with existing tsconfig |

**Key insight:** All patterns needed for this phase already exist in the codebase. `governanceFields` shows the shared-field-block pattern. Existing scripts show the patch-script pattern. The refactor is mechanical, not inventive.

---

## Common Pitfalls

### Pitfall 1: essay.ts surfaceOn description is type-specific

**What goes wrong:** Current essay.ts surfaceOn has `description: 'Which ecosystem sites should display this essay'`. The shared surfaceOnField.ts must use the generic copy: `'Which ecosystem sites should display this content'`. If the essay-specific copy is copied into the shared file, the description will be wrong on video, podcast, etc.

**How to avoid:** The description in CONTEXT.md is explicit: use the generic copy. The shared definition uses "this content", not "this essay".

### Pitfall 2: SURFACE_SITES import creates a circular dependency

**What goes wrong:** `surfaceOnField.ts` imports from `../../lib/constants` — the relative path goes up two levels from `schemaTypes/blocks/`. This is correct but must be verified against tsconfig paths. There are no path aliases in this project (`CONVENTIONS.md`), so the relative path `../../lib/constants` is the only option.

**How to avoid:** Verify the path resolves correctly by checking that `schemaTypes/blocks/surfaceOnField.ts` importing `../../lib/constants` correctly reaches `lib/constants.ts` at the project root. Since `schemaTypes/blocks/` is 2 levels deep, `../../lib/` resolves to `lib/` at root — correct.

### Pitfall 3: Schemas without `groups` array get a type error

**What goes wrong:** Adding `group: 'distribution'` to `surfaceOnField` while the receiving schema has no `groups` array causes a Sanity Studio runtime warning: field references a group that doesn't exist. The field still renders but is not grouped.

**How to avoid:** For each schema receiving surfaceOnField, explicitly add `groups: [{name: 'distribution', title: 'Distribution'}]` to the `defineType` call. Check whether the schema already has a `groups` array before adding one (video.ts — confirmed no groups; podcast, podcastEpisode, keynote, news — confirmed no groups).

### Pitfall 4: alumniContinuum initialValue vs existing document values

**What goes wrong:** The schema file `alumniContinuum.ts` already has an `initialValue` block: `{archivalStatus: 'alumni-only', narrativeOwner: 'futuro', ...}`. But CONTEXT.md locked defaults for the patch are `narrativeOwner: 'benext'` and `archivalStatus: 'archival'`. These conflict.

**Why it matters:** The GROQ audit will show actual document values. Some documents may have been created with `narrativeOwner: 'futuro'` (from the old initialValue). The patch script must only use `setIfMissing` — documents that already have a `narrativeOwner` value (even `futuro`) must NOT be overwritten. Only truly null/missing fields get patched.

**How to avoid:** Use `setIfMissing` in the patch transaction, never `set`. Also update the `initialValue` in `alumniContinuum.ts` to match the CONTEXT.md defaults (`narrativeOwner: 'benext'`, `platformTier: 'canonical'`, `archivalStatus: 'archival'`) so new documents created after this phase get the correct defaults.

### Pitfall 5: Casing drift on existing essay surfaceOn values

**What goes wrong:** Existing essay documents have `surfaceOn` values using old labels (`'hectorhlopez.com'` is the value — wait, the VALUE is already `'hectorhlopez'`). The labels are changing from `'hectorhlopez.com'` (essay.ts current title) to `'Hector H. Lopez'` (CONTEXT.md decision). VALUES are not changing — only titles. No data migration needed. But this must be confirmed by reading essay.ts carefully.

**Confirmed from essay.ts inspection:** current values are `hectorhlopez`, `futuro`, `benext`, `mitikah`, `medikah`, `next` — all lowercase, all matching the new SURFACE_SITES values. Only the display titles change. Zero migration risk.

---

## Code Examples

### Current State (to be replaced)

```typescript
// sanity.config.ts lines 38-53 — current diverged state
const GOVERNED_TYPES = new Set([
  'essay', 'video', 'podcast', 'podcastEpisode',
  'opEd', 'curatedPost', 'socialPost', 'news', 'keynote',
  'project', 'futuroSummit', 'alumni',
  // NOTE: alumniContinuum is MISSING here (present in deskStructure.ts — live bug)
  'alumniDream', 'alumniConversation', 'projectUpdate', 'participantConnection',
  'accreditationRecord', 'credential', 'accreditationHourLog',
  'pricingTier', 'usageRecord',
])
const BILINGUAL_TYPES = new Set(['essay', 'video', 'podcastEpisode', 'opEd'])
```

```typescript
// deskStructure.ts lines 21-28 — current state (has alumniContinuum)
const GOVERNED_TYPES = new Set([
  'essay', 'video', 'podcast', 'podcastEpisode',
  'opEd', 'curatedPost', 'socialPost', 'news', 'keynote',
  'project', 'futuroSummit', 'alumni',
  'alumniDream', 'alumniConversation', 'projectUpdate', 'participantConnection', 'alumniContinuum',
  'accreditationRecord', 'credential', 'accreditationHourLog',
  'pricingTier', 'usageRecord',
])
```

### Target State (what gets written)

Both files replace their local const with:
```typescript
import {GOVERNED_TYPES, BILINGUAL_TYPES} from './lib/constants'
```

### essay.ts surfaceOn replacement

Current inline definition (essay.ts lines 92-108) gets replaced with:
```typescript
import {surfaceOnField} from './blocks/surfaceOnField'
// ... inside fields array, replace the inline defineField block with:
surfaceOnField,
// ... and add a groups array on the defineType:
groups: [
  {name: 'distribution', title: 'Distribution'},
],
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Duplicate GOVERNED_TYPES in 2 files | Single source in lib/constants.ts | Divergence made structurally impossible |
| Inline surfaceOn per schema file | Shared export from surfaceOnField.ts | 1 source controls all site options — Arkah update touches 1 line |
| alumniContinuum: views without badges | alumniContinuum: full governance treatment | Editors see EntityBadge (Vermillion/BeNeXT), PlatformTierBadge (Canonical), ArchivalBadge (Archival) |
| 6 surfaceOn sites (no Arkah) | 7 surfaceOn sites (Arkah added) | Arkah content can be routed via Studio |

---

## Open Questions

1. **Does alumniContinuum have actual documents in production?**
   - What we know: The schema exists, is registered in schemaTypes/index.ts, appears in deskStructure.ts groupedDocTypes, but CONCERNS.md notes it is "hidden from desk" and "pending review"
   - What's unclear: How many documents exist with type `alumniContinuum` in production? CONCERNS.md says to "query production for documents" before proceeding
   - Recommendation: The GROQ audit script in the plan must check count first: `count(*[_type == "alumniContinuum"])`. If zero, patching is a no-op but the GOVERNED_TYPES fix and initialValue update are still needed.

2. **Field group addition on essay.ts — backward compatibility**
   - What we know: essay.ts currently has no `groups` array. Adding one is additive.
   - What's unclear: Whether essay documents currently displayed in the studio will show any visual difference from adding a Distribution group. CONTEXT.md says "always visible (not collapsed)" — this is the default for new groups.
   - Recommendation: Adding a group affects field grouping UI. All other essay fields (not assigned to a group) will appear in the default ungrouped section. This is existing essay behavior since surfaceOn was already ungrouped — no regression.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None — zero test infrastructure exists in this project |
| Config file | None |
| Quick run command | `npx sanity build` (TypeScript compilation check) |
| Full suite command | `npx sanity build` |

**No automated test framework is configured.** The codebase has zero test files (confirmed in CONCERNS.md and STRUCTURE.md). Validation for this phase is via:
1. TypeScript compilation: `npx sanity build` — catches import errors, type mismatches
2. Manual Studio inspection: open documents of each modified type and verify fields render
3. GROQ audit: run audit script in Vision tool to verify alumniContinuum governance state

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SCHM-08 | GOVERNED_TYPES is defined once in lib/constants.ts | manual-only: grep confirms single definition | `grep -r "GOVERNED_TYPES" *.ts lib/*.ts` | ❌ Wave 0 — no test file |
| SCHM-01 | alumniContinuum shows EntityBadge, PlatformTierBadge, ArchivalBadge | manual: open alumniContinuum doc in Studio | `npx sanity build` (TS only) | ❌ no test file |
| SCHM-02 | surfaceOnField.ts exports a valid defineField | TypeScript compile | `npx sanity build` | ❌ Wave 0 |
| SCHM-03/04 | video/podcast/podcastEpisode/keynote/news have surfaceOn with 7 sites including arkah | TypeScript compile + manual Studio check | `npx sanity build` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npx sanity build` — TypeScript compilation must pass
- **Per wave merge:** `npx sanity build` + manual Studio smoke-test of one modified schema type
- **Phase gate:** All schemas compile; Studio opens without errors; alumniContinuum shows three governance badges; essay/video/podcast/podcastEpisode/keynote/news each show surfaceOn grid with 7 options including Arkah

### Wave 0 Gaps

No test files exist to create for this phase — the project has no test infrastructure. The plan should not invest in creating a test framework as part of Phase 4 (that would be a separate effort). Validation is via TypeScript compilation and manual Studio inspection.

*(No Wave 0 test creation needed — validation is compile-time + manual)*

---

## Sources

### Primary (HIGH confidence)
- Direct codebase reading:
  - `sanity.config.ts` — current GOVERNED_TYPES at lines 38-53, BILINGUAL_TYPES at line 53
  - `deskStructure.ts` — current GOVERNED_TYPES at lines 21-28 (diverged, includes alumniContinuum)
  - `schemaTypes/essay.ts` — current inline surfaceOn at lines 92-108 (6 sites, no Arkah)
  - `schemaTypes/alumniContinuum.ts` — has `...governanceFields` spread, conflicting initialValue (`narrativeOwner: 'futuro'` vs CONTEXT.md `benext`)
  - `schemaTypes/blocks/governanceBlock.ts` — export pattern for shared field arrays; Arkah missing from narrativeOwner options (separate concern, not in scope for Phase 4)
  - `.planning/codebase/CONCERNS.md` — confirms GOVERNED_TYPES divergence bug
  - `.planning/codebase/ARCHITECTURE.md` — GOVERNED_TYPES Set role
  - `.planning/codebase/STRUCTURE.md` — "Where to Add New Code" checklist
  - `.planning/codebase/CONVENTIONS.md` — UPPER_SNAKE_CASE, `type` not `interface`, no path aliases
  - `.planning/research/ARCHITECTURE.md` — Anti-Pattern 5, Feature 2 surfaceOn extension pattern
  - `.planning/research/PITFALLS.md` — Pitfall 6 (surfaceOn casing), Pitfall 11 (alumniContinuum side effects)
  - `.planning/phases/04-tech-debt-shared-infrastructure/04-CONTEXT.md` — locked decisions
  - `.planning/phases/04-tech-debt-shared-infrastructure/04-UI-SPEC.md` — visual contract

### Secondary (MEDIUM confidence)
- Confirmed via grep: video, podcast, podcastEpisode, keynote, news have no existing `surfaceOn` field, no `groups` array
- Confirmed via `ls lib/`: lib/ directory does not exist at project root

---

## Metadata

**Confidence breakdown:**
- Constants extraction: HIGH — complete picture from direct code reading; both files and their exact line numbers known
- surfaceOnField pattern: HIGH — essay.ts definition is the exact source; pattern confirmed against governanceBlock.ts export shape
- alumniContinuum data patch: MEDIUM — schema confirmed, patch approach confirmed; actual production document count is unknown until GROQ audit runs
- Field group addition: HIGH — Sanity groups API is straightforward; no groups currently exist on receiving schemas

**Research date:** 2026-03-16
**Valid until:** 2026-04-16 (stable — no external dependencies, all findings are codebase-internal)
