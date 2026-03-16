/**
 * Migrate alumni featuredEssays + featuredVideos -> featuredContent
 *
 * Usage:
 *   npx tsx scripts/migrate-alumni-featured.ts [--live]
 *
 * Without --live flag, runs in dry-run mode (no mutations).
 * With --live flag, applies changes to production.
 */

import {config} from 'dotenv'
import {createClient} from '@sanity/client'

config({path: '.env.local', override: false})

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID || 'fo6n8ceo',
  dataset: process.env.SANITY_DATASET || 'production',
  token: process.env.SANITY_WRITE_TOKEN || '',
  apiVersion: '2025-01-01',
  useCdn: false,
})

const isLive = process.argv.includes('--live')

async function run() {
  // Fetch all alumni that have featuredEssays or featuredVideos
  const docs = await client.fetch<
    Array<{
      _id: string
      name: string
      featuredEssays?: Array<{_ref: string; _type: string; _key?: string}>
      featuredVideos?: Array<{_ref: string; _type: string; _key?: string}>
      featuredContent?: Array<{_ref: string; _type: string; _key?: string}>
    }>
  >(
    `*[_type == "alumni" && (defined(featuredEssays) || defined(featuredVideos))]{
      _id, name, featuredEssays, featuredVideos, featuredContent
    }`,
  )

  console.log(`Found ${docs.length} alumni with featuredEssays or featuredVideos`)

  if (docs.length === 0) {
    console.log('Nothing to migrate.')
    return
  }

  if (!isLive) {
    console.log(
      `\nWARNING: This will REMOVE featuredEssays and featuredVideos fields from ${docs.length} alumni documents. Run with --live to apply.`,
    )
    console.log('\n[DRY RUN] Documents that would be migrated:')
    for (const doc of docs) {
      const essayCount = doc.featuredEssays?.length ?? 0
      const videoCount = doc.featuredVideos?.length ?? 0
      const existingContent = doc.featuredContent?.length ?? 0
      console.log(
        `  ${doc._id} (${doc.name}) — ${essayCount} essays, ${videoCount} videos, ${existingContent} existing featuredContent`,
      )
    }
    console.log('\n[DRY RUN] No documents were patched.')
    return
  }

  let patched = 0
  let errors = 0

  for (const doc of docs) {
    try {
      // Merge existing featuredContent + featuredEssays + featuredVideos
      const existing = doc.featuredContent ?? []
      const essays = doc.featuredEssays ?? []
      const videos = doc.featuredVideos ?? []

      // Deduplicate by _ref
      const seen = new Set(existing.map((r) => r._ref))
      const merged = [...existing]

      for (const ref of [...essays, ...videos]) {
        if (!seen.has(ref._ref)) {
          seen.add(ref._ref)
          merged.push(ref)
        }
      }

      console.log(`[PATCHING] ${doc._id} (${doc.name}) — merging ${merged.length} refs into featuredContent`)

      await client
        .patch(doc._id)
        .set({featuredContent: merged})
        .unset(['featuredEssays', 'featuredVideos'])
        .commit()

      patched++
    } catch (err) {
      errors++
      console.error(`ERROR: ${doc._id} — ${(err as Error).message}`)
    }
  }

  console.log(`\nPatched ${patched} records. ${errors} errors.`)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
