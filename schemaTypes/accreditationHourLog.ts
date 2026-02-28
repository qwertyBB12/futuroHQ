import { defineType, defineField } from 'sanity'
import { governanceFields } from './blocks/governanceBlock'

export default defineType({
  name: 'accreditationHourLog',
  title: 'Accreditation Hour Log',
  type: 'document',
  description:
    'Tracks raw hours and credit hours after rate conversion. ' +
    'Credit rates: summit/hackathon 1:1, workspace/mentorship 2:1, conversation 4:1. ' +
    'First certificate requires 240 credit hours.',
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
      name: 'source',
      title: 'Source',
      type: 'string',
      options: {
        list: [
          { title: 'Futuro Summit', value: 'futuro-summit' },
          { title: 'Hackathon', value: 'hackathon' },
          { title: 'Workspace', value: 'workspace' },
          { title: 'Conversation', value: 'conversation' },
          { title: 'Mentorship', value: 'mentorship' },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'rawHours',
      title: 'Raw Hours',
      type: 'number',
      validation: (Rule) => Rule.required().min(0),
    }),
    defineField({
      name: 'creditHours',
      title: 'Credit Hours',
      type: 'number',
      description: 'Hours after rate conversion',
      validation: (Rule) => Rule.required().min(0),
    }),
    defineField({
      name: 'date',
      title: 'Date',
      type: 'date',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
    }),

    // --- Links ---
    defineField({
      name: 'linkedEvent',
      title: 'Linked Event',
      type: 'reference',
      to: [{ type: 'futuroSummit' }],
    }),
    defineField({
      name: 'linkedConversation',
      title: 'Linked Conversation',
      type: 'reference',
      to: [{ type: 'alumniConversation' }],
    }),
    defineField({
      name: 'linkedProject',
      title: 'Linked Project',
      type: 'reference',
      to: [{ type: 'project' }],
    }),

    // --- Verification ---
    defineField({
      name: 'verified',
      title: 'Verified?',
      type: 'boolean',
      initialValue: false,
    }),

    // --- Governance ---
    ...governanceFields,
  ],

  preview: {
    select: {
      alumniName: 'alumni.name',
      source: 'source',
      creditHours: 'creditHours',
      date: 'date',
    },
    prepare({ alumniName, source, creditHours, date }) {
      const hrs = creditHours != null ? `${creditHours} credit hrs` : ''
      return {
        title: `${alumniName || 'Unknown'} — ${source || '?'}`,
        subtitle: [hrs, date].filter(Boolean).join(' · '),
      }
    },
  },

  orderings: [
    {
      title: 'Newest',
      name: 'dateDesc',
      by: [{ field: 'date', direction: 'desc' }],
    },
  ],
})
