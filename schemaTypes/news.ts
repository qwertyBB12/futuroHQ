import { defineType, defineField } from 'sanity'
import { governanceFields } from './blocks/governanceBlock'

export default defineType({
  name: 'news',
  title: 'News Article',
  type: 'document',
  description:
    'News articles, updates, and announcements for futuro.ngo and ecosystem sites. ' +
    'Default narrativeOwner: "benext". Default platformTier: "institutional". Default archivalStatus: "archival". ' +
    'Institutional voice — third person, factual, measured. ' +
    'Categories: update, alumni, impact, event. Used on /news and /news/[slug].',
  initialValue: {
    narrativeOwner: 'benext',
    platformTier: 'institutional',
    archivalStatus: 'archival',
  },
  fields: [
    // --- Publish toggle pinned at top ---
    defineField({
      name: 'publish',
      title: 'Publish?',
      type: 'boolean',
      initialValue: true,
      description: 'Toggle to control if this article is visible on the site',
    }),

    // --- Core ---
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'Headline for the article',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      description: 'URL-friendly identifier generated from the title',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'publishDate',
      title: 'Publish Date',
      type: 'date',
      description: 'Display date for the article',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'excerpt',
      title: 'Excerpt',
      type: 'text',
      rows: 3,
      description: 'Short summary displayed in cards and listings (max 200 chars)',
      validation: Rule => Rule.max(200).warning('Keep excerpts under 200 characters for card layouts'),
    }),

    // --- Body ---
    defineField({
      name: 'body',
      title: 'Body',
      type: 'array',
      description: 'Full article content using Portable Text',
      of: [
        {
          type: 'block',
          styles: [
            { title: 'Normal', value: 'normal' },
            { title: 'H2', value: 'h2' },
            { title: 'H3', value: 'h3' },
            { title: 'Quote', value: 'blockquote' },
          ],
          marks: {
            decorators: [
              { title: 'Bold', value: 'strong' },
              { title: 'Italic', value: 'em' },
            ],
            annotations: [
              {
                name: 'link',
                type: 'object',
                title: 'Link',
                fields: [
                  {
                    name: 'href',
                    type: 'url',
                    title: 'URL',
                    validation: Rule => Rule.uri({ allowRelative: true }),
                  },
                ],
              },
            ],
          },
        },
        {
          type: 'image',
          options: { hotspot: true },
          fields: [
            defineField({
              name: 'alt',
              title: 'Alt Text',
              type: 'string',
              description: 'Describe the image for accessibility',
            }),
            defineField({
              name: 'caption',
              title: 'Caption',
              type: 'string',
            }),
          ],
        },
      ],
    }),

    // --- Media ---
    defineField({
      name: 'featuredImage',
      title: 'Featured Image',
      type: 'image',
      options: { hotspot: true },
      description: 'Hero image displayed at the top of the article and in cards',
    }),

    // --- Classification ---
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      description: 'Categorize the article for filtering and display',
      options: {
        list: [
          { title: 'Update', value: 'update' },
          { title: 'Alumni', value: 'alumni' },
          { title: 'Impact', value: 'impact' },
          { title: 'Event', value: 'event' },
        ],
        layout: 'radio',
      },
      initialValue: 'update',
    }),
    defineField({
      name: 'featured',
      title: 'Featured?',
      type: 'boolean',
      initialValue: false,
      description: 'Feature this article prominently on the news page',
    }),

    // --- Author ---
    defineField({
      name: 'author',
      title: 'Author',
      type: 'reference',
      to: [{ type: 'person' }],
      description: 'Select the author of this article',
    }),

    // --- Tags ---
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'tag' }] }],
    }),

    // --- SEO (shared block) ---
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seoBlock',
      description: 'Override SEO metadata for this article when needed',
    }),

    // --- Governance ---
    ...governanceFields,
  ],

  orderings: [
    {
      title: 'Publish Date (Newest)',
      name: 'publishDateDesc',
      by: [{ field: 'publishDate', direction: 'desc' }],
    },
    {
      title: 'Publish Date (Oldest)',
      name: 'publishDateAsc',
      by: [{ field: 'publishDate', direction: 'asc' }],
    },
  ],

  preview: {
    select: {
      title: 'title',
      date: 'publishDate',
      category: 'category',
      media: 'featuredImage',
    },
    prepare({ title, date, category, media }) {
      const categoryLabel = category ? category.charAt(0).toUpperCase() + category.slice(1) : ''
      return {
        title: title || 'Untitled Article',
        subtitle: [categoryLabel, date].filter(Boolean).join(' · '),
        media,
      }
    },
  },
})
