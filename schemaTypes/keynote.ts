import {defineType, defineField} from 'sanity'
import {governanceFields} from './blocks/governanceBlock'

export default defineType({
  name: 'keynote',
  title: 'Keynote',
  type: 'document',
  description:
    'A keynote speech or major presentation. ' +
    'Default narrativeOwner: "hector". Default platformTier: "canonical". Default archivalStatus: "archival". ' +
    'Venue and date are required. Category classifies the type: commencement, conference, institutional, panel, workshop. ' +
    'Link to related video, essay, or podcast episode when recordings exist. ' +
    'Featured keynotes surface on hectorhlopez.com/keynotes.',
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
      name: 'videoUrl',
      title: 'Video URL',
      type: 'url',
      description: 'YouTube or other video embed URL',
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
