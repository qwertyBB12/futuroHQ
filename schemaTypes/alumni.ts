import { defineType, defineField } from 'sanity'
import { governanceFields } from './blocks/governanceBlock'

export default defineType({
  name: 'alumni',
  title: 'Alumni',
  type: 'document',
  fieldsets: [
    {
      name: 'companion',
      title: 'Companion Platform',
      options: { collapsible: true, collapsed: true },
    },
  ],
  fields: [
    // --- Publish toggle pinned at top ---
    defineField({
      name: 'publish',
      title: 'Publish?',
      type: 'boolean',
      initialValue: true,
      description: 'Toggle to control if this entry is visible across ecosystem'
    }),

    // --- Core ---
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'name', maxLength: 96 },
      description: 'URL-friendly identifier',
    }),
    defineField({ name: 'country', title: 'Country', type: 'string' }),
    defineField({ name: 'bio', title: 'Biography', type: 'text' }),

    // --- Media ---
    defineField({
      name: 'media',
      title: 'Media Assets',
      type: 'array',
      of: [{ type: 'mediaBlock' }, { type: 'image' }],
    }),

    // --- Project Links ---
    defineField({
      name: 'currentProjects',
      title: 'Current Projects',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'project' }] }],
      description: 'Projects they are currently active in',
    }),
    defineField({
      name: 'previousProjects',
      title: 'Previous Projects',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'project' }] }],
      description: 'Past projects this alumni has contributed to',
    }),

    // --- Order ---
    defineField({
      name: 'order',
      title: 'Order',
      type: 'number',
      description: 'Controls sorting priority (lower = higher priority)',
    }),

    // --- Companion Platform (new fields — all optional) ---
    defineField({
      name: 'cohortYear',
      title: 'Cohort Year',
      type: 'number',
      fieldset: 'companion',
    }),
    defineField({
      name: 'generation',
      title: 'Generation',
      type: 'string',
      options: {
        list: [
          { title: 'Emerging Leader', value: 'emerging' },
          { title: 'Changemaker', value: 'changemaker' },
          { title: 'Legacy Architect', value: 'legacy-architect' },
        ],
      },
      fieldset: 'companion',
    }),
    defineField({
      name: 'convening',
      title: 'Convening (Futuro Summit)',
      type: 'reference',
      to: [{ type: 'futuroSummit' }],
      fieldset: 'companion',
    }),
    defineField({
      name: 'engagementLevel',
      title: 'Engagement Level',
      type: 'string',
      options: {
        list: [
          { title: 'Active', value: 'active' },
          { title: 'Periodic', value: 'periodic' },
          { title: 'Dormant', value: 'dormant' },
          { title: 'Lost Contact', value: 'lost-contact' },
        ],
      },
      fieldset: 'companion',
    }),
    defineField({
      name: 'lastContactDate',
      title: 'Last Contact Date',
      type: 'date',
      fieldset: 'companion',
    }),
    defineField({
      name: 'skills',
      title: 'Skills',
      type: 'array',
      of: [{ type: 'string' }],
      fieldset: 'companion',
    }),
    defineField({
      name: 'interests',
      title: 'Interests',
      type: 'array',
      of: [{ type: 'string' }],
      fieldset: 'companion',
    }),
    defineField({
      name: 'location',
      title: 'Location',
      type: 'object',
      fields: [
        defineField({ name: 'city', title: 'City', type: 'string' }),
        defineField({ name: 'country', title: 'Country', type: 'string' }),
        defineField({ name: 'region', title: 'Region', type: 'string' }),
      ],
      fieldset: 'companion',
    }),
    defineField({
      name: 'contactInfo',
      title: 'Contact Info',
      type: 'object',
      description: 'INTERNAL — Never exposed in public queries',
      fields: [
        defineField({ name: 'email', title: 'Email', type: 'string' }),
        defineField({ name: 'phone', title: 'Phone', type: 'string' }),
        defineField({ name: 'preferredChannel', title: 'Preferred Channel', type: 'string' }),
      ],
      fieldset: 'companion',
    }),
    defineField({
      name: 'preferredLanguage',
      title: 'Preferred Language',
      type: 'string',
      description: 'ISO language code (e.g. en, es, pt)',
      fieldset: 'companion',
    }),
    defineField({
      name: 'founderReadiness',
      title: 'Founder Readiness',
      type: 'string',
      description: 'INTERNAL — Never surface to participants',
      options: {
        list: [
          { title: 'Exploring', value: 'exploring' },
          { title: 'Ideating', value: 'ideating' },
          { title: 'Building', value: 'building' },
          { title: 'Scaling', value: 'scaling' },
          { title: 'Mentoring', value: 'mentoring' },
        ],
      },
      fieldset: 'companion',
    }),
    defineField({
      name: 'onboardingDate',
      title: 'Onboarding Date',
      type: 'date',
      fieldset: 'companion',
    }),
    defineField({
      name: 'lastLoginDate',
      title: 'Last Login Date',
      type: 'datetime',
      fieldset: 'companion',
    }),
    defineField({
      name: 'journeyNotes',
      title: 'Journey Notes',
      type: 'text',
      description: 'INTERNAL — Private notes on this participant\'s journey',
      fieldset: 'companion',
    }),

    // --- Narrative (shared block) ---
    defineField({
      name: 'narrative',
      title: 'Narrative Development',
      type: 'narrativeBlock',
    }),

    // --- External Identity ---
    defineField({
      name: 'externalIds',
      title: 'External IDs',
      type: 'object',
      description: 'Deduplication keys for external system imports',
      fields: [
        defineField({ name: 'supabase', title: 'Supabase User ID', type: 'string' }),
        defineField({ name: 'kajabi', title: 'Kajabi Contact ID', type: 'string' }),
      ],
      options: { collapsible: true, collapsed: true },
    }),

    // --- Governance ---
    ...governanceFields,
  ],

  preview: {
    select: { 
      title: 'name', 
      subtitle: 'country', 
      mediaBlockThumb: 'media.0.thumbnail',
      mediaImage: 'media.0.asset'
    },
    prepare({ title, subtitle, mediaBlockThumb, mediaImage }) {
      return {
        title: title || 'Unnamed Alumni',
        subtitle: subtitle || '—',
        media: mediaBlockThumb || mediaImage || undefined,
      }
    }
  }
})