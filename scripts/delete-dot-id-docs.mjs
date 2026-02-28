import dotenv from 'dotenv'
import { createClient } from '@sanity/client'

dotenv.config()
dotenv.config({ path: '.env.local', override: true })

const client = createClient({
  projectId: 'fo6n8ceo',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_TOKEN,
  useCdn: false,
})

// Find videos with dots in IDs
const videosToDelete = await client.fetch('*[_type == "video" && _id match "*.*"]{_id}')
console.log(`Found ${videosToDelete.length} videos with dots in IDs to delete`)

// Find essays with dots in IDs
const essaysToDelete = await client.fetch('*[_type == "essay" && _id match "*.*"]{_id}')
console.log(`Found ${essaysToDelete.length} essays with dots in IDs to delete`)

// Delete videos
console.log('\nDeleting videos...')
let videoDeleted = 0
for (const doc of videosToDelete) {
  await client.delete(doc._id)
  videoDeleted++
  if (videoDeleted % 10 === 0) console.log(`  Deleted ${videoDeleted}/${videosToDelete.length} videos`)
}
console.log(`✓ Deleted ${videoDeleted} videos`)

// Delete essays
console.log('\nDeleting essays...')
let essayDeleted = 0
for (const doc of essaysToDelete) {
  await client.delete(doc._id)
  essayDeleted++
  console.log(`  Deleted: ${doc._id}`)
}
console.log(`✓ Deleted ${essayDeleted} essays`)

console.log(`\nTotal deleted: ${videoDeleted + essayDeleted} documents`)
