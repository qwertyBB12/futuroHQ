/**
 * Migrate podcastEpisode documents from dotted IDs (podcastEpisode.xxx)
 * to non-dotted IDs (podcastEpisode-xxx) so they are publicly readable
 * under the default Sanity ACL rule: _id in path("*")
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
  const episodes = await client.fetch<any[]>(`*[_type == "podcastEpisode"]{...}`)
  console.log(`Found ${episodes.length} episodes to migrate`)

  for (const ep of episodes) {
    const oldId = ep._id
    const newId = oldId.replace(/\./g, '-')

    if (oldId === newId) {
      console.log(`  SKIP ${oldId} (no dots)`)
      continue
    }

    console.log(`  ${oldId} → ${newId}`)

    const { _rev, _createdAt, _updatedAt, ...fields } = ep
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
