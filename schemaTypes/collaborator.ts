import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'collaborator',
  title: 'Collaborator / Organization',
  type: 'document',
  fields: [
    // --- Publish toggle ---
    defineField({
      name: 'publish',
      title: 'Publish?',
      type: 'boolean',
      initialValue: true,
      description: 'Toggle to control if this collaborator is visible across ecosystem',
    }),

    // --- Core ---
    defineField({
      name: 'name',
      title: 'Organization Name',
      type: 'string',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'orgType',
      title: 'Type',
      type: 'string',
      description: 'Classify organization type (University, High School, NGO, etc.)',
      options: {
        list: [
          { title: 'NGO', value: 'ngo' },
          { title: 'University', value: 'university' },
          { title: 'Government', value: 'government' },
          { title: 'Corporation', value: 'corporation' },
          { title: 'Foundation', value: 'foundation' },
          { title: 'High School', value: 'highschool' }, // ✅ new
          { title: 'Other', value: 'other' },
        ]
      }
    }),
    defineField({ name: 'bio', title: 'About / Biography', type: 'text' }),
    defineField({
      name: 'logo',
      title: 'Logo',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({ name: 'website', title: 'Website', type: 'url' }),
    defineField({
      name: 'order',
      title: 'Order',
      type: 'number',
      description: 'Controls sorting priority (lower = higher priority)',
    }),

    // --- Media ---
    defineField({
      name: 'media',
      title: 'Media Assets',
      type: 'array',
      of: [{ type: 'mediaBlock' }, { type: 'image' }],
    }),

    // --- Links ---
    defineField({
      name: 'relatedProjects',
      title: 'Related Projects',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'project' }] }],
    }),
    defineField({
      name: 'relatedPeople',
      title: 'Key People',
      type: 'array',
      of: [
        { type: 'reference', to: [{ type: 'ledgerPerson' }, { type: 'alumni' }, { type: 'person' }] }
      ],
    }),

    // --- Narrative (shared block) ---
    defineField({
      name: 'narrative',
      title: 'Narrative Development',
      type: 'narrativeBlock',
    }),

    // --- SEO (shared block) ---
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seoBlock',
    }),
  ],

  preview: {
    select: { title: 'name', subtitle: 'orgType', media: 'logo.asset' },
    prepare({ title, subtitle, media }) {
      return {
        title: title || 'Unnamed Collaborator',
        subtitle: subtitle || '—',
        media,
      }
    }
  }
})