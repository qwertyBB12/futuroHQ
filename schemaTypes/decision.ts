import {defineType, defineField} from 'sanity'
import {BookIcon} from '@sanity/icons'

export default defineType({
  name: 'decision',
  title: 'Decision',
  type: 'document',
  icon: BookIcon,
  description:
    'Decision records capture the institutional memory of the ecosystem. ' +
    'When Claude Code discusses an architectural or strategic decision with Héctor and a decision is reached, log it here. ' +
    'The decision field should be specific and actionable, not vague. ' +
    'The rationale field is the most important — future-you needs to know WHY, not just WHAT. ' +
    'Link to related documents when they exist. ' +
    'Set status to "active" for new decisions. Use "superseded" when a newer decision replaces this one, and link via the supersedes field. ' +
    'Domain should match the area of concern: "architecture" for technical/infrastructure, "content" for editorial strategy, "operations" for process decisions.',
  fields: [
    defineField({
      name: 'title',
      title: 'Decision Title',
      type: 'string',
      description: 'Clear statement of what was decided',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'decisionDate',
      title: 'Date',
      type: 'date',
      initialValue: () => new Date().toISOString().split('T')[0],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'narrativeOwner',
      title: 'Entity',
      type: 'string',
      description: 'Which entity or domain this decision affects',
      options: {
        list: [
          {title: 'Héctor (Personal)', value: 'hector'},
          {title: 'BeNeXT', value: 'benext'},
          {title: 'Futuro', value: 'futuro'},
          {title: 'NeXT', value: 'next'},
          {title: 'Mítikah', value: 'mitikah'},
          {title: 'Medikah', value: 'medikah'},
          {title: 'Arkah', value: 'arkah'},
          {title: 'Ecosystem (Cross-Entity)', value: 'ecosystem'},
        ],
      },
      initialValue: 'ecosystem',
    }),
    defineField({
      name: 'domain',
      title: 'Domain',
      type: 'string',
      description: 'Area this decision falls under',
      options: {
        list: [
          {title: 'Architecture', value: 'architecture'},
          {title: 'Content Strategy', value: 'content'},
          {title: 'Design', value: 'design'},
          {title: 'Operations', value: 'operations'},
          {title: 'Partnerships', value: 'partnerships'},
          {title: 'Product', value: 'product'},
          {title: 'Finance', value: 'finance'},
          {title: 'Legal / Compliance', value: 'legal'},
        ],
      },
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          {title: 'Active', value: 'active'},
          {title: 'Superseded', value: 'superseded'},
          {title: 'Under Review', value: 'review'},
          {title: 'Reverted', value: 'reverted'},
        ],
        layout: 'radio',
      },
      initialValue: 'active',
    }),
    defineField({
      name: 'context',
      title: 'Context',
      type: 'text',
      description: 'What prompted this decision? What problem or opportunity was being addressed?',
      rows: 4,
    }),
    defineField({
      name: 'decision',
      title: 'Decision',
      type: 'text',
      description: 'What was decided? Be specific.',
      rows: 4,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'rationale',
      title: 'Rationale',
      type: 'text',
      description: 'Why this decision and not the alternatives? What tradeoffs were accepted?',
      rows: 4,
    }),
    defineField({
      name: 'alternatives',
      title: 'Alternatives Considered',
      type: 'text',
      description: 'What other options were evaluated?',
      rows: 3,
    }),
    defineField({
      name: 'consequences',
      title: 'Expected Consequences',
      type: 'text',
      description: 'What does this decision enable or foreclose?',
      rows: 3,
    }),
    defineField({
      name: 'supersedes',
      title: 'Supersedes',
      type: 'reference',
      to: [{type: 'decision'}],
      description: 'Previous decision this replaces, if any',
    }),
    defineField({
      name: 'relatedDocuments',
      title: 'Related Documents',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [
            {type: 'essay'},
            {type: 'project'},
            {type: 'futuroSummit'},
            {type: 'person'},
            {type: 'decision'},
          ],
        },
      ],
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'tag'}]}],
    }),
  ],
  orderings: [
    {
      title: 'Date (Newest)',
      name: 'dateDesc',
      by: [{field: 'decisionDate', direction: 'desc'}],
    },
  ],
  preview: {
    select: {
      title: 'title',
      date: 'decisionDate',
      entity: 'narrativeOwner',
      status: 'status',
      domain: 'domain',
    },
    prepare({title, date, entity, status, domain}) {
      return {
        title: title || 'Untitled Decision',
        subtitle: [entity || 'ecosystem', domain, date, status || 'active']
          .filter(Boolean)
          .join(' · '),
      }
    },
  },
})
