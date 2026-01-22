import dotenv from 'dotenv'
import { createClient } from '@sanity/client'

dotenv.config()
dotenv.config({ path: '.env.local', override: true })

const projectId = process.env.SANITY_PROJECT_ID || 'fo6n8ceo'
const dataset = process.env.SANITY_DATASET || 'production'
const token = process.env.SANITY_TOKEN
const isDryRun = process.argv.includes('--dry-run')

if (!token) {
  console.error('Missing SANITY_TOKEN. Provide a write-enabled token in the environment.')
  process.exit(1)
}

if (!process.env.SANITY_PROJECT_ID) {
  console.warn(`SANITY_PROJECT_ID not set. Using default: ${projectId}`)
}

if (!process.env.SANITY_DATASET) {
  console.warn(`SANITY_DATASET not set. Using default: ${dataset}`)
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: '2024-01-01',
  token,
  useCdn: false,
})

const OPED_QUERY = '*[_type == "opEd" && !(_id in path("drafts.**"))]'
const VLOG_QUERY = '*[_type == "vlog" && !(_id in path("drafts.**"))]'

const normalizeLanguage = (value) => {
  if (!value) return 'en'
  const normalized = value.trim().toLowerCase()
  if (normalized === 'es' || normalized.startsWith('spanish')) return 'es'
  if (normalized === 'en' || normalized.startsWith('english')) return 'en'
  return normalized.includes('es') ? 'es' : 'en'
}

const detectPlatformFromUrl = (url) => {
  if (!url) return null
  const lowered = url.toLowerCase()
  if (lowered.includes('tiktok.com')) return 'TikTok'
  if (lowered.includes('instagram.com')) return 'Instagram Reels'
  if (lowered.includes('linkedin.com')) return 'LinkedIn'
  if (lowered.includes('youtube.com') || lowered.includes('youtu.be')) return 'YouTube'
  return null
}

const mapPlatform = (vlog) => {
  const fromUrl = detectPlatformFromUrl(vlog.videoUrl)
  if (fromUrl) return fromUrl

  const channelType = typeof vlog.channelType === 'string' ? vlog.channelType.toLowerCase() : ''
  if (channelType.includes('tiktok')) return 'TikTok'
  if (channelType.includes('instagram')) return 'Instagram Reels'
  if (channelType.includes('linkedin')) return 'LinkedIn'

  return 'YouTube'
}

const normalizePublishDate = (value) => value || new Date().toISOString()

const cleanId = (value) => value.replace(/^drafts\./, '')

const migrateOpEds = async () => {
  console.log('Fetching opEd documents...')
  const opEds = await client.fetch(OPED_QUERY)
  console.log(`Found ${opEds.length} opEd documents.`)

  let migrated = 0
  let skipped = 0

  for (let index = 0; index < opEds.length; index += 1) {
    const doc = opEds[index]
    const baseId = cleanId(doc._id)
    const essayId = `essay-${baseId}`

    try {
      const existing = await client.getDocument(essayId)
      if (existing) {
        skipped += 1
        console.log(`[opEd ${index + 1}/${opEds.length}] Skipped (exists): ${essayId}`)
        continue
      }

      const {
        _id,
        _type,
        _rev,
        _createdAt,
        _updatedAt,
        seo,
        ...rest
      } = doc

      const essayDoc = {
        _id: essayId,
        _type: 'essay',
        ...rest,
        language: normalizeLanguage(doc.language),
        publicationVenue: 'aldia',
        publishDate: normalizePublishDate(doc.publishDate),
        fiveYearTest: doc.fiveYearTest ?? false,
        seoBlock: seo ?? doc.seoBlock,
        originalId: doc._id,
      }

      if (isDryRun) {
        migrated += 1
        console.log(`[opEd ${index + 1}/${opEds.length}] Would migrate: ${doc._id} -> ${essayId}`)
        continue
      }

      await client.createIfNotExists(essayDoc)
      migrated += 1
      console.log(`[opEd ${index + 1}/${opEds.length}] Migrated: ${doc._id} -> ${essayId}`)
    } catch (error) {
      console.error(`[opEd ${index + 1}/${opEds.length}] Failed: ${doc._id}`, error)
    }
  }

  return {total: opEds.length, migrated, skipped}
}

const migrateVlogs = async () => {
  console.log('Fetching vlog documents...')
  const vlogs = await client.fetch(VLOG_QUERY)
  console.log(`Found ${vlogs.length} vlog documents.`)

  let migrated = 0
  let skipped = 0

  for (let index = 0; index < vlogs.length; index += 1) {
    const doc = vlogs[index]
    const baseId = cleanId(doc._id)
    const videoId = `video-${baseId}`

    try {
      const existing = await client.getDocument(videoId)
      if (existing) {
        skipped += 1
        console.log(`[vlog ${index + 1}/${vlogs.length}] Skipped (exists): ${videoId}`)
        continue
      }

      const {
        _id,
        _type,
        _rev,
        _createdAt,
        _updatedAt,
        tags_ref,
        datePublished,
        ...rest
      } = doc

      const videoDoc = {
        _id: videoId,
        _type: 'video',
        ...rest,
        videoFormat: 'longform',
        platform: mapPlatform(doc),
        publishDate: normalizePublishDate(datePublished),
        videoUrl: doc.videoUrl,
        thumbnailImage: doc.video?.thumbnail || undefined,
        tags: Array.isArray(tags_ref) ? tags_ref : [],
        originalId: doc._id,
      }

      if (!videoDoc.videoUrl) {
        console.warn(`[vlog ${index + 1}/${vlogs.length}] Missing videoUrl: ${doc._id}`)
      }

      if (isDryRun) {
        migrated += 1
        console.log(`[vlog ${index + 1}/${vlogs.length}] Would migrate: ${doc._id} -> ${videoId}`)
        continue
      }

      await client.createIfNotExists(videoDoc)
      migrated += 1
      console.log(`[vlog ${index + 1}/${vlogs.length}] Migrated: ${doc._id} -> ${videoId}`)
    } catch (error) {
      console.error(`[vlog ${index + 1}/${vlogs.length}] Failed: ${doc._id}`, error)
    }
  }

  return {total: vlogs.length, migrated, skipped}
}

const main = async () => {
  try {
    if (isDryRun) {
      console.log('DRY RUN MODE - No documents will be created')
    }
    console.log('Connecting to Sanity...')
    console.log(`✓ Connected to project: ${projectId}`)

    const opEdResult = await migrateOpEds()
    const vlogResult = await migrateVlogs()

    if (isDryRun) {
      console.log('\nWould migrate:')
      console.log(
        `  - ${opEdResult.migrated} Op-Eds → Essays (publicationVenue: aldia, language: en/es)`,
      )
      console.log(
        `  - ${vlogResult.migrated} Vlogs → Videos (videoFormat: longform, platform: auto)`,
      )
      console.log(`\nTotal: ${opEdResult.migrated + vlogResult.migrated} documents would be created`)
    } else {
      console.log('Migration finished.')
    }
  } catch (error) {
    console.error('Migration failed.', error)
    process.exitCode = 1
  }
}

main()
