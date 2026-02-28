import { defineType, defineField } from 'sanity'
import { governanceFields } from './blocks/governanceBlock'

export default defineType({
  name: 'accreditationRecord',
  title: 'Accreditation Record',
  type: 'document',
  description: 'Tracks experiential learning across five dimensions for NeXT accreditation',
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
      name: 'dimension',
      title: 'Dimension',
      type: 'string',
      options: {
        list: [
          { title: 'Workspace Usage', value: 'workspace-usage' },
          { title: 'Project Lifecycle', value: 'project-lifecycle' },
          { title: 'AI Fluency', value: 'ai-fluency' },
          { title: 'Collaboration', value: 'collaboration' },
          { title: 'Impact', value: 'impact' },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'evidenceType',
      title: 'Evidence Type',
      type: 'string',
      description: 'What kind of evidence supports this record',
    }),
    defineField({
      name: 'evidenceRef',
      title: 'Evidence Reference',
      type: 'reference',
      to: [
        { type: 'alumniConversation' },
        { type: 'projectUpdate' },
        { type: 'alumniDream' },
      ],
    }),
    defineField({
      name: 'hoursLogged',
      title: 'Hours Logged',
      type: 'number',
    }),
    defineField({
      name: 'milestoneReached',
      title: 'Milestone Reached',
      type: 'string',
    }),
    defineField({
      name: 'date',
      title: 'Date',
      type: 'date',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'verified',
      title: 'Verified?',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'credential',
      title: 'Linked Credential',
      type: 'reference',
      to: [{ type: 'credential' }],
    }),

    // --- Governance ---
    ...governanceFields,
  ],

  preview: {
    select: {
      alumniName: 'alumni.name',
      dimension: 'dimension',
      date: 'date',
    },
    prepare({ alumniName, dimension, date }) {
      return {
        title: `${alumniName || 'Unknown'} — ${dimension || 'Unknown'}`,
        subtitle: date || '—',
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
