import { defineType, defineField } from 'sanity'
import { governanceFields } from './blocks/governanceBlock'

const dreamStatusList = [
  { title: 'Seed', value: 'seed' },
  { title: 'Articulated', value: 'articulated' },
  { title: 'In Motion', value: 'in-motion' },
  { title: 'Realized', value: 'realized' },
  { title: 'Evolved', value: 'evolved' },
  { title: 'Paused', value: 'paused' },
  { title: 'Released', value: 'released' },
]

export default defineType({
  name: 'alumniDream',
  title: 'Alumni Dream',
  type: 'document',
  description: 'Tracks dreams from first whisper through realization',
  fields: [
    // --- Core ---
    defineField({
      name: 'alumni',
      title: 'Alumni',
      type: 'reference',
      to: [{ type: 'alumni' }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
    }),
    defineField({
      name: 'language',
      title: 'Language',
      type: 'string',
      description: 'ISO language code (e.g. en, es, pt)',
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          { title: 'Project', value: 'project' },
          { title: 'Career', value: 'career' },
          { title: 'Education', value: 'education' },
          { title: 'Community', value: 'community' },
          { title: 'Personal', value: 'personal' },
          { title: 'Institutional', value: 'institutional' },
        ],
      },
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: { list: dreamStatusList },
      initialValue: 'seed',
    }),
    defineField({
      name: 'surfacedDate',
      title: 'Surfaced Date',
      type: 'date',
      description: 'When this dream was first expressed',
    }),

    // --- Status History ---
    defineField({
      name: 'statusHistory',
      title: 'Status History',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'fromStatus',
              title: 'From Status',
              type: 'string',
              options: { list: dreamStatusList },
            }),
            defineField({
              name: 'toStatus',
              title: 'To Status',
              type: 'string',
              options: { list: dreamStatusList },
            }),
            defineField({
              name: 'date',
              title: 'Date',
              type: 'date',
            }),
            defineField({
              name: 'reason',
              title: 'Reason',
              type: 'string',
            }),
            defineField({
              name: 'conversation',
              title: 'Related Conversation',
              type: 'reference',
              to: [{ type: 'alumniConversation' }],
            }),
          ],
          preview: {
            select: { from: 'fromStatus', to: 'toStatus', date: 'date' },
            prepare({ from, to, date }) {
              return { title: `${from || '?'} → ${to || '?'}`, subtitle: date }
            },
          },
        },
      ],
    }),

    // --- Milestones ---
    defineField({
      name: 'milestones',
      title: 'Milestones',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'date', title: 'Date', type: 'date' }),
            defineField({ name: 'title', title: 'Title', type: 'string' }),
            defineField({ name: 'description', title: 'Description', type: 'text' }),
            defineField({
              name: 'evidence',
              title: 'Evidence',
              type: 'array',
              of: [{ type: 'image' }],
            }),
          ],
          preview: {
            select: { title: 'title', subtitle: 'date' },
          },
        },
      ],
    }),

    // --- Links ---
    defineField({
      name: 'linkedProjects',
      title: 'Linked Projects',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'project' }] }],
    }),
    defineField({
      name: 'supporters',
      title: 'Supporters',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'alumni' }] }],
    }),

    // --- Progress ---
    defineField({
      name: 'blockers',
      title: 'Blockers',
      type: 'text',
      description: 'Current obstacles or challenges',
    }),
    defineField({
      name: 'nextStep',
      title: 'Next Step',
      type: 'string',
    }),
    defineField({
      name: 'nextStepDueDate',
      title: 'Next Step Due Date',
      type: 'date',
    }),
    defineField({
      name: 'inspirations',
      title: 'Inspirations',
      type: 'array',
      of: [{ type: 'string' }],
    }),

    // --- Narrative ---
    defineField({
      name: 'narrative',
      title: 'Narrative Development',
      type: 'narrativeBlock',
    }),

    // --- Governance ---
    ...governanceFields,
  ],

  preview: {
    select: {
      title: 'title',
      alumniName: 'alumni.name',
      status: 'status',
    },
    prepare({ title, alumniName, status }) {
      return {
        title: title || 'Untitled Dream',
        subtitle: [alumniName, status].filter(Boolean).join(' — '),
      }
    },
  },

  orderings: [
    {
      title: 'Newest',
      name: 'surfacedDesc',
      by: [{ field: 'surfacedDate', direction: 'desc' }],
    },
    {
      title: 'Status',
      name: 'statusAsc',
      by: [{ field: 'status', direction: 'asc' }],
    },
  ],
})
