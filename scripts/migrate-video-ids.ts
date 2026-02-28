/**
 * Migrate video documents from dotted IDs (video.xxx)
 * to non-dotted IDs (video-xxx) so they are publicly readable.
 */
import { config } from 'dotenv'
import { createClient } from '@sanity/client'

config({ path: '.env.local', override: false })

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID!,
  dataset: process.env.SANITY_DATASET || 'production',
  token: process.env.SANITY_WRITE_TOKEN!,
  apiVersion: '2025-01-01',
  useCdn: false,
})

async function run() {
  const videos = await client.fetch<any[]>(`*[_type == "video" && _id match "video.*"]{...}`)
  console.log(`Found ${videos.length} videos with dotted IDs to migrate`)

  for (const doc of videos) {
    const oldId = doc._id
    const newId = oldId.replace(/\./g, '-')

    if (oldId === newId) {
      console.log(`  SKIP ${oldId}`)
      continue
    }

    console.log(`  ${oldId} → ${newId}`)

    const { _rev, _createdAt, _updatedAt, ...fields } = doc
    const newDoc = { ...fields, _id: newId }

    await client
      .transaction()
      .createOrReplace(newDoc)
      .delete(oldId)
      .commit()
  }

  console.log('Migration complete.')
}

run().catch(err => {
  console.error('Migration failed:', err)
  process.exit(1)
})
