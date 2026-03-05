import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'tag',
  title: 'Tag',
  type: 'document',
  description:
    'Reusable taxonomy tag referenced across all content types via tags_ref. ' +
    'Not governed — tags are cross-entity by design. ' +
    'Include label, slug, and optional color for visual differentiation. ' +
    'Prefer creating tags here and referencing them (tags_ref) over legacy string tags.',
  fields: [
    defineField({
      name: 'label',
      title: 'Label',
      type: 'string',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'label', maxLength: 96},
    }),
    defineField({
      name: 'color',
      title: 'Color (hex)',
      type: 'string',
    }),
  ],
  preview: {
    select: {title: 'label'},
  },
})
