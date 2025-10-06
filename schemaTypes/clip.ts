import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'clip',
  title: 'Clip',
  type: 'document',
  fields: [
    // --- Publish toggle pinned at top ---
    defineField({
      name: 'publish',
      title: 'Publish?',
      type: 'boolean',
      initialValue: true,
      description: 'Toggle to control if this clip is visible across ecosystem'
    }),

    // --- Core ---
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
    }),

    // --- Media ---
    defineField({
      name: 'clipMedia',
      title: 'Clip Media',
      type: 'mediaBlock',
      description: 'Attach the media asset for this clip (video, audio, image)',
    }),

    // --- Metadata ---
    defineField({
      name: 'platforms',
      title: 'Published Platforms',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Where this clip has been distributed (TikTok, Reels, YouTube Shorts, etc.)'
    }),
    defineField({
      name: 'order',
      title: 'Order',
      type: 'number',
      description: 'Sort order for display priority',
    }),

    // --- SEO ---
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seoBlock',
    }),
  ],

  preview: {
    select: { 
      title: 'title', 
      subtitle: 'description', 
      mediaBlockThumb: 'clipMedia.thumbnail',
      mediaImage: 'clipMedia.asset'
    },
    prepare({ title, subtitle, mediaBlockThumb, mediaImage }) {
      return {
        title: title || 'Untitled Clip',
        subtitle: subtitle || '—',
        media: mediaBlockThumb || mediaImage || undefined,
      }
    }
  }
})