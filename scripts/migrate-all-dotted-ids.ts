/**
 * Migrate ALL documents with dotted IDs to dashed IDs
 * in 3 phases to respect referential integrity:
 *   1. Create all new docs (with updated refs)
 *   2. Update all remaining docs that reference old IDs
 *   3. Delete all old docs
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

const SKIP_PREFIXES = ['sanity.', 'system.', '_.',  'drafts.']

function shouldMigrate(doc: any): boolean {
  if (!doc._id.includes('.')) return false
  for (const p of SKIP_PREFIXES) {
    if (doc._id.startsWith(p) || doc._type.startsWith(p)) return false
  }
  return true
}

function replaceRefs(obj: any, idMap: Map<string, string>): any {
  return JSON.parse(JSON.stringify(obj), (key, value) => {
    if (key === '_ref' && typeof value === 'string' && idMap.has(value)) {
      return idMap.get(value)
    }
    return value
  })
}

async function run() {
  const allDocs = await client.fetch<any[]>(`*[_id match "*.*"]{...}`)
  const toMigrate = allDocs.filter(shouldMigrate)

  console.log(`Found ${toMigrate.length} documents to migrate`)
  const byType: Record<string, number> = {}
  for (const d of toMigrate) byType[d._type] = (byType[d._type] || 0) + 1
  console.log('By type:', byType)

  // Build ID mapping
  const idMap = new Map<string, string>()
  for (const doc of toMigrate) {
    idMap.set(doc._id, doc._id.replace(/\./g, '-'))
  }

  // Phase 1: Create all new documents (with updated refs)
  console.log('\n--- Phase 1: Creating new documents ---')
  let created = 0
  for (const doc of toMigrate) {
    const newId = idMap.get(doc._id)!
    const patched = replaceRefs(doc, idMap)
    const { _rev, _createdAt, _updatedAt, ...fields } = patched
    await client.createOrReplace({ ...fields, _id: newId })
    created++
    if (created % 50 === 0) console.log(`  created ${created}/${toMigrate.length}`)
  }
  console.log(`  Created ${created} new documents`)

  // Phase 2: Update all non-migrated docs that reference old IDs
  console.log('\n--- Phase 2: Updating stale references ---')
  const remaining = await client.fetch<any[]>(`*[!(_type match "sanity.*") && !(_type match "system.*") && !(_id in path("_.*"))]{...}`)
  let refFixes = 0
  for (const doc of remaining) {
    if (idMap.has(doc._id)) continue // skip old docs about to be deleted
    const str = JSON.stringify(doc)
    let changed = false
    const fixed = JSON.parse(str, (key, value) => {
      if (key === '_ref' && typeof value === 'string' && idMap.has(value)) {
        changed = true
        return idMap.get(value)
      }
      return value
    })
    if (changed) {
      const { _rev, _createdAt, _updatedAt, ...fields } = fixed
      await client.createOrReplace(fields)
      refFixes++
    }
  }
  console.log(`  Fixed ${refFixes} documents with stale references`)

  // Phase 3: Delete old documents
  console.log('\n--- Phase 3: Deleting old documents ---')
  let deleted = 0
  for (const doc of toMigrate) {
    try {
      await client.delete(doc._id)
      deleted++
      if (deleted % 50 === 0) console.log(`  deleted ${deleted}/${toMigrate.length}`)
    } catch (err: any) {
      console.error(`  FAILED to delete ${doc._id}: ${err.message}`)
    }
  }
  console.log(`  Deleted ${deleted} old documents`)

  console.log(`\nMigration complete.`)
}

run().catch(err => {
  console.error('Migration failed:', err)
  process.exit(1)
})
