# Architecture

**Analysis Date:** 2026-03-07

## Pattern Overview

**Overall:** Sanity Studio v3 Plugin Architecture with Multi-Entity Governance Layer

**Key Characteristics:**
- Single Sanity Studio instance serving 7 ecosystem entities (Hector, BeNeXT, Futuro, NeXT, Mitikah, Medikah, Arkah)
- Governance-driven content classification via shared field blocks spread into document schemas
- Custom dashboard tool, document badges, document actions, and view panes extending the Sanity framework
- Schema-as-code pattern: all 33+ document types defined as TypeScript modules, composed from shared building blocks

## Layers

**Configuration Layer:**
- Purpose: Wires together all plugins, schema, theming, badges, actions, and tools
- Location: `sanity.config.ts`, `sanity.cli.ts`
- Contains: Plugin registration, theme binding, badge/action resolver functions, custom tool registration
- Depends on: All other layers (schemas, components, theme)
- Used by: Sanity runtime

**Schema Layer:**
- Purpose: Defines all document types and object types for the content lake
- Location: `schemaTypes/`
- Contains: 33 document type definitions + 3 shared object types (`mediaBlock`, `narrativeBlock`, `seoBlock`) + 2 field block arrays (`commonMeta`, `governanceFields`)
- Depends on: Sanity `defineType`/`defineField`, custom input components from `components/inputs/`
- Used by: Configuration layer, preview/view components that reference schema names

**Shared Building Blocks (sub-layer of Schema):**
- Purpose: Reusable field arrays and object types spread into document schemas
- Location: `schemaTypes/blocks/commonMeta.ts`, `schemaTypes/blocks/governanceBlock.ts`
- Contains: `commonMeta` (7 fields: publish, order, dates, AI derivatives, distribution, analytics) and `governanceFields` (5 fields: platformTier, archivalStatus, narrativeOwner, conversionTracking, postingEntity)
- Depends on: Sanity field definitions
- Used by: Document schemas that spread `...governanceFields` and/or include `commonMeta` fields

**Component Layer:**
- Purpose: All custom React UI for the studio
- Location: `components/`
- Contains: Badges, actions, dashboard widgets, input overrides, preview panes, view panes, studio chrome
- Depends on: `@sanity/ui`, `sanity` hooks (`useClient`, `useDocumentOperation`, `useFormValue`), Sanity Content Lake API
- Used by: Configuration layer (registered via `sanity.config.ts`)

**Theme Layer:**
- Purpose: Visual identity (Civic Modern warm dark palette)
- Location: `theme.ts`, `palettes.ts`, `styles.css`, `tailwind.config.js`
- Contains: Legacy theme token mapping, CSS custom properties, global styles (fonts, body bg)
- Depends on: `buildLegacyTheme` from Sanity
- Used by: Configuration layer (`theme` property)

**Scripts & Migrations Layer:**
- Purpose: One-off data operations against the content lake
- Location: `scripts/`, `migrations/`
- Contains: Backfill scripts, import scripts, ID migration scripts, content seeding
- Depends on: Sanity CLI client
- Used by: Run manually via CLI

## Data Flow

**Content Creation Flow:**

1. Editor opens document in desk structure (`deskStructure.ts` determines navigation hierarchy)
2. Schema definition (`schemaTypes/*.ts`) renders the form with governance fields, SEO block, media block
3. Custom input components (`SeoGeneratorInput`, `MediaBlockInput`) enhance specific fields
4. Document badges (`EntityBadge`, `PlatformTierBadge`, `ArchivalBadge`, `LanguageBadge`) display governance status in real-time
5. On save, document actions (`TriggerDeployAction`, `GenerateAIDerivativesAction`, `SocialDistributeAction`, `ArchiveAction`) are available
6. View panes show Preview (live GROQ fetch), Governance overview, References (incoming), and SEO Audit tabs

**Document View Pane Flow:**

1. `deskStructure.ts` > `documentViews()` determines which tabs appear based on schema type
2. `LivePreview` component fetches document via GROQ with schema-specific projections, subscribes to real-time updates
3. `GovernanceView` reads governance fields from `document.displayed` and renders ownership/classification cards
4. `ReferencesView` fetches all documents that reference the current document via `*[references($id)]`
5. `SeoAuditView` runs 7 checks against SEO metadata and produces a score

**Dashboard Data Flow:**

1. `DashboardLayout` renders as a custom tool (registered in `sanity.config.ts` > `tools`)
2. Each widget fetches data independently via `useClient` and GROQ queries
3. Boot sequence animation runs once per day via localStorage gate (`am-boot-ts` key)

**Social Distribution Flow:**

1. `SocialDistributeAction` sends document metadata to `SANITY_STUDIO_SOCIAL_WEBHOOK_URL` (Make.com)
2. Payload includes: _id, _type, title, excerpt, slug, narrativeOwner, postingEntity, language, socialTargets, ai_derivatives
3. External automation handles posting to selected platforms

**State Management:**
- No global state management library; Sanity's built-in document store handles all state
- Widget-level state via React `useState`/`useEffect` hooks
- Dashboard boot gate via `localStorage`

## Key Abstractions

**Governance Fields:**
- Purpose: Multi-entity content classification and ownership model
- Definition: `schemaTypes/blocks/governanceBlock.ts`
- Usage: Spread into document schemas via `...governanceFields`
- Pattern: 5 fields (narrativeOwner, platformTier, archivalStatus, postingEntity, conversionTracking) that determine entity ownership, content hierarchy, lifespan, and distribution tracking
- Consumed by: `EntityBadge`, `PlatformTierBadge`, `ArchivalBadge`, `GovernanceView`, `ArchiveAction`, `SocialDistributeAction`

**GOVERNED_TYPES Set:**
- Purpose: Central registry of document types that participate in governance
- Definition: `sanity.config.ts` (line 37-49) and duplicated in `deskStructure.ts` (line 21-28)
- Pattern: `Set<string>` checked via `.has()` to conditionally attach badges, actions, and view panes
- Important: Two separate `GOVERNED_TYPES` sets exist -- one in config (for badges/actions) and one in desk structure (for view panes). Keep them synchronized.

**Shared Object Types:**
- Purpose: Reusable structured content blocks embedded across multiple document types
- Examples:
  - `mediaBlock` (`schemaTypes/mediaBlock.ts`) - Platform-aware media embed (video/audio/image)
  - `narrativeBlock` (`schemaTypes/narrativeBlock.ts`) - Deep storytelling framework with 12+ fields
  - `seoBlock` (`schemaTypes/seoBlock.ts`) - SEO metadata with AI generator input
- Pattern: Defined as Sanity `object` types, used via `type: 'mediaBlock'` etc. in document schemas

**Common Meta:**
- Purpose: Shared metadata fields for publishable content
- Definition: `schemaTypes/blocks/commonMeta.ts`
- Pattern: Array of `defineField()` calls, spread into document schemas
- Contains: publish toggle, order, publishedAt, updatedAt, AI derivatives, distribution links, social targets, analytics

**Document View System:**
- Purpose: Multi-tab document editing with contextual panes
- Implementation: `deskStructure.ts` > `documentViews()` function
- Pattern: All documents get Content + Preview tabs. Governed types additionally get Governance + References tabs. SEO-eligible types get SEO Audit tab.
- View components: `components/previews/LivePreview.tsx`, `components/views/GovernanceView.tsx`, `components/views/ReferencesView.tsx`, `components/views/SeoAuditView.tsx`

**Glass Morphism UI:**
- Purpose: Consistent visual style for dashboard widgets
- Definition: `components/dashboard/glassStyles.ts`
- Pattern: Exported `CSSProperties` objects (`glassPanel`, `glassCard`, `glassButton`) applied as inline styles

## Entry Points

**Studio Entry:**
- Location: `sanity.config.ts`
- Triggers: Sanity dev server (`npx sanity dev`) or production build
- Responsibilities: Registers all plugins, schema, theme, custom tools, badges, and actions

**Desk Structure:**
- Location: `deskStructure.ts`
- Triggers: Loaded by `structureTool({structure: deskStructure})` plugin
- Responsibilities: Defines 4-tier navigation (Writer's Desk, Daily, Programs & Projects, System) plus ungrouped fallback. Assigns view panes per document type.

**Schema Registry:**
- Location: `schemaTypes/index.ts`
- Triggers: Imported by `sanity.config.ts` > `schema: {types: schemaTypes}`
- Responsibilities: Exports flat array of all 33 document types + 3 object types

**Dashboard Tool:**
- Location: `components/dashboard/DashboardLayout.tsx`
- Triggers: Registered as custom tool in `sanity.config.ts` > `tools`
- Responsibilities: Renders ecosystem command center with 7 widgets in a grid layout

## Error Handling

**Strategy:** Fail silently for external integrations; show inline errors for user-facing features

**Patterns:**
- External webhook calls (deploy, social, AI) use try/catch with empty catch blocks -- fire-and-forget
- `SeoGeneratorInput` displays error messages inline via state (`setError(...)`)
- `LivePreview` shows spinner during loading, "No content yet" for empty state
- `ReferencesView` shows spinner then empty state card
- `SeoAuditView` gracefully handles missing fields with "Not set" / "warn" / "fail" statuses

## Cross-Cutting Concerns

**Logging:** Console warnings only, used sparingly (e.g., `fetchSeoSuggestion.ts` warns on missing endpoint)

**Validation:** Sanity's built-in `Rule` validation on schema fields (required, max length, min/max). No custom validation logic beyond schema definitions.

**Authentication:** Handled entirely by Sanity's built-in auth (project-level access). No custom auth layer.

**Theming:** Three-layer approach:
1. `palettes.ts` defines color tokens
2. `theme.ts` wraps them via `buildLegacyTheme()`
3. `styles.css` provides CSS overrides, font imports, and body background that `buildLegacyTheme` cannot control

**Multi-Entity Awareness:** Pervasive. The `narrativeOwner` field drives badge colors, governance views, social distribution payloads, and visual treatment across the studio. Entity color maps are duplicated in `EntityBadge.ts`, `GovernanceView.tsx`, and `ReferencesView.tsx`.

---

*Architecture analysis: 2026-03-07*
