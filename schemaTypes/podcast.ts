import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'podcast',
  title: 'Podcast Series',
  type: 'document',
  fields: [
    // --- Publish toggle pinned at top ---
    defineField({
      name: 'publish',
      title: 'Publish?',
      type: 'boolean',
      initialValue: true,
      description: 'Toggle to control if this podcast is visible across ecosystem',
    }),

    // --- Order for manual prioritization ---
    defineField({
      name: 'order',
      title: 'Order',
      type: 'number',
      description: 'Controls manual ordering across lists',
    }),

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