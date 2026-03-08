import { defineType, defineField } from 'sanity'
import { commonMeta } from './blocks/commonMeta'
import { governanceFields } from './blocks/governanceBlock'

export default defineType({
  name: 'curatedPost',
  title: 'Curated Post (Third-Party)',
  type: 'document',
  description:
    'Third-party content curated with original commentary. ' +
    'Default narrativeOwner: "hector". Default platformTier: "distribution". Default archivalStatus: "ephemeral". ' +
    'The title is YOUR headline (not the original). The body is YOUR interpretation or framing. ' +
    'Always include the original source URL and author attribution. ' +
    'This is curation as editorial act — why does this matter to the ecosystem?',
  fields: [
    // --- Core ---
    defineField({
      name: 'title',
      title: 'Your Headline',
      type: 'string',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
    }),
    defineField({ 
      name: 'body', 
      title: 'Your Commentary', 
      type: 'text',
      description: 'Your interpretation, framing, or additional context'
    }),

    // --- Source Metadata ---
    defineField({
      name: 'sourceType',
      title: 'Source Type',
      type: 'string',
      options: { 
        list: [
          { title: 'Article', value: 'article' },
          { title: 'YouTube', value: 'youtube' },
          { title: 'Podcast', value: 'podcast' },
          { title: 'Tweet / X Post', value: 'tweet' },
          { title: 'Other', value: 'other' },
        ]
      },
    }),
    defineField({ 
      name: 'originalSourceUrl', 
      title: 'Original Source URL', 
      type: 'url',
      description: 'Link to the original article, video, or social post'
    }),
    defineField({ name: 'sourceAuthor', title: 'Source Author/Org', type: 'string' }),

    // --- Media ---
    defineField({
      name: 'media',
      title: 'Optional Media/Embed',
      type: 'array',
      of: [{ type: 'mediaBlock' }, { type: 'image' }],
    }),

    // --- Meta ---
    defineField({ 
      name: 'datePublished', 
      title: 'Publish Date', 
      type: 'datetime',
      initialValue: () => new Date().toISOString()
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'tag' }] }],
      description: 'Reusable tag references for categorization and filtering',
    }),

    // --- Narrative & SEO ---
    defineField({ name: 'narrative', title: 'Narrative Development', type: 'narrativeBlock' }),
    defineField({ name: 'seo', title: 'SEO', type: 'seoBlock' }),
    ...commonMeta,

    // --- Governance ---
    ...governanceFields,
  ],

  preview: {
    select: { title: 'title', subtitle: 'sourceType', media: 'media.0.thumbnail' },
    prepare({ title, subtitle, media }) {
      return { 
        title: title || 'Untitled Curated Post', 
        subtitle: subtitle || '—', 
        media 
      }
    }
  }
})
