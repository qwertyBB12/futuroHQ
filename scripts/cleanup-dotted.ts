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
  const docs = await client.fetch<any[]>(`*[_id match "*.*"]{_id,_type}`)
  const old = docs.filter((d: any) =>
    !d._id.startsWith('drafts.') &&
    !d._type.startsWith('sanity.') &&
    !d._type.startsWith('system.') &&
    !d._id.startsWith('_.')
  )
  console.log(`Remaining dotted: ${old.length}`)

  // Delete non-tags first (they reference tags), then tags
  old.sort((a: any, b: any) => (a._type === 'tag' ? 1 : 0) - (b._type === 'tag' ? 1 : 0))

  let ok = 0
  let fail = 0
  for (const d of old) {
    try {
      await client.delete(d._id)
      ok++
    } catch {
      fail++
    }
  }
  console.log(`Deleted: ${ok}, Failed: ${fail}`)
}

run()
