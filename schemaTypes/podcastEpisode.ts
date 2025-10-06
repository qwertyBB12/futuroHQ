import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'podcastEpisode',
  title: 'Podcast Episode',
  type: 'document',
  fields: [
    // --- Publish toggle pinned at top ---
    defineField({
      name: 'publish',
      title: 'Publish?',
      type: 'boolean',
      initialValue: true,
      description: 'Toggle to control if this episode is visible across ecosystem',
    }),

    // --- Order for manual prioritization ---
    defineField({
      name: 'order',
      title: 'Order',
      type: 'number',
      description: 'Controls manual ordering across lists (e.g. override chronological)',
    }),

    // --- Core ---
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({ name: 'description', title: 'Description', type: 'text' }),
    defineField({ name: 'pubDate', title: 'Publish Date', type: 'datetime' }),

    // --- Audio + Video ---
    defineField({
      name: 'audioEmbed',
      title: 'Audio Embed',
      type: 'mediaBlock',
      description: 'Usually Captivate.fm / RSS',
    }),
    defineField({
      name: 'videoEmbed',
      title: 'Video Embed',
      type: 'mediaBlock',
      description: 'YouTube / Vimeo / Wistia',
    }),

    // --- Relations ---
    defineField({
      name: 'series',
      title: 'Podcast Series',
      type: 'reference',
      to: [{ type: 'podcast' }],
    }),
  ],

  preview: {
    select: {
      title: 'title',
      subtitle: 'pubDate',
      media: 'videoEmbed.thumbnail', // fallback to audio if no video
    },
    prepare({ title, subtitle, media }) {
      return {
        title: title || 'Untitled Episode',
        subtitle: subtitle ? new Date(subtitle).toLocaleDateString() : '—',
        media,
      }
    },
  },
})