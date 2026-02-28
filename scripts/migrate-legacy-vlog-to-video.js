/* eslint-disable no-console */
require('dotenv').config()

const {createClient} = require('@sanity/client')

const PROJECT_ID = process.env.SANITY_PROJECT_ID || 'fo6n8ceo'
const DATASET = process.env.SANITY_DATASET || 'production'
const TOKEN = process.env.SANITY_TOKEN
const API_VERSION = '2024-10-23'

if (!TOKEN) {
  console.error('Missing SANITY_TOKEN in environment.')
  process.exit(1)
}

const client = createClient({
  projectId: PROJECT_ID,
  dataset: DATASET,
  apiVersion: API_VERSION,
  token: TOKEN,
  useCdn: false,
})

const isDryRun = process.argv.includes('--dry-run')

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96)
}

function normalizePlatform(value) {
  if (!value) return null
  const normalized = String(value).toLowerCase()
  if (normalized.includes('youtube')) return 'YouTube'
  if (normalized.includes('tiktok')) return 'TikTok'
  if (normalized.includes('instagram')) return 'Instagram Reels'
  if (normalized.includes('linkedin')) return 'LinkedIn'
  return null
}

function platformFromUrls(urls) {
  if (!Array.isArray(urls)) return null
  for (const url of urls) {
    const match = normalizePlatform(url)
    if (match) return match
  }
  return null
}

function mapVideoFormat(value) {
  if (!value) return null
  const normalized = String(value).toLowerCase()
  if (['short', 'shortform', 'clip'].includes(normalized)) return 'shortform'
  return 'longform'
}

function buildYouTubeUrl(platformId) {
  if (!platformId) return null
  return `https://www.youtube.com/watch?v=${platformId}`
}

function pickDefined(input) {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined)
  )
}

async function migrate() {
  console.log(`\n=== MIGRATE LEGACY VLOG FIELDS → VIDEO (${PROJECT_ID}/${DATASET}) ===\n`)
  console.log(isDryRun ? 'DRY RUN MODE - No changes will be committed.\n' : 'LIVE MODE\n')

  const videos = await client.fetch(
    `*[_type == "video" && (
      defined(ai_derivatives) ||
      defined(analytics) ||
      defined(channelRef) ||
      defined(channelType) ||
      defined(contentFormat) ||
      defined(distribution) ||
      defined(gallery) ||
      defined(language) ||
      defined(narrative) ||
      defined(order) ||
      defined(originalId) ||
      defined(publish) ||
      defined(publishedAt) ||
      defined(datePublished) ||
      defined(seo) ||
      defined(updatedAt) ||
      defined(video) ||
      defined(tags_ref) ||
      (defined(tags) && tags[0]._type != "reference")
    )]{
      _id,
      title,
      slug,
      _createdAt,
      publishDate,
      videoUrl,
      platform,
      videoFormat,
      thumbnailImage,
      tags,
      tags_ref,
      ai_derivatives,
      analytics,
      channelRef,
      channelType,
      contentFormat,
      distribution,
      gallery,
      language,
      narrative,
      order,
      originalId,
      publish,
      publishedAt,
      datePublished,
      seo,
      updatedAt,
      video
    }`
  )

  if (!videos.length) {
    console.log('No legacy video documents found. Nothing to migrate.\n')
    return
  }

  console.log(`Found ${videos.length} video documents with legacy fields.\n`)

  for (const doc of videos) {
    const slugCurrent = doc.slug?.current
    const mappedSlug = slugCurrent || slugify(doc.title)
    const mappedPublishDate =
      doc.publishDate || doc.publishedAt || doc.datePublished || doc._createdAt

    const legacyUrls = Array.isArray(doc.distribution) ? doc.distribution : []
    const legacyPlatform =
      normalizePlatform(doc.platform) ||
      normalizePlatform(doc.video?.platform) ||
      platformFromUrls(legacyUrls)

    const mappedVideoFormat = doc.videoFormat || mapVideoFormat(doc.contentFormat) || 'longform'

    const mappedVideoUrl =
      doc.videoUrl ||
      (legacyUrls.length ? legacyUrls[0] : null) ||
      buildYouTubeUrl(doc.video?.platformId)

    const mappedThumbnail = doc.thumbnailImage || doc.video?.thumbnail

    const hasRefTags = Array.isArray(doc.tags) && doc.tags[0]?._type === 'reference'
    const hasLegacyTags = Array.isArray(doc.tags) && !hasRefTags
    const mappedTags = hasRefTags
      ? doc.tags
      : doc.tags_ref && doc.tags_ref.length
      ? doc.tags_ref
      : undefined

    const legacyVlog = pickDefined({
      aiDerivatives: doc.ai_derivatives,
      analytics: doc.analytics,
      channelRef: doc.channelRef,
      channelType: doc.channelType,
      contentFormat: doc.contentFormat,
      distribution: doc.distribution,
      gallery: doc.gallery,
      language: doc.language,
      narrative: doc.narrative,
      order: doc.order,
      originalId: doc.originalId,
      publish: doc.publish,
      publishedAt: doc.publishedAt || doc.datePublished,
      seo: doc.seo,
      updatedAt: doc.updatedAt,
      video: doc.video,
      videoUrl: doc.videoUrl,
      tags: hasLegacyTags ? doc.tags : undefined,
      tags_ref: doc.tags_ref,
    })

    const setIfMissing = pickDefined({
      slug: mappedSlug ? {_type: 'slug', current: mappedSlug} : undefined,
      publishDate: mappedPublishDate,
      videoUrl: mappedVideoUrl || undefined,
      platform: legacyPlatform || undefined,
      videoFormat: mappedVideoFormat || undefined,
      thumbnailImage: mappedThumbnail || undefined,
      tags: mappedTags,
    })

    console.log(`- ${doc._id} | ${doc.title}`)
    if (isDryRun) {
      console.log('  setIfMissing:', setIfMissing)
      console.log('  legacyVlog keys:', Object.keys(legacyVlog))
      continue
    }

    const unsetFields = [
      'ai_derivatives',
      'analytics',
      'channelRef',
      'channelType',
      'contentFormat',
      'distribution',
      'gallery',
      'language',
      'narrative',
      'order',
      'originalId',
      'publish',
      'publishedAt',
      'datePublished',
      'seo',
      'updatedAt',
      'video',
      'tags_ref',
    ]

    if (hasLegacyTags) {
      unsetFields.push('tags')
    }

    try {
      await client
        .patch(doc._id)
        .setIfMissing(setIfMissing)
        .set({legacyVlog})
        .unset(unsetFields)
        .commit()
      console.log('  ✅ migrated')
    } catch (error) {
      console.error('  ❌ failed:', error.message)
    }
  }

  console.log('\nDone.\n')
}

migrate().catch((error) => {
  console.error(error)
  process.exit(1)
})
