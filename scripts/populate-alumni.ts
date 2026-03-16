/**
 * Populate alumni records from user-provided data file.
 *
 * Usage:
 *   npx tsx scripts/populate-alumni.ts [--dry-run]
 *
 * Reads: scripts/data/alumni-data.json
 * Uses client.patch().set() to overwrite fields with real data.
 * Processes in chunks of 25 with 1s delay for rate-limit safety.
 */

import {config} from 'dotenv'
import {createClient} from '@sanity/client'
import {readFileSync} from 'fs'
import {resolve} from 'path'

config({path: '.env.local', override: false})

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID || 'fo6n8ceo',
  dataset: process.env.SANITY_DATASET || 'production',
  token: process.env.SANITY_WRITE_TOKEN || '',
  apiVersion: '2025-01-01',
  useCdn: false,
})

const isDryRun = process.argv.includes('--dry-run')

type AlumniRecord = {
  _id: string
  cohortYear?: number
  generation?: string
  country?: string
  bio?: string
  [key: string]: unknown
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function processInChunks<T>(
  items: T[],
  chunkSize: number,
  handler: (chunk: T[]) => Promise<void>,
  delayMs = 1000,
): Promise<void> {
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize)
    await handler(chunk)
    if (i + chunkSize < items.length) {
      await sleep(delayMs)
    }
  }
}

async function run() {
  const dataPath = resolve(__dirname, 'data/alumni-data.json')
  let records: AlumniRecord[]

  try {
    records = JSON.parse(readFileSync(dataPath, 'utf-8'))
  } catch {
    console.error(`ERROR: Could not read ${dataPath}`)
    console.error('Create scripts/data/alumni-data.json with an array of records keyed by _id.')
    console.error('See scripts/data-templates/alumni-data.example.json for the expected format.')
    process.exit(1)
  }

  console.log(`Loaded ${records.length} alumni records from data file`)

  if (isDryRun) {
    console.log('\n[DRY RUN] Records that would be patched:')
    for (const rec of records) {
      const fields = Object.keys(rec).filter((k) => k !== '_id')
      console.log(`  ${rec._id} — fields: ${fields.join(', ')}`)
    }
    console.log('\n[DRY RUN] No documents were patched.')
    return
  }

  let patched = 0
  let errors = 0

  await processInChunks(records, 25, async (chunk) => {
    const tx = client.transaction()
    for (const rec of chunk) {
      const {_id, ...fields} = rec
      tx.patch(_id, (p) => p.set(fields))
    }
    try {
      await tx.commit()
      patched += chunk.length
      console.log(`[PATCHING] Patched ${chunk.length} documents`)
    } catch (err) {
      errors += chunk.length
      console.error(`ERROR: chunk failed — ${(err as Error).message}`)
    }
  })

  console.log(`\nPatched ${patched} records. ${errors} errors.`)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
