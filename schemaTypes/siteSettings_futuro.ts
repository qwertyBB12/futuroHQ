import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'siteSettings_futuro',
  title: 'Futuro Site Settings',
  type: 'document',
  description: 'Global configuration powering futuro.ngo defaults, metadata, and shared UI copy',
  fields: [
    defineField({
      name: 'siteTitle',
      title: 'Site Title',
      type: 'string',
      description: 'Primary site title used in navigation, browser tabs, and metadata',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'metaDescription',
      title: 'Meta Description',
      type: 'text',
      rows: 3,
      description: 'Default SEO description applied when pages do not provide their own',
    }),
    defineField({
      name: 'defaultSocialImage',
      title: 'Default Social Image',
      type: 'image',
      options: { hotspot: true },
      description: 'Fallback Open Graph / social sharing image for the site',
    }),
    defineField({
      name: 'globalCta',
      title: 'Global Call To Action',
      type: 'object',
      description: 'Reusable CTA surfaced across the site (e.g., Apply or Donate)',
      fields: [
        defineField({
          name: 'copy',
          title: 'CTA Copy',
          type: 'string',
          description: 'Button or link copy for the CTA',
        }),
        defineField({
          name: 'url',
          title: 'CTA URL',
          type: 'url',
          description: 'Destination link triggered by the CTA',
        }),
      ],
    }),
    defineField({
      name: 'socialLinks',
      title: 'Social Links',
      type: 'array',
      description: 'Structured list of Futuro social channels',
      of: [
        defineField({
          name: 'socialLink',
          title: 'Social Link',
          type: 'object',
          fields: [
            defineField({
              name: 'platform',
              title: 'Platform',
              type: 'string',
              description: 'Name of the social platform (e.g., Instagram, LinkedIn)',
            }),
            defineField({
              name: 'url',
              title: 'URL',
              type: 'url',
              description: 'Full URL to the social profile',
            }),
            defineField({
              name: 'handle',
              title: 'Handle',
              type: 'string',
              description: 'Optional handle or username for display',
            }),
          ],
        }),
      ],
    }),
    defineField({
      name: 'footerCopy',
      title: 'Footer Copy',
      type: 'text',
      rows: 3,
      description: 'Reusable footer text such as mission statements or legal language',
    }),
  ],
  preview: {
    select: {
      title: 'siteTitle',
      subtitle: 'globalCta.copy',
      media: 'defaultSocialImage',
    },
    prepare({ title, subtitle, media }) {
      return {
        title: title || 'Futuro Site Settings',
        subtitle: subtitle || 'CTA not set',
        media,
      }
    },
  },
})
