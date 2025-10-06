import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'project',
  title: 'Project',
  type: 'document',
  fields: [
    // --- Publish toggle pinned at top ---
    defineField({
      name: 'publish',
      title: 'Publish?',
      type: 'boolean',
      initialValue: true,
      description: 'Toggle to control if this project is visible across the ecosystem',
    }),

    // --- Ordering ---
    defineField({
      name: 'order',
      title: 'Order',
      type: 'number',
      description: 'Use lower numbers to feature/pin projects higher in lists',
    }),

    // --- Status ---
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          { title: 'Active', value: 'active' },
          { title: 'In Progress', value: 'inprogress' },
          { title: 'Archived', value: 'archived' },
        ],
      },
      initialValue: 'active',
      description: 'Track whether this project is active, in progress, or archived',
    }),

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
      description: 'Used for project page URLs',
    }),
    defineField({
      name: 'summary',
      title: 'Summary',
      type: 'text',
      description: 'Concise description of the project',
    }),

    // --- Dates (optional) ---
    defineField({
      name: 'startDate',
      title: 'Start Date',
      type: 'date',
    }),
    defineField({
      name: 'endDate',
      title: 'End Date',
      type: 'date',
    }),

    // --- Media ---
    defineField({
      name: 'projectMedia',
      title: 'Project Media',
      type: 'array',
      of: [{ type: 'mediaBlock' }, { type: 'image' }],
    }),

    // --- Links ---
    defineField({
      name: 'participants',
      title: 'Participants',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{ type: 'alumni' }, { type: 'ledgerPerson' }, { type: 'person' }],
        },
      ],
    }),
    defineField({
      name: 'partnerOrgs',
      title: 'Partner Organizations',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'collaborator' }] }],
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
    select: {
      title: 'title',
      subtitle: 'summary',
      media: 'projectMedia.0.thumbnail',
    },
    prepare({ title, subtitle, media }) {
      return {
        title: title || 'Untitled Project',
        subtitle: subtitle ? subtitle.slice(0, 60) + '…' : '—',
        media,
      }
    },
  },
})