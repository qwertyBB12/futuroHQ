import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'vlog',
  title: 'Vlog',
  type: 'document',
  fields: [
    // --- Publish toggle (pinned) ---
    defineField({
      name: 'publish',
      title: 'Publish?',
      type: 'boolean',
      initialValue: true,
      description: 'Toggle to control if this vlog is visible across the ecosystem',
    }),

    // --- Ordering ---
    defineField({
      name: 'order',
      title: 'Order',
      type: 'number',
      description: 'Use lower numbers to pin/feature higher on lists',
    }),

    // --- Core ---
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
    }),
    defineField({
      name: 'language',
      title: 'Language',
      type: 'string',
      options: { list: ['English', 'Spanish'] },
    }),
    defineField({
      name: 'channelType',
      title: 'Channel',
      type: 'string',
      options: {
        list: [
          { title: 'Hector (Personal)', value: 'personal' },
          { title: 'BeNeXT Global', value: 'benext' },
          { title: 'Futuro', value: 'futuro' },
          { title: 'Mitikah', value: 'mitikah' },
          { title: 'Other', value: 'other' },
        ]
      },
      description: 'Where this vlog primarily publishes/appears',
    }),
    defineField({
      name: 'channelRef',
      title: 'Channel Owner (optional)',
      type: 'reference',
      to: [{ type: 'collaborator' }, { type: 'person' }],
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
    }),
    defineField({
      name: 'datePublished',
      title: 'Publish Date',
      type: 'datetime',
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'string' }],
    }),

    // --- Media ---
    defineField({
      name: 'video',
      title: 'Vlog Video (primary)',
      type: 'mediaBlock',
      description: 'Main video for this vlog (YouTube / Wistia / Vimeo / custom embed)',
    }),
    defineField({
      name: 'videoUrl',
      title: 'Platform URL',
      type: 'url',
      description: 'Direct URL to this vlog (e.g. YouTube link)',
    }),
    defineField({
      name: 'gallery',
      title: 'Gallery (optional)',
      type: 'array',
      of: [{ type: 'mediaBlock' }, { type: 'image' }],
      description: 'Any supporting clips or images',
    }),

    // --- Narrative & SEO (shared blocks) ---
    defineField({
      name: 'narrative',
      title: 'Narrative Development',
      type: 'narrativeBlock',
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seoBlock',
    }),
  ],

  preview: {
    select: { title: 'title', subtitle: 'channelType', media: 'video.thumbnail' },
    prepare({ title, subtitle, media }) {
      return {
        title: title || 'Untitled Vlog',
        subtitle: subtitle || '—',
        media,
      }
    }
  }
})