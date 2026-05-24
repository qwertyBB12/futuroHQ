import { defineType, defineField } from 'sanity'
import {featuredContentField} from './blocks/featuredContentField'

export default defineType({
  name: 'alumni',
  title: 'Alumni',
  type: 'document',
  description:
    'Futuro/BeNeXT program graduates with Companion Platform integration (30+ fields including dreams, conversations, accreditation). ' +
    'Distinct from person (simple identity) and ledgerPerson (narrative intelligence). ' +
    'A Futuro/BeNeXT program alumnus. Public profiles live on benextglobal.com. ' +
    'Default narrativeOwner: "benext" or "futuro" depending on cohort. ' +
    'Default platformTier: "personal". Default archivalStatus: "archival". ' +
    'Bios should be third person. Include cohortYear, generation, and convening reference. ' +
    'Media array holds photos and video testimonials (mediaBlock). ' +
    'Companion Platform fields (supabaseUserId, etc.) link to the gated alumni dashboard. ' +
    'featuredContent surfaces content where this alumni appears on their profile.',
  fieldsets: [
    {
      name: 'companion',
      title: 'Companion Platform',
      options: { collapsible: true, collapsed: true },
    },
  ],
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
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'name', maxLength: 96 },
      description: 'URL-friendly identifier',
    }),
    defineField({ name: 'country', title: 'Country', type: 'string' }),
    defineField({
      name: 'pronouns',
      title: 'Pronouns',
      type: 'string',
      description: 'Used for natural-language copy like "In her voice / In his voice". Falls back to possessive ({First}\'s voice) if unset.',
      options: {
        list: [
          { title: 'she / her', value: 'she/her' },
          { title: 'he / him', value: 'he/him' },
          { title: 'they / them', value: 'they/them' },
        ],
        layout: 'radio',
      },
    }),
    defineField({
      name: 'projectTitle',
      title: 'Project Title',
      type: 'string',
      description: 'Short project title shown on alumni cards (e.g. "Renewable Energy in the Caribbean")',
    }),
    defineField({ name: 'bio', title: 'Biography', type: 'text' }),
    defineField({
      name: 'bioEs',
      title: 'Biography (Español)',
      type: 'text',
      description: 'Spanish biography. Falls back to English on /es pages if empty.',
    }),

    // --- Media ---
    defineField({
      name: 'media',
      title: 'Media Assets',
      type: 'array',
      of: [{ type: 'mediaBlock' }, { type: 'image', options: { hotspot: true } }],
    }),
    defineField({
      name: 'heroVideoUrl',
      title: 'Hero Video URL',
      type: 'url',
      description: 'Direct MP4 URL for the full-bleed profile hero background. Plays silently on loop. Use Bunny CDN, Cloudflare Stream, or any direct video link.',
    }),
    defineField({
      name: 'featuredClipUrl',
      title: 'Featured Clip URL',
      type: 'url',
      description: 'Direct MP4 URL of a single featured clip (with audio) shown in the In Their Words section of the alumni profile page. Bunny CDN preferred. Plural refactor (featuredClips array + isPrimary flag) is queued as a follow-on phase.',
    }),
    defineField({
      name: 'featuredVideos',
      title: 'Featured Videos (manual override)',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'video' }] }],
      description: 'Optional manual ordering override on top of the participant-based auto-gallery. Items listed here are pinned to the front in the order given; remaining videos (where this alumnus is tagged in participants[]) follow by date.',
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

    // --- Education ---
    defineField({
      name: 'education',
      title: 'Education',
      type: 'array',
      of: [{
        type: 'object',
        fields: [
          defineField({ name: 'institution', title: 'Institution', type: 'string', validation: Rule => Rule.required() }),
          defineField({ name: 'school', title: 'School / College', type: 'string', description: 'e.g. Edmund A. Walsh School of Foreign Service' }),
          defineField({ name: 'degree', title: 'Degree', type: 'string', description: 'e.g. Bachelor of Science in Foreign Service, Master of Arts' }),
          defineField({ name: 'fieldOfStudy', title: 'Field of Study', type: 'string', description: 'e.g. International Politics, Strategic Communication' }),
          defineField({ name: 'certificates', title: 'Additional Certificates', type: 'array', of: [{ type: 'string' }] }),
          defineField({ name: 'startYear', title: 'Start Year', type: 'number' }),
          defineField({ name: 'endYear', title: 'End Year', type: 'number' }),
        ],
        preview: {
          select: { title: 'institution', subtitle: 'degree' },
        },
      }],
      description: 'Educational background shown on public profile',
    }),

    // --- Featured Content (curated for public profile) ---
    featuredContentField,

    // --- Order ---
    defineField({
      name: 'order',
      title: 'Order',
      type: 'number',
      description: 'Controls sorting priority (lower = higher priority)',
    }),

    // --- Futuro Corps OG card fields ("Futuro Corps · [Posture] · № NNN") ---
    defineField({
      name: 'futuroPosture',
      title: 'Futuro Posture',
      type: 'string',
      description: 'Vocational posture for the Futuro Corps OG eyebrow. Anyone of any age can claim any posture — this is NOT an age tier.',
      options: {
        list: [
          { title: 'Architect', value: 'architect' },
          { title: 'Catalyst', value: 'catalyst' },
          { title: 'Steward', value: 'steward' },
        ],
        layout: 'radio',
      },
    }),
    defineField({
      name: 'ledgerNumber',
      title: 'Ledger Number',
      type: 'number',
      description: 'Stable sequence number for this alumni in the Futuro Corps. Renders as "№ NNN" in the OG card eyebrow. Assign once and do not change.',
      validation: Rule => Rule.integer().positive(),
    }),

    // --- Companion Platform (new fields — all optional) ---
    defineField({
      name: 'institutionalDesignation',
      title: 'Institutional Designation',
      type: 'string',
      description: 'Controls dashboard access and dossier card title. Known values: "founder" (full admin), "ecosystem-director" (Directors\' Circle access). Free-text also accepted for display titles like "Project Author | Emerging".',
      fieldset: 'companion',
      options: {
        list: [
          { title: 'Founder', value: 'founder' },
          { title: 'Ecosystem Director', value: 'ecosystem-director' },
        ],
        layout: 'dropdown',
      },
    }),
    defineField({
      name: 'cohortYear',
      title: 'Cohort Year',
      type: 'number',
      fieldset: 'companion',
    }),
    defineField({
      name: 'generation',
      title: 'Generation',
      type: 'string',
      options: {
        list: [
          { title: 'Emerging Leader', value: 'emerging' },
          { title: 'Changemaker', value: 'changemaker' },
          { title: 'Legacy Architect', value: 'legacy-architect' },
        ],
      },
      fieldset: 'companion',
    }),
    defineField({
      name: 'convening',
      title: 'Convening (Futuro Summit)',
      type: 'reference',
      to: [{ type: 'futuroSummit' }],
      fieldset: 'companion',
      description: 'Primary / originating convening. Use the "Additional Cohorts" array for any further convenings this alumnus has participated in.',
    }),
    defineField({
      name: 'cohorts',
      title: 'Additional Cohorts',
      type: 'array',
      fieldset: 'companion',
      description: 'For alumni who have participated in more than one convening. Lists secondary cohorts beyond the originating one. Used for display on the public profile.',
      of: [{
        type: 'object',
        fields: [
          defineField({ name: 'convening', title: 'Convening', type: 'reference', to: [{ type: 'futuroSummit' }], validation: Rule => Rule.required() }),
          defineField({ name: 'year', title: 'Year', type: 'number', description: 'Year of this cohort (denormalized for display when the convening reference is unresolved).' }),
          defineField({ name: 'role', title: 'Role in this cohort', type: 'string', description: 'Optional. e.g. "Participant", "Mentor", "Returning author".' }),
        ],
        preview: {
          select: { title: 'convening.title', subtitle: 'year' },
        },
      }],
    }),
    defineField({
      name: 'engagementLevel',
      title: 'Engagement Level',
      type: 'string',
      options: {
        list: [
          { title: 'Active', value: 'active' },
          { title: 'Periodic', value: 'periodic' },
          { title: 'Dormant', value: 'dormant' },
          { title: 'Lost Contact', value: 'lost-contact' },
        ],
      },
      fieldset: 'companion',
    }),
    defineField({
      name: 'lastContactDate',
      title: 'Last Contact Date',
      type: 'date',
      fieldset: 'companion',
    }),
    defineField({
      name: 'skills',
      title: 'Skills',
      type: 'array',
      of: [{ type: 'string' }],
      fieldset: 'companion',
    }),
    defineField({
      name: 'interests',
      title: 'Interests',
      type: 'array',
      of: [{ type: 'string' }],
      fieldset: 'companion',
    }),
    defineField({
      name: 'location',
      title: 'Location',
      type: 'object',
      fields: [
        defineField({ name: 'city', title: 'City', type: 'string' }),
        defineField({ name: 'country', title: 'Country', type: 'string' }),
        defineField({ name: 'region', title: 'Region', type: 'string' }),
      ],
      fieldset: 'companion',
    }),
    defineField({
      name: 'contactInfo',
      title: 'Contact Info',
      type: 'object',
      description: 'INTERNAL — Never exposed in public queries',
      fields: [
        defineField({ name: 'email', title: 'Email', type: 'string' }),
        defineField({ name: 'phone', title: 'Phone', type: 'string' }),
        defineField({ name: 'preferredChannel', title: 'Preferred Channel', type: 'string' }),
      ],
      fieldset: 'companion',
    }),
    defineField({
      name: 'preferredLanguage',
      title: 'Preferred Language',
      type: 'string',
      description: 'ISO language code (e.g. en, es, pt)',
      fieldset: 'companion',
    }),
    defineField({
      name: 'founderReadiness',
      title: 'Founder Readiness',
      type: 'string',
      description: 'INTERNAL — Never surface to participants',
      options: {
        list: [
          { title: 'Exploring', value: 'exploring' },
          { title: 'Ideating', value: 'ideating' },
          { title: 'Building', value: 'building' },
          { title: 'Scaling', value: 'scaling' },
          { title: 'Mentoring', value: 'mentoring' },
        ],
      },
      fieldset: 'companion',
    }),
    defineField({
      name: 'onboardingDate',
      title: 'Onboarding Date',
      type: 'date',
      fieldset: 'companion',
    }),
    defineField({
      name: 'lastLoginDate',
      title: 'Last Login Date',
      type: 'datetime',
      fieldset: 'companion',
    }),
    defineField({
      name: 'journeyNotes',
      title: 'Journey Notes',
      type: 'text',
      description: 'INTERNAL — Private notes on this participant\'s journey',
      fieldset: 'companion',
    }),

    // --- Narrative (shared block) ---
    defineField({
      name: 'narrative',
      title: 'Narrative Development',
      type: 'narrativeBlock',
      description:
        'Differentiator fields for editorial enrichment (Opening Portrait, Origin Signal, ' +
        "Strategic Identity, Anima Key, etc.). Collapsed by default — only `strategicIdentity` " +
        'is queried by benextglobal.com today; the rest are deferred enrichment scaffolding.',
      options: { collapsible: true, collapsed: true },
    }),

    // --- External Identity ---
    defineField({
      name: 'externalIds',
      title: 'External IDs',
      type: 'object',
      description:
        'Identity links to external systems. Populated by the Stripe webhook + ' +
        'enrollment pipeline (Phase 62) — do not edit by hand unless reconciling.',
      fields: [
        defineField({ name: 'supabase', title: 'Supabase User ID', type: 'string' }),
        defineField({
          name: 'stripeSessionId',
          title: 'Stripe Session ID',
          type: 'string',
          description: 'cs_live_… from the Author × AI checkout that created this stub.',
        }),
        defineField({
          name: 'editionSlug',
          title: 'Author × AI Edition',
          type: 'string',
          description: 'e.g. may-2026 — the edition the buyer enrolled in.',
        }),
      ],
      options: { collapsible: true, collapsed: false },
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

    // --- Entity attribution (narrativeOwner only — alumni are people, not
    //     content, so platformTier / archivalStatus / conversionTracking /
    //     postingEntity from governanceFields were never populated here and
    //     don't apply to a person doc). ---
    defineField({
      name: 'narrativeOwner',
      title: 'Narrative Owner',
      type: 'string',
      options: {
        list: [
          { title: 'Hector (Personal Voice)', value: 'hector' },
          { title: 'BeNeXT (Institutional)', value: 'benext' },
          { title: 'Futuro (Program)', value: 'futuro' },
          { title: 'NeXT (Platform)', value: 'next' },
          { title: 'Mitikah (Advisory)', value: 'mitikah' },
          { title: 'Medikah (Healthcare)', value: 'medikah' },
        ],
        layout: 'dropdown',
      },
      description: 'Which entity attributes this person (BeNeXT / Futuro / NeXT / etc.)',
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