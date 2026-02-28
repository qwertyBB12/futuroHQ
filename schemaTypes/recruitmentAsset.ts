import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'recruitmentAsset',
  title: 'Recruitment Asset',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'chapter',
      title: 'Chapter',
      type: 'number',
      description: 'Which chapter of the 7-chapter narrative arc this asset belongs to',
      validation: Rule => Rule.required().min(1).max(7),
      options: {
        list: [
          { title: 'Ch. 1 — The Signal', value: 1 },
          { title: 'Ch. 2 — The Declaration', value: 2 },
          { title: 'Ch. 3 — The Witness', value: 3 },
          { title: 'Ch. 4 — The Archive', value: 4 },
          { title: 'Ch. 5 — The Review', value: 5 },
          { title: 'Ch. 6 — The Invitation', value: 6 },
          { title: 'Ch. 7 — The Crossing', value: 7 },
        ],
      },
    }),
    defineField({
      name: 'assetType',
      title: 'Asset Type',
      type: 'string',
      options: {
        list: [
          { title: 'Photo (convening)', value: 'photo' },
          { title: 'Video (Wistia)', value: 'video' },
          { title: 'Quote', value: 'quote' },
          { title: 'Statistic', value: 'stat' },
          { title: 'Testimonial', value: 'testimonial' },
        ],
      },
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: { hotspot: true },
      hidden: ({ parent }) => parent?.assetType === 'video' || parent?.assetType === 'quote' || parent?.assetType === 'stat',
    }),
    defineField({
      name: 'videoUrl',
      title: 'Video URL',
      type: 'url',
      description: 'Wistia or YouTube URL for video assets',
      hidden: ({ parent }) => parent?.assetType !== 'video',
    }),
    defineField({
      name: 'videoPlatformId',
      title: 'Video Platform ID',
      type: 'string',
      description: 'Wistia hashed ID or YouTube video ID',
      hidden: ({ parent }) => parent?.assetType !== 'video',
    }),
    defineField({
      name: 'text',
      title: 'Text Content',
      type: 'text',
      description: 'Quote text, testimonial text, or stat value',
    }),
    defineField({
      name: 'attribution',
      title: 'Attribution',
      type: 'string',
      description: 'Quote/testimonial attribution — name, title, country',
    }),
    defineField({
      name: 'linkedPerson',
      title: 'Linked Person',
      type: 'reference',
      to: [{ type: 'ledgerPerson' }, { type: 'alumni' }],
      description: 'The person this asset is about, if applicable',
    }),
    defineField({
      name: 'language',
      title: 'Language',
      type: 'string',
      options: { list: ['en', 'es', 'both'] },
      initialValue: 'both',
    }),
    defineField({
      name: 'isActive',
      title: 'Active',
      type: 'boolean',
      initialValue: true,
    }),
  ],

  preview: {
    select: {
      title: 'title',
      chapter: 'chapter',
      type: 'assetType',
      media: 'image',
    },
    prepare({ title, chapter, type, media }) {
      const chapterNames: Record<number, string> = {
        1: 'The Signal',
        2: 'The Declaration',
        3: 'The Witness',
        4: 'The Archive',
        5: 'The Review',
        6: 'The Invitation',
        7: 'The Crossing',
      }
      return {
        title: title || 'Untitled',
        subtitle: `Ch. ${chapter} — ${chapterNames[chapter] || '?'} (${type})`,
        media,
      }
    },
  },

  orderings: [
    {
      title: 'Chapter',
      name: 'chapterAsc',
      by: [{ field: 'chapter', direction: 'asc' }],
    },
  ],
})
