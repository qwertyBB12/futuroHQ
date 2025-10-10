import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'futuroSummit',
  title: 'Futuro Summit',
  type: 'document',
  description: 'Central record for each Futuro Summit experience',
  fields: [
    defineField({
      name: 'title',
      title: 'Name',
      type: 'string',
      description: 'Official name of this Futuro Summit',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'subtitle',
      title: 'Subtitle',
      type: 'string',
      description: 'Optional subheading or theme for the summit',
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      description: 'URL-friendly identifier generated from the summit name',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'dateRange',
      title: 'Date Range',
      type: 'object',
      description: 'Start and end dates for the summit program',
      fields: [
        defineField({
          name: 'startDate',
          title: 'Start Date',
          type: 'date',
          description: 'First day of the summit',
        }),
        defineField({
          name: 'endDate',
          title: 'End Date',
          type: 'date',
          description: 'Last day of the summit',
        }),
      ],
    }),
    defineField({
      name: 'location',
      title: 'Location',
      type: 'string',
      description: 'City, campus, or digital venue where the summit is hosted',
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 4,
      description: 'Markdown-friendly overview that captures key details and vibe',
    }),
    defineField({
      name: 'callToAction',
      title: 'Call To Action',
      type: 'object',
      description: 'Primary CTA copy and URL used to drive applicants or RSVPs',
      fields: [
        defineField({
          name: 'copy',
          title: 'CTA Copy',
          type: 'string',
          description: 'Button or link text used for the CTA',
        }),
        defineField({
          name: 'url',
          title: 'CTA URL',
          type: 'url',
          description: 'Destination link for the CTA',
        }),
      ],
    }),
    defineField({
      name: 'featuredProjects',
      title: 'Featured Projects',
      type: 'array',
      description: 'Projects highlighted as part of this summit experience',
      of: [{ type: 'reference', to: [{ type: 'project' }] }],
    }),
    defineField({
      name: 'hostInstitution',
      title: 'Host Institution',
      type: 'reference',
      to: [{ type: 'collaborator' }],
      description: 'Select the organization hosting this Futuro Summit',
      options: {
        filter: 'isFuturoHost == true',
      },
    }),
    defineField({
      name: 'coverImage',
      title: 'Cover Image',
      type: 'image',
      options: { hotspot: true },
      description: 'Optional cover image or hero asset for the summit landing page',
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seoBlock',
      description: 'Override SEO metadata for the summit page when needed',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'subtitle',
      media: 'coverImage',
    },
    prepare({ title, subtitle, media }) {
      return {
        title: title || 'Untitled Futuro Summit',
        subtitle: subtitle || 'Subtitle pending',
        media,
      }
    },
  },
})
