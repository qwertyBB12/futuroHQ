// components/MyNavbar.tsx
import './styles.css'
import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { schemaTypes } from './schemaTypes'
import { customTheme } from './theme'
import StudioLogo from './components/StudioLogo'
import MyNavbar from './components/MyNavbar'
import StudioHead from './components/StudioHead'
import deskStructure from './deskStructure'

/**
 * Webhook reminders:
 * - Configure Sanity Manage → API → Webhooks to POST `document.publish`/`document.update` events to:
 *   • Netlify build hook: `process.env.NETLIFY_BUILD_HOOK_URL`
 *   • Make scenario hook: `process.env.MAKE_SCENARIO_WEBHOOK_URL`
 * - Add these to `.env.local` (never commit):
 *   NETLIFY_BUILD_HOOK_URL=https://...
 *   MAKE_SCENARIO_WEBHOOK_URL=https://...
 */

export default defineConfig({
  name: 'default',
  title: 'BeNeXT Global HQ',
  projectId: 'fo6n8ceo',
  dataset: 'production',
  theme: customTheme,
  plugins: [structureTool({ structure: deskStructure }), visionTool()],
  schema: { types: schemaTypes },
  studio: {
    components: {
      logo: StudioLogo,
      navbar: MyNavbar,
      head: StudioHead,
    },
  },
})
