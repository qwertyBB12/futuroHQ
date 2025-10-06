import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'seoBlock',
  title: 'SEO',
  type: 'object',
  fields: [
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { maxLength: 96 },
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'titleTag',
      title: 'Title Tag',
      type: 'string',
      validation: Rule => Rule.max(60).warning('Keep under 60 characters for best SEO'),
    }),
    defineField({
      name: 'metaDescription',
      title: 'Meta Description',
      type: 'text',
      validation: Rule => Rule.max(160).warning('Keep under 160 characters for SEO snippet'),
    }),
    defineField({
      name: 'socialImage',
      title: 'Social Image',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'keywords',
      title: 'Keywords',
      type: 'array',
      of: [{ type: 'string' }],
    }),
  ],
})