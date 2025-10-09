import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'tag',
  title: 'Tag',
  type: 'document',
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
