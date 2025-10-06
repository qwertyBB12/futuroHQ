import { defineType, defineField } from 'sanity'

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

    // --- Narrative & SEO ---
    defineField({ name: 'narrative', title: 'Narrative Development', type: 'narrativeBlock' }),
    defineField({ name: 'seo', title: 'SEO', type: 'seoBlock' }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'platform', media: 'media.0.thumbnail' },
    prepare({ title, subtitle, media }) {
      return { title: title || 'Untitled Social Post', subtitle: subtitle || '—', media }
    }
  }
})