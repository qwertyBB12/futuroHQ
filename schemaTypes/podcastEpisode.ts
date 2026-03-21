import { defineType, defineField } from 'sanity'
import { commonMeta } from './blocks/commonMeta'
import { governanceFields } from './blocks/governanceBlock'
import {surfaceOnField} from './blocks/surfaceOnField'
import {featuredInField} from './blocks/featuredInField'
import { transcriptFields, transcriptGroup } from './blocks/transcriptBlock'

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
    transcriptGroup,
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
    featuredInField,

    // --- Audio + Video ---
    defineField({
      name: 'audioEmbed',
      title: 'Audio Embed',
      type: 'mediaBlock',
      description: 'Usually Captivate.fm / RSS',
    }),
    defineField({
      name: 'externalLinks',
      title: 'External Platform Links',
      type: 'array',
      description: 'Links to this episode on external platforms (Spotify, Apple Podcasts, etc.)',
      group: 'distribution',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'platform',
              title: 'Platform',
              type: 'string',
              options: {
                list: [
                  { title: 'Spotify', value: 'spotify' },
                  { title: 'Apple Podcasts', value: 'apple' },
                  { title: 'Google Podcasts', value: 'google' },
                  { title: 'YouTube', value: 'youtube' },
                  { title: 'Amazon Music', value: 'amazon' },
                  { title: 'Captivate', value: 'captivate' },
                  { title: 'Other', value: 'other' },
                ],
              },
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'url',
              title: 'URL',
              type: 'url',
              validation: (Rule) => Rule.required(),
            }),
          ],
          preview: {
            select: { title: 'platform', subtitle: 'url' },
          },
        },
      ],
    }),
    defineField({
      name: 'videoEmbed',
      title: 'Video Embed',
      type: 'mediaBlock',
      description: 'YouTube / Vimeo / Wistia',
    }),
    ...transcriptFields,

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
