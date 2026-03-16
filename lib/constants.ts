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
  'project', 'futuroSummit', 'alumni', 'alumniContinuum',
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
