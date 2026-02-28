import { defineType, defineField } from 'sanity'
import { governanceFields } from './blocks/governanceBlock'

export default defineType({
  name: 'usageRecord',
  title: 'Usage Record',
  type: 'document',
  description: 'Tracks API consumption per participant per activity for billing and accreditation',
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
      name: 'date',
      title: 'Date',
      type: 'date',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'activityType',
      title: 'Activity Type',
      type: 'string',
      options: {
        list: [
          { title: 'Conversation', value: 'conversation' },
          { title: 'Workspace', value: 'workspace' },
          { title: 'Mentorship', value: 'mentorship' },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'rawMinutes',
      title: 'Raw Minutes',
      type: 'number',
      validation: (Rule) => Rule.required().min(0),
    }),
    defineField({
      name: 'tokensUsed',
      title: 'Tokens Used',
      type: 'number',
    }),
    defineField({
      name: 'creditHoursEarned',
      title: 'Credit Hours Earned',
      type: 'number',
    }),
    defineField({
      name: 'tier',
      title: 'Tier',
      type: 'string',
      options: {
        list: [
          { title: 'Foundation', value: 'foundation' },
          { title: 'Builder', value: 'builder' },
          { title: 'Scaling', value: 'scaling' },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),

    // --- Links ---
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

    // --- Governance ---
    ...governanceFields,
  ],

  preview: {
    select: {
      alumniName: 'alumni.name',
      activityType: 'activityType',
      rawMinutes: 'rawMinutes',
      date: 'date',
    },
    prepare({ alumniName, activityType, rawMinutes, date }) {
      const mins = rawMinutes != null ? `${rawMinutes} min` : ''
      return {
        title: `${alumniName || 'Unknown'} — ${activityType || '?'}`,
        subtitle: [mins, date].filter(Boolean).join(' · '),
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
