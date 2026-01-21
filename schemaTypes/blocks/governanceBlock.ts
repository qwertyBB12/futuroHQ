import {defineField} from 'sanity'

/**
 * Governance fields for content hierarchy and ownership
 * Import and spread into document schemas: ...governanceFields
 */
export const governanceFields = [
  // 1. Platform Tier - 4-tier content hierarchy
  defineField({
    name: 'platformTier',
    title: 'Platform Tier',
    type: 'string',
    options: {
      list: [
        {title: 'Canonical (Substack, Website)', value: 'canonical'},
        {title: 'Personal (YouTube, Podcast)', value: 'personal'},
        {title: 'Distribution (LinkedIn, Medium)', value: 'distribution'},
        {title: 'Institutional (BeNeXT, Futuro)', value: 'institutional'},
      ],
      layout: 'radio',
    },
    description: 'Content hierarchy tier: Canonical > Personal > Distribution > Institutional',
  }),

  // 2. Archival Status - Ephemeral vs permanent content
  defineField({
    name: 'archivalStatus',
    title: 'Archival Status',
    type: 'string',
    options: {
      list: [
        {title: 'Ephemeral (temporary, social-first)', value: 'ephemeral'},
        {title: 'Archival (permanent, evergreen)', value: 'archival'},
        {title: 'Alumni-Only (restricted access)', value: 'alumni-only'},
      ],
      layout: 'radio',
    },
    initialValue: 'ephemeral',
    description: 'Determines content lifespan and accessibility',
  }),

  // 3. Narrative Owner - Individual vs institutional voice
  defineField({
    name: 'narrativeOwner',
    title: 'Narrative Owner',
    type: 'string',
    options: {
      list: [
        {title: 'Hector (Personal Voice)', value: 'hector'},
        {title: 'BeNeXT (Institutional)', value: 'benext'},
        {title: 'Futuro (Program)', value: 'futuro'},
        {title: 'NeXT (Platform)', value: 'next'},
        {title: 'Mitikah (Advisory)', value: 'mitikah'},
        {title: 'Medikah (Healthcare)', value: 'medikah'},
      ],
      layout: 'dropdown',
    },
    description: 'Who owns the narrative voice of this content',
  }),

  // 4. Conversion Tracking - TikTok-to-Substack funnel
  defineField({
    name: 'conversionTracking',
    title: 'Conversion Tracking',
    type: 'object',
    fields: [
      {
        name: 'sourceChannel',
        title: 'Source Channel',
        type: 'string',
        options: {
          list: [
            {title: 'TikTok', value: 'tiktok'},
            {title: 'Instagram Reels', value: 'reels'},
            {title: 'YouTube Shorts', value: 'youtube-shorts'},
            {title: 'X/Twitter', value: 'x'},
            {title: 'LinkedIn', value: 'linkedin'},
            {title: 'Other', value: 'other'},
          ],
        },
      },
      {
        name: 'destinationAction',
        title: 'Destination Action',
        type: 'string',
        options: {
          list: [
            {title: 'Substack Subscribe', value: 'substack-subscribe'},
            {title: 'YouTube Subscribe', value: 'youtube-subscribe'},
            {title: 'Podcast Follow', value: 'podcast-follow'},
            {title: 'Website Visit', value: 'website-visit'},
            {title: 'Newsletter Signup', value: 'newsletter-signup'},
            {title: 'Application Submit', value: 'application-submit'},
          ],
        },
      },
      {
        name: 'conversionRate',
        title: 'Conversion Rate (%)',
        type: 'number',
        validation: (Rule) => Rule.min(0).max(100),
      },
      {
        name: 'utmCampaign',
        title: 'UTM Campaign',
        type: 'string',
        description: 'Campaign identifier for tracking',
      },
      {
        name: 'ctaUsed',
        title: 'CTA Used',
        type: 'string',
        description: 'The call-to-action that drove conversion',
      },
    ],
    description: 'Track conversion paths from discovery to engagement',
  }),

  // 5. Posting Entity - Personal vs institutional posts
  defineField({
    name: 'postingEntity',
    title: 'Posting Entity',
    type: 'string',
    options: {
      list: [
        {title: 'Hector Personal', value: 'hector-personal'},
        {title: 'BeNeXT Institutional', value: 'benext-institutional'},
        {title: 'Futuro Program', value: 'futuro-program'},
        {title: 'Mitikah Advisory', value: 'mitikah-advisory'},
      ],
      layout: 'radio',
    },
    description: 'Which entity/account is posting this content',
  }),
]
