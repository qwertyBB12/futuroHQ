/**
 * BeNeXT Global HQ — Sanity Studio Configuration
 *
 * Ecosystem-aligned Civic Modern theme
 * AI Assist, Dashboard, Custom Actions & Badges
 * Dual-workspace: production + staging
 *
 * Project: fo6n8ceo | Datasets: production, staging
 */

import './styles.css'
import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {assist} from '@sanity/assist'
import {media} from 'sanity-plugin-media'
import {schemaTypes} from './schemaTypes'
import {customTheme} from './theme'
import StudioLogo from './components/StudioLogo'
import MyNavbar from './components/MyNavbar'
import StudioHead from './components/StudioHead'
import deskStructure from './deskStructure'
import DashboardLayout from './components/dashboard/DashboardLayout'

// Badges
import {EntityBadge} from './components/badges/EntityBadge'
import {PlatformTierBadge} from './components/badges/PlatformTierBadge'
import {LanguageBadge} from './components/badges/LanguageBadge'
import {ArchivalBadge} from './components/badges/ArchivalBadge'

// Actions
import {TriggerDeployAction} from './components/actions/TriggerDeployAction'
import {GenerateAIDerivativesAction} from './components/actions/GenerateAIDerivativesAction'
import {ArchiveAction} from './components/actions/ArchiveAction'
import {SocialDistributeAction} from './components/actions/SocialDistributeAction'
import {GOVERNED_TYPES, BILINGUAL_TYPES} from './lib/constants'

/**
 * Webhook reminders:
 * - Configure Sanity Manage > API > Webhooks to POST document.publish/document.update events to:
 *   - Netlify build hook: process.env.SANITY_STUDIO_NETLIFY_BUILD_HOOK_URL
 *   - Make scenario hook: process.env.SANITY_STUDIO_SOCIAL_WEBHOOK_URL
 * - Add these to .env.local (never commit)
 */

// ---------------------------------------------------------------------------
// Shared configuration — common to all workspaces
// ---------------------------------------------------------------------------
const sharedConfig = {
  theme: customTheme,
  icon: StudioLogo,

  plugins: [
    structureTool({structure: deskStructure}),
    visionTool(),
    assist(),
    media(),
  ],

  schema: {types: schemaTypes},

  // Custom Studio Components
  studio: {
    components: {
      logo: StudioLogo,
      navbar: MyNavbar,
      head: StudioHead,
    },
  },

  // Custom Tools — Dashboard
  tools: (prev: any) => [
    {
      name: 'dashboard',
      title: 'Dashboard',
      component: DashboardLayout,
    },
    ...prev,
  ],

  // Document Badges & Actions
  document: {
    badges: (prev: any, context: any) => {
      const badges = [...prev]

      if (GOVERNED_TYPES.has(context.schemaType)) {
        badges.push(EntityBadge)
        badges.push(PlatformTierBadge)
        badges.push(ArchivalBadge)
      }

      // Decision has standalone narrativeOwner (no full governance block)
      if (context.schemaType === 'decision') {
        badges.push(EntityBadge)
      }

      if (BILINGUAL_TYPES.has(context.schemaType)) {
        badges.push(LanguageBadge)
      }

      return badges
    },

    actions: (prev: any, context: any) => {
      const actions = [...prev]

      // Deploy action — available on all content types
      if (GOVERNED_TYPES.has(context.schemaType)) {
        actions.push(TriggerDeployAction)
        actions.push(GenerateAIDerivativesAction)
        actions.push(ArchiveAction)
      }

      // Social distribution — only on publishable content
      if (['essay', 'video', 'podcastEpisode', 'opEd', 'curatedPost'].includes(context.schemaType)) {
        actions.push(SocialDistributeAction)
      }

      return actions
    },
  },
}

// ---------------------------------------------------------------------------
// Dual-workspace config: production + staging
// ---------------------------------------------------------------------------
export default defineConfig([
  {
    ...sharedConfig,
    name: 'production',
    title: 'Autori Mandatum',
    projectId: 'fo6n8ceo',
    dataset: 'production',
    basePath: '/production',
  },
  {
    ...sharedConfig,
    name: 'staging',
    title: 'Autori Mandatum (Staging)',
    projectId: 'fo6n8ceo',
    dataset: 'staging',
    basePath: '/staging',
  },
])
