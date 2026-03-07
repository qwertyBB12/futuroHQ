# Technology Stack

**Analysis Date:** 2026-03-07

## Languages

**Primary:**
- TypeScript 5.8 - All schema definitions, components, actions, badges, dashboard widgets
- CSS - Global theming (`styles.css`), Civic Modern liquid glass design system

**Secondary:**
- JavaScript (CommonJS) - Build scripts (`scripts/postbuild.js`, `scripts/postinstall.js`), config files (`tailwind.config.js`, `postcss.config.js`)
- GROQ - Sanity query language used in dashboard widgets and preview components

## Runtime

**Environment:**
- Node.js 20.19.0 (pinned in `netlify.toml` build environment)
- Browser (React SPA) - Studio runs client-side after build

**Package Manager:**
- npm
- Lockfile: `package-lock.json` (present)

## Frameworks

**Core:**
- Sanity Studio v5.13.0 (`sanity` package) - Content management platform
- React 19.2.3 - UI rendering
- styled-components 6.1.18 - Required by Sanity's `@sanity/ui` internals

**CSS/Styling:**
- Tailwind CSS 4.1.14 - Utility classes, ecosystem color tokens
- PostCSS 8.5.6 - CSS processing pipeline
- LightningCSS 1.30.1 - CSS minification/transformation
- Autoprefixer 10.4.21 - Vendor prefixes

**Build/Dev:**
- Sanity CLI - `sanity dev`, `sanity build`, `sanity deploy`
- esbuild 0.25.10 - JavaScript bundling (used by Sanity build)
- Rollup 4.52.4 - Module bundling (used by Sanity build)
- tsx 4.20.6 - TypeScript execution for migration scripts

**Linting/Formatting:**
- ESLint 9.28 with `@sanity/eslint-config-studio` 5.0.2
- Prettier 3.5 - Inline config in `package.json`

## Key Dependencies

**Critical:**
- `sanity` ^5.13.0 - Core studio framework; defines schema, plugins, document actions, badges
- `@sanity/client` ^6.29.1 - Content Lake API client; used in dashboard widgets for GROQ queries
- `@sanity/vision` ^5.13.0 - GROQ query playground plugin
- `@sanity/assist` ^5.0.4 - AI Assist plugin (field-level AI generation with per-entity instructions)
- `sanity-plugin-media` ^4.1.1 - Asset management plugin with tagging/search

**Infrastructure:**
- `rss-parser` ^3.13.0 - RSS feed parsing for content import scripts (podcasts, op-eds, TikTok clips)
- `dotenv` ^16.6.1 - Environment variable loading for migration scripts

## Configuration

**TypeScript:**
- Config: `tsconfig.json`
- Target: ES2017
- Module: Preserve
- Strict mode enabled
- JSX: preserve (handled by bundler)

**Prettier (inline in `package.json`):**
- `semi: false`
- `printWidth: 100`
- `bracketSpacing: false`
- `singleQuote: true`

**Tailwind:**
- Config: `tailwind.config.js`
- PostCSS plugin: `@tailwindcss/postcss` in `postcss.config.js`
- Custom font families: `display` (Oswald), `body` (Mulish), `mono` (JetBrains Mono)
- Custom color tokens: `copper`, `vermillion`, `sandstone`, `archivalSlate`, `foundersBlack`, `midnight`

**Sanity Theme:**
- `theme.ts` - Wraps `buildLegacyTheme()` with Civic Modern palette
- `palettes.ts` - Token map (17 CSS custom properties: brand, buttons, states, navigation)
- `styles.css` - 400+ lines of CSS overrides for liquid glass aesthetic (backdrop-filter, radial gradients, custom scrollbars)

**Build:**
- Build command: `npm run build` (runs `sanity build && node ./scripts/postbuild.js`)
- `scripts/postbuild.js` - Strips Sanity core bridge `<script>` from `dist/index.html` to prevent duplicate React context warnings
- `scripts/postinstall.js` - Installs Linux x64 native modules (esbuild, rollup, lightningcss) when deploying on Netlify
- Output directory: `dist/`

**Environment:**
- `.env.local` present (contains secrets - not read)
- 5 env vars documented in CLAUDE.md (see INTEGRATIONS.md for details)

## Platform Requirements

**Development:**
- Node.js 20.x
- npm
- macOS or Linux

**Production:**
- Netlify (static site hosting)
- Deployed at: `hq.benextglobal.com`
- SPA routing: all paths redirect to `/index.html` (configured in `netlify.toml`)
- Content Security Policy headers configured in `netlify.toml` (allows Sanity CDN, Google Fonts, Plasmic)
- Sanity deployment app ID: `brard4oo9dkswctzj5pla8uh` (in `sanity.cli.ts`)

## Fonts

**Loaded via Google Fonts (in `styles.css`):**
- Oswald 300-700 - Headings, brand, navigation
- Mulish 300-800 (with italics) - Body, UI, buttons, badges
- JetBrains Mono 400-600 - Code, monospace elements

---

*Stack analysis: 2026-03-07*
