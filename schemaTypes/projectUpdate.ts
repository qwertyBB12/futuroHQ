import { defineType, defineField } from 'sanity'
import { governanceFields } from './blocks/governanceBlock'

export default defineType({
  name: 'projectUpdate',
  title: 'Project Update',
  type: 'document',
  description: 'Milestones, pivots, outcomes, and reflections for a project',
  fields: [
    // --- Core ---
    defineField({
      name: 'project',
      title: 'Project',
      type: 'reference',
      to: [{ type: 'project' }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'date',
      title: 'Date',
      type: 'date',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'language',
      title: 'Language',
      type: 'string',
      description: 'ISO language code (e.g. en, es, pt)',
    }),
    defineField({
      name: 'updateType',
      title: 'Update Type',
      type: 'string',
      options: {
        list: [
          { title: 'Milestone', value: 'milestone' },
          { title: 'Pivot', value: 'pivot' },
          { title: 'Phase Change', value: 'phase-change' },
          { title: 'Funding', value: 'funding' },
          { title: 'Outcome', value: 'outcome' },
          { title: 'Reflection', value: 'reflection' },
          { title: 'Setback', value: 'setback' },
          { title: 'Collaboration', value: 'collaboration' },
        ],
      },
    }),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'array',
      of: [{ type: 'block' }],
    }),
    defineField({
      name: 'evidence',
      title: 'Evidence',
      type: 'array',
      of: [{ type: 'image' }, { type: 'mediaBlock' }],
    }),
    defineField({
      name: 'metrics',
      title: 'Metrics',
      type: 'object',
      fields: [
        defineField({ name: 'reached', title: 'People Reached', type: 'number' }),
        defineField({ name: 'unit', title: 'Unit', type: 'string' }),
        defineField({ name: 'context', title: 'Context', type: 'string' }),
      ],
    }),

    // --- Attribution ---
    defineField({
      name: 'author',
      title: 'Author',
      type: 'reference',
      to: [{ type: 'alumni' }],
    }),

    // --- Links ---
    defineField({
      name: 'linkedDream',
      title: 'Linked Dream',
      type: 'reference',
      to: [{ type: 'alumniDream' }],
    }),
    defineField({
      name: 'linkedConversation',
      title: 'Linked Conversation',
      type: 'reference',
      to: [{ type: 'alumniConversation' }],
    }),

    // --- Visibility ---
    defineField({
      name: 'visibility',
      title: 'Visibility',
      type: 'string',
      options: {
        list: [
          { title: 'Public', value: 'public' },
          { title: 'Community', value: 'community' },
          { title: 'Private', value: 'private' },
        ],
        layout: 'radio',
      },
      initialValue: 'community',
    }),

    // --- Governance ---
    ...governanceFields,
  ],

  preview: {
    select: {
      title: 'title',
      projectTitle: 'project.title',
      updateType: 'updateType',
      date: 'date',
    },
    prepare({ title, projectTitle, updateType, date }) {
      return {
        title: title || projectTitle || 'Untitled Update',
        subtitle: [updateType, date].filter(Boolean).join(' — '),
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
