import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'person',
  title: 'Person',
  type: 'document',
  description:
    'Simple public profiles (name, role, bio, photo) — cross-entity identity records shared across the ecosystem. ' +
    'Intentionally ungoverned: person is a cross-cutting identity type, not multi-entity content, so governanceFields are not applied.',
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
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'name', maxLength: 96 },
      description: 'URL-friendly identifier',
    }),
    defineField({ name: 'role', title: 'Role', type: 'string' }),
    defineField({ name: 'bio', title: 'Bio', type: 'text' }),

    // --- Identity bridge ---
    defineField({
      name: 'supabaseUserId',
      title: 'Supabase User ID',
      type: 'string',
      description: 'Links this person to their Supabase Auth account for gated site access',
      readOnly: true,
    }),

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

    // --- Voice Identification ---
    defineField({
      name: 'voiceSignature',
      title: 'Voice Signature',
      type: 'array',
      of: [{ type: 'number' }],
      readOnly: true,
      hidden: true,
      description: 'Speaker embedding from pyannote diarization (512-dim). Auto-populated by pipeline.',
    }),
    defineField({
      name: 'hasVoiceSignature',
      title: 'Voice Enrolled',
      type: 'boolean',
      readOnly: true,
      initialValue: false,
      description: 'Whether this person has a voice signature for auto-identification.',
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