/**
 * BeNeXT Global HQ — Sanity Studio Configuration
 *
 * Ecosystem-aligned Civic Modern theme
 * AI Assist, Dashboard, Custom Actions & Badges
 *
 * Project: fo6n8ceo | Dataset: production
 */

import './styles.css'
import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {assist} from '@sanity/assist'
import {scheduledPublishing} from '@sanity/scheduled-publishing'
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

// Document types that have governance fields (show entity badges + custom actions)
const GOVERNED_TYPES = new Set([
  'essay',
  'video',
  'podcast',
  'podcastEpisode',
  'opEd',
  'curatedPost',
  'socialPost',
  'project',
  'futuroSummit',
  'person',
  'alumni',
  'collaborator',
  'alumniDream',
  'alumniConversation',
  'projectUpdate',
])

// Types with language field
const BILINGUAL_TYPES = new Set(['essay', 'video', 'podcastEpisode', 'opEd'])

/**
 * Webhook reminders:
 * - Configure Sanity Manage > API > Webhooks to POST document.publish/document.update events to:
 *   - Netlify build hook: process.env.SANITY_STUDIO_NETLIFY_BUILD_HOOK_URL
 *   - Make scenario hook: process.env.SANITY_STUDIO_SOCIAL_WEBHOOK_URL
 * - Add these to .env.local (never commit)
 */

export default defineConfig({
  name: 'default',
  title: 'BeNeXT Global HQ',
  projectId: 'fo6n8ceo',
  dataset: 'production',
  theme: customTheme,

  plugins: [
    structureTool({structure: deskStructure}),
    visionTool(),
    assist(),
    scheduledPublishing(),
    media(),
  ],

  schema: {types: schemaTypes},

  // ---------------------------------------------------------------------------
  // Custom Studio Components
  // ---------------------------------------------------------------------------
  studio: {
    components: {
      logo: StudioLogo,
      navbar: MyNavbar,
      head: StudioHead,
    },
  },

  // ---------------------------------------------------------------------------
  // Custom Tools — Dashboard
  // ---------------------------------------------------------------------------
  tools: (prev) => [
    {
      name: 'dashboard',
      title: 'Dashboard',
      component: DashboardLayout,
    },
    ...prev,
  ],

  // ---------------------------------------------------------------------------
  // Document Badges — Entity awareness at a glance
  // ---------------------------------------------------------------------------
  document: {
    badges: (prev, context) => {
      const badges = [...prev]

      if (GOVERNED_TYPES.has(context.schemaType)) {
        badges.push(EntityBadge)
        badges.push(PlatformTierBadge)
        badges.push(ArchivalBadge)
      }

      if (BILINGUAL_TYPES.has(context.schemaType)) {
        badges.push(LanguageBadge)
      }

      return badges
    },

    // -------------------------------------------------------------------------
    // Document Actions — Ecosystem-aware workflows
    // -------------------------------------------------------------------------
    actions: (prev, context) => {
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
})
