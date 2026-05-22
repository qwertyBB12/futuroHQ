import { defineType, defineField } from 'sanity'
import {featuredContentField} from './blocks/featuredContentField'

export default defineType({
  name: 'collaborator',
  title: 'Collaborator / Organization',
  type: 'document',
  fields: [
    // --- Publish toggle ---
    defineField({
      name: 'publish',
      title: 'Publish?',
      type: 'boolean',
      initialValue: true,
      description: 'Toggle to control if this collaborator is visible across ecosystem',
    }),

    // --- Core ---
    defineField({
      name: 'name',
      title: 'Organization Name',
      type: 'string',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'name', maxLength: 96 },
      description: 'URL path for the collaborator profile page',
    }),
    defineField({
      name: 'orgType',
      title: 'Type',
      type: 'string',
      description: 'Classify organization type (University, High School, NGO, etc.)',
      options: {
        list: [
          { title: 'NGO', value: 'ngo' },
          { title: 'University', value: 'university' },
          { title: 'Government', value: 'government' },
          { title: 'Corporation', value: 'corporation' },
          { title: 'Foundation', value: 'foundation' },
          { title: 'High School', value: 'highschool' }, // ✅ new
          { title: 'Other', value: 'other' },
        ]
      }
    }),
    defineField({ name: 'bio', title: 'About / Biography', type: 'text' }),
    defineField({
      name: 'logo',
      title: 'Logo',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({ name: 'website', title: 'Website', type: 'url' }),
    defineField({
      name: 'order',
      title: 'Order',
      type: 'number',
      description: 'Controls sorting priority (lower = higher priority)',
    }),
    defineField({
      name: 'isFuturoHost',
      title: 'Is Futuro Summit Host?',
      type: 'boolean',
      initialValue: false,
      description: 'Flag collaborators that qualify as Futuro Summit host institutions',
    }),

    // --- Dossier metadata (Phase 65 design) ---
    defineField({
      name: 'country',
      title: 'Country / Region',
      type: 'string',
      description: 'Shown in the hero eyebrow. e.g. "USA", "Spain", "Panama".',
    }),
    defineField({
      name: 'firstCollaborationYear',
      title: 'First Collaboration Year',
      type: 'number',
      description: 'Year of the first joint convening or engagement. Shown as "Since {year}" in the hero eyebrow.',
      validation: Rule => Rule.min(1900).max(2100).integer(),
    }),
    defineField({
      name: 'pullQuote',
      title: 'Hero Pull Quote',
      type: 'object',
      description: 'Attributed quote from a principal at this institution. Renders in the hero.',
      fields: [
        defineField({ name: 'text', title: 'Quote', type: 'text', rows: 3 }),
        defineField({ name: 'speakerName', title: 'Speaker Name', type: 'string' }),
        defineField({ name: 'speakerRole', title: 'Speaker Role', type: 'string', description: 'e.g. "Secretary General · 2015–2024"' }),
      ],
    }),
    defineField({
      name: 'recordStats',
      title: 'Record — Stats Strip',
      type: 'object',
      description: 'Four curator-set stats shown on the warm-paper Record section. Section hides if fewer than 3 are set.',
      fields: [
        defineField({ name: 'yearsOfCollaboration', title: 'Years of Collaboration', type: 'number' }),
        defineField({ name: 'conveningsHosted', title: 'Convenings Hosted', type: 'number' }),
        defineField({ name: 'projectAuthorsEngaged', title: 'Project Authors Engaged', type: 'number' }),
        defineField({ name: 'legacyProjectsSupported', title: 'Legacy Projects Supported', type: 'number' }),
      ],
    }),
    defineField({
      name: 'featuredVideo',
      title: 'In Their Voice — Featured Video',
      type: 'object',
      description: 'Single video of a principal speaking. Section hides if empty.',
      fields: [
        defineField({
          name: 'platform',
          title: 'Platform',
          type: 'string',
          options: { list: [{ title: 'Wistia', value: 'wistia' }, { title: 'YouTube', value: 'youtube' }] },
        }),
        defineField({ name: 'mediaId', title: 'Media ID', type: 'string', description: 'Wistia hashed ID or YouTube video ID.' }),
        defineField({ name: 'speakerName', title: 'Speaker Name', type: 'string' }),
        defineField({ name: 'title', title: 'Video Title', type: 'string' }),
        defineField({ name: 'durationSeconds', title: 'Duration (seconds)', type: 'number' }),
      ],
    }),
    defineField({
      name: 'sharedWork',
      title: 'Shared Work — Engagements',
      type: 'array',
      description: 'Concrete engagements, in chronological order. Each entry becomes a card on the warm-paper Shared Work section.',
      of: [{
        type: 'object',
        fields: [
          defineField({ name: 'year', title: 'Year', type: 'number', validation: Rule => Rule.required().min(1900).max(2100).integer() }),
          defineField({
            name: 'engagementType',
            title: 'Type',
            type: 'string',
            options: { list: [
              { title: 'Convening', value: 'Convening' },
              { title: 'Policy Dialogue', value: 'Policy Dialogue' },
              { title: 'Advisory', value: 'Advisory' },
              { title: 'Project Work', value: 'Project Work' },
              { title: 'Other', value: 'Other' },
            ]},
          }),
          defineField({ name: 'title', title: 'Title', type: 'string', validation: Rule => Rule.required() }),
          defineField({ name: 'description', title: 'Short description', type: 'text', rows: 2 }),
          defineField({ name: 'whatHappened', title: 'What Happened', type: 'text', rows: 2 }),
          defineField({ name: 'whatItProduced', title: 'What It Produced', type: 'text', rows: 2 }),
        ],
        preview: {
          select: { title: 'title', subtitle: 'year' },
          prepare({ title, subtitle }) { return { title, subtitle: subtitle ? String(subtitle) : '—' } },
        },
      }],
    }),

    // --- Media ---
    defineField({
      name: 'media',
      title: 'Media Assets',
      type: 'array',
      of: [{ type: 'mediaBlock' }, { type: 'image', options: { hotspot: true } }],
    }),

    // --- Links ---
    defineField({
      name: 'relatedProjects',
      title: 'Related Projects',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'project' }] }],
    }),
    defineField({
      name: 'relatedPeople',
      title: 'Key People',
      type: 'array',
      of: [
        { type: 'reference', to: [{ type: 'ledgerPerson' }, { type: 'alumni' }, { type: 'person' }] }
      ],
    }),
    featuredContentField,

    // --- Narrative (shared block) ---
    defineField({
      name: 'narrative',
      title: 'Narrative Development',
      type: 'narrativeBlock',
    }),

    // --- SEO (shared block) ---
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seoBlock',
    }),
  ],

  preview: {
    select: { title: 'name', subtitle: 'orgType', media: 'logo.asset' },
    prepare({ title, subtitle, media }) {
      return {
        title: title || 'Unnamed Collaborator',
        subtitle: subtitle || '—',
        media,
      }
    }
  }
})
