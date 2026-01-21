import { defineType, defineField } from 'sanity'
import { commonMeta } from './blocks/commonMeta'
import { governanceFields } from './blocks/governanceBlock'

export default defineType({
  name: 'podcastEpisode',
  title: 'Podcast Episode',
  type: 'document',
  fields: [
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
      description: 'URL path for the episode',
    }),
    defineField({ name: 'description', title: 'Description', type: 'text' }),
    defineField({ name: 'pubDate', title: 'Publish Date', type: 'datetime' }),
    defineField({
      name: 'episodeNumber',
      title: 'Episode Number',
      type: 'number',
    }),
    defineField({
      name: 'seasonNumber',
      title: 'Season Number',
      type: 'number',
    }),
    defineField({
      name: 'duration',
      title: 'Duration (HH:MM:SS)',
      type: 'string',
    }),
    defineField({
      name: 'language',
      title: 'Language',
      type: 'string',
      options: { list: ['English', 'Spanish'] },
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'tags_ref',
      title: 'Tags (ref)',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'tag' }] }],
    }),

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
    ...commonMeta,

    // --- Governance ---
    ...governanceFields,
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
