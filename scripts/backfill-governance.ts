/**
 * Backfill governance fields on podcast episodes missing them.
 * Sets: narrativeOwner=hector, platformTier=canonical, archivalStatus=archival
 */
import { config } from 'dotenv'
import { createClient } from '@sanity/client'

config({ path: '.env.local', override: false })

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID || '',
  dataset: process.env.SANITY_DATASET || 'production',
  token: process.env.SANITY_WRITE_TOKEN || '',
  apiVersion: '2025-01-01',
  useCdn: false,
})

async function run() {
  const episodes = await client.fetch<any[]>(
    `*[_type == "podcastEpisode" && (!defined(narrativeOwner) || !defined(archivalStatus) || !defined(platformTier))]{_id, title, narrativeOwner, platformTier, archivalStatus}`
  )

  console.log(`Found ${episodes.length} episodes missing governance fields`)

  for (const ep of episodes) {
    console.log(`  Patching: ${ep.title}`)
    await client
      .patch(ep._id)
      .setIfMissing({
        narrativeOwner: 'hector',
        platformTier: 'canonical',
        archivalStatus: 'archival',
      })
      .commit()
  }

  console.log('Done.')
}

run().catch(err => {
  console.error(err)
  process.exit(1)
})
