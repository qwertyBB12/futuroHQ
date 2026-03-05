import { defineType, defineField } from 'sanity'
import { governanceFields } from './blocks/governanceBlock'

export default defineType({
  name: 'socialPost',
  title: 'Social Post',
  type: 'document',
  description:
    'Social media variations derived from canonical source content (essays, podcasts, videos). ' +
    'Every socialPost MUST reference a sourceDocument — social posts do not exist independently. ' +
    'Default narrativeOwner: inherit from the source document. ' +
    'Default platformTier: "distribution". Default archivalStatus: "ephemeral". ' +
    'Set targetPlatform to the specific platform this variation is for. ' +
    'Each platform variation should offer a DIFFERENT angle on the source — a different question, a different pull quote, a different framing. Not the same text trimmed to different lengths. ' +
    'postingEntity is determined by narrativeOwner: "hector" → personal accounts, "benext"/"futuro" → BeNeXT institutional accounts. ' +
    'No countdown timers, scarcity tactics, or desperate CTAs. Ever. Threshold logic: create recognition, not urgency. ' +
    'The 5-Year Test: Would Héctor be proud of this post in 2030?',
  initialValue: {
    narrativeOwner: 'hector',
    platformTier: 'distribution',
    archivalStatus: 'ephemeral',
  },
  fields: [
    // --- Visibility & order ---
    defineField({ name: 'publish', title: 'Publish?', type: 'boolean', initialValue: true }),
    defineField({ name: 'order', title: 'Order', type: 'number' }),

    // --- Core ---
    defineField({
      name: 'platform',
      title: 'Platform',
      type: 'string',
      options: { list: ['LinkedIn', 'X', 'Instagram', 'TikTok', 'Facebook', 'YouTube', 'Other'] }
    }),
    defineField({
      name: 'author',
      title: 'Author',
      type: 'reference',
      to: [{ type: 'person' }, { type: 'alumni' }, { type: 'ledgerPerson' }, { type: 'collaborator' }],
    }),
    defineField({ name: 'title', title: 'Title / Hook', type: 'string' }),
    defineField({ name: 'body', title: 'Caption / Body', type: 'text' }),

    // --- Source & Distribution Pipeline ---
    defineField({
      name: 'sourceDocument',
      title: 'Source Content',
      type: 'reference',
      to: [{ type: 'essay' }, { type: 'video' }, { type: 'podcast' }, { type: 'podcastEpisode' }],
      description: 'The canonical content this social post promotes',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'targetPlatform',
      title: 'Target Platform',
      type: 'string',
      options: {
        list: [
          { title: 'LinkedIn', value: 'linkedin' },
          { title: 'Facebook', value: 'facebook' },
          { title: 'Instagram', value: 'instagram' },
          { title: 'TikTok', value: 'tiktok' },
          { title: 'YouTube (Community)', value: 'youtube' },
          { title: 'X / Twitter', value: 'x' },
        ],
        layout: 'radio',
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'postBody',
      title: 'Post Content',
      type: 'text',
      description: 'Platform-formatted text content',
      rows: 6,
    }),
    defineField({
      name: 'hashtags',
      title: 'Hashtags',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'distributionStatus',
      title: 'Distribution Status',
      type: 'string',
      options: {
        list: [
          { title: 'Draft (not yet posted)', value: 'draft' },
          { title: 'Queued', value: 'queued' },
          { title: 'Posted', value: 'posted' },
          { title: 'Failed', value: 'failed' },
        ],
      },
      initialValue: 'draft',
    }),
    defineField({
      name: 'postedUrl',
      title: 'Posted URL',
      type: 'url',
      description: 'The live URL of the post after distribution',
      readOnly: true,
    }),
    defineField({
      name: 'postedAt',
      title: 'Posted At',
      type: 'datetime',
      readOnly: true,
    }),

    // --- Media ---
    defineField({
      name: 'media',
      title: 'Attached Media',
      type: 'array',
      of: [{ type: 'mediaBlock' }, { type: 'image' }],
    }),

    // --- Dates ---
    defineField({ name: 'datePublished', title: 'Publish Date', type: 'datetime' }),
    defineField({
      name: 'scheduledDate',
      title: 'Scheduled Date',
      type: 'datetime',
      description: 'Optional — when this post is planned to go live',
    }),

    // --- Metadata ---
    defineField({
      name: 'postUrl',
      title: 'Post URL',
      type: 'url',
      description: 'Link to the live post on the chosen platform',
    }),
    defineField({
      name: 'tagsOrHandles',
      title: 'Hashtags / Handles',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({ name: 'tags', title: 'Tags', type: 'array', of: [{ type: 'string' }] }),
    defineField({
      name: 'tags_ref',
      title: 'Tags (ref)',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'tag' }] }],
      description: 'Reusable tag references (keep legacy string tags during migration)',
    }),

    // --- Narrative & SEO ---
    defineField({ name: 'narrative', title: 'Narrative Development', type: 'narrativeBlock' }),
    defineField({ name: 'seo', title: 'SEO', type: 'seoBlock' }),

    // --- Governance ---
    ...governanceFields,

    // --- Institutional Post Context (conditional on postingEntity) ---
    defineField({
      name: 'institutionalContext',
      title: 'Institutional Context',
      type: 'object',
      hidden: ({ parent }) => !parent?.postingEntity || parent?.postingEntity === 'hector-personal',
      description: 'Additional context for institutional posts',
      fields: [
        {
          name: 'approvalStatus',
          title: 'Approval Status',
          type: 'string',
          options: {
            list: [
              { title: 'Draft', value: 'draft' },
              { title: 'Pending Review', value: 'pending-review' },
              { title: 'Approved', value: 'approved' },
              { title: 'Rejected', value: 'rejected' },
            ],
            layout: 'radio',
          },
        },
        {
          name: 'approvedBy',
          title: 'Approved By',
          type: 'reference',
          to: [{ type: 'person' }],
        },
        {
          name: 'campaignId',
          title: 'Campaign ID',
          type: 'string',
          description: 'Internal campaign or initiative identifier',
        },
        {
          name: 'complianceNotes',
          title: 'Compliance Notes',
          type: 'text',
          description: 'Any legal/compliance considerations for this post',
        },
      ],
    }),
  ],
  preview: {
    select: {
      title: 'title',
      targetPlatform: 'targetPlatform',
      platform: 'platform',
      status: 'distributionStatus',
      media: 'media.0.thumbnail',
    },
    prepare({ title, targetPlatform, platform, status, media }) {
      const plat = targetPlatform || platform || '—'
      const sub = status ? `${plat} · ${status}` : plat
      return { title: title || 'Untitled Social Post', subtitle: sub, media }
    }
  }
})
