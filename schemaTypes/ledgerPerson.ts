import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'ledgerPerson',
  title: 'Vanguard Ledger Person',
  type: 'document',
  fields: [
    // --- Publish toggle pinned at top ---
    defineField({
      name: 'publish',
      title: 'Publish?',
      type: 'boolean',
      initialValue: true,
      description: 'Quick toggle: controls if this entry is visible across ecosystem'
    }),

    // --- Order for manual prioritization ---
    defineField({
      name: 'order',
      title: 'Order',
      type: 'number',
      description: 'Controls sorting priority (lower = higher priority)'
    }),

    // --- Identifier ---
    defineField({
      name: 'fullName',
      title: 'Full Name',
      type: 'string',
      validation: Rule => Rule.required(),
    }),
    defineField({ name: 'alias', title: 'Alias / Cinematic Tagline', type: 'string' }),
    defineField({ name: 'currentTitle', title: 'Current Title / Role', type: 'string' }),
    defineField({ name: 'organization', title: 'Organization', type: 'string' }),
    defineField({ name: 'countryOrRegion', title: 'Country or Region', type: 'string' }),

    // --- Affiliations (link to Collaborator) ---
    defineField({
      name: 'affiliatedOrgs',
      title: 'Affiliated Organizations',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'collaborator' }] }],
      description: 'Links to collaborator entities (NGOs, corporations, universities, etc.)',
    }),

    // --- Narrative Development ---
    defineField({ name: 'openingPortrait', title: 'Opening Portrait', type: 'text' }),
    defineField({ name: 'originSignal', title: 'Origin Signal', type: 'text' }),
    defineField({ name: 'strategicIdentity', title: 'Strategic Identity', type: 'text' }),
    defineField({
      name: 'alignmentGrid',
      title: 'Futuro Alignment Grid',
      type: 'array',
      of: [{
        type: 'object',
        fields: [
          { name: 'pillar', title: 'Pillar', type: 'string' },
          { name: 'signal', title: 'Signal', type: 'string' },
        ]
      }],
    }),
    defineField({ name: 'soulmarkSignals', title: 'Soulmark Signals', type: 'array', of: [{ type: 'string' }] }),
    defineField({ name: 'doctrinalLens', title: 'Doctrinal Lens', type: 'text' }),
    defineField({ name: 'animaKey', title: 'Anima Key', type: 'string' }),
    defineField({ name: 'whyTheyBelong', title: 'Why They Belong', type: 'array', of: [{ type: 'string' }] }),
    defineField({ name: 'engagementProtocol', title: 'Engagement Protocol', type: 'text' }),
    defineField({ name: 'legacyVector', title: 'Legacy Vector', type: 'text' }),
    defineField({ name: 'countercurrents', title: 'Countercurrents', type: 'text' }),
    defineField({ name: 'ethosValues', title: 'Ethos & Values', type: 'array', of: [{ type: 'string' }] }),
    defineField({ name: 'futuroEcho', title: 'Futuro Echo', type: 'text' }),

    // --- Media Assets ---
    defineField({
      name: 'richMedia',
      title: 'Rich Media',
      type: 'array',
      of: [
        { type: 'mediaBlock' },   // Videos hosted on Wistia, YouTube, Vimeo
        { type: 'image' },        // Still images
        {
          type: 'object',         // Custom embeds like iframes
          name: 'customEmbed',
          title: 'Custom Embed',
          fields: [
            {
              name: 'embedCode',
              title: 'Embed Code',
              type: 'text',
              description: 'Paste raw HTML/iframe embed here',
            },
            {
              name: 'caption',
              title: 'Caption',
              type: 'string',
            },
          ]
        }
      ]
    }),

    // --- SEO ---
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'object',
      fields: [
        { name: 'slug', title: 'Slug', type: 'slug', options: { source: 'fullName' } },
        { name: 'titleTag', title: 'Title Tag', type: 'string' },
        { name: 'metaDescription', title: 'Meta Description', type: 'text' },
        { name: 'socialImage', title: 'Social Image', type: 'image' },
      ],
    }),

    // --- Meta ---
    defineField({ 
      name: 'publicationStatus', 
      title: 'Publication Status', 
      type: 'string', 
      options: { list: ['DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED'] }, 
      initialValue: 'DRAFT' 
    }),
    defineField({ 
      name: 'visibility', 
      title: 'Visibility', 
      type: 'string', 
      options: { list: ['PUBLIC', 'REGISTERED', 'PRIVATE', 'EMBARGOED'] }, 
      initialValue: 'PUBLIC' 
    }),
    defineField({ name: 'isFeatured', title: 'Featured', type: 'boolean' }),
  ],

  preview: {
    select: {
      title: 'fullName',
      subtitle: 'alias',
      media: 'seo.socialImage',
    },
    prepare({ title, subtitle, media }) {
      return {
        title: title || 'Unnamed Leader',
        subtitle: subtitle || '—',
        media,
      }
    }
  }
})