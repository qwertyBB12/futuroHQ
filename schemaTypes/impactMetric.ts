import { defineType, defineField } from 'sanity'

/**
 * Impact Metric — Updatable statistics for futuro.ngo
 *
 * Replaces hardcoded stats (150+ Project Authors, 12 Countries, etc.)
 * with CMS-managed values that can be updated without deploys.
 * Used on homepage, /impact, and /alumni pages.
 *
 * DECISION: futuroSummit used as-is (Option C from rebuild proposal).
 * No separate program.ts schema needed — convening data lives in futuroSummit.
 */
export default defineType({
  name: 'impactMetric',
  title: 'Impact Metric',
  type: 'document',
  description: 'Updatable impact statistics displayed across futuro.ngo (homepage, impact, alumni)',
  fields: [
    defineField({
      name: 'label',
      title: 'Label',
      type: 'string',
      description: 'Short label displayed below the number (e.g., "Project Authors", "Countries")',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'value',
      title: 'Value',
      type: 'string',
      description: 'The statistic displayed prominently (e.g., "150+", "$28M", "12")',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 2,
      description: 'Optional longer description for expanded views or tooltips',
    }),
    defineField({
      name: 'displayOrder',
      title: 'Display Order',
      type: 'number',
      description: 'Controls the order metrics appear (lower = first)',
      validation: Rule => Rule.required().integer().min(1),
    }),
    defineField({
      name: 'showOnHomepage',
      title: 'Show on Homepage?',
      type: 'boolean',
      initialValue: true,
      description: 'Include this metric in the homepage stats section',
    }),
  ],

  orderings: [
    {
      title: 'Display Order',
      name: 'displayOrderAsc',
      by: [{ field: 'displayOrder', direction: 'asc' }],
    },
  ],

  preview: {
    select: {
      title: 'label',
      subtitle: 'value',
    },
    prepare({ title, subtitle }) {
      return {
        title: subtitle || '—',
        subtitle: title || 'Unnamed Metric',
      }
    },
  },
})
