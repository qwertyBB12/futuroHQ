import { defineType, defineField } from 'sanity'
import { governanceCoreFields } from './blocks/governanceBlock'
import {surfaceOnField} from './blocks/surfaceOnField'
import {featuredInField} from './blocks/featuredInField'
import { transcriptFields, transcriptGroup } from './blocks/transcriptBlock'

export default defineType({
  name: 'video',
  title: 'Video',
  type: 'document',
  description:
    'Video content — reflections, interviews, documentaries. ' +
    'Default narrativeOwner: "hector". Default platformTier: "canonical". Default archivalStatus: "archival". ' +
    'Supports bilingual (en/es) with conditional Spanish title/description fields. ' +
    'videoFormat determines longform vs shortform. contentCategory determines site section placement. ' +
    'Keynote speeches use the dedicated keynote type, not video.',
  initialValue: {
    narrativeOwner: 'hector',
    platformTier: 'canonical',
    archivalStatus: 'archival',
    videoSource: 'b2',
  },
  groups: [
    {name: 'content', title: 'Content', default: true},
    {name: 'storage', title: 'B2/Bunny Storage'},
    transcriptGroup,
    {name: 'distribution', title: 'Distribution'},
    {name: 'seo', title: 'SEO'},
    {name: 'legacy', title: 'Legacy'},
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
      description:
        'URL slug for public surfaces. Required to render on a public site — ' +
        'public video listings (`videoListBySiteQuery`) filter with `defined(slug.current)`, ' +
        'so videos without a slug are silently excluded. Warning, not blocking.',
      validation: (Rule) => Rule.warning('No slug — this video will not appear on any public site listing.'),
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
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: 'titleEs',
      title: 'Title (Spanish)',
      type: 'string',
      group: 'content',
      description: 'Spanish title for bilingual videos',
      hidden: ({ document }) => !document?.language || !(document.language as string[]).includes('es'),
    }),
    defineField({
      name: 'descriptionEs',
      title: 'Description (Spanish)',
      type: 'text',
      group: 'content',
      description: 'Spanish description for bilingual videos',
      hidden: ({ document }) => !document?.language || !(document.language as string[]).includes('es'),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      group: 'content',
    }),
    defineField({
      name: 'thumbnailImage',
      title: 'Thumbnail Image',
      type: 'image',
      group: 'content',
      options: { hotspot: true },
    }),
    defineField({
      name: 'contentCategory',
      title: 'Content Category',
      type: 'string',
      group: 'content',
      description: 'Determines which section this video appears in on hectorhlopez.com',
      options: {
        list: [
          { title: 'Reflection', value: 'reflection' },
          { title: 'Interview', value: 'interview' },
          { title: 'Documentary', value: 'documentary' },
          { title: 'Presentation', value: 'presentation' },
          { title: 'B-Roll', value: 'b-roll' },
          { title: 'Source Footage', value: 'source' },
        ],
        layout: 'radio',
      },
      initialValue: 'reflection',
    }),
    defineField({
      name: 'videoFormat',
      title: 'Video Format',
      type: 'string',
      group: 'content',
      options: {
        list: [
          { title: 'Longform', value: 'longform' },
          { title: 'Shortform', value: 'shortform' },
        ],
        layout: 'radio',
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'publishDate',
      title: 'Publish Date',
      type: 'datetime',
      group: 'content',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      group: 'content',
      of: [{ type: 'reference', to: [{ type: 'tag' }] }],
    }),
    defineField({
      name: 'participants',
      title: 'Participants',
      type: 'array',
      group: 'content',
      of: [{ type: 'reference', to: [{ type: 'alumni' }, { type: 'ledgerPerson' }, { type: 'collaborator' }] }],
      description: 'People who appear in this video. Drives the per-person video gallery on alumni profile pages. Seed via speaker-name heuristic; refine via tag-media review.',
    }),
    featuredInField,

    // ── Storage tab ──────────────────────────────────────────────
    defineField({
      name: 'videoSource',
      title: 'Video Source',
      type: 'string',
      description: 'Where this video is hosted. New videos default to B2/Bunny CDN.',
      group: 'storage',
      options: {
        list: [
          {title: 'Wistia (Legacy)', value: 'wistia'},
          {title: 'B2/Bunny CDN', value: 'b2'},
        ],
        layout: 'radio',
      },
      initialValue: 'b2',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'b2Key',
      title: 'B2 Object Key',
      type: 'string',
      description: 'Full path in B2 bucket (e.g., videos/2026/my-video.mp4)',
      group: 'storage',
      hidden: ({document}) => document?.videoSource !== 'b2',
    }),
    defineField({
      name: 'cdnUrl',
      title: 'Bunny CDN URL',
      type: 'url',
      description: 'Public CDN URL for video playback (e.g., https://cdn.benextglobal.com/videos/...)',
      group: 'storage',
      hidden: ({document}) => document?.videoSource !== 'b2',
    }),
    defineField({
      name: 'resolution',
      title: 'Resolution',
      type: 'string',
      description: 'Video resolution (e.g., 1080p, 4K)',
      group: 'storage',
      options: {
        list: [
          {title: '720p', value: '720p'},
          {title: '1080p', value: '1080p'},
          {title: '1440p (2K)', value: '1440p'},
          {title: '2160p (4K)', value: '2160p'},
        ],
      },
      hidden: ({document}) => document?.videoSource !== 'b2',
    }),
    defineField({
      name: 'thumbnailUrl',
      title: 'CDN Thumbnail URL',
      type: 'url',
      description: 'Bunny CDN URL for video thumbnail (auto-generated by pipeline or manual)',
      group: 'storage',
      hidden: ({document}) => document?.videoSource !== 'b2',
    }),
    defineField({
      name: 'b2Key_watermarked',
      title: 'B2 Key (Watermarked)',
      type: 'string',
      description: 'B2 path for the watermarked variant (generated by pipeline)',
      group: 'storage',
      readOnly: true,
      hidden: ({document}) => document?.videoSource !== 'b2',
    }),
    defineField({
      name: 'b2Key_9_16',
      title: 'B2 Key (9:16 Portrait)',
      type: 'string',
      description: 'B2 path for the 9:16 portrait crop variant (generated by pipeline)',
      group: 'storage',
      readOnly: true,
      hidden: ({document}) => document?.videoSource !== 'b2',
    }),
    defineField({
      name: 'b2Key_1_1',
      title: 'B2 Key (1:1 Square)',
      type: 'string',
      description: 'B2 path for the 1:1 square crop variant (generated by pipeline)',
      group: 'storage',
      readOnly: true,
      hidden: ({document}) => document?.videoSource !== 'b2',
    }),
    defineField({
      name: 'bunnyStatus',
      title: 'Pipeline Status',
      type: 'string',
      description: 'Set by the media pipeline Worker. processing = upload received, ready = CDN validated, error = pipeline failure.',
      group: 'storage',
      options: {
        list: [
          {title: 'Processing', value: 'processing'},
          {title: 'Ready', value: 'ready'},
          {title: 'Error', value: 'error'},
        ],
        layout: 'radio',
      },
      readOnly: true,
      hidden: ({document}) => document?.videoSource !== 'b2',
    }),
    defineField({
      name: 'duration',
      title: 'Duration (seconds)',
      type: 'number',
      group: 'storage',
    }),
    defineField({
      name: 'needsVisualProcessing',
      title: 'Needs Visual Processing',
      type: 'boolean',
      group: 'storage',
      description: 'Clip was cut from raw footage — LUT and vignette not yet applied.',
      initialValue: false,
    }),
    defineField({
      name: 'needsColorCorrection',
      title: 'Needs Color Correction',
      type: 'boolean',
      group: 'storage',
      description: 'Video is too dark or has exposure issues requiring manual correction.',
      initialValue: false,
    }),
    defineField({
      name: 'doNotDisclose',
      title: 'Do Not Disclose',
      type: 'boolean',
      group: 'content',
      description: 'Participant has a do-not-disclose clause in their agreement. This video must not be published externally.',
      initialValue: false,
    }),
    defineField({
      name: 'tierRating',
      title: 'Tier Rating',
      type: 'string',
      group: 'content',
      description: 'Editorial quality tier assigned during review.',
      options: {
        list: [
          {title: 'S — Exceptional', value: 'S'},
          {title: 'A — Strong', value: 'A'},
          {title: 'B — Usable', value: 'B'},
          {title: 'C — Weak', value: 'C'},
          {title: 'D — Unusable', value: 'D'},
        ],
        layout: 'radio',
      },
    }),
    defineField({
      name: 'reviewStatus',
      title: 'Review Status',
      type: 'string',
      group: 'content',
      description: 'Editorial workflow state for the video review dashboard.',
      options: {
        list: [
          {title: 'Unreviewed', value: 'unreviewed'},
          {title: 'In Review', value: 'in-review'},
          {title: 'Approved', value: 'approved'},
          {title: 'Flagged', value: 'flagged'},
          {title: 'Published', value: 'published'},
          {title: 'Archived', value: 'archived'},
        ],
      },
      initialValue: 'unreviewed',
    }),
    defineField({
      name: 'adminNotes',
      title: 'Admin Notes',
      type: 'text',
      group: 'content',
      description: 'Editorial comments, reprocessing instructions, or review notes.',
      rows: 4,
    }),
    defineField({
      name: 'speakerConfidence',
      title: 'Speaker Match Confidence',
      type: 'number',
      group: 'storage',
      readOnly: true,
      hidden: true,
      description: 'Cosine similarity score (0-1) from voice signature matching.',
    }),
    defineField({
      name: 'needsReview',
      title: 'Needs Review',
      type: 'boolean',
      group: 'content',
      readOnly: true,
      initialValue: false,
      description: 'Flagged for manual review — speaker match confidence below 0.80.',
    }),
    defineField({
      name: 'platform',
      title: 'Platform',
      type: 'string',
      group: 'storage',
      options: {
        list: [
          { title: 'YouTube', value: 'YouTube' },
          { title: 'TikTok', value: 'TikTok' },
          { title: 'Instagram Reels', value: 'Instagram Reels' },
          { title: 'LinkedIn', value: 'LinkedIn' },
        ],
      },
      hidden: ({document}) => document?.videoSource === 'b2',
    }),
    defineField({
      name: 'videoUrl',
      title: 'Video URL',
      type: 'url',
      group: 'storage',
      hidden: ({document}) => document?.videoSource === 'b2',
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const doc = context?.document
          if (doc?.videoSource !== 'b2' && !value) {
            return 'Video URL is required for Wistia videos'
          }
          return true
        }),
    }),

    // ── Transcript tab ───────────────────────────────────────────
    ...transcriptFields,
    defineField({
      name: 'playbackUrl',
      title: 'Playback URL (override)',
      type: 'url',
      group: 'storage',
      description: 'Optional. When set, frontends should play this URL with the trim window instead of cdnUrl. Used to merge a response clip with its preceding question by pointing at the parent session and trimming to question→answer.',
    }),
    defineField({
      name: 'trimStart',
      title: 'Trim Start (seconds)',
      type: 'number',
      group: 'content',
      description: 'Offset from clip start to begin playback (drops leading filler). Applies to playbackUrl if set, else cdnUrl. Frontend uses #t= media fragment, no re-encoding required.',
    }),
    defineField({
      name: 'trimEnd',
      title: 'Trim End (seconds)',
      type: 'number',
      group: 'content',
      description: 'Offset from clip start to end playback. Pair with trimStart for #t=start,end media fragment.',
    }),
    defineField({
      name: 'globeFeatured',
      title: 'Globe Featured',
      type: 'boolean',
      group: 'content',
      description:
        'When true, this clip is the one that plays for its person in the homepage situation-room globe cycler. ' +
        'Curated via the globe clip picker tool. If any of a person\'s clips is featured, only featured clips cycle for them.',
      initialValue: false,
    }),
    defineField({
      name: 'globeTrim',
      title: 'Globe Trim (override for the globe tile)',
      type: 'object',
      group: 'content',
      description:
        'Optional in/out point JUST for the globe tile, so the face can be framed clear of the lower-third without changing the real clip trim. Falls back to trimStart/trimEnd.',
      fields: [
        defineField({ name: 'start', title: 'Start (seconds)', type: 'number' }),
        defineField({ name: 'end', title: 'End (seconds)', type: 'number' }),
      ],
    }),
    defineField({
      name: 'speakerOverlays',
      title: 'Speaker Overlays (lower-third credits)',
      type: 'array',
      group: 'content',
      description:
        'Documentary-style lower-third credits. Each entry flashes its name/role/organization at the given time. ' +
        'personRef links the overlay to a ledgerPerson or alumni doc so cross-profile galleries can find this clip.',
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
              to: [{type: 'ledgerPerson'}, {type: 'alumni'}],
              weak: true,
              description: 'Optional: link to ledgerPerson or alumni. Drives Vanguard Ledger / collaborator gallery surfacing. Weak reference so editing the target doc never blocks on these.',
            }),
            defineField({name: 'name', title: 'Name', type: 'string'}),
            defineField({name: 'role', title: 'Role / Designation', type: 'string'}),
            defineField({name: 'organization', title: 'Organization', type: 'string'}),
            defineField({name: 'country', title: 'Country', type: 'string'}),
            defineField({name: 'ledgerNo', title: 'Ledger No.', type: 'string'}),
          ],
          preview: {
            select: {time: 'time', name: 'name', role: 'role'},
            prepare: ({time, name, role}) => ({
              title: name || '(no name)',
              subtitle: [typeof time === 'number' ? `${time}s` : null, role].filter(Boolean).join(' · '),
            }),
          },
        }),
      ],
    }),
    defineField({
      name: 'transcriptScore',
      title: 'Transcript Score (LLM)',
      type: 'object',
      group: 'transcript',
      readOnly: true,
      description: 'Claude-derived signal (Phase 64). Drives the gallery promotion pipeline.',
      fields: [
        defineField({ name: 'depth', title: 'Depth (1–5)', type: 'number' }),
        defineField({ name: 'formality', title: 'Formality (1–5)', type: 'number' }),
        defineField({
          name: 'category',
          title: 'Suggested Category',
          type: 'string',
          options: {
            list: ['project-talk', 'personal-reflection', 'casual', 'logistics', 'unknown'],
          },
        }),
        defineField({ name: 'quote', title: 'Representative Quote', type: 'text' }),
        defineField({ name: 'scoredAt', title: 'Scored At', type: 'datetime' }),
        defineField({ name: 'model', title: 'Model', type: 'string' }),
      ],
    }),

    // ── Distribution tab ─────────────────────────────────────────
    surfaceOnField,
    ...governanceCoreFields.map(field => ({...field, group: 'distribution'})),

    // ── SEO tab ──────────────────────────────────────────────────
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seoBlock',
      group: 'seo',
    }),

    // ── Legacy tab ───────────────────────────────────────────────
    defineField({
      name: 'legacyVlog',
      title: 'Legacy Vlog Data',
      type: 'object',
      readOnly: true,
      group: 'legacy',
      options: { collapsible: true, collapsed: true },
      fields: [
        defineField({
          name: 'aiDerivatives',
          title: 'AI Derivatives',
          type: 'object',
          fields: [
            defineField({ name: 'summary', title: 'Summary', type: 'text' }),
            defineField({
              name: 'quotes',
              title: 'Quotes',
              type: 'array',
              of: [{ type: 'string' }],
            }),
            defineField({
              name: 'captions',
              title: 'Captions',
              type: 'array',
              of: [{ type: 'string' }],
            }),
          ],
        }),
        defineField({
          name: 'analytics',
          title: 'Analytics',
          type: 'object',
          fields: [
            defineField({ name: 'likes', title: 'Likes', type: 'number' }),
            defineField({ name: 'shares', title: 'Shares', type: 'number' }),
            defineField({ name: 'views', title: 'Views', type: 'number' }),
            defineField({ name: 'source', title: 'Source', type: 'string' }),
          ],
        }),
        defineField({
          name: 'channelRef',
          title: 'Channel Owner',
          type: 'reference',
          to: [{ type: 'collaborator' }, { type: 'person' }],
        }),
        defineField({
          name: 'channelType',
          title: 'Channel',
          type: 'string',
        }),
        defineField({
          name: 'contentFormat',
          title: 'Content Format',
          type: 'string',
        }),
        defineField({
          name: 'distribution',
          title: 'Distribution URLs',
          type: 'array',
          of: [{ type: 'url' }],
        }),
        defineField({
          name: 'gallery',
          title: 'Gallery',
          type: 'array',
          of: [{ type: 'mediaBlock' }, { type: 'image', options: { hotspot: true } }],
        }),
        defineField({
          name: 'language',
          title: 'Language',
          type: 'string',
        }),
        defineField({
          name: 'narrative',
          title: 'Narrative',
          type: 'narrativeBlock',
        }),
        defineField({
          name: 'order',
          title: 'Order',
          type: 'number',
        }),
        defineField({
          name: 'originalId',
          title: 'Original ID',
          type: 'string',
        }),
        defineField({
          name: 'publish',
          title: 'Publish',
          type: 'boolean',
        }),
        defineField({
          name: 'publishedAt',
          title: 'Published At',
          type: 'datetime',
        }),
        defineField({
          name: 'seo',
          title: 'SEO',
          type: 'seoBlock',
        }),
        defineField({
          name: 'updatedAt',
          title: 'Updated At',
          type: 'datetime',
        }),
        defineField({
          name: 'video',
          title: 'Legacy Video',
          type: 'mediaBlock',
        }),
        defineField({
          name: 'videoUrl',
          title: 'Legacy Video URL',
          type: 'url',
        }),
        defineField({
          name: 'tags',
          title: 'Legacy Tags',
          type: 'array',
          of: [{ type: 'string' }],
        }),
        defineField({
          name: 'tags_ref',
          title: 'Legacy Tags (ref)',
          type: 'array',
          of: [{ type: 'reference', to: [{ type: 'tag' }] }],
        }),
      ],
    }),
  ],
  preview: {
    select: {
      title: 'title',
      date: 'publishDate',
      format: 'videoFormat',
      category: 'contentCategory',
      media: 'thumbnailImage',
    },
    prepare({ title, date, format, category, media }) {
      const dateStr = date ? new Date(date).toLocaleDateString() : ''
      const labels = [format, category].filter(Boolean).join(' · ')
      return {
        title: title || 'Untitled Video',
        subtitle: [labels, dateStr].filter(Boolean).join(' — '),
        media,
      }
    },
  },
})
