/**
 * Central completeness configuration for enrichment tooling.
 * Single source of truth for field checklists, validation, and GROQ filters.
 *
 * IMPORTANT: Zero imports from 'sanity' or '@sanity/ui'. This file is pure
 * TypeScript so it can be imported by both the Studio (browser) and Node.js
 * batch scripts running outside the Studio runtime.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type FieldCheck = {
  /** Top-level field name on the document */
  field: string
  /** Human-readable label for banner display and missing field lists */
  label: string
  /** Returns true when the field value satisfies the completeness requirement */
  validate: (value: unknown) => boolean
}

export type CompletenessConfig = Record<string, FieldCheck[]>

// ---------------------------------------------------------------------------
// COMPLETENESS_CONFIG — per-type field checklists with deep validation
// ---------------------------------------------------------------------------

export const COMPLETENESS_CONFIG: CompletenessConfig = {
  alumni: [
    {
      field: 'bio',
      label: 'Bio',
      validate: (v) => typeof v === 'string' && v.trim().length > 50,
    },
    {
      field: 'media',
      label: 'Photo',
      validate: (v) => Array.isArray(v) && v.length > 0,
    },
    {
      field: 'cohortYear',
      label: 'Cohort Year',
      validate: (v) => typeof v === 'number' && v > 0,
    },
    {
      field: 'generation',
      label: 'Generation',
      validate: (v) => typeof v === 'string' && v.length > 0,
    },
    {
      field: 'slug',
      label: 'Slug',
      validate: (v) => Boolean((v as Record<string, unknown>)?.current),
    },
  ],

  collaborator: [
    {
      field: 'bio',
      label: 'Bio',
      validate: (v) => typeof v === 'string' && v.trim().length > 50,
    },
    {
      field: 'logo',
      label: 'Logo',
      validate: (v) =>
        Boolean((v as Record<string, Record<string, unknown>>)?.asset?._ref),
    },
    {
      field: 'orgType',
      label: 'Org Type',
      validate: (v) => typeof v === 'string' && v.length > 0,
    },
  ],

  ledgerPerson: [
    {
      field: 'openingPortrait',
      label: 'Opening Portrait',
      validate: (v) => typeof v === 'string' && v.trim().length > 50,
    },
    {
      field: 'currentTitle',
      label: 'Current Title',
      validate: (v) => typeof v === 'string' && v.length > 0,
    },
    {
      field: 'organization',
      label: 'Organization',
      validate: (v) => typeof v === 'string' && v.length > 0,
    },
  ],

  video: [
    {
      field: 'thumbnailImage',
      label: 'Thumbnail',
      validate: (v) =>
        Boolean((v as Record<string, Record<string, unknown>>)?.asset?._ref),
    },
    {
      field: 'description',
      label: 'Description',
      validate: (v) => typeof v === 'string' && v.trim().length > 0,
    },
    {
      field: 'tags',
      label: 'Tags',
      validate: (v) => Array.isArray(v) && v.length > 0,
    },
    {
      field: 'seo',
      label: 'SEO',
      validate: (v) =>
        Boolean((v as Record<string, unknown>)?.metaDescription),
    },
  ],

  podcastEpisode: [
    {
      field: 'description',
      label: 'Description',
      validate: (v) => typeof v === 'string' && v.trim().length > 0,
    },
    {
      field: 'audioEmbed',
      label: 'Audio Embed',
      validate: (v) => Boolean(v),
    },
    {
      field: 'tags',
      label: 'Tags',
      validate: (v) => Array.isArray(v) && v.length > 0,
    },
    {
      field: 'episodeNumber',
      label: 'Episode Number',
      validate: (v) => typeof v === 'number' && v > 0,
    },
  ],
}

// ---------------------------------------------------------------------------
// ENRICHMENT_TYPES — the 5 tracked type names as a Set
// NOTE: This is NOT the same as GOVERNED_TYPES. collaborator and ledgerPerson
// are tracked for enrichment but are NOT in GOVERNED_TYPES.
// ---------------------------------------------------------------------------

export const ENRICHMENT_TYPES: Set<string> = new Set(
  Object.keys(COMPLETENESS_CONFIG),
)

// ---------------------------------------------------------------------------
// checkCompleteness — runs all field checks for a given document type
// ---------------------------------------------------------------------------

/**
 * Runs the completeness checklist for a document of the given schema type.
 *
 * @param doc        - The document object (top-level field values)
 * @param schemaType - The Sanity schema type name (e.g. 'alumni')
 * @returns { completed, total, missingFields } where missingFields contains
 *          the human-readable labels of all failing checks.
 *          If schemaType is not tracked, returns { completed: 0, total: 0, missingFields: [] }.
 */
export function checkCompleteness(
  doc: Record<string, unknown>,
  schemaType: string,
): {completed: number; total: number; missingFields: string[]} {
  const checks = COMPLETENESS_CONFIG[schemaType]
  if (!checks) {
    return {completed: 0, total: 0, missingFields: []}
  }

  const missingFields: string[] = []
  let completed = 0

  for (const check of checks) {
    if (check.validate(doc[check.field])) {
      completed++
    } else {
      missingFields.push(check.label)
    }
  }

  return {completed, total: checks.length, missingFields}
}

// ---------------------------------------------------------------------------
// GROQ_FILTERS — pre-built GROQ filter strings for each tracked type
// Used by deskStructure.ts (Needs Enrichment lists) and dashboard widgets.
// All filters exclude drafts and match published documents missing at least
// one required field.
// ---------------------------------------------------------------------------

export const GROQ_FILTERS: Record<string, string> = {
  alumni: `_type == "alumni" && !(_id in path("drafts.**")) && (!defined(bio) || length(bio) <= 50 || !defined(media) || length(media) == 0 || !defined(cohortYear) || !defined(generation) || !defined(slug) || !defined(slug.current))`,

  collaborator: `_type == "collaborator" && !(_id in path("drafts.**")) && (!defined(bio) || length(bio) <= 50 || !defined(logo) || !defined(logo.asset) || !defined(orgType))`,

  ledgerPerson: `_type == "ledgerPerson" && !(_id in path("drafts.**")) && (!defined(openingPortrait) || length(openingPortrait) <= 50 || !defined(currentTitle) || !defined(organization))`,

  video: `_type == "video" && !(_id in path("drafts.**")) && (!defined(thumbnailImage) || !defined(thumbnailImage.asset) || !defined(description) || description == "" || !defined(tags) || length(tags) == 0 || !defined(seo) || !defined(seo.metaDescription))`,

  podcastEpisode: `_type == "podcastEpisode" && !(_id in path("drafts.**")) && (!defined(description) || description == "" || !defined(audioEmbed) || !defined(tags) || length(tags) == 0 || !defined(episodeNumber))`,
}
