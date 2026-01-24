import { defineType, defineField } from 'sanity'
import { commonMeta } from './blocks/commonMeta'
import { governanceFields } from './blocks/governanceBlock'

export default defineType({
  name: 'podcast',
  title: 'Podcast Series',
  type: 'document',
  fields: [
    // --- Status ---
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          { title: 'Active', value: 'active' },
          { title: 'Archived', value: 'archived' },
        ],
      },
      initialValue: 'active',
    }),

    // --- Core ---
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
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
      options: {
        list: [
          { title: 'English', value: 'en' },
          { title: 'Spanish', value: 'es' },
          { title: 'Bilingual', value: 'bilingual' },
        ],
        layout: 'radio',
      },
      initialValue: 'en',
      description: 'Primary language of this podcast series',
    }),
    defineField({ name: 'description', title: 'Description', type: 'text' }),

    // --- Feeds ---
    defineField({
      name: 'rssFeedUrl',
      title: 'RSS Feed URL (Audio)',
      type: 'url',
      description: 'Paste Captivate RSS feed URL',
    }),
    defineField({
      name: 'youtubeChannelUrl',
      title: 'YouTube Playlist/Channel URL (Video)',
      type: 'url',
      description: 'Paste playlist or channel for video episodes',
    }),

    // --- Cover ---
    defineField({
      name: 'coverMedia',
      title: 'Cover Media',
      type: 'mediaBlock', // ✅ unified
    }),
    ...commonMeta,

    // --- Governance ---
    ...governanceFields,
  ],

  preview: {
    select: {
      title: 'title',
      subtitle: 'status',
      media: 'coverMedia.thumbnail',
    },
    prepare({ title, subtitle, media }) {
      return {
        title: title || 'Untitled Podcast',
        subtitle: subtitle || '—',
        media,
      }
    },
  },
})
