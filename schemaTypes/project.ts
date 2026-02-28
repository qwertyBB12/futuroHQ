import { defineType, defineField } from 'sanity'
import { commonMeta } from './blocks/commonMeta'
import { governanceFields } from './blocks/governanceBlock'

export default defineType({
  name: 'project',
  title: 'Project',
  type: 'document',
  fieldsets: [
    {
      name: 'companion',
      title: 'Companion Platform',
      options: { collapsible: true, collapsed: true },
    },
  ],
  fields: [
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
    defineField({
      name: 'publicNarrative',
      title: 'Public Narrative',
      type: 'object',
      description: 'Public-facing copy only. Keep it clear, operational, and non-poetic.',
      fields: [
        defineField({
          name: 'whatItIs',
          title: 'What It Is',
          type: 'text',
          rows: 2,
        }),
        defineField({
          name: 'whatHappens',
          title: 'What Happens',
          type: 'text',
          rows: 2,
        }),
        defineField({
          name: 'whatItProduces',
          title: 'What It Produces',
          type: 'text',
          rows: 2,
        }),
        defineField({
          name: 'communityLine',
          title: 'Community Line (Optional)',
          type: 'string',
        }),
      ],
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

    // --- Companion Platform (new fields — all optional) ---
    defineField({
      name: 'phase',
      title: 'Project Phase',
      type: 'string',
      options: {
        list: [
          { title: 'Ideation', value: 'ideation' },
          { title: 'Prototype', value: 'prototype' },
          { title: 'Pilot', value: 'pilot' },
          { title: 'Scaling', value: 'scaling' },
          { title: 'Sustaining', value: 'sustaining' },
          { title: 'Archived', value: 'archived' },
        ],
      },
      fieldset: 'companion',
    }),
    defineField({
      name: 'cohortYear',
      title: 'Cohort Year',
      type: 'number',
      fieldset: 'companion',
    }),
    defineField({
      name: 'originSummit',
      title: 'Origin Summit',
      type: 'reference',
      to: [{ type: 'futuroSummit' }],
      fieldset: 'companion',
    }),
    defineField({
      name: 'fundingStatus',
      title: 'Funding Status',
      type: 'string',
      options: {
        list: [
          { title: 'Unfunded', value: 'unfunded' },
          { title: 'Seeking', value: 'seeking' },
          { title: 'Seed', value: 'seed' },
          { title: 'Funded', value: 'funded' },
          { title: 'Self-Sustaining', value: 'self-sustaining' },
        ],
      },
      fieldset: 'companion',
    }),
    defineField({
      name: 'capitalNeeds',
      title: 'Capital Needs',
      type: 'object',
      fields: [
        defineField({ name: 'financial', title: 'Financial', type: 'boolean' }),
        defineField({ name: 'social', title: 'Social', type: 'boolean' }),
        defineField({ name: 'intellectual', title: 'Intellectual', type: 'boolean' }),
        defineField({ name: 'description', title: 'Description', type: 'text' }),
      ],
      fieldset: 'companion',
    }),
    defineField({
      name: 'impactAreas',
      title: 'Impact Areas',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        list: [
          { title: 'Healthcare', value: 'healthcare' },
          { title: 'Education', value: 'education' },
          { title: 'Culture', value: 'culture' },
          { title: 'Environment', value: 'environment' },
          { title: 'Economic', value: 'economic' },
          { title: 'Governance', value: 'governance' },
          { title: 'Narrative', value: 'narrative' },
        ],
      },
      fieldset: 'companion',
    }),
    defineField({
      name: 'targetCommunity',
      title: 'Target Community',
      type: 'string',
      fieldset: 'companion',
    }),
    defineField({
      name: 'originDream',
      title: 'Origin Dream',
      type: 'reference',
      to: [{ type: 'alumniDream' }],
      fieldset: 'companion',
    }),
    defineField({
      name: 'projectHealth',
      title: 'Project Health',
      type: 'string',
      description: 'INTERNAL — Never surface to participants',
      options: {
        list: [
          { title: 'Thriving', value: 'thriving' },
          { title: 'Steady', value: 'steady' },
          { title: 'Stalled', value: 'stalled' },
          { title: 'At Risk', value: 'at-risk' },
          { title: 'Paused', value: 'paused' },
        ],
      },
      fieldset: 'companion',
    }),
    defineField({
      name: 'lastActivityDate',
      title: 'Last Activity Date',
      type: 'date',
      fieldset: 'companion',
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
    ...commonMeta,

    // --- Governance ---
    ...governanceFields,
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
