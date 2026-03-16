import {defineType, defineField} from 'sanity'
import {governanceFields} from './blocks/governanceBlock'
import {surfaceOnField} from './blocks/surfaceOnField'

export default defineType({
  name: 'keynote',
  title: 'Keynote',
  type: 'document',
  description:
    'The canonical representation of a keynote speech or major presentation — the hub connecting all formats (video, essay, podcast). ' +
    'Default narrativeOwner: "hector". Default platformTier: "canonical". Default archivalStatus: "archival". ' +
    'Venue and date are required. Category classifies the type: commencement, conference, institutional, panel, workshop. ' +
    'Use linkedVideo, linkedEssay, and linkedPodcastEpisode to connect related content. ' +
    'Featured keynotes surface on hectorhlopez.com/keynotes.',
  groups: [
    {name: 'distribution', title: 'Distribution'},
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required().min(2).max(200),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'title', maxLength: 96},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'venue',
      title: 'Venue',
      type: 'string',
      description: 'e.g. Georgetown University, HACU Annual Conference',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'location',
      title: 'Location',
      type: 'string',
      description: 'e.g. Washington, DC or Mexico City',
    }),
    defineField({
      name: 'date',
      title: 'Date',
      type: 'datetime',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 4,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'speechText',
      title: 'Speech Text',
      type: 'array',
      of: [{type: 'block'}],
      description: 'Full written text of the keynote speech, if available',
    }),
    defineField({
      name: 'linkedVideo',
      title: 'Linked Video',
      type: 'reference',
      to: [{type: 'video'}],
      description: 'Video recording of this keynote speech',
    }),
    defineField({
      name: 'linkedEssay',
      title: 'Linked Essay',
      type: 'reference',
      to: [{type: 'essay'}],
      description: 'Published essay version of this keynote, if one exists',
    }),
    defineField({
      name: 'linkedPodcastEpisode',
      title: 'Linked Podcast Episode',
      type: 'reference',
      to: [{type: 'podcastEpisode'}],
      description: 'Podcast episode of this keynote speech, if one exists',
    }),
    defineField({
      name: 'videoUrl',
      title: 'Video URL',
      type: 'url',
      description: 'YouTube or other video embed URL (legacy — prefer linkedVideo reference)',
    }),
    defineField({
      name: 'presentationUrl',
      title: 'Presentation URL',
      type: 'url',
      description: 'Link to slides or presentation deck',
    }),
    defineField({
      name: 'pressLinks',
      title: 'Press Links',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'title',
              title: 'Title',
              type: 'string',
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
            select: {
              title: 'title',
              subtitle: 'url',
            },
          },
        },
      ],
    }),
    defineField({
      name: 'featured',
      title: 'Featured',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'displayOrder',
      title: 'Display Order',
      type: 'number',
      description: 'Lower numbers appear first',
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          {title: 'Commencement', value: 'commencement'},
          {title: 'Conference', value: 'conference'},
          {title: 'Institution', value: 'institution'},
          {title: 'Policy', value: 'policy'},
        ],
      },
    }),
    // --- Tags ---
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'tag' }] }],
    }),

    // --- SEO ---
    defineField({ name: 'seo', title: 'SEO', type: 'seoBlock' }),

    surfaceOnField,
    ...governanceFields,
  ],
  orderings: [
    {
      title: 'Date (Newest)',
      name: 'dateDesc',
      by: [{field: 'date', direction: 'desc'}],
    },
    {
      title: 'Display Order',
      name: 'displayOrderAsc',
      by: [{field: 'displayOrder', direction: 'asc'}],
    },
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'venue',
      date: 'date',
      category: 'category',
    },
    prepare({title, subtitle, date, category}) {
      const dateStr = date
        ? new Date(date).toLocaleDateString('en-US', {year: 'numeric', month: 'short'})
        : ''
      const cat = category ? `[${category}]` : ''
      return {
        title,
        subtitle: [subtitle, dateStr, cat].filter(Boolean).join(' — '),
      }
    },
  },
})
