import { defineType, defineField } from 'sanity'
import {featuredContentField} from './blocks/featuredContentField'

export default defineType({
  name: 'ledgerPerson',
  title: 'Vanguard Ledger Person',
  type: 'document',
  description:
    'Vanguard Ledger narrative intelligence dossiers — soulmarks, doctrine alignment, strategic grids. ' +
    'Distinct from person (simple identity) and alumni (program graduate profiles). ' +
    'Intentionally ungoverned: ledgerPerson is a cross-cutting identity type used for narrative intelligence, not multi-entity content.',
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

    // --- Vanguard Ledger identifier (used in OG cards: "Vanguard Ledger · № NNN") ---
    defineField({
      name: 'ledgerNumber',
      title: 'Ledger Number',
      type: 'number',
      description: 'Stable sequence number for this Ledger entry. Renders as "№ NNN" in the OG card eyebrow. Assign once and do not change.',
      validation: Rule => Rule.integer().positive(),
    }),

    // --- Identifier ---
    defineField({
      name: 'fullName',
      title: 'Full Name',
      type: 'string',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Legacy Slug',
      type: 'slug',
      description: 'Legacy top-level slug. New records should set the canonical URL slug under SEO. Some queries (e.g. collaborator → relatedPeople) coalesce this field with seo.slug.',
      options: { source: 'fullName', maxLength: 96 },
    }),
    defineField({
      name: 'portrait',
      title: 'Portrait',
      type: 'image',
      options: { hotspot: true },
      description: 'Portrait image for the ledger person — cropable via hotspot.',
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt Text',
          type: 'string',
          description: 'Accessible description of the portrait',
        }),
      ],
    }),
    defineField({
      name: 'galleryPhotos',
      title: 'Gallery Photos',
      type: 'array',
      description: 'Curated stills shown in the "Stills" photo gallery on the profile (paper-formal coda below the narrative). Distinct from the single Portrait above.',
      of: [
        defineField({
          name: 'galleryPhoto',
          title: 'Photo',
          type: 'image',
          options: { hotspot: true },
          fields: [
            defineField({ name: 'alt', title: 'Alt Text', type: 'string' }),
            defineField({ name: 'quote', title: 'Quote (EN)', type: 'text', rows: 2, description: 'Optional standout quote shown under this still (English). Leave blank for a plain image.' }),
            defineField({ name: 'quoteEs', title: 'Quote (ES)', type: 'text', rows: 2, description: 'Spanish version of the quote (their actual words). Shown on the ES page.' }),
          ],
        }),
      ],
    }),
    defineField({ name: 'alias', title: 'Alias / Cinematic Tagline', type: 'string' }),
    defineField({ name: 'currentTitle', title: 'Current Title / Role', type: 'string' }),
    defineField({ name: 'organization', title: 'Organization', type: 'string' }),
    defineField({ name: 'countryOrRegion', title: 'Country or Region', type: 'string' }),
    defineField({
      name: 'location',
      title: 'Location',
      type: 'object',
      description: 'Precise city for the situation-room globe (drives map placement). Mirrors the alumni location field.',
      fields: [
        defineField({ name: 'city', title: 'City', type: 'string' }),
        defineField({ name: 'country', title: 'Country', type: 'string' }),
        defineField({ name: 'region', title: 'Region / State', type: 'string' }),
      ],
    }),

    // --- Affiliations (link to Collaborator) ---
    defineField({
      name: 'affiliatedOrgs',
      title: 'Affiliated Organizations',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'collaborator' }] }],
      description: 'Links to collaborator entities (NGOs, corporations, universities, etc.)',
    }),
    featuredContentField,

    // --- Narrative Development ---
    defineField({ name: 'openingPortrait', title: 'Opening Portrait', type: 'text' }),
    defineField({
      name: 'openingPortraitEs',
      title: 'Opening Portrait (ES)',
      type: 'text',
      description: 'Spanish translation of the Opening Portrait.',
    }),
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

    // --- Featured Videos (pin order on the cross-record gallery) ---
    defineField({
      name: 'featuredVideos',
      title: 'Featured Videos (pinned)',
      type: 'array',
      description:
        'Videos to pin to the front of this member\'s "On the record" gallery on the public profile. ' +
        'Order here = order on the page. Videos not listed appear after, ordered by publishDate desc.',
      of: [{ type: 'reference', to: [{ type: 'video' }] }],
    }),

    // --- Media Assets ---
    defineField({
      name: 'richMedia',
      title: 'Rich Media',
      type: 'array',
      of: [
        { type: 'mediaBlock' },   // Videos hosted on Wistia, YouTube, Vimeo
        { type: 'image', options: { hotspot: true } },        // Still images
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
      type: 'seoBlock',
    }),

    // --- Meta ---
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
      portrait: 'portrait',
    },
    prepare({ title, subtitle, media, portrait }) {
      return {
        title: title || 'Unnamed Leader',
        subtitle: subtitle || '—',
        media: media || portrait,
      }
    }
  }
})