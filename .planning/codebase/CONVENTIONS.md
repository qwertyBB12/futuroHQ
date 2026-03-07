# Coding Conventions

**Analysis Date:** 2026-03-07

## Naming Patterns

**Files:**
- Schema types: `camelCase.ts` (e.g., `schemaTypes/podcastEpisode.ts`, `schemaTypes/alumniDream.ts`)
- Shared blocks: `camelCase.ts` in `schemaTypes/blocks/` (e.g., `governanceBlock.ts`, `commonMeta.ts`)
- React components: `PascalCase.tsx` (e.g., `components/MyNavbar.tsx`, `components/StudioHead.tsx`)
- Non-React TS modules: `camelCase.ts` (e.g., `components/badges/EntityBadge.ts`, `components/utils/fetchSeoSuggestion.ts`)
- Dashboard widgets: `PascalCase.tsx` (e.g., `components/dashboard/EcosystemHealthWidget.tsx`)
- Style modules: `camelCase.ts` (e.g., `components/dashboard/glassStyles.ts`)

**Functions:**
- React components: `PascalCase` (e.g., `DashboardLayout`, `LivePreview`, `SeoGeneratorInput`)
- Helper functions: `camelCase` (e.g., `fetchSeoSuggestion`, `formatDate`, `buildQuery`, `shouldRunBoot`)
- Sanity document action/badge exports: `PascalCase` const (e.g., `EntityBadge`, `TriggerDeployAction`)

**Variables:**
- Constants: `UPPER_SNAKE_CASE` for config objects and sets (e.g., `GOVERNED_TYPES`, `BILINGUAL_TYPES`, `VESSEL_COLORS`, `ENTITIES`, `BOOT_KEY`)
- Color tokens: `UPPER_SNAKE_CASE` (e.g., `COPPER`, `VERMILLION`, `SANDSTONE`, `SLATE`)
- State: `camelCase` (e.g., `totalDocs`, `isLoading`, `confirming`)

**Types:**
- TypeScript types: `PascalCase` (e.g., `EntityCount`, `LivePreviewProps`, `PreviewDocument`, `SeoSuggestion`)
- Use `type` keyword, not `interface` -- the codebase consistently uses `type` for all type definitions

**Schema names:**
- Sanity type names: `camelCase` strings (e.g., `'essay'`, `'podcastEpisode'`, `'alumniDream'`, `'seoBlock'`)
- Exception: `siteSettings_futuro` uses underscore (singleton pattern)

## Code Style

**Formatting:**
- Prettier v3.5+ configured in `package.json`
- No semicolons (`"semi": false`)
- Single quotes (`"singleQuote": true`)
- Print width: 100 characters (`"printWidth": 100`)
- No bracket spacing (`"bracketSpacing": false`)
- Example: `import {defineType, defineField} from 'sanity'`

**Linting:**
- ESLint v9 with flat config (`eslint.config.mjs`)
- Uses `@sanity/eslint-config-studio` preset (extends it directly with no custom rules)
- TypeScript strict mode enabled in `tsconfig.json`

**Indentation:**
- 2 spaces (Prettier default)

## Import Organization

**Order:**
1. React imports (`import {useState, useEffect} from 'react'`)
2. Sanity SDK imports (`import {defineType, defineField} from 'sanity'`, `import {useClient} from 'sanity'`)
3. Sanity UI components (`import {Stack, Heading, Text} from '@sanity/ui'`)
4. Sanity icons (`import {RocketIcon} from '@sanity/icons'`)
5. Local imports - shared blocks (`import {governanceFields} from './blocks/governanceBlock'`)
6. Local imports - components/utils (`import {fetchSeoSuggestion} from '../utils/fetchSeoSuggestion'`)

**Path Aliases:**
- No path aliases configured. All imports use relative paths (`'./blocks/governanceBlock'`, `'../utils/fetchSeoSuggestion'`)

**Import style:**
- Named imports with destructuring: `import {defineType, defineField} from 'sanity'`
- Default imports for schema types: `import essay from './essay'`
- Default imports for React components: `import DashboardLayout from './components/dashboard/DashboardLayout'`
- Type imports use `import type` syntax: `import type {DocumentBadgeComponent} from 'sanity'`

## Schema Conventions

**Document type pattern:**
```typescript
import {defineType, defineField} from 'sanity'
import {governanceFields} from './blocks/governanceBlock'

export default defineType({
  name: 'typeName',
  title: 'Human Title',
  type: 'document',
  description: 'AI Assist instruction string — describes defaults, voice, rules.',
  initialValue: {
    narrativeOwner: 'hector',
    platformTier: 'canonical',
    archivalStatus: 'archival',
  },
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    // ... domain-specific fields ...
    ...governanceFields,
  ],
  preview: {
    select: {title: 'title', date: 'publishDate', media: 'coverImage'},
    prepare({title, date, media}) {
      return {
        title: title || 'Untitled',
        subtitle: date ? new Date(date).toLocaleDateString() : '',
        media,
      }
    },
  },
})
```

**Key schema conventions:**
- Use `defineType()` and `defineField()` from Sanity (never raw objects)
- Export schema as `export default defineType(...)` (default export per file)
- Spread `...governanceFields` at the end of governed document fields arrays
- Use `description` on `defineType` as AI Assist context string (describes defaults, voice guidance, rules)
- Include `initialValue` for governance fields when applicable
- Always include `preview` with `select` + `prepare` pattern
- `prepare()` always provides a fallback title (e.g., `title || 'Untitled Essay'`)
- Validation uses arrow syntax: `validation: (Rule) => Rule.required()`
- Shared field blocks (`governanceFields`, `commonMeta`) are arrays of `defineField()` calls, spread into fields

**Object type pattern (shared blocks):**
```typescript
import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'blockName',
  title: 'Block Title',
  type: 'object',
  components: {input: CustomInputComponent},  // optional custom input
  fields: [
    defineField({name: 'fieldName', title: 'Field Title', type: 'string'}),
  ],
  preview: {
    select: {title: 'title'},
    prepare({title}) {
      return {title: title || 'Untitled'}
    },
  },
})
```

**Reusable field group pattern (for spreading):**
```typescript
import {defineField} from 'sanity'

export const governanceFields = [
  defineField({name: 'platformTier', title: 'Platform Tier', type: 'string', ...}),
  defineField({name: 'archivalStatus', title: 'Archival Status', type: 'string', ...}),
  // ...
]
```

## Component Conventions

**Document badge pattern (`components/badges/*.ts`):**
```typescript
import type {DocumentBadgeComponent} from 'sanity'

export const EntityBadge: DocumentBadgeComponent = (props) => {
  const value = (props.published?.fieldName || props.draft?.fieldName) as string | undefined
  if (!value) return null
  return {label: 'Label', title: 'Tooltip', color: 'primary'}
}
```

**Document action pattern (`components/actions/*.ts`):**
```typescript
import {useState} from 'react'
import type {DocumentActionComponent} from 'sanity'

export const ActionName: DocumentActionComponent = (props) => {
  const [state, setState] = useState(false)
  // Guard: return null if not applicable
  if (!condition) return null
  return {
    label: 'Action Label',
    icon: SomeIcon,
    onHandle: async () => { /* ... */ },
    dialog: state ? {type: 'confirm', message: '...', onConfirm, onCancel} : undefined,
  }
}
```

**Dashboard widget pattern (`components/dashboard/*.tsx`):**
```typescript
import {useClient} from 'sanity'
import {Stack, Heading, Text} from '@sanity/ui'
import {glassPanel, glassCard} from './glassStyles'

export default function WidgetName() {
  const client = useClient({apiVersion: '2024-10-23'})
  // Fetch data in useEffect, render with glassPanel/glassCard styles
  return (
    <div style={{...glassPanel, padding: 24}}>
      <Stack space={4}>
        <Heading size={1} style={{fontFamily: "'Oswald', sans-serif", textTransform: 'uppercase'}}>
          Widget Title
        </Heading>
        {/* content */}
      </Stack>
    </div>
  )
}
```

**View pane pattern (`components/views/*.tsx`):**
- Export as `const ViewName: ComponentType<ViewProps> = ({document}) => { ... }` or `export default function ViewName`
- Accept `{document, schemaType}` props
- Access document data via `document?.displayed`
- Use `@sanity/ui` components for layout

## Error Handling

**Patterns:**
- External API calls: try/catch with `console.warn` for non-critical failures (see `fetchSeoSuggestion.ts`)
- Fire-and-forget actions: empty catch blocks (e.g., `TriggerDeployAction` Netlify hook)
- User-facing errors: store in state and render inline (e.g., `SeoGeneratorInput` error state)
- Guard clauses: return `null` early from badges/actions when preconditions not met
- No global error boundary or centralized error handling

**Error display pattern:**
```typescript
const [error, setError] = useState<string | null>(null)
// In handler:
catch (err) {
  setError(err instanceof Error ? err.message : 'Unexpected error')
}
// In render:
{error && <Card tone="critical" padding={3}><Text size={1}>{error}</Text></Card>}
```

## Logging

**Framework:** Browser console only (`console.warn`)

**Patterns:**
- Prefix warnings with module identifier: `console.warn('[seo-generator] Missing...')`
- No structured logging library
- No server-side logging (client-only Sanity Studio)

## Comments

**When to Comment:**
- Section dividers in schema index: `// --- Core ---`, `// --- Media / Publishing ---`
- JSDoc on exported functions/components: one-liner describing purpose
- Inline comments for non-obvious logic or platform workarounds
- CSS section headers use `/* --- SECTION NAME --- */` block comments

**JSDoc style:**
```typescript
/**
 * One-click archive: sets archivalStatus to 'alumni-only'
 * and unpublishes the document from public frontends.
 */
```

**Comment separators in config files:**
```typescript
// ---------------------------------------------------------------------------
// Section Name
// ---------------------------------------------------------------------------
```

## Styling Approach

**Primary:** Inline `style` objects using `CSSProperties`
- Shared glass styles exported from `components/dashboard/glassStyles.ts`
- Color constants defined at file top: `const COPPER = '#B17E68'`
- Typography inline: `fontFamily: "'Oswald', sans-serif"`, `textTransform: 'uppercase'`

**Secondary:** Global CSS in `styles.css`
- Targets Sanity internal `data-ui` attributes (e.g., `[data-ui="Navbar"]`)
- Heavy use of `!important` to override Sanity defaults
- Liquid glass aesthetic via `backdrop-filter`, `border` gradients, `box-shadow` layers

**UI Components:** `@sanity/ui` exclusively (`Stack`, `Grid`, `Flex`, `Card`, `Text`, `Heading`, `Badge`, `Button`, `Spinner`, `Box`, `Inline`)

**Tailwind:** Configured (`tailwind.config.js`) but not actively used in source files. CSS utility classes (`font-display`, `font-body`, `font-mono`, `h1-brand`) defined manually in `styles.css`.

## Sanity Client Usage

**API Version:** Always specify `{apiVersion: '2024-10-23'}` when calling `useClient()`

**GROQ queries:** Inline strings (no separate query files)

**Pattern:**
```typescript
const client = useClient({apiVersion: '2024-10-23'})
useEffect(() => {
  const fetchData = async () => {
    const result = await client.fetch<Type>(query, params)
    setState(result)
  }
  fetchData()
}, [client])
```

## Module Design

**Exports:**
- Schema types: default export (`export default defineType(...)`)
- Shared field blocks: named export (`export const governanceFields = [...]`)
- Components: default export for full components, named export for badges/actions
- Utility functions: named export (`export async function fetchSeoSuggestion(...)`)
- Types: named export (`export type SeoSuggestion = {...}`)

**Barrel Files:**
- `schemaTypes/index.ts` is the only barrel file -- re-exports all schema types as a combined array

**No barrel files for components** -- each component imported directly by path.

---

*Convention analysis: 2026-03-07*
