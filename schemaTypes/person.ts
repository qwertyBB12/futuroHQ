import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'person',
  title: 'Person',
  type: 'document',
  fields: [
    // --- Publish toggle pinned at top ---
    defineField({
      name: 'publish',
      title: 'Publish?',
      type: 'boolean',
      initialValue: true,
      description: 'Toggle to control if this person is visible across ecosystem',
    }),

    // --- Order for manual prioritization ---
    defineField({
      name: 'order',
      title: 'Order',
      type: 'number',
      description: 'Controls manual ordering across lists',
    }),

    // --- Core ---
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({ name: 'role', title: 'Role', type: 'string' }),
    defineField({ name: 'bio', title: 'Bio', type: 'text' }),

    // --- Media ---
    defineField({
      name: 'photo',
      title: 'Photo',
      type: 'mediaBlock', // ✅ unified block
    }),
    defineField({
      name: 'altText',
      title: 'Alt Text (Accessibility)',
      type: 'string',
      description: 'Alternative text for screen readers and SEO',
    }),
  ],

  preview: {
    select: {
      title: 'name',
      subtitle: 'role',
      media: 'photo.thumbnail', // <-- Sanity will pull image object from mediaBlock
    },
    prepare({ title, subtitle, media }) {
      return {
        title: title || 'Unnamed Person',
        subtitle: subtitle || '—',
        media,
      }
    },
  },
})