import { defineType, defineField } from 'sanity'
import { commonMeta } from './blocks/commonMeta'
import { governanceFields } from './blocks/governanceBlock'

export default defineType({
  name: 'substackEssay',
  title: 'Substack Essay',
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
      description: 'Full essay content (rich text)',
    }),

    // --- Substack Link ---
    defineField({
      name: 'substackUrl',
      title: 'Substack URL',
      type: 'url',
      description: 'Link to the published essay on Substack',
      validation: (Rule) => Rule.uri({ scheme: ['https'] }),
    }),

    // --- Institutional Reference ---
    defineField({
      name: 'institutionalReference',
      title: 'Institutional Reference',
      type: 'object',
      description: 'Link this personal essay to institutional context if applicable',
      fields: [
        {
          name: 'relatedEntity',
          title: 'Related Entity',
          type: 'string',
          options: {
            list: [
              { title: 'None', value: 'none' },
              { title: 'BeNeXT', value: 'benext' },
              { title: 'Futuro', value: 'futuro' },
              { title: 'Mitikah', value: 'mitikah' },
              { title: 'Medikah', value: 'medikah' },
            ],
          },
          initialValue: 'none',
        },
        {
          name: 'relatedProject',
          title: 'Related Project',
          type: 'reference',
          to: [{ type: 'project' }],
        },
        {
          name: 'context',
          title: 'Context Note',
          type: 'text',
          description: 'How does this essay relate to institutional work?',
        },
      ],
    }),

    // --- Five Year Test ---
    defineField({
      name: 'fiveYearTest',
      title: 'Five Year Test',
      type: 'boolean',
      initialValue: false,
      description: 'Will this content still be relevant and valuable in 5 years?',
    }),

    // --- Media ---
    defineField({
      name: 'coverImage',
      title: 'Cover Image',
      type: 'image',
      options: { hotspot: true },
    }),

    // --- SEO ---
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seoBlock',
    }),
    ...commonMeta,

    // --- Governance (with defaults) ---
    ...governanceFields,
  ],

  initialValue: {
    platformTier: 'canonical',
    narrativeOwner: 'hector',
    archivalStatus: 'archival',
    fiveYearTest: false,
  },

  preview: {
    select: {
      title: 'title',
      subtitle: 'publishDate',
      media: 'coverImage',
    },
    prepare({ title, subtitle, media }) {
      return {
        title: title || 'Untitled Essay',
        subtitle: subtitle ? new Date(subtitle).toLocaleDateString() : '—',
        media,
      }
    },
  },
})
