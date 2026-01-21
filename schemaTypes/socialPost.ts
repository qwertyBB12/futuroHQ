import { defineType, defineField } from 'sanity'
import { governanceFields } from './blocks/governanceBlock'

export default defineType({
  name: 'socialPost',
  title: 'Social Post (Original)',
  type: 'document',
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
    select: { title: 'title', subtitle: 'platform', media: 'media.0.thumbnail' },
    prepare({ title, subtitle, media }) {
      return { title: title || 'Untitled Social Post', subtitle: subtitle || '—', media }
    }
  }
})
