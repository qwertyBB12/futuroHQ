import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'enrollee',
  title: 'Enrollee',
  type: 'document',
  groups: [
    { name: 'identity', title: 'Identity', default: true },
    { name: 'enrollment', title: 'Enrollment' },
    { name: 'project', title: 'Legacy Project' },
    { name: 'conversation', title: 'Conversation' },
    { name: 'meta', title: 'Meta' },
  ],
  fields: [
    // --- Identity ---
    defineField({
      name: 'fullName',
      title: 'Full Name',
      type: 'string',
      validation: Rule => Rule.required(),
      group: 'identity',
    }),
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
      group: 'identity',
    }),
    defineField({
      name: 'phone',
      title: 'Phone (E.164)',
      type: 'string',
      description: 'WhatsApp number in E.164 format, e.g. +525512345678',
      group: 'identity',
    }),
    defineField({
      name: 'countryOrRegion',
      title: 'Country or Region',
      type: 'string',
      group: 'identity',
    }),
    defineField({
      name: 'school',
      title: 'School',
      type: 'string',
      group: 'identity',
    }),
    defineField({
      name: 'gradeOrYear',
      title: 'Grade or Year',
      type: 'string',
      group: 'identity',
    }),
    defineField({
      name: 'photo',
      title: 'Photo',
      type: 'image',
      options: { hotspot: true },
      group: 'identity',
    }),
    defineField({
      name: 'language',
      title: 'Preferred Language',
      type: 'string',
      options: { list: ['en', 'es'] },
      initialValue: 'es',
      group: 'identity',
    }),

    // --- Enrollment ---
    defineField({
      name: 'stage',
      title: 'Enrollment Stage',
      type: 'string',
      options: {
        list: [
          { title: 'Prospect', value: 'prospect' },
          { title: 'Nominated', value: 'nominated' },
          { title: 'In Conversation', value: 'in_conversation' },
          { title: 'Project Defined', value: 'project_defined' },
          { title: 'Invited', value: 'invited' },
          { title: 'Enrolled', value: 'enrolled' },
          { title: 'Confirmed', value: 'confirmed' },
          { title: 'Alumnus', value: 'alumnus' },
          { title: 'Declined', value: 'declined' },
          { title: 'Withdrawn', value: 'withdrawn' },
        ],
      },
      initialValue: 'prospect',
      group: 'enrollment',
    }),
    defineField({
      name: 'source',
      title: 'Acquisition Source',
      type: 'string',
      options: {
        list: [
          { title: 'School Nomination (B2B2C)', value: 'school' },
          { title: 'Direct Application (B2C)', value: 'direct' },
          { title: 'QR Code Scan', value: 'qr' },
          { title: 'Social Media', value: 'social' },
          { title: 'Referral', value: 'referral' },
        ],
      },
      group: 'enrollment',
    }),
    defineField({
      name: 'campaignSlug',
      title: 'Campaign Slug',
      type: 'string',
      description: 'If school-nominated, the campaign slug (e.g. cdmx-2026)',
      group: 'enrollment',
    }),
    defineField({
      name: 'programYear',
      title: 'Program Year',
      type: 'number',
      initialValue: 2026,
      group: 'enrollment',
    }),
    defineField({
      name: 'chosenLocation',
      title: 'Chosen Location',
      type: 'string',
      options: { list: ['georgetown', 'sevilla'] },
      group: 'enrollment',
    }),
    defineField({
      name: 'scholarshipAmount',
      title: 'Scholarship Amount',
      type: 'number',
      group: 'enrollment',
    }),
    defineField({
      name: 'enrolledAt',
      title: 'Enrolled At',
      type: 'datetime',
      group: 'enrollment',
    }),

    // --- Legacy Project ---
    defineField({
      name: 'legacyProjectBrief',
      title: 'Legacy Project Brief',
      type: 'text',
      description: 'The nominee\'s Legacy Project description, authored by them during conversation',
      group: 'project',
    }),
    defineField({
      name: 'discoveryAnswers',
      title: 'Discovery Answers',
      type: 'object',
      description: 'Responses to the 3 strength-based discovery questions',
      fields: [
        defineField({ name: 'passion', title: 'The Passion (Q1)', type: 'text' }),
        defineField({ name: 'investment', title: 'The Investment (Q2)', type: 'text' }),
        defineField({ name: 'shape', title: 'The Shape (Q3)', type: 'text' }),
      ],
      group: 'project',
    }),
    defineField({
      name: 'linkedProject',
      title: 'Linked Legacy Project',
      type: 'reference',
      to: [{ type: 'project' }],
      description: 'If this enrollee\'s project is documented in the Projects collection',
      group: 'project',
    }),

    // --- Conversation ---
    defineField({
      name: 'currentChapter',
      title: 'Current Chapter',
      type: 'number',
      description: 'Current chapter in the 7-chapter WhatsApp narrative (1-7)',
      validation: Rule => Rule.min(0).max(7),
      group: 'conversation',
    }),
    defineField({
      name: 'conversationNotes',
      title: 'Conversation Notes',
      type: 'text',
      description: 'Staff notes about this enrollee\'s journey',
      group: 'conversation',
    }),
    defineField({
      name: 'milestones',
      title: 'Milestones',
      type: 'array',
      of: [{
        type: 'object',
        fields: [
          defineField({ name: 'event', title: 'Event', type: 'string' }),
          defineField({ name: 'timestamp', title: 'Timestamp', type: 'datetime' }),
          defineField({ name: 'detail', title: 'Detail', type: 'string' }),
        ],
      }],
      group: 'conversation',
    }),

    // --- Meta ---
    defineField({
      name: 'supabaseConversationId',
      title: 'Supabase Conversation ID',
      type: 'string',
      description: 'Links to whatsapp_conversations table',
      group: 'meta',
    }),
    defineField({
      name: 'supabaseInvitationId',
      title: 'Supabase Invitation ID',
      type: 'string',
      description: 'Links to enrollment_invitations table',
      group: 'meta',
    }),
    defineField({
      name: 'promotedToLedger',
      title: 'Promoted to Vanguard Ledger',
      type: 'reference',
      to: [{ type: 'ledgerPerson' }],
      description: 'If this enrollee has been elevated to a ledgerPerson entry',
      group: 'meta',
    }),
  ],

  preview: {
    select: {
      title: 'fullName',
      subtitle: 'stage',
      media: 'photo',
    },
    prepare({ title, subtitle, media }) {
      const stageLabels: Record<string, string> = {
        prospect: 'Prospect',
        nominated: 'Nominated',
        in_conversation: 'In Conversation',
        project_defined: 'Project Defined',
        invited: 'Invited',
        enrolled: 'Enrolled',
        confirmed: 'Confirmed',
        alumnus: 'Alumnus',
        declined: 'Declined',
        withdrawn: 'Withdrawn',
      }
      return {
        title: title || 'Unnamed',
        subtitle: stageLabels[subtitle] || subtitle || 'Unknown',
        media,
      }
    },
  },

  orderings: [
    {
      title: 'Stage',
      name: 'stageAsc',
      by: [{ field: 'stage', direction: 'asc' }],
    },
    {
      title: 'Name',
      name: 'nameAsc',
      by: [{ field: 'fullName', direction: 'asc' }],
    },
    {
      title: 'Newest',
      name: 'createdDesc',
      by: [{ field: '_createdAt', direction: 'desc' }],
    },
  ],
})
