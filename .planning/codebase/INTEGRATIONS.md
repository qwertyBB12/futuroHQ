# External Integrations

**Analysis Date:** 2026-03-07

## APIs & External Services

**Sanity Content Lake:**
- Primary data store for all 33 document types across 7 entities
- SDK/Client: `@sanity/client` ^6.29.1
- Project ID: `fo6n8ceo`
- Dataset: `production`
- API version: `2024-10-23` (used in dashboard widgets)
- Used in: All dashboard widgets (`components/dashboard/*.tsx`), preview components (`components/previews/LivePreview.tsx`), governance views (`components/views/*.tsx`)
- Client instantiation pattern: `useClient({apiVersion: '2024-10-23'})` from `sanity` package

**AI Derivatives Endpoint:**
- Purpose: Generate summaries, quotes, and captions for content documents
- Action: `components/actions/GenerateAIDerivativesAction.ts`
- Auth: env var `SANITY_STUDIO_AI_ENDPOINT`
- Protocol: POST with JSON body (`{documentId, documentType, title, body, description, excerpt}`)
- Response: JSON `{summary, quotes[], captions[]}`
- Patches document's `ai_derivatives` field via Sanity's `useDocumentOperation`

**AI SEO Generator Endpoint:**
- Purpose: Generate SEO metadata (title tags, meta descriptions, keywords)
- Component: `components/inputs/SeoGeneratorInput.tsx`
- Utility: `components/utils/fetchSeoSuggestion.ts`
- Auth: env var `AI_SEO_GENERATOR_ENDPOINT`
- Protocol: POST with JSON body (`{doc: SanityDocument, fieldPath: string}`)
- Response: JSON `{title?, description?, keywords[]?}`
- Applied to document's `seo` object field via `onChange(set(...))`

**Sanity AI Assist:**
- Purpose: Field-level AI generation with per-entity narrative instructions
- Plugin: `@sanity/assist` ^5.0.4
- Configured in: `sanity.config.ts` as `assist()` plugin
- No additional env vars required (uses Sanity's built-in AI infrastructure)

## Data Storage

**Databases:**
- Sanity Content Lake (hosted by Sanity.io)
  - Connection: Built into `sanity` package; configured via `projectId` + `dataset` in `sanity.config.ts` and `sanity.cli.ts`
  - Client: `@sanity/client` (GROQ queries), `useDocumentOperation` (mutations)
  - No direct database connections; all data access through Sanity's API

**File Storage:**
- Sanity Asset Pipeline (images, files)
  - Managed via `sanity-plugin-media` ^4.1.1 (asset browser with tagging)
  - CDN: `cdn.sanity.io`

**Caching:**
- localStorage for dashboard boot sequence gate (`am-boot-ts` key, 24h TTL) in `components/dashboard/DashboardLayout.tsx`
- No external caching service

## Authentication & Identity

**Auth Provider:**
- Sanity.io built-in authentication
  - Users authenticate through Sanity's hosted auth (Google, GitHub, email)
  - No custom auth implementation in studio code
  - Session management handled by Sanity framework

## Monitoring & Observability

**Error Tracking:**
- None (errors in actions are silently caught with empty `catch` blocks)

**Logs:**
- `console.warn` in `components/utils/fetchSeoSuggestion.ts` for missing endpoint or failed requests
- `console.log`/`console.warn` in build scripts (`scripts/postbuild.js`, `scripts/postinstall.js`)
- No structured logging framework

## CI/CD & Deployment

**Hosting:**
- Netlify (static site)
- Studio URL: `hq.benextglobal.com`
- Legacy URL: `futurohq.netlify.app` (referenced in CSP connect-src)
- Build config: `netlify.toml`
  - Build command: `npm run build`
  - Publish directory: `dist`
  - Node version: `20.19.0`

**Sanity Deploy:**
- `sanity deploy` command available (deploys to Sanity-hosted studio)
- App ID: `brard4oo9dkswctzj5pla8uh` in `sanity.cli.ts`

**CI Pipeline:**
- No `.github/` directory detected
- No CI configuration files found
- Deployment appears to be triggered via Netlify's git integration or manual `sanity deploy`

## Environment Configuration

**Required env vars:**

| Variable | Purpose | Used In |
|----------|---------|---------|
| `SANITY_STUDIO_NETLIFY_BUILD_HOOK_URL` | Netlify deploy trigger (POST webhook) | `components/actions/TriggerDeployAction.ts` |
| `SANITY_STUDIO_SOCIAL_WEBHOOK_URL` | Social media automation (Make.com) | `components/actions/SocialDistributeAction.ts` |
| `SANITY_STUDIO_AI_ENDPOINT` | AI derivatives generation | `components/actions/GenerateAIDerivativesAction.ts` |
| `AI_SEO_GENERATOR_ENDPOINT` | SEO metadata generation | `components/utils/fetchSeoSuggestion.ts` |
| `SANITY_STUDIO_FAVICON_VERSION` | Cache-busting favicon version | Optional |

**Env var access pattern:**
- Studio actions use `process.env.SANITY_STUDIO_*` (Sanity exposes `SANITY_STUDIO_` prefixed vars to client)
- `AI_SEO_GENERATOR_ENDPOINT` does NOT use the `SANITY_STUDIO_` prefix -- may not be available in production builds (potential issue)
- All actions gracefully degrade when env vars are missing (return `null` or disable button)

**Secrets location:**
- `.env.local` (git-ignored, local development)
- Netlify environment variables (production)

## Webhooks & Callbacks

**Outgoing (from Studio):**

1. **Netlify Build Hook**
   - Trigger: User clicks "Deploy to Sites" action on governed document types
   - Endpoint: `SANITY_STUDIO_NETLIFY_BUILD_HOOK_URL`
   - Method: POST (empty body, fire-and-forget)
   - File: `components/actions/TriggerDeployAction.ts`

2. **Social Distribution (Make.com)**
   - Trigger: User clicks "Distribute to Social" on publishable content types (`essay`, `video`, `podcastEpisode`, `opEd`, `curatedPost`)
   - Endpoint: `SANITY_STUDIO_SOCIAL_WEBHOOK_URL`
   - Method: POST with JSON payload
   - Payload fields: `_id`, `_type`, `title`, `excerpt`, `slug`, `narrativeOwner`, `postingEntity`, `language`, `coverImage`, `surfaceOn`, `socialTargets`, `ai_derivatives`
   - File: `components/actions/SocialDistributeAction.ts`

3. **AI Derivatives**
   - Trigger: User clicks "Generate AI Derivatives" on content with body/description/excerpt
   - Endpoint: `SANITY_STUDIO_AI_ENDPOINT`
   - Method: POST with JSON payload
   - File: `components/actions/GenerateAIDerivativesAction.ts`

4. **AI SEO Generation**
   - Trigger: User clicks "Generate" button in SEO field input
   - Endpoint: `AI_SEO_GENERATOR_ENDPOINT`
   - Method: POST with full document + field path
   - File: `components/utils/fetchSeoSuggestion.ts`

**Incoming:**
- None (Studio is a client-side SPA with no server endpoints)

**Sanity-side webhooks (documented in `sanity.config.ts` comments):**
- Configured via Sanity Manage > API > Webhooks
- Events: `document.publish`, `document.update`
- Targets: Netlify build hook, Make.com scenario hook

## External Content Sources (Migration Scripts)

**RSS Feeds (used in one-time import scripts, not runtime):**
- `rss-parser` ^3.13.0
- `scripts/import-opeds-from-blog.ts` - Imports from BeNeXT blog RSS feed
- `scripts/import-podcastEpisodes.ts` - Imports from podcast RSS feed
- `scripts/import-tiktok-clips.ts` - Imports from TikTok RSS feed
- These are CLI scripts run via `tsx`, not part of the deployed studio

## Content Security Policy

**Allowed external origins (from `netlify.toml`):**
- `api.sanity.io`, `*.sanity.io` - Sanity API
- `sanity-cdn.com`, `core.sanity-cdn.com`, `modules.sanity-cdn.com` - Sanity CDN
- `cdn.sanity.io` - Asset CDN
- `fonts.googleapis.com`, `fonts.gstatic.com` - Google Fonts
- `plasmic.app`, `*.plasmic.app` - Plasmic (visual builder, referenced but not actively used in codebase)
- WebSocket connections to Sanity for real-time collaboration

---

*Integration audit: 2026-03-07*
