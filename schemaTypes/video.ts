import { defineType, defineField } from 'sanity'
import { governanceFields } from './blocks/governanceBlock'

export default defineType({
  name: 'video',
  title: 'Video',
  type: 'document',
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
    }),
    defineField({
      name: 'videoUrl',
      title: 'Video URL',
      type: 'url',
      validation: (Rule) => Rule.required(),
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
      name: 'publishDate',
      title: 'Publish Date',
      type: 'datetime',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'duration',
      title: 'Duration (seconds)',
      type: 'number',
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'tag' }] }],
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
    ...governanceFields,
  ],
})
