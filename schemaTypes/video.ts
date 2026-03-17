import { defineType, defineField } from 'sanity'
import { governanceFields } from './blocks/governanceBlock'
import {surfaceOnField} from './blocks/surfaceOnField'
import {featuredInField} from './blocks/featuredInField'

export default defineType({
  name: 'video',
  title: 'Video',
  type: 'document',
  description:
    'Video content — reflections, interviews, documentaries. ' +
    'Default narrativeOwner: "hector". Default platformTier: "canonical". Default archivalStatus: "archival". ' +
    'Supports bilingual (en/es) with conditional Spanish title/description fields. ' +
    'videoFormat determines longform vs shortform. contentCategory determines site section placement. ' +
    'Keynote speeches use the dedicated keynote type, not video.',
  initialValue: {
    narrativeOwner: 'hector',
    platformTier: 'canonical',
    archivalStatus: 'archival',
    videoSource: 'b2',
  },
  groups: [
    {name: 'distribution', title: 'Distribution'},
    {name: 'storage', title: 'B2/Bunny Storage'},
  ],
  fields: [
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
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'language',
      title: 'Language',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        list: [
          { title: 'English', value: 'en' },
          { title: 'Spanish', value: 'es' },
        ],
        layout: 'grid',
      },
      initialValue: ['en'],
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: 'titleEs',
      title: 'Title (Spanish)',
      type: 'string',
      description: 'Spanish title for bilingual videos',
      hidden: ({ document }) => !document?.language || !(document.language as string[]).includes('es'),
    }),
    defineField({
      name: 'descriptionEs',
      title: 'Description (Spanish)',
      type: 'text',
      description: 'Spanish description for bilingual videos',
      hidden: ({ document }) => !document?.language || !(document.language as string[]).includes('es'),
    }),
    defineField({
      name: 'videoFormat',
      title: 'Video Format',
      type: 'string',
      options: {
        list: [
          { title: 'Longform', value: 'longform' },
          { title: 'Shortform', value: 'shortform' },
        ],
        layout: 'radio',
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'videoSource',
      title: 'Video Source',
      type: 'string',
      description: 'Where this video is hosted. New videos default to B2/Bunny CDN.',
      options: {
        list: [
          {title: 'Wistia (Legacy)', value: 'wistia'},
          {title: 'B2/Bunny CDN', value: 'b2'},
        ],
        layout: 'radio',
      },
      initialValue: 'b2',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'platform',
      title: 'Platform',
      type: 'string',
      options: {
        list: [
          { title: 'YouTube', value: 'YouTube' },
          { title: 'TikTok', value: 'TikTok' },
          { title: 'Instagram Reels', value: 'Instagram Reels' },
          { title: 'LinkedIn', value: 'LinkedIn' },
        ],
      },
      hidden: ({document}) => document?.videoSource === 'b2',
    }),
    defineField({
      name: 'videoUrl',
      title: 'Video URL',
      type: 'url',
      hidden: ({document}) => document?.videoSource === 'b2',
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const doc = context?.document
          // Required for wistia or null (existing docs without videoSource)
          if (doc?.videoSource !== 'b2' && !value) {
            return 'Video URL is required for Wistia videos'
          }
          return true
        }),
    }),
    defineField({
      name: 'b2Key',
      title: 'B2 Object Key',
      type: 'string',
      description: 'Full path in B2 bucket (e.g., videos/2026/my-video.mp4)',
      group: 'storage',
      hidden: ({document}) => document?.videoSource !== 'b2',
    }),
    defineField({
      name: 'cdnUrl',
      title: 'Bunny CDN URL',
      type: 'url',
      description: 'Public CDN URL for video playback (e.g., https://cdn.benextglobal.com/videos/...)',
      group: 'storage',
      hidden: ({document}) => document?.videoSource !== 'b2',
    }),
    defineField({
      name: 'resolution',
      title: 'Resolution',
      type: 'string',
      description: 'Video resolution (e.g., 1080p, 4K)',
      options: {
        list: [
          {title: '720p', value: '720p'},
          {title: '1080p', value: '1080p'},
          {title: '1440p (2K)', value: '1440p'},
          {title: '2160p (4K)', value: '2160p'},
        ],
      },
      group: 'storage',
      hidden: ({document}) => document?.videoSource !== 'b2',
    }),
    defineField({
      name: 'thumbnailUrl',
      title: 'CDN Thumbnail URL',
      type: 'url',
      description: 'Bunny CDN URL for video thumbnail (auto-generated by pipeline or manual)',
      group: 'storage',
      hidden: ({document}) => document?.videoSource !== 'b2',
    }),
    defineField({
      name: 'thumbnailImage',
      title: 'Thumbnail Image',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
    }),
    defineField({
      name: 'contentCategory',
      title: 'Content Category',
      type: 'string',
      description: 'Determines which section this video appears in on hectorhlopez.com',
      options: {
        list: [
          { title: 'Reflection', value: 'reflection' },
          { title: 'Interview', value: 'interview' },
          { title: 'Documentary', value: 'documentary' },
        ],
        layout: 'radio',
      },
      initialValue: 'reflection',
    }),
    defineField({
      name: 'publishDate',
      title: 'Publish Date',
      type: 'datetime',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'duration',
      title: 'Duration (seconds)',
      type: 'number',
      group: 'storage',
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'tag' }] }],
    }),
    featuredInField,
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seoBlock',
    }),
    defineField({
      name: 'legacyVlog',
      title: 'Legacy Vlog Data',
      type: 'object',
      readOnly: true,
      options: { collapsible: true, collapsed: true },
      fields: [
        defineField({
          name: 'aiDerivatives',
          title: 'AI Derivatives',
          type: 'object',
          fields: [
            defineField({ name: 'summary', title: 'Summary', type: 'text' }),
            defineField({
              name: 'quotes',
              title: 'Quotes',
              type: 'array',
              of: [{ type: 'string' }],
            }),
            defineField({
              name: 'captions',
              title: 'Captions',
              type: 'array',
              of: [{ type: 'string' }],
            }),
          ],
        }),
        defineField({
          name: 'analytics',
          title: 'Analytics',
          type: 'object',
          fields: [
            defineField({ name: 'likes', title: 'Likes', type: 'number' }),
            defineField({ name: 'shares', title: 'Shares', type: 'number' }),
            defineField({ name: 'views', title: 'Views', type: 'number' }),
            defineField({ name: 'source', title: 'Source', type: 'string' }),
          ],
        }),
        defineField({
          name: 'channelRef',
          title: 'Channel Owner',
          type: 'reference',
          to: [{ type: 'collaborator' }, { type: 'person' }],
        }),
        defineField({
          name: 'channelType',
          title: 'Channel',
          type: 'string',
        }),
        defineField({
          name: 'contentFormat',
          title: 'Content Format',
          type: 'string',
        }),
        defineField({
          name: 'distribution',
          title: 'Distribution URLs',
          type: 'array',
          of: [{ type: 'url' }],
        }),
        defineField({
          name: 'gallery',
          title: 'Gallery',
          type: 'array',
          of: [{ type: 'mediaBlock' }, { type: 'image' }],
        }),
        defineField({
          name: 'language',
          title: 'Language',
          type: 'string',
        }),
        defineField({
          name: 'narrative',
          title: 'Narrative',
          type: 'narrativeBlock',
        }),
        defineField({
          name: 'order',
          title: 'Order',
          type: 'number',
        }),
        defineField({
          name: 'originalId',
          title: 'Original ID',
          type: 'string',
        }),
        defineField({
          name: 'publish',
          title: 'Publish',
          type: 'boolean',
        }),
        defineField({
          name: 'publishedAt',
          title: 'Published At',
          type: 'datetime',
        }),
        defineField({
          name: 'seo',
          title: 'SEO',
          type: 'seoBlock',
        }),
        defineField({
          name: 'updatedAt',
          title: 'Updated At',
          type: 'datetime',
        }),
        defineField({
          name: 'video',
          title: 'Legacy Video',
          type: 'mediaBlock',
        }),
        defineField({
          name: 'videoUrl',
          title: 'Legacy Video URL',
          type: 'url',
        }),
        defineField({
          name: 'tags',
          title: 'Legacy Tags',
          type: 'array',
          of: [{ type: 'string' }],
        }),
        defineField({
          name: 'tags_ref',
          title: 'Legacy Tags (ref)',
          type: 'array',
          of: [{ type: 'reference', to: [{ type: 'tag' }] }],
        }),
      ],
    }),
    surfaceOnField,
    ...governanceFields,
  ],
  preview: {
    select: {
      title: 'title',
      date: 'publishDate',
      format: 'videoFormat',
      category: 'contentCategory',
      media: 'thumbnailImage',
    },
    prepare({ title, date, format, category, media }) {
      const dateStr = date ? new Date(date).toLocaleDateString() : ''
      const labels = [format, category].filter(Boolean).join(' · ')
      return {
        title: title || 'Untitled Video',
        subtitle: [labels, dateStr].filter(Boolean).join(' — '),
        media,
      }
    },
  },
})
