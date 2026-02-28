import { defineType, defineField } from 'sanity'
import { governanceFields } from './blocks/governanceBlock'

export default defineType({
  name: 'alumniConversation',
  title: 'Alumni Conversation',
  type: 'document',
  description: 'AI or human-conducted conversation record',
  groups: [
    { name: 'core', title: 'Core', default: true },
    { name: 'insights', title: 'Insights' },
    { name: 'internal', title: 'Internal (AI/Admin)' },
    { name: 'links', title: 'Links' },
  ],
  fields: [
    // --- Core ---
    defineField({
      name: 'alumni',
      title: 'Alumni',
      type: 'reference',
      to: [{ type: 'alumni' }],
      validation: (Rule) => Rule.required(),
      group: 'core',
    }),
    defineField({
      name: 'date',
      title: 'Date',
      type: 'date',
      validation: (Rule) => Rule.required(),
      group: 'core',
    }),
    defineField({
      name: 'language',
      title: 'Language',
      type: 'string',
      description: 'ISO language code (e.g. en, es, pt)',
      group: 'core',
    }),
    defineField({
      name: 'format',
      title: 'Format',
      type: 'string',
      options: {
        list: [
          { title: 'AI Voice', value: 'ai-voice' },
          { title: 'AI Chat', value: 'ai-chat' },
          { title: 'In Person', value: 'in-person' },
          { title: 'Video', value: 'video' },
          { title: 'Phone', value: 'phone' },
          { title: 'Email', value: 'email' },
        ],
      },
      group: 'core',
    }),
    defineField({
      name: 'context',
      title: 'Context',
      type: 'string',
      options: {
        list: [
          { title: 'Onboarding', value: 'onboarding' },
          { title: 'Check-in', value: 'check-in' },
          { title: 'Project Review', value: 'project-review' },
          { title: 'Dream Session', value: 'dream-session' },
          { title: 'Crisis', value: 'crisis' },
          { title: 'Celebration', value: 'celebration' },
          { title: 'Re-engagement', value: 're-engagement' },
        ],
      },
      group: 'core',
    }),
    defineField({
      name: 'conductedBy',
      title: 'Conducted By',
      type: 'reference',
      to: [{ type: 'person' }, { type: 'alumni' }],
      description: 'Who led the conversation (empty if AI-conducted)',
      group: 'core',
    }),
    defineField({
      name: 'isAIConducted',
      title: 'AI Conducted?',
      type: 'boolean',
      initialValue: false,
      group: 'core',
    }),
    defineField({
      name: 'summary',
      title: 'Summary',
      type: 'text',
      group: 'core',
    }),

    // --- Insights ---
    defineField({
      name: 'keyInsights',
      title: 'Key Insights',
      type: 'array',
      of: [{ type: 'string' }],
      group: 'insights',
    }),
    defineField({
      name: 'themes',
      title: 'Themes',
      type: 'array',
      of: [{ type: 'string' }],
      group: 'insights',
    }),
    defineField({
      name: 'conversationArc',
      title: 'Conversation Arc',
      type: 'object',
      fields: [
        defineField({ name: 'openingState', title: 'Opening State', type: 'string' }),
        defineField({ name: 'turningPoint', title: 'Turning Point', type: 'string' }),
        defineField({ name: 'closingState', title: 'Closing State', type: 'string' }),
      ],
      group: 'insights',
    }),
    defineField({
      name: 'followUp',
      title: 'Follow Up',
      type: 'object',
      fields: [
        defineField({ name: 'action', title: 'Action', type: 'string' }),
        defineField({ name: 'dueDate', title: 'Due Date', type: 'date' }),
        defineField({
          name: 'assignedTo',
          title: 'Assigned To',
          type: 'reference',
          to: [{ type: 'person' }, { type: 'alumni' }],
        }),
        defineField({ name: 'completed', title: 'Completed?', type: 'boolean' }),
        defineField({ name: 'completedDate', title: 'Completed Date', type: 'date' }),
      ],
      group: 'insights',
    }),

    // --- Internal (AI/Admin only) ---
    defineField({
      name: 'transcript',
      title: 'Transcript',
      type: 'text',
      description: 'INTERNAL — Full transcript. Encrypted at rest, subject to retention policies.',
      group: 'internal',
    }),
    defineField({
      name: 'sentiment',
      title: 'Sentiment',
      type: 'string',
      description: 'INTERNAL — Participant emotional state',
      options: {
        list: [
          { title: 'Thriving', value: 'thriving' },
          { title: 'Steady', value: 'steady' },
          { title: 'Struggling', value: 'struggling' },
          { title: 'Disconnected', value: 'disconnected' },
          { title: 'Rekindling', value: 'rekindling' },
        ],
      },
      group: 'internal',
    }),
    defineField({
      name: 'energyLevel',
      title: 'Energy Level',
      type: 'string',
      description: 'INTERNAL — Participant energy during conversation',
      options: {
        list: [
          { title: 'High', value: 'high' },
          { title: 'Moderate', value: 'moderate' },
          { title: 'Low', value: 'low' },
          { title: 'Uncertain', value: 'uncertain' },
        ],
      },
      group: 'internal',
    }),
    defineField({
      name: 'founderSignals',
      title: 'Founder Signals',
      type: 'object',
      description: 'INTERNAL — Founder mentality signals tracked by AI',
      fields: [
        defineField({ name: 'ownershipThinking', title: 'Ownership Thinking', type: 'boolean' }),
        defineField({ name: 'employeeThinking', title: 'Employee Thinking', type: 'boolean' }),
        defineField({ name: 'dreamReference', title: 'Dream Reference', type: 'boolean' }),
        defineField({ name: 'communityMention', title: 'Community Mention', type: 'boolean' }),
        defineField({ name: 'obstacleNamed', title: 'Obstacle Named', type: 'boolean' }),
        defineField({ name: 'nextStepIdentified', title: 'Next Step Identified', type: 'boolean' }),
      ],
      group: 'internal',
    }),

    // --- Links ---
    defineField({
      name: 'linkedProject',
      title: 'Linked Project',
      type: 'reference',
      to: [{ type: 'project' }],
      group: 'links',
    }),
    defineField({
      name: 'linkedDream',
      title: 'Linked Dream',
      type: 'reference',
      to: [{ type: 'alumniDream' }],
      group: 'links',
    }),

    // --- Governance ---
    ...governanceFields,
  ],

  preview: {
    select: {
      alumniName: 'alumni.name',
      date: 'date',
      context: 'context',
      format: 'format',
    },
    prepare({ alumniName, date, context, format }) {
      const parts = [context, format].filter(Boolean).join(' · ')
      return {
        title: alumniName ? `${alumniName} — ${date || 'No date'}` : date || 'No date',
        subtitle: parts || '—',
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
