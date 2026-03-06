import { defineType, defineField } from 'sanity'
import { commonMeta } from './blocks/commonMeta'
import { governanceFields } from './blocks/governanceBlock'

export default defineType({
  name: 'opEd',
  title: 'Op-Ed',
  type: 'document',
  description:
    'Opinion-editorial pieces — shorter, more pointed than essays. ' +
    'Default narrativeOwner: "hector". Default platformTier: "canonical". Default archivalStatus: "archival". ' +
    'Supports bilingual (en/es). Body uses Portable Text. ' +
    'Voice should be direct and argumentative — making a case, not just reflecting. ' +
    'Include source publication if externally published.',
  fields: [
    // --- Core ---
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
    }),
    defineField({
      name: 'language',
      title: 'Language',
      type: 'string',
      options: { list: ['English', 'Spanish'] },
    }),
    defineField({ 
      name: 'body', 
      title: 'Body', 
      type: 'array', 
      of: [{ type: 'block' }],
      description: 'Main text of the op-ed (rich text with formatting)',
    }),
    defineField({
      name: 'publishDate',
      title: 'Publish Date',
      type: 'datetime',
      description: 'When this op-ed should be published (optional)',
    }),

    // --- Author ---
    defineField({
      name: 'author',
      title: 'Author',
      type: 'reference',
      to: [
        { type: 'person' }, 
        { type: 'alumni' }, 
        { type: 'ledgerPerson' }
      ],
    }),

    // --- Media ---
    defineField({
      name: 'media',
      title: 'Attached Media',
      type: 'array',
      of: [{ type: 'mediaBlock' }, { type: 'image' }],
    }),

    // --- Narrative enrichment ---
    defineField({
      name: 'narrative',
      title: 'Narrative Development',
      type: 'narrativeBlock',
    }),

    // --- Tags ---
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'tag' }] }],
    }),

    // --- SEO ---
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seoBlock',
    }),
    ...commonMeta,

    // --- Governance ---
    ...governanceFields,
  ],

  preview: {
    select: { title: 'title', subtitle: 'language', date: 'publishDate', media: 'media.0.thumbnail' },
    prepare({ title, subtitle, date, media }) {
      const formattedDate = date ? new Date(date).toLocaleDateString() : null
      return {
        title: title || 'Untitled Op-Ed',
        subtitle: `${subtitle || '—'}${formattedDate ? ` | ${formattedDate}` : ''}`,
        media,
      }
    }
  }
})
