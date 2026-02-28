import { defineType, defineField } from 'sanity'
import { governanceFields } from './blocks/governanceBlock'

export default defineType({
  name: 'credential',
  title: 'Credential',
  type: 'document',
  description: 'Credential issued by NeXT, backed by supporting accreditation records',
  fields: [
    // --- Core ---
    defineField({
      name: 'alumni',
      title: 'Alumni',
      type: 'reference',
      to: [{ type: 'alumni' }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'issuedDate',
      title: 'Issued Date',
      type: 'date',
    }),
    defineField({
      name: 'issuedBy',
      title: 'Issued By',
      type: 'string',
      options: {
        list: [{ title: 'NeXT', value: 'next' }],
      },
      initialValue: 'next',
      readOnly: true,
    }),
    defineField({
      name: 'level',
      title: 'Level',
      type: 'string',
      options: {
        list: [
          { title: 'Foundation', value: 'foundation' },
          { title: 'Builder', value: 'builder' },
          { title: 'Scaling', value: 'scaling' },
          { title: 'Master', value: 'master' },
        ],
      },
    }),
    defineField({
      name: 'supportingRecords',
      title: 'Supporting Records',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'accreditationRecord' }] }],
    }),
    defineField({
      name: 'verified',
      title: 'Verified?',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'publicDisplay',
      title: 'Public Display?',
      type: 'boolean',
      initialValue: false,
      description: 'Allow this credential to appear on public profiles',
    }),

    // --- Governance ---
    ...governanceFields,
  ],

  preview: {
    select: {
      title: 'title',
      alumniName: 'alumni.name',
      level: 'level',
    },
    prepare({ title, alumniName, level }) {
      return {
        title: title || 'Untitled Credential',
        subtitle: [alumniName, level].filter(Boolean).join(' — '),
      }
    },
  },
})
