import { defineType, defineField } from 'sanity'
import { governanceCoreFields } from './blocks/governanceBlock'
import { transcriptFields, transcriptGroup } from './blocks/transcriptBlock'

/**
 * videoSource — long-form canonical recording (Phase 71, moments model).
 *
 * One videoSource per long-form file on B2/Bunny CDN. Many videoMoment docs
 * project into a single source via trimStart/trimEnd. This is the data-model
 * anchor for the entire moments pipeline.
 *
 * AXA SAFETY: This type does NOT modify or replace the legacy `video` schema.
 * The `video` type stays registered and serves AXA + legacy content indefinitely.
 *
 * - Storage:    b2Key, cdnUrl, duration, thumbnailUrl
 * - Transcript: ...transcriptFields (readOnly — written by pipeline)
 * - Overlays:   masterOverlays[] — default overlay cues for the full recording
 * - Governance: ...governanceCoreFields mapped to 'distribution' group
 * - Curation:   pendingCuration flag drives /dashboard/moments source list
 */
export default defineType({
  name: 'videoSource',
  title: 'Video Source',
  type: 'document',
  description:
    'Long-form canonical recording on B2/Bunny CDN. ' +
    'Anchor for the moments model — many videoMoment docs project into this source via trimStart/trimEnd. ' +
    'Default narrativeOwner: "futuro" for Futuro MMXIX/MMXXV onboarding. ' +
    'pendingCuration=true means the source awaits moment extraction in /dashboard/moments.',
  initialValue: {
    narrativeOwner: 'futuro',
    platformTier: 'institutional',
    archivalStatus: 'archival',
    pendingCuration: true,
    language: ['en'],
  },
  groups: [
    { name: 'content', title: 'Content', default: true },
    { name: 'storage', title: 'B2/Bunny Storage' },
    transcriptGroup,
    { name: 'distribution', title: 'Distribution' },
  ],
  fields: [
    // ── Content tab ──────────────────────────────────────────────
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      group: 'content',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'content',
      options: { source: 'title', maxLength: 96 },
    }),
    defineField({
      name: 'language',
      title: 'Language',
      type: 'array',
      group: 'content',
      of: [{ type: 'string' }],
      options: {
        list: [
          { title: 'English', value: 'en' },
          { title: 'Spanish', value: 'es' },
        ],
        layout: 'grid',
      },
      initialValue: ['en'],
    }),
    defineField({
      name: 'titleEs',
      title: 'Title (Spanish)',
      type: 'string',
      group: 'content',
      description: 'Spanish title for bilingual recordings',
      hidden: ({ document }) => !document?.language || !(document.language as string[]).includes('es'),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      group: 'content',
    }),
    defineField({
      name: 'descriptionEs',
      title: 'Description (Spanish)',
      type: 'text',
      group: 'content',
      description: 'Spanish description for bilingual recordings',
      hidden: ({ document }) => !document?.language || !(document.language as string[]).includes('es'),
    }),
    defineField({
      name: 'recordedAt',
      title: 'Recorded At',
      type: 'datetime',
      group: 'content',
    }),
    defineField({
      name: 'recordedAtLocation',
      title: 'Location',
      type: 'string',
      group: 'content',
      description: 'e.g. "OAS, Washington D.C."',
    }),
    defineField({
      name: 'participants',
      title: 'Participants',
      type: 'array',
      group: 'content',
      description: 'Everyone present in this recording. Drives per-person surfacing.',
      of: [
        {
          type: 'reference',
          to: [{ type: 'alumni' }, { type: 'ledgerPerson' }, { type: 'collaborator' }],
        },
      ],
    }),
    defineField({
      name: 'masterOverlays',
      title: 'Master Overlays (lower-third defaults)',
      type: 'array',
      group: 'content',
      description:
        'Default overlay cues for the full recording. videoMoment.overlayCues overrides these per-moment; ' +
        'if overlayCues is empty the frontend inherits these.',
      of: [
        defineField({
          name: 'overlayCue',
          type: 'object',
          fields: [
            defineField({
              name: 'time',
              title: 'Time (seconds)',
              type: 'number',
              description: 'Playhead position when the credit appears.',
              validation: (Rule) => Rule.required().min(0),
            }),
            defineField({
              name: 'personRef',
              title: 'Person',
              type: 'reference',
              to: [{ type: 'ledgerPerson' }, { type: 'alumni' }],
              weak: true,
              description:
                'Optional: link to ledgerPerson or alumni. Drives gallery surfacing. ' +
                'Weak reference so editing the target doc never blocks on these.',
            }),
            defineField({ name: 'name', title: 'Name', type: 'string' }),
            defineField({ name: 'role', title: 'Role / Designation', type: 'string' }),
            defineField({ name: 'organization', title: 'Organization', type: 'string' }),
            defineField({ name: 'country', title: 'Country', type: 'string' }),
            defineField({ name: 'ledgerNo', title: 'Ledger No.', type: 'string' }),
          ],
          preview: {
            select: { time: 'time', name: 'name', role: 'role' },
            prepare: ({ time, name, role }) => ({
              title: name || '(no name)',
              subtitle: [typeof time === 'number' ? `${time}s` : null, role].filter(Boolean).join(' · '),
            }),
          },
        }),
      ],
    }),

    // ── Storage tab ──────────────────────────────────────────────
    defineField({
      name: 'b2Key',
      title: 'B2 Object Key',
      type: 'string',
      group: 'storage',
      description: 'Full path in B2 bucket, e.g. "Futuro MMXIX/edited/HB2_OAS PARTNER 4K_ahq12.mp4"',
    }),
    defineField({
      name: 'cdnUrl',
      title: 'Bunny CDN URL',
      type: 'url',
      group: 'storage',
      description: 'Public CDN URL for video playback, e.g. "https://benext.b-cdn.net/Futuro%20MMXIX/edited/..."',
    }),
    defineField({
      name: 'publicSource',
      title: 'Approved-public source',
      type: 'boolean',
      group: 'storage',
      initialValue: false,
      description:
        'Clips pipeline (spec 2026-06-10): ONLY pre-edited, fully-approved files ' +
        '(Smithsonian/OAS). When true, this source\'s moments may play the source ' +
        'cdnUrl directly with #t= windows. Raw event masters stay false FOREVER — ' +
        'their moments publish via exported per-clip files only.',
    }),
    defineField({
      name: 'duration',
      title: 'Duration (seconds)',
      type: 'number',
      group: 'storage',
      description: 'Total duration of the source recording in seconds.',
    }),
    defineField({
      name: 'thumbnailUrl',
      title: 'CDN Thumbnail URL',
      type: 'url',
      group: 'storage',
      description: 'Bunny CDN URL for default thumbnail (auto-generated by pipeline or manual).',
    }),
    defineField({
      name: 'pendingCuration',
      title: 'Pending Curation',
      type: 'boolean',
      group: 'storage',
      initialValue: true,
      description: 'Source appears in /dashboard/moments source list when true. Set to false once all moments are extracted.',
    }),

    // ── Transcript tab ───────────────────────────────────────────
    // Both fields are readOnly — written by the transcription pipeline only.
    ...transcriptFields,

    // ── Distribution tab ─────────────────────────────────────────
    ...governanceCoreFields.map((field) => ({ ...field, group: 'distribution' as const })),
  ],
  preview: {
    select: {
      title: 'title',
      recordedAt: 'recordedAt',
      location: 'recordedAtLocation',
      pending: 'pendingCuration',
    },
    prepare({ title, recordedAt, location, pending }) {
      const dateStr = recordedAt ? new Date(recordedAt).toLocaleDateString() : ''
      const meta = [location, dateStr].filter(Boolean).join(' · ')
      return {
        title: title || 'Untitled Source',
        subtitle: [pending ? '[PENDING CURATION]' : '[CURATED]', meta].filter(Boolean).join(' — '),
      }
    },
  },
})
