/**
 * Normalize op-ed documents so array fields have `_key` values and
 * bodies are stored as Portable Text blocks instead of raw strings.
 *
 * Usage:
 *   DRY_RUN=true npx tsx scripts/fix-opeds-keys.ts
 *   DRY_RUN=false npx tsx scripts/fix-opeds-keys.ts
 *
 * Requires SANITY_PROJECT_ID, SANITY_WRITE_TOKEN, optional SANITY_DATASET (defaults to production).
 */

import {config as loadEnv} from 'dotenv'
import {createClient} from '@sanity/client'
import crypto from 'node:crypto'

loadEnv({path: '.env.local', override: false})

const projectId = process.env.SANITY_PROJECT_ID
const dataset = process.env.SANITY_DATASET || 'production'
const token = process.env.SANITY_WRITE_TOKEN
const dryRun = process.env.DRY_RUN !== 'false'

if (!projectId || !token) {
  console.error('Missing SANITY_PROJECT_ID or SANITY_WRITE_TOKEN environment variables.')
  process.exit(1)
}

const client = createClient({
  projectId,
  dataset,
  token,
  apiVersion: '2025-01-01',
  useCdn: false,
})

type Span = {
  _type: 'span'
  text: string
  marks?: string[]
  _key?: string
}

type Block = {
  _type: 'block'
  style?: string
  markDefs?: unknown[]
  children: Span[]
  _key?: string
}

function normalizeStringToBlocks(value: string): Block[] {
  const trimmed = value.trim()
  if (!trimmed) {
    return []
  }

  return trimmed.split(/\n{2,}/g).map((paragraph) => ({
    _type: 'block',
    _key: crypto.randomUUID(),
    style: 'normal',
    markDefs: [],
    children: [
      {
        _type: 'span',
        _key: crypto.randomUUID(),
        marks: [],
        text: paragraph.replace(/\n/g, ' ').trim(),
      },
    ],
  }))
}

function ensureBlockKeys(blocks: unknown): Block[] {
  if (!Array.isArray(blocks)) return []

  return blocks.map((block: any) => {
    if (typeof block !== 'object' || block === null) {
      return null
    }

    const normalizedBlock: Block = {
      _type: 'block',
      style: typeof block.style === 'string' ? block.style : 'normal',
      markDefs: Array.isArray(block.markDefs) ? block.markDefs : [],
      _key: typeof block._key === 'string' ? block._key : crypto.randomUUID(),
      children: [],
    }

    const children = Array.isArray(block.children) ? block.children : []
    normalizedBlock.children = children.map((child: any) => ({
      _type: 'span',
      text: typeof child?.text === 'string' ? child.text : '',
      marks: Array.isArray(child?.marks) ? child.marks : [],
      _key: typeof child?._key === 'string' ? child._key : crypto.randomUUID(),
    }))

    if (normalizedBlock.children.length === 0) {
      normalizedBlock.children.push({
        _type: 'span',
        text: '',
        marks: [],
        _key: crypto.randomUUID(),
      })
    }

    return normalizedBlock
  }).filter(Boolean) as Block[]
}

type MediaItem = {
  _type: string
  _key?: string
  [key: string]: unknown
}

function ensureArrayItemKeys(items: unknown): MediaItem[] | undefined {
  if (!Array.isArray(items) || items.length === 0) {
    return undefined
  }

  let changed = false
  const normalized = items.map((item: any) => {
    if (item && typeof item === 'object') {
      if (typeof item._key !== 'string') {
        changed = true
        return {...item, _key: crypto.randomUUID()}
      }
      return item
    }
    return item
  })

  return changed ? (normalized as MediaItem[]) : undefined
}

async function run() {
  const docs = await client.fetch<
    Array<{
      _id: string
      body?: unknown
      media?: unknown
      distribution?: unknown
    }>
  >(`*[_type == "opEd"]{_id, body, media, distribution}`)

  if (!docs.length) {
    console.log('No op-ed documents found.')
    return
  }

  let processed = 0
  const transaction = client.transaction()

  for (const doc of docs) {
    const patch: Record<string, unknown> = {}

    // Normalize body
    if (typeof doc.body === 'string') {
      patch.body = normalizeStringToBlocks(doc.body)
    } else if (Array.isArray(doc.body)) {
      const normalizedBlocks = ensureBlockKeys(doc.body)
      if (JSON.stringify(normalizedBlocks) !== JSON.stringify(doc.body)) {
        patch.body = normalizedBlocks
      }
    } else if (doc.body == null) {
      patch.body = []
    }

    // Ensure media array items have keys
    const keyedMedia = ensureArrayItemKeys(doc.media)
    if (keyedMedia) {
      patch.media = keyedMedia
    }

    if (Object.keys(patch).length > 0) {
      processed += 1
      if (dryRun) {
        console.log(`📝 [dry-run] Would patch ${doc._id} with`, patch)
      } else {
        transaction.patch(doc._id, {set: patch})
      }
    }
  }

  if (dryRun) {
    console.log(`Dry run complete. ${processed} documents would be normalized.`)
  } else if (processed > 0) {
    await transaction.commit()
    console.log(`Done. Normalized ${processed} op-ed documents.`)
  } else {
    console.log('All op-ed documents already have proper keys.')
  }
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
