import { defineType, defineField } from 'sanity'
import { governanceFields } from './blocks/governanceBlock'

export default defineType({
  name: 'participantConnection',
  title: 'Participant Connection',
  type: 'document',
  description: 'Tracks relationships between participants for the community layer',
  fields: [
    // --- Core ---
    defineField({
      name: 'fromAlumni',
      title: 'From Alumni',
      type: 'reference',
      to: [{ type: 'alumni' }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'toAlumni',
      title: 'To Alumni',
      type: 'reference',
      to: [{ type: 'alumni' }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'connectionType',
      title: 'Connection Type',
      type: 'string',
      options: {
        list: [
          { title: 'Cohort-mate', value: 'cohort-mate' },
          { title: 'Collaborator', value: 'collaborator' },
          { title: 'Mentor–Mentee', value: 'mentor-mentee' },
          { title: 'Project Collaborator', value: 'project-collaborator' },
          { title: 'Supporter', value: 'supporter' },
        ],
      },
    }),
    defineField({
      name: 'originContext',
      title: 'Origin Context',
      type: 'string',
      description: 'How this connection was formed',
    }),
    defineField({
      name: 'sharedProjects',
      title: 'Shared Projects',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'project' }] }],
    }),
    defineField({
      name: 'establishedDate',
      title: 'Established Date',
      type: 'date',
    }),
    defineField({
      name: 'strength',
      title: 'Connection Strength',
      type: 'string',
      options: {
        list: [
          { title: 'Strong', value: 'strong' },
          { title: 'Moderate', value: 'moderate' },
          { title: 'Dormant', value: 'dormant' },
        ],
      },
    }),
    defineField({
      name: 'notes',
      title: 'Notes',
      type: 'text',
    }),

    // --- Governance ---
    ...governanceFields,
  ],

  preview: {
    select: {
      fromName: 'fromAlumni.name',
      toName: 'toAlumni.name',
      connectionType: 'connectionType',
    },
    prepare({ fromName, toName, connectionType }) {
      return {
        title: `${fromName || '?'} ↔ ${toName || '?'}`,
        subtitle: connectionType || '—',
      }
    },
  },
})
