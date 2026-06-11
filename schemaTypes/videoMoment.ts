import { defineType, defineField } from 'sanity'
import { governanceCoreFields } from './blocks/governanceBlock'

/**
 * videoMoment — a tagged projection into a videoSource (Phase 71, moments model).
 *
 * One moment = { sourceRef, alumnusOwner, trimStart, trimEnd, title, overlayCues }.
 * The frontend derives playbackUrl from sourceRef.cdnUrl + '#t=' + trimStart + ',' + trimEnd.
 * No computed `playbackUrl` field is stored — matches buildPlaybackSrc() in AlumniVideoGallery.astro.
 *
 * alumnusOwner = single primary person owner (alumni | ledgerPerson | collaborator).
 * Multi-participant surfacing: add additional people in overlayCues[].personRef.
 *
 * overlayCues[] = moment-scoped overlays. If empty at render time, the frontend
 * inherits sourceRef.masterOverlays (no store needed — pure query-time coalesce).
 *
 * publish=false by default — curator approves but does NOT auto-publish.
 * The moments curator (/dashboard/moments) sets publish=false on creation;
 * editorial approval sets it to true.
 *
 * AXA SAFETY: Does NOT modify the legacy `video` schema. Entirely additive.
 */
export default defineType({
  name: 'videoMoment',
  title: 'Video Moment',
  type: 'document',
  description:
    'A tagged projection into a videoSource. ' +
    'trimStart + trimEnd define the clip window (seconds). ' +
    'Frontend derives playback via cdnUrl + "#t=" + trimStart + "," + trimEnd — no re-encoding. ' +
    'publish=false keeps the moment in editorial review; set to true to surface in galleries.',
  initialValue: {
    publish: false,
    language: ['en'],
  },
  groups: [
    { name: 'content', title: 'Content', default: true },
    { name: 'trim', title: 'Trim & Source' },
    { name: 'distribution', title: 'Distribution' },
  ],
  fields: [
    // ── Trim & Source tab ────────────────────────────────────────
    defineField({
      name: 'sourceRef',
      title: 'Video Source',
      type: 'reference',
      to: [{ type: 'videoSource' }],
      group: 'trim',
      description: 'The long-form recording this moment projects into.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'trimStart',
      title: 'Trim Start (seconds)',
      type: 'number',
      group: 'trim',
      description: 'Offset from source start to begin playback (seconds). Used as #t=start fragment — no re-encoding.',
      validation: (Rule) => Rule.required().min(0),
    }),
    defineField({
      name: 'trimEnd',
      title: 'Trim End (seconds)',
      type: 'number',
      group: 'trim',
      description: 'Offset from source start to end playback (seconds). Pair with trimStart for #t=start,end.',
      validation: (Rule) => Rule.required().min(0),
    }),

    // ── Content tab ──────────────────────────────────────────────
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      group: 'content',
      validation: (Rule) => Rule.required(),
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
      description: 'Spanish title for bilingual moments',
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
      description: 'Spanish description for bilingual moments',
      hidden: ({ document }) => !document?.language || !(document.language as string[]).includes('es'),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'content',
      options: { source: 'title', maxLength: 96 },
    }),
    defineField({
      name: 'alumnusOwner',
      title: 'Primary Owner',
      type: 'reference',
      to: [{ type: 'alumni' }, { type: 'ledgerPerson' }, { type: 'collaborator' }],
      group: 'content',
      description:
        'Single primary person owner of this moment. ' +
        'This drives which alumni/ledger profile this moment surfaces on. ' +
        'For multi-participant attribution, add people in overlayCues[].personRef.',
    }),
    defineField({
      name: 'overlayCues',
      title: 'Overlay Cues (lower-third credits)',
      type: 'array',
      group: 'content',
      description:
        'Moment-scoped overlay cues. Empty = frontend inherits sourceRef.masterOverlays at render time. ' +
        'Override here to add moment-specific credits or suppress inherited overlays.',
      of: [
        defineField({
          name: 'overlayCue',
          type: 'object',
          fields: [
            defineField({
              name: 'time',
              title: 'Time (seconds)',
              type: 'number',
              description: 'Playhead position relative to trimStart when the credit appears.',
              validation: (Rule) => Rule.required().min(0),
            }),
            defineField({
              name: 'personRef',
              title: 'Person',
              type: 'reference',
              to: [{ type: 'ledgerPerson' }, { type: 'alumni' }],
              weak: true,
              description:
                'Optional: link to ledgerPerson or alumni. Drives Vanguard Ledger / collaborator gallery surfacing.',
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
    defineField({
      name: 'contentCategory',
      title: 'Content Category',
      type: 'string',
      group: 'content',
      options: {
        list: [
          { title: 'Reflection', value: 'reflection' },
          { title: 'Interview', value: 'interview' },
          { title: 'Documentary', value: 'documentary' },
          { title: 'Presentation', value: 'presentation' },
          { title: 'B-Roll', value: 'b-roll' },
        ],
        layout: 'radio',
      },
    }),
    defineField({
      name: 'publish',
      title: 'Publish',
      type: 'boolean',
      group: 'content',
      initialValue: false,
      description:
        'Set to true to surface this moment in public galleries. ' +
        'Curator approves → publish=false; editorial team sets to true.',
    }),
    defineField({
      name: 'publishDate',
      title: 'Publish Date',
      type: 'datetime',
      group: 'content',
      description: 'Optional override for gallery sort order (defaults to _createdAt).',
    }),

    // ── Clips pipeline (spec 2026-06-10) ─────────────────────────
    defineField({
      name: 'publicApproved',
      title: 'Public approved',
      type: 'boolean',
      group: 'content',
      initialValue: false,
      description:
        'SECOND curation tier — exported ≠ public. Public profiles render a moment ' +
        'ONLY when this is true (curated via the clip-public-picker tool or here). ' +
        'False = gated: the clip exists in the system / alumni portal only.',
    }),
    defineField({
      name: 'clipUrl',
      title: 'Exported clip URL',
      type: 'url',
      group: 'trim',
      readOnly: true,
      description:
        'Set by publish-approved-moments.mjs — the per-moment clip file in ' +
        'published-clips/. The ONLY URL public surfaces play. Do not edit by hand.',
    }),
    defineField({
      name: 'clipExportedAt',
      title: 'Clip exported at',
      type: 'datetime',
      group: 'trim',
      readOnly: true,
    }),
    defineField({
      name: 'trimHash',
      title: 'Trim hash',
      type: 'string',
      group: 'trim',
      readOnly: true,
      description: 'Export bookkeeping — changes when trims/master change, triggering re-export.',
    }),

    // ── Distribution tab ─────────────────────────────────────────
    ...governanceCoreFields.map((field) => ({ ...field, group: 'distribution' as const })),
  ],
  preview: {
    select: {
      title: 'title',
      publish: 'publish',
      trimStart: 'trimStart',
      trimEnd: 'trimEnd',
    },
    prepare({ title, publish, trimStart, trimEnd }) {
      const trimStr =
        typeof trimStart === 'number' && typeof trimEnd === 'number'
          ? `${trimStart}s – ${trimEnd}s`
          : ''
      return {
        title: title || 'Untitled Moment',
        subtitle: [publish ? '[PUBLISHED]' : '[DRAFT]', trimStr].filter(Boolean).join(' · '),
      }
    },
  },
})
