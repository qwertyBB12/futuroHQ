import { defineType, defineField } from 'sanity'
import { governanceFields } from './blocks/governanceBlock'

export default defineType({
  name: 'essay',
  title: 'Essay',
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
      type: 'string',
      options: {
        list: [
          { title: 'English', value: 'en' },
          { title: 'Spanish', value: 'es' },
        ],
      },
      initialValue: 'en',
    }),
    defineField({
      name: 'publicationVenue',
      title: 'Publication Venue',
      type: 'string',
      options: {
        list: [
          { title: 'Substack (EN)', value: 'substack-en' },
          { title: 'Cuadernos (ES)', value: 'cuadernos-es' },
          { title: 'Al Dia', value: 'aldia' },
          { title: 'Original', value: 'original' },
        ],
      },
    }),
    defineField({
      name: 'externalUrl',
      title: 'External URL',
      type: 'url',
      description: 'Optional link to Substack, Cuadernos, or Al Dia',
    }),
    defineField({
      name: 'publishDate',
      title: 'Publish Date',
      type: 'datetime',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'array',
      of: [{ type: 'block' }],
    }),
    defineField({
      name: 'excerpt',
      title: 'Excerpt',
      type: 'text',
      description: 'Max 300 characters',
      validation: (Rule) => Rule.max(300),
    }),
    defineField({
      name: 'coverImage',
      title: 'Cover Image',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'fiveYearTest',
      title: 'Five Year Test',
      type: 'boolean',
      initialValue: false,
      description: 'Will I be proud of this in 2030?',
    }),
    defineField({
      name: 'institutionalReference',
      title: 'Institutional Reference',
      type: 'object',
      fields: [
        defineField({
          name: 'includeReference',
          title: 'Include Reference',
          type: 'boolean',
          initialValue: false,
        }),
        defineField({
          name: 'referenceText',
          title: 'Reference Text',
          type: 'text',
        }),
        defineField({
          name: 'referenceUrl',
          title: 'Reference URL',
          type: 'url',
        }),
      ],
    }),
    defineField({
      name: 'seoBlock',
      title: 'SEO',
      type: 'seoBlock',
    }),
    ...governanceFields,
  ],
})
