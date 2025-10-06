import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'opEd',
  title: 'Op-Ed',
  type: 'document',
  fields: [
    // --- Publish toggle pinned at top ---
    defineField({
      name: 'publish',
      title: 'Publish?',
      type: 'boolean',
      initialValue: true,
      description: 'Toggle to control if this entry is visible across ecosystem'
    }),

    // --- Order for manual prioritization ---
    defineField({
      name: 'order',
      title: 'Order',
      type: 'number',
      description: 'Controls manual ordering across the ecosystem'
    }),

    // --- Core ---
    defineField({ 
      name: 'title', 
      title: 'Title', 
      type: 'string',
      validation: Rule => Rule.required(),
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

    // --- SEO ---
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seoBlock',
    }),
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