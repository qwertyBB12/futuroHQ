/**
 * Batch enrichment script — patches incomplete documents with placeholder values.
 *
 * Usage:
 *   npx tsx scripts/batch-enrich.ts <type> [--dry-run]
 *
 * Types: alumni, collaborator, ledgerPerson, video, podcastEpisode
 *
 * Uses setIfMissing so existing values are never overwritten — safe to run multiple times.
 * Processes in chunks of 25 with 1s delay between chunks for rate-limit safety.
 */

import {config} from 'dotenv'
import {createClient} from '@sanity/client'
import {COMPLETENESS_CONFIG, GROQ_FILTERS} from '../lib/completeness'

config({path: '.env.local', override: false})

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID || 'fo6n8ceo',
  dataset: process.env.SANITY_DATASET || 'production',
  token: process.env.SANITY_WRITE_TOKEN || '',
  apiVersion: '2025-01-01',
  useCdn: false,
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
    // Sleep between chunks but not after the last one
    if (i + chunkSize < items.length) {
      await sleep(delayMs)
    }
  }
}

// ---------------------------------------------------------------------------
// Placeholder defaults per type — intentionally obvious so they show up in
// Needs Enrichment lists and can be replaced with real data in Phase 6.
// ---------------------------------------------------------------------------

const DEFAULTS: Record<string, Record<string, unknown>> = {
  alumni: {
    bio: '[Bio needed]',
    cohortYear: 2025,
    generation: '[Generation needed]',
  },
  collaborator: {
    bio: '[Bio needed]',
    orgType: '[Type needed]',
  },
  ledgerPerson: {
    openingPortrait: '[Opening portrait text needed]',
    currentTitle: '[Title needed]',
    organization: '[Organization needed]',
  },
  video: {
    description: '[Description needed]',
  },
  podcastEpisode: {
    description: '[Description needed]',
  },
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

const USAGE = 'Usage: npx tsx scripts/batch-enrich.ts <type> [--dry-run]'
const VALID_TYPES = Object.keys(COMPLETENESS_CONFIG)

const typeArg = process.argv[2]
const isDryRun = process.argv.includes('--dry-run')

if (!typeArg || !VALID_TYPES.includes(typeArg)) {
  console.error(`Error: invalid or missing type argument.`)
  console.error(USAGE)
  console.error(`Valid types: ${VALID_TYPES.join(', ')}`)
  process.exit(1)
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function run() {
  const type = typeArg
  const filter = GROQ_FILTERS[type]
  const fields = COMPLETENESS_CONFIG[type].map((f) => f.field)
  const projection = `{_id, _type, ${fields.join(', ')}}`

  console.log(`Fetching incomplete ${type} documents...`)
  const docs = await client.fetch<Array<{_id: string; _type: string} & Record<string, unknown>>>(
    `*[${filter}]${projection}`,
  )

  console.log(`Found ${docs.length} ${type} needing enrichment`)

  if (isDryRun) {
    console.log('\n[DRY RUN] Documents that would be patched:')
    for (const doc of docs) {
      const missingFields = COMPLETENESS_CONFIG[type]
        .filter((check) => !check.validate(doc[check.field]))
        .map((check) => check.label)
      console.log(`  ${doc._id} — missing: ${missingFields.join(', ')}`)
    }
    console.log('\n[DRY RUN] No documents were patched.')
    return
  }

  if (docs.length === 0) {
    console.log(`All ${type} records are complete.`)
    return
  }

  const defaults = DEFAULTS[type]

  await processInChunks(docs, 25, async (chunk) => {
    const tx = client.transaction()
    for (const doc of chunk) {
      tx.patch(doc._id, (p) => p.setIfMissing(defaults))
    }
    await tx.commit()
    console.log(`Patched ${chunk.length} documents`)
  })

  console.log('Done.')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
