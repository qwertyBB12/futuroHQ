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

const draftIds = [
  'drafts.video-vlog-youtube-bZpW_4qw3Qs',
  'drafts.video-vlog-youtube-pHTAB3ov-xY',
]

async function run() {
  for (const draftId of draftIds) {
    const publishedId = draftId.replace('drafts.', '')
    const draft = await client.getDocument(draftId)
    if (!draft) {
      console.log(`  Not found: ${draftId}`)
      continue
    }
    const { _rev, _createdAt, _updatedAt, ...fields } = draft as any
    await client
      .transaction()
      .createOrReplace({ ...fields, _id: publishedId })
      .delete(draftId)
      .commit()
    console.log(`  Published: ${publishedId}`)
  }
  console.log('Done.')
}

run().catch(err => { console.error(err); process.exit(1) })
