import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'alumni',
  title: 'Alumni',
  type: 'document',
  fields: [
    // --- Publish toggle pinned at top ---
    defineField({
      name: 'publish',
      title: 'Publish?',
      type: 'boolean',
      initialValue: true,
      description: 'Toggle to control if this entry is visible across ecosystem'
    }),

    // --- Core ---
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: Rule => Rule.required(),
    }),
    defineField({ name: 'country', title: 'Country', type: 'string' }),
    defineField({ name: 'bio', title: 'Biography', type: 'text' }),

    // --- Media ---
    defineField({
      name: 'media',
      title: 'Media Assets',
      type: 'array',
      of: [{ type: 'mediaBlock' }, { type: 'image' }],
    }),

    // --- Project Links ---
    defineField({
      name: 'currentProjects',
      title: 'Current Projects',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'project' }] }],
      description: 'Projects they are currently active in',
    }),
    defineField({
      name: 'previousProjects',
      title: 'Previous Projects',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'project' }] }],
      description: 'Past projects this alumni has contributed to',
    }),

    // --- Order ---
    defineField({
      name: 'order',
      title: 'Order',
      type: 'number',
      description: 'Controls sorting priority (lower = higher priority)',
    }),

    // --- Narrative (shared block) ---
    defineField({
      name: 'narrative',
      title: 'Narrative Development',
      type: 'narrativeBlock',
    }),

    // --- SEO (shared block) ---
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seoBlock',
    }),
  ],

  preview: {
    select: { 
      title: 'name', 
      subtitle: 'country', 
      mediaBlockThumb: 'media.0.thumbnail',
      mediaImage: 'media.0.asset'
    },
    prepare({ title, subtitle, mediaBlockThumb, mediaImage }) {
      return {
        title: title || 'Unnamed Alumni',
        subtitle: subtitle || '—',
        media: mediaBlockThumb || mediaImage || undefined,
      }
    }
  }
})