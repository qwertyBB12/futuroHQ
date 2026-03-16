import { defineType, defineField } from 'sanity'
import { governanceFields } from './blocks/governanceBlock'
import {surfaceOnField} from './blocks/surfaceOnField'
import {featuredInField} from './blocks/featuredInField'

export default defineType({
  name: 'essay',
  title: 'Essay',
  type: 'document',
  description:
    'Primary content type for long-form writing. ' +
    'Default narrativeOwner: "hector" (unless explicitly creating for another entity). ' +
    'Default platformTier: "canonical". Default archivalStatus: "archival". ' +
    'Always populate seo with title, description, and keywords. ' +
    'Language is English unless explicitly specified. ' +
    'The essay body uses Portable Text. Write in cinematic, literary, reflective prose — bold but not bombastic. ' +
    'Never use sovereignty/lexicon terms in essay content (these are internal-only vocabulary).',
  initialValue: {
    narrativeOwner: 'hector',
    platformTier: 'canonical',
    archivalStatus: 'archival',
  },
  groups: [
    {name: 'distribution', title: 'Distribution'},
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'language',
      title: 'Language',
      type: 'string',
      options: {
        list: [
          { title: 'English', value: 'en' },
          { title: 'Spanish', value: 'es' },
        ],
      },
      initialValue: 'en',
    }),
    defineField({
      name: 'publicationVenue',
      title: 'Publication Venue',
      type: 'string',
      options: {
        list: [
          { title: 'Substack (EN)', value: 'substack-en' },
          { title: 'Cuadernos (ES)', value: 'cuadernos-es' },
          { title: 'Al Dia', value: 'aldia' },
          { title: 'Original', value: 'original' },
        ],
      },
    }),
    defineField({
      name: 'externalUrl',
      title: 'External URL',
      type: 'url',
      description: 'Optional link to Substack, Cuadernos, or Al Dia',
    }),
    defineField({
      name: 'publishDate',
      title: 'Publish Date',
      type: 'datetime',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'array',
      of: [{ type: 'block' }],
    }),
    defineField({
      name: 'excerpt',
      title: 'Excerpt',
      type: 'text',
      description: 'Max 300 characters',
      validation: (Rule) => Rule.max(300),
    }),
    defineField({
      name: 'coverImage',
      title: 'Cover Image',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'fiveYearTest',
      title: 'Five Year Test',
      type: 'boolean',
      initialValue: false,
      description: 'Will I be proud of this in 2030?',
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'tag' }] }],
    }),
    featuredInField,
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seoBlock',
    }),
    surfaceOnField,
    ...governanceFields,
  ],
  preview: {
    select: {
      title: 'title',
      date: 'publishDate',
      language: 'language',
      media: 'coverImage',
    },
    prepare({ title, date, language, media }) {
      const dateStr = date ? new Date(date).toLocaleDateString() : ''
      const lang = language === 'es' ? '[ES]' : ''
      return {
        title: title || 'Untitled Essay',
        subtitle: [lang, dateStr].filter(Boolean).join(' · '),
        media,
      }
    },
  },
})
