import {config} from 'dotenv'
import {createClient} from '@sanity/client'

config({path: '.env.local', override: false})

type DocWithDates = {
  _id: string
  _type: string
  _createdAt: string
  publishDate?: string
  datePublished?: string
  pubDate?: string
}

const projectId = process.env.SANITY_PROJECT_ID
const dataset = process.env.SANITY_DATASET || 'production'
const token = process.env.SANITY_WRITE_TOKEN

if (!projectId) {
  console.error('Missing SANITY_PROJECT_ID environment variable.')
  process.exit(1)
}

if (!token) {
  console.error('Missing SANITY_WRITE_TOKEN environment variable.')
  process.exit(1)
}

const client = createClient({
  projectId,
  dataset,
  token,
  apiVersion: '2025-01-01',
  useCdn: false,
})

const dryRun = process.env.DRY_RUN !== 'false'
const targetTypes =
  process.env.PUBLISHED_AT_TYPES?.split(',').map(part => part.trim()).filter(Boolean) ?? [
    'opEd',
    'curatedPost',
    'vlog',
    'project',
    'podcast',
  ]

const getFallbackDate = (doc: DocWithDates) => {
  const candidates = [doc.datePublished, doc.pubDate, doc.publishDate, doc._createdAt]
  const firstDefined = candidates.find(value => typeof value === 'string' && value.trim())
  return firstDefined ? new Date(firstDefined).toISOString() : null
}

async function backfill() {
  console.log(
    `Backfilling publishedAt for ${targetTypes.join(', ')} (dryRun=${dryRun ? 'true' : 'false'}).`,
  )

  const docs: DocWithDates[] = await client.fetch(
    `*[_type in $types && !defined(publishedAt)]{_id, _type, _createdAt, publishDate, datePublished, pubDate}`,
    {types: targetTypes},
  )

  if (!docs.length) {
    console.log('All target documents already contain publishedAt. Nothing to do.')
    return
  }

  let patchedCount = 0
  for (const doc of docs) {
    const fallback = getFallbackDate(doc)
    if (!fallback) {
      console.warn(
        `Skipping ${doc._id} (${doc._type}) – no fallback date available for publishedAt.`,
      )
      continue
    }

    console.log(`Setting publishedAt on ${doc._id} (${doc._type}) -> ${fallback}`)

    if (dryRun) {
      continue
    }

    await client.patch(doc._id).setIfMissing({publishedAt: fallback}).commit()
    patchedCount += 1
  }

  console.log(`Backfill complete. Patched ${patchedCount} document(s).`)
}

backfill().catch(err => {
  console.error('PublishedAt backfill failed:', err)
  process.exit(1)
})
