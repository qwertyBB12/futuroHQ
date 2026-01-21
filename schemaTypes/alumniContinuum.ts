import { defineType, defineField } from 'sanity'
import { commonMeta } from './blocks/commonMeta'
import { governanceFields } from './blocks/governanceBlock'

export default defineType({
  name: 'alumniContinuum',
  title: 'Alumni Continuum',
  type: 'document',
  fields: [
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
    }),

    // --- Access Control ---
    defineField({
      name: 'accessLevel',
      title: 'Access Level',
      type: 'string',
      options: {
        list: [
          { title: 'All Alumni', value: 'all-alumni' },
          { title: 'Inner Circle', value: 'inner-circle' },
          { title: 'Founding Cohort', value: 'founding-cohort' },
          { title: 'Regional Chapter', value: 'regional-chapter' },
        ],
        layout: 'radio',
      },
      initialValue: 'all-alumni',
      description: 'Which alumni group can access this content',
    }),

    // --- Content Type ---
    defineField({
      name: 'contentType',
      title: 'Content Type',
      type: 'string',
      options: {
        list: [
          { title: 'Resource', value: 'resource' },
          { title: 'Announcement', value: 'announcement' },
          { title: 'Discussion Prompt', value: 'discussion' },
          { title: 'Opportunity', value: 'opportunity' },
          { title: 'Archive Material', value: 'archive' },
          { title: 'Playbook', value: 'playbook' },
        ],
        layout: 'dropdown',
      },
      description: 'Type of alumni content',
    }),

    // --- Body ---
    defineField({
      name: 'body',
      title: 'Body',
      type: 'array',
      of: [{ type: 'block' }],
      description: 'Main content (rich text)',
    }),

    // --- Related Projects ---
    defineField({
      name: 'relatedProjects',
      title: 'Related Projects',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'project' }] }],
      description: 'Link to relevant Futuro/BeNeXT projects',
    }),

    // --- Related Alumni ---
    defineField({
      name: 'relatedAlumni',
      title: 'Related Alumni',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'alumni' }] }],
      description: 'Alumni contributors or featured members',
    }),

    // --- Media ---
    defineField({
      name: 'media',
      title: 'Attached Media',
      type: 'array',
      of: [{ type: 'mediaBlock' }, { type: 'image' }],
    }),

    // --- Dates ---
    defineField({
      name: 'publishDate',
      title: 'Publish Date',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: 'expiresAt',
      title: 'Expires At',
      type: 'datetime',
      description: 'Optional expiration for time-sensitive content (opportunities, announcements)',
    }),

    ...commonMeta,

    // --- Governance (with defaults) ---
    ...governanceFields,
  ],

  initialValue: {
    archivalStatus: 'alumni-only',
    narrativeOwner: 'futuro',
    accessLevel: 'all-alumni',
  },

  preview: {
    select: {
      title: 'title',
      contentType: 'contentType',
      accessLevel: 'accessLevel',
    },
    prepare({ title, contentType, accessLevel }) {
      return {
        title: title || 'Untitled Alumni Content',
        subtitle: `${contentType || '—'} | ${accessLevel || '—'}`,
      }
    },
  },
})
