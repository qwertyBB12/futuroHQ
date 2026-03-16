import { defineType, defineField } from 'sanity'
import { commonMeta } from './blocks/commonMeta'
import { governanceFields } from './blocks/governanceBlock'
import {surfaceOnField} from './blocks/surfaceOnField'

export default defineType({
  name: 'podcastEpisode',
  title: 'Podcast Episode',
  type: 'document',
  description:
    'Individual podcast episode within a series. ' +
    'Default narrativeOwner: "hector". Default platformTier: "canonical". Default archivalStatus: "archival". ' +
    'Supports bilingual (en/es). Include episode number, season number, and duration. ' +
    'audioEmbed is the primary player (Captivate/RSS). videoEmbed is optional (YouTube/Vimeo). ' +
    'Reference the parent podcast series via the series field.',
  groups: [
    {name: 'distribution', title: 'Distribution'},
  ],
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
      options: {
        list: [
          { title: 'English', value: 'en' },
          { title: 'Spanish', value: 'es' },
        ],
        layout: 'radio',
      },
      initialValue: 'en',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
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
    // --- SEO ---
    defineField({ name: 'seo', title: 'SEO', type: 'seoBlock' }),

    ...commonMeta,
    surfaceOnField,

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
