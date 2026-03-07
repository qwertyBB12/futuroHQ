# Codebase Structure

**Analysis Date:** 2026-03-07

## Directory Layout

```
clean-studio/
├── sanity.config.ts              # Master config (theme, plugins, badges, actions, tools)
├── sanity.cli.ts                 # Sanity CLI config (project ID, dataset)
├── deskStructure.ts              # Desk navigation (4 tiers + ungrouped fallback)
├── theme.ts                      # buildLegacyTheme wrapper
├── palettes.ts                   # Civic Modern color token map
├── styles.css                    # Global CSS (fonts, body bg, overrides)
├── tailwind.config.js            # Tailwind v4 with ecosystem colors
├── postcss.config.js             # PostCSS config
├── tsconfig.json                 # TypeScript config
├── eslint.config.mjs             # ESLint flat config
├── netlify.toml                  # Netlify deployment config
├── package.json                  # Dependencies and scripts
├── schema.json                   # Generated schema (sanity typegen)
├── sanity-typegen.json           # Typegen config
├── schemaTypes/                  # All document and object type definitions
│   ├── index.ts                  # Schema registry (exports flat array)
│   ├── blocks/                   # Shared field arrays (not standalone types)
│   │   ├── commonMeta.ts         # Publish, order, dates, AI, analytics fields
│   │   └── governanceBlock.ts    # narrativeOwner, platformTier, archival, etc.
│   ├── mediaBlock.ts             # Media embed object type
│   ├── narrativeBlock.ts         # Deep storytelling framework object type
│   ├── seoBlock.ts               # SEO metadata object type
│   └── [35 document schemas]     # essay.ts, video.ts, alumni.ts, etc.
├── components/                   # All custom React components
│   ├── MyNavbar.tsx              # Navbar (passthrough to default)
│   ├── StudioLogo.tsx            # Brand favicon as workspace icon
│   ├── StudioHead.tsx            # Custom <head> (favicons, meta, font preconnect)
│   ├── badges/                   # Document badge components
│   │   ├── EntityBadge.ts        # Color-coded narrativeOwner label
│   │   ├── PlatformTierBadge.ts  # Canonical/Personal/Distribution/Institutional
│   │   ├── LanguageBadge.ts      # EN/ES on bilingual types
│   │   └── ArchivalBadge.ts      # Ephemeral/Archival/Alumni-Only
│   ├── actions/                  # Document action components
│   │   ├── TriggerDeployAction.ts      # Netlify build hook trigger
│   │   ├── GenerateAIDerivativesAction.ts  # AI summary/quotes/captions
│   │   ├── ArchiveAction.ts            # One-click archive to alumni-only
│   │   └── SocialDistributeAction.ts   # Send to Make.com webhook
│   ├── dashboard/                # Dashboard tool widgets
│   │   ├── DashboardLayout.tsx   # Main layout with boot sequence
│   │   ├── EcosystemHealthWidget.tsx   # Document counts per entity
│   │   ├── RecentActivityWidget.tsx    # Last 12 updated documents
│   │   ├── QuickActionsWidget.tsx      # One-click create shortcuts
│   │   ├── EcosystemSitesWidget.tsx    # Site status cards
│   │   ├── MyDraftsWidget.tsx          # Current user's drafts
│   │   ├── PendingTasksWidget.tsx      # Tasks needing attention
│   │   ├── SeoHealthWidget.tsx         # SEO coverage overview
│   │   └── glassStyles.ts             # Shared glass morphism CSS
│   ├── inputs/                   # Custom input components
│   │   ├── MediaBlockInput.tsx   # Media embed input wrapper
│   │   └── SeoGeneratorInput.tsx # AI-powered SEO metadata generator
│   ├── previews/                 # Preview pane components
│   │   └── LivePreview.tsx       # Real-time GROQ preview (schema-specific layouts)
│   ├── views/                    # Document view pane components
│   │   ├── GovernanceView.tsx    # Governance field overview
│   │   ├── ReferencesView.tsx    # Incoming reference graph
│   │   └── SeoAuditView.tsx      # SEO checklist with scoring
│   └── utils/                    # Shared utility functions
│       └── fetchSeoSuggestion.ts # API call to SEO automation endpoint
├── scripts/                      # One-off data scripts (CLI)
│   ├── backfill-governance.ts    # Populate governance fields
│   ├── backfill-publishedAt.ts   # Populate publish dates
│   ├── import-youtube-videos.ts  # Bulk import from YouTube
│   ├── import-podcastEpisodes.ts # Bulk import podcast episodes
│   ├── migrate-tags.ts           # Legacy string tags to references
│   ├── publish-drafts.ts         # Batch publish draft documents
│   ├── populate-*.mjs            # Alumni bio population scripts
│   └── [15 more scripts]         # Various migration/import scripts
├── migrations/                   # Sanity migration scripts
│   ├── migrateVideoLanguage.ts   # Video language field migration
│   ├── seedFuturoContent.ts      # Seed Futuro program content
│   └── seedKeynotes.ts           # Seed keynote documents
├── static/                       # Static assets (served at /static/)
│   ├── favicon.svg               # Primary SVG favicon
│   ├── favicon.ico               # ICO fallback
│   ├── favicon-*.png             # Various favicon sizes
│   ├── apple-touch-icon.png      # iOS icon
│   ├── logo-benext.png           # BeNeXT logo (used in dashboard)
│   └── [other static images]     # Google logos, etc.
├── backups/                      # Data export backups
│   ├── export-20251008.tgz       # Content lake export
│   └── repo-snapshot-20251008.tar # Repo snapshot
├── dist/                         # Build output (generated)
├── .sanity/                      # Sanity runtime cache (generated)
├── .netlify/                     # Netlify functions/config (generated)
└── .planning/                    # GSD planning documents
```

## Directory Purposes

**`schemaTypes/`:**
- Purpose: All Sanity schema definitions for the content lake
- Contains: 35 document type files (one per type), 3 object type files, 1 index file, `blocks/` subdirectory
- Key files: `index.ts` (registry), `blocks/governanceBlock.ts` (governance fields), `blocks/commonMeta.ts` (shared meta)
- Pattern: Each file exports a `defineType({...})` call as default export

**`schemaTypes/blocks/`:**
- Purpose: Shared field arrays that are spread into document schemas (not standalone Sanity types)
- Contains: `commonMeta.ts` (exported as array of `defineField`), `governanceBlock.ts` (exported as array of `defineField`)
- Pattern: `export const governanceFields = [defineField({...}), ...]` -- consumed via `...governanceFields` spread

**`components/`:**
- Purpose: All custom React components for studio UI
- Contains: 6 subdirectories organized by function, plus 3 top-level chrome components
- Key files: `MyNavbar.tsx`, `StudioHead.tsx`, `StudioLogo.tsx`

**`components/badges/`:**
- Purpose: Document badge components shown in desk list and document header
- Contains: 4 badge files, each exporting a `DocumentBadgeComponent`
- Pattern: Read governance fields from `props.published` or `props.draft`, return `{label, color, title}` or `null`

**`components/actions/`:**
- Purpose: Custom document actions (buttons in the document action menu)
- Contains: 4 action files, each exporting a `DocumentActionComponent`
- Pattern: Check env var availability, return action config with `onHandle` async function

**`components/dashboard/`:**
- Purpose: Custom dashboard tool ("Ecosystem Command Center")
- Contains: 1 layout component, 7 widget components, 1 shared styles file
- Key files: `DashboardLayout.tsx` (layout + boot sequence), `glassStyles.ts` (shared CSS-in-JS)

**`components/views/`:**
- Purpose: Document view pane components (tabs alongside Content and Preview)
- Contains: `GovernanceView.tsx`, `ReferencesView.tsx`, `SeoAuditView.tsx`
- Pattern: Receive `{document, schemaType}` props, render read-only analysis UI

**`components/inputs/`:**
- Purpose: Custom input components that replace or wrap default Sanity inputs
- Contains: `SeoGeneratorInput.tsx` (wraps seoBlock with AI generate button), `MediaBlockInput.tsx`
- Pattern: Receive `ObjectInputProps`, call `renderDefault(props)` then add custom UI

**`components/previews/`:**
- Purpose: Live document preview with schema-specific layouts
- Contains: `LivePreview.tsx` (single file handling all 25+ schema types via switch/case)
- Pattern: Fetches document via GROQ with schema-specific projections, subscribes to real-time updates

**`scripts/`:**
- Purpose: One-off CLI scripts for data migration, import, and backfill
- Contains: 25+ scripts (TypeScript and JavaScript)
- Pattern: Run via `npx sanity exec scripts/scriptName.ts` or `node scripts/scriptName.mjs`
- Not committed to production builds

**`migrations/`:**
- Purpose: Sanity-managed migration scripts
- Contains: 3 migration files
- Pattern: Run via `npx sanity migration run`

**`static/`:**
- Purpose: Static files served by Sanity at `/static/` path
- Generated: No
- Committed: Yes
- Important: Sanity automatically serves files from this directory. Custom favicons must be placed here.

## Key File Locations

**Entry Points:**
- `sanity.config.ts`: Master studio configuration -- all plugins, schema, theme, badges, actions, tools
- `sanity.cli.ts`: CLI configuration (project ID `fo6n8ceo`, dataset `production`)
- `deskStructure.ts`: Desk navigation structure (4 tiers + ungrouped fallback)

**Configuration:**
- `theme.ts`: Theme wrapper (`buildLegacyTheme`)
- `palettes.ts`: Color token definitions (Civic Modern palette)
- `styles.css`: Global CSS (body background, fonts, Sanity overrides)
- `tailwind.config.js`: Tailwind configuration with ecosystem color tokens
- `netlify.toml`: Deployment configuration for Netlify
- `tsconfig.json`: TypeScript configuration
- `.env.local`: Environment variables (exists, not committed)

**Core Logic:**
- `schemaTypes/blocks/governanceBlock.ts`: Governance field definitions (narrativeOwner, platformTier, archivalStatus, postingEntity, conversionTracking)
- `schemaTypes/blocks/commonMeta.ts`: Shared metadata fields (publish, order, dates, AI derivatives, distribution, analytics)
- `schemaTypes/index.ts`: Schema registry exporting all 36 types
- `components/previews/LivePreview.tsx`: Schema-aware document preview (largest component, ~828 lines)

**Testing:**
- No test files or test framework detected in this project

## Naming Conventions

**Files:**
- Schema types: `camelCase.ts` matching the Sanity type name (e.g., `podcastEpisode.ts` for type `podcastEpisode`)
- Components: `PascalCase.tsx` (e.g., `DashboardLayout.tsx`, `EntityBadge.ts`)
- Utilities: `camelCase.ts` (e.g., `fetchSeoSuggestion.ts`, `glassStyles.ts`)
- Scripts: `kebab-case.ts` or `kebab-case.mjs` (e.g., `backfill-governance.ts`, `populate-laura-miller.mjs`)

**Directories:**
- All lowercase, no hyphens: `schemaTypes/`, `components/`, `scripts/`, `migrations/`, `static/`
- Sub-directories by function: `badges/`, `actions/`, `dashboard/`, `inputs/`, `previews/`, `views/`, `utils/`, `blocks/`

**Exports:**
- Schema files: default export of `defineType({...})`
- Badge/Action files: named export of the component (e.g., `export const EntityBadge`)
- Dashboard/View components: default export of the React component
- Shared field blocks: named export of the array (e.g., `export const governanceFields`)

## Where to Add New Code

**New Document Schema:**
1. Create `schemaTypes/newType.ts` using `defineType({name: 'newType', type: 'document', ...})`
2. Import and add to the array in `schemaTypes/index.ts`
3. Add `...governanceFields` spread if the type needs governance
4. Add the type name to `GOVERNED_TYPES` in both `sanity.config.ts` AND `deskStructure.ts`
5. Add to `groupedDocTypes` set in `deskStructure.ts` and place in appropriate tier
6. Add a preview case in `components/previews/LivePreview.tsx` > `previewProjections` and the switch/case
7. If bilingual, add to `BILINGUAL_TYPES` in `sanity.config.ts`
8. If SEO-eligible, add to `SEO_TYPES` in `deskStructure.ts`

**New Object Type (reusable block):**
1. Create `schemaTypes/newBlock.ts` using `defineType({name: 'newBlock', type: 'object', ...})`
2. Import and add to the array in `schemaTypes/index.ts`
3. Use in document schemas via `type: 'newBlock'`

**New Shared Field Array (like governanceFields):**
1. Create `schemaTypes/blocks/newFields.ts` exporting an array of `defineField()` calls
2. Spread into document schemas: `...newFields`

**New Document Badge:**
1. Create `components/badges/NewBadge.ts` exporting a `DocumentBadgeComponent`
2. Register in `sanity.config.ts` > `document.badges` callback

**New Document Action:**
1. Create `components/actions/NewAction.ts` exporting a `DocumentActionComponent`
2. Register in `sanity.config.ts` > `document.actions` callback

**New Dashboard Widget:**
1. Create `components/dashboard/NewWidget.tsx` as a React component
2. Import and add to `components/dashboard/DashboardLayout.tsx` grid layout
3. Use `glassPanel` / `glassCard` from `components/dashboard/glassStyles.ts` for consistent styling

**New View Pane (document tab):**
1. Create `components/views/NewView.tsx` accepting `{document, schemaType}` props
2. Register in `deskStructure.ts` > `documentViews()` function via `S.view.component(NewView).title('Tab Name')`

**New Custom Input:**
1. Create `components/inputs/NewInput.tsx` implementing Sanity input props
2. Register on the schema field or type via `components: {input: NewInput}`

**Utilities:**
- Shared helpers: `components/utils/`
- One-off data scripts: `scripts/`
- Sanity migrations: `migrations/`

## Special Directories

**`dist/`:**
- Purpose: Production build output
- Generated: Yes (by `npx sanity build`)
- Committed: No (in `.gitignore`)

**`.sanity/`:**
- Purpose: Sanity runtime cache
- Generated: Yes
- Committed: No

**`.netlify/`:**
- Purpose: Netlify functions and deployment config
- Generated: Yes (partially)
- Committed: Partially (has committed structure files)

**`backups/`:**
- Purpose: Manual data export backups
- Generated: No (manually created)
- Committed: Yes (tracked in git)

**`static/`:**
- Purpose: Static assets served by Sanity at `/static/` path
- Generated: No
- Committed: Yes
- Important: Sanity checks `static/` for custom favicons via `hasCustomFavicon()`

---

*Structure analysis: 2026-03-07*
