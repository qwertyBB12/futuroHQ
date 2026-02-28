import { defineType, defineField } from 'sanity'
import { governanceFields } from './blocks/governanceBlock'

export default defineType({
  name: 'pricingTier',
  title: 'Pricing Tier',
  type: 'document',
  description: 'PPP-adjusted pricing configuration. Editable without code changes.',
  fields: [
    // --- Core ---
    defineField({
      name: 'name',
      title: 'Tier Name',
      type: 'string',
      options: {
        list: [
          { title: 'Foundation (Free)', value: 'foundation' },
          { title: 'Builder', value: 'builder' },
          { title: 'Scaling', value: 'scaling' },
          { title: 'Fast-Track', value: 'fast-track' },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'basePrice',
      title: 'Base Price (USD)',
      type: 'number',
      validation: (Rule) => Rule.required().min(0),
    }),
    defineField({
      name: 'countryPricing',
      title: 'Country Pricing (PPP)',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'country',
              title: 'Country',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'price',
              title: 'Price',
              type: 'number',
              validation: (Rule) => Rule.required().min(0),
            }),
            defineField({
              name: 'currency',
              title: 'Currency',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
          ],
          preview: {
            select: { country: 'country', price: 'price', currency: 'currency' },
            prepare({ country, price, currency }) {
              return { title: country || '?', subtitle: `${price} ${currency}` }
            },
          },
        },
      ],
    }),
    defineField({
      name: 'workspaceHoursPerMonth',
      title: 'Workspace Hours / Month',
      type: 'number',
    }),
    defineField({
      name: 'conversationLimit',
      title: 'Conversation Limit',
      type: 'string',
      description: 'e.g. "5/month", "unlimited"',
    }),
    defineField({
      name: 'features',
      title: 'Features',
      type: 'array',
      of: [{ type: 'string' }],
    }),

    // --- Governance ---
    ...governanceFields,
  ],

  preview: {
    select: {
      name: 'name',
      basePrice: 'basePrice',
    },
    prepare({ name, basePrice }) {
      return {
        title: name || 'Untitled Tier',
        subtitle: basePrice != null ? `$${basePrice}/mo` : '—',
      }
    },
  },
})
