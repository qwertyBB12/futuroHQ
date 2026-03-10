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
      name: 'navLinks',
      title: 'Navigation Links',
      type: 'array',
      description: 'Ordered list of navigation links rendered in the site header',
      of: [
        {
          name: 'navLinkItem',
          title: 'Nav Link',
          type: 'object',
          fields: [
            defineField({
              name: 'label',
              title: 'Label',
              type: 'string',
              description: 'English navigation label',
              validation: Rule => Rule.required(),
            }),
            defineField({
              name: 'labelEs',
              title: 'Label (ES)',
              type: 'string',
              description: 'Spanish variant — navigation label',
            }),
            defineField({
              name: 'href',
              title: 'Link Path',
              type: 'string',
              description: 'URL path or full URL for the navigation link',
              validation: Rule => Rule.required(),
            }),
          ],
        },
      ],
    }),
    defineField({
      name: 'metaDescription',
      title: 'Meta Description',
      type: 'text',
      rows: 3,
      description: 'Default SEO description applied when pages do not provide their own',
    }),
    defineField({
      name: 'metaDescriptionEs',
      title: 'Meta Description (ES)',
      type: 'text',
      rows: 3,
      description: 'Spanish variant — default SEO description applied when pages do not provide their own',
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
          name: 'copyEs',
          title: 'CTA Copy (ES)',
          type: 'string',
          description: 'Spanish variant — button or link copy for the CTA',
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
    // --- About Page ---
    defineField({
      name: 'aboutHeroHeading',
      title: 'About Hero Heading',
      type: 'string',
      description: 'Main heading on the About page',
    }),
    defineField({
      name: 'aboutHeroHeadingEs',
      title: 'About Hero Heading (ES)',
      type: 'string',
      description: 'Spanish variant — main heading on the About page',
    }),
    defineField({
      name: 'aboutHeroLead',
      title: 'About Hero Lead',
      type: 'text',
      rows: 3,
      description: 'Introductory paragraph beneath the About hero heading',
    }),
    defineField({
      name: 'aboutHeroLeadEs',
      title: 'About Hero Lead (ES)',
      type: 'text',
      rows: 3,
      description: 'Spanish variant — introductory paragraph beneath the About hero heading',
    }),
    defineField({
      name: 'aboutBody',
      title: 'About Body',
      type: 'text',
      rows: 12,
      description: 'Extended About page body copy (plain text)',
    }),
    defineField({
      name: 'aboutBodyEs',
      title: 'About Body (ES)',
      type: 'text',
      rows: 12,
      description: 'Spanish variant — extended About page body copy (plain text)',
    }),
    defineField({
      name: 'footerCopy',
      title: 'Footer Copy',
      type: 'text',
      rows: 3,
      description: 'Reusable footer text such as mission statements or legal language',
    }),
    defineField({
      name: 'footerCopyEs',
      title: 'Footer Copy (ES)',
      type: 'text',
      rows: 3,
      description: 'Spanish variant — reusable footer text such as mission statements or legal language',
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
