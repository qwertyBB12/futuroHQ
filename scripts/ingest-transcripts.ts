/**
 * Transcript ingestion script — patches video documents with fullText and speakerSegments
 * from .enriched.json files produced by the transcription pipeline.
 *
 * Usage:
 *   npx tsx scripts/ingest-transcripts.ts [--dry-run] [--force]
 *
 * Behavior:
 *   - Fetches all video documents with videoSource == "b2" and a defined b2Key
 *   - Scans transcripts/ directory for *.enriched.json files
 *   - Matches videos to enriched JSON by filename stem extracted from b2Key
 *   - Patches fullText and speakerSegments using client.patch().set().commit()
 *   - Skips videos that already have fullText unless --force is passed
 *   - Processes in chunks of 10 with 1s delay for rate-limit safety
 *   - In --dry-run mode, reports matches but does NOT patch
 */

import {config} from 'dotenv'
import {createClient} from '@sanity/client'
import {resolve, basename} from 'path'
import {readFileSync, readdirSync} from 'fs'

config({path: '.env.local', override: false})

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID || 'fo6n8ceo',
  dataset: process.env.SANITY_DATASET || 'production',
  token: process.env.SANITY_WRITE_TOKEN || '',
  apiVersion: '2025-01-01',
  useCdn: false,
})

// ---------------------------------------------------------------------------
// CLI flags
// ---------------------------------------------------------------------------

const isDryRun = process.argv.includes('--dry-run')
const isForce = process.argv.includes('--force')

const USAGE = 'Usage: npx tsx scripts/ingest-transcripts.ts [--dry-run] [--force]'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface VideoDoc {
  _id: string
  b2Key: string
  title?: string
  fullText?: string
}

interface SpeakerSegment {
  speaker: string
  start: number
  end: number
  text: string
}

interface EnrichedJson {
  full_text?: string
  speaker_segments?: SpeakerSegment[]
  source_file?: string
  filename?: string
}

interface SanitySegment {
  _key: string
  _type: 'object'
  speaker: string
  start: number
  end: number
  text: string
}

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
    if (i + chunkSize < items.length) {
      await sleep(delayMs)
    }
  }
}

/**
 * Extract stem from b2Key — the last path segment without extension.
 * Example: "Futuro MMXIX/edited/HB_GORDON_ahq12.mp4" -> "HB_GORDON_ahq12"
 * Handles filenames with spaces.
 */
function stemFromB2Key(b2Key: string): string {
  const base = basename(b2Key)
  const dotIndex = base.lastIndexOf('.')
  return dotIndex > 0 ? base.slice(0, dotIndex) : base
}

/**
 * Convert pipeline speaker_segments to Sanity array items.
 * Adds _key (8-char random UUID slice) and _type: 'object' required by Sanity.
 */
function toSanitySegments(segments: SpeakerSegment[]): SanitySegment[] {
  return segments.map((seg) => ({
    _key: crypto.randomUUID().slice(0, 8),
    _type: 'object' as const,
    speaker: seg.speaker,
    start: seg.start,
    end: seg.end,
    text: seg.text,
  }))
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function run(): Promise<void> {
  console.log('')
  console.log('=== Transcript Ingestion Script ===')
  console.log(USAGE)
  console.log('')
  console.log(`Mode: ${isDryRun ? 'DRY RUN (no changes)' : 'LIVE'}`)
  console.log(`Force overwrite: ${isForce ? 'YES (will overwrite existing transcripts)' : 'NO (skip if fullText exists)'}`)
  console.log('')

  // 1. Fetch all B2 videos with a b2Key set (includes drafts)
  console.log('Fetching B2 video documents from Sanity...')
  const videos = await client.fetch<VideoDoc[]>(
    `*[_type == "video" && videoSource == "b2" && defined(b2Key)]{_id, b2Key, title, fullText}`,
  )
  console.log(`Found ${videos.length} B2 video document(s) with b2Key`)
  console.log('')

  // 2. Scan transcripts/ directory for all *.enriched.json files
  const transcriptsDir = resolve(__dirname, '../transcripts')
  let enrichedFiles: string[]
  try {
    enrichedFiles = readdirSync(transcriptsDir).filter((f) => f.endsWith('.enriched.json'))
  } catch (err) {
    console.error(`Error reading transcripts directory: ${transcriptsDir}`)
    console.error(err)
    process.exit(1)
  }
  console.log(`Found ${enrichedFiles.length} .enriched.json file(s) in transcripts/`)
  console.log('')

  // Build a map: stem -> filename for fast lookup (case-insensitive)
  const stemToFile = new Map<string, string>()
  for (const file of enrichedFiles) {
    const stem = file.replace(/\.enriched\.json$/, '')
    stemToFile.set(stem.toLowerCase(), file)
  }

  // 3. Match videos to enriched JSON files
  const matched: Array<{video: VideoDoc; enrichedFile: string; stem: string}> = []
  const unmatched: VideoDoc[] = []
  const skipped: VideoDoc[] = []

  for (const video of videos) {
    const stem = stemFromB2Key(video.b2Key)

    // Try exact match first, then case-insensitive
    const exactFile = `${stem}.enriched.json`
    const exactExists = enrichedFiles.includes(exactFile)
    const caseInsensitiveFile = stemToFile.get(stem.toLowerCase())

    const matchedFile = exactExists ? exactFile : caseInsensitiveFile

    if (!matchedFile) {
      unmatched.push(video)
      continue
    }

    // Skip if already has fullText and --force not set
    if (!isForce && video.fullText && video.fullText.trim().length > 0) {
      skipped.push(video)
      continue
    }

    matched.push({video, enrichedFile: matchedFile, stem})
  }

  // Find enriched files with no corresponding video
  const matchedFileNames = new Set(matched.map((m) => m.enrichedFile))
  const unmatchedFiles = enrichedFiles.filter((f) => !matchedFileNames.has(f))

  // 4. Report
  console.log('=== Matching Report ===')
  console.log(`Matched:   ${matched.length} video(s) have a corresponding enriched JSON`)
  console.log(`Skipped:   ${skipped.length} video(s) already have fullText (use --force to overwrite)`)
  console.log(`Unmatched: ${unmatched.length} video(s) have b2Key but no enriched JSON`)
  console.log(`Orphan files: ${unmatchedFiles.length} enriched JSON file(s) have no matching video`)
  console.log('')

  if (matched.length > 0) {
    console.log('--- Matched ---')
    for (const {video, enrichedFile} of matched) {
      const hasExisting = video.fullText ? ' [HAS TRANSCRIPT — will overwrite]' : ''
      console.log(`  [MATCH] ${video.title || video._id}`)
      console.log(`          b2Key: ${video.b2Key}`)
      console.log(`          file:  ${enrichedFile}${hasExisting}`)
    }
    console.log('')
  }

  if (skipped.length > 0) {
    console.log('--- Skipped (already have transcript) ---')
    for (const video of skipped) {
      console.log(`  [SKIP]  ${video.title || video._id} — ${video.b2Key}`)
    }
    console.log('')
  }

  if (unmatched.length > 0) {
    console.log('--- Unmatched videos (have b2Key but no enriched JSON) ---')
    for (const video of unmatched) {
      const stem = stemFromB2Key(video.b2Key)
      console.log(`  [MISS]  ${video.title || video._id}`)
      console.log(`          b2Key: ${video.b2Key}`)
      console.log(`          expected: ${stem}.enriched.json`)
    }
    console.log('')
  }

  if (unmatchedFiles.length > 0) {
    console.log('--- Orphan enriched files (no matching video doc) ---')
    for (const file of unmatchedFiles) {
      console.log(`  [ORPHAN] ${file}`)
    }
    console.log('')
  }

  if (isDryRun) {
    console.log('[DRY RUN] No documents were patched.')
    return
  }

  if (matched.length === 0) {
    console.log('Nothing to patch.')
    return
  }

  // 5. Patch matched videos
  console.log(`Patching ${matched.length} video document(s)...`)
  let patchedCount = 0
  let errorCount = 0

  await processInChunks(matched, 10, async (chunk) => {
    for (const {video, enrichedFile} of chunk) {
      try {
        const filePath = resolve(transcriptsDir, enrichedFile)
        const enriched: EnrichedJson = JSON.parse(readFileSync(filePath, 'utf-8'))

        const fullText = enriched.full_text || ''
        const rawSegments = enriched.speaker_segments || []
        const speakerSegments = toSanitySegments(rawSegments)

        if (!fullText && rawSegments.length === 0) {
          console.log(`  [WARN]  ${video.title || video._id} — enriched JSON has no full_text or speaker_segments, skipping`)
          return
        }

        await client.patch(video._id).set({fullText, speakerSegments}).commit()
        patchedCount++
        console.log(`  [OK]    ${video.title || video._id} — ${rawSegments.length} segments, ${fullText.length} chars`)
      } catch (err) {
        errorCount++
        console.error(`  [ERROR] ${video.title || video._id} — ${err instanceof Error ? err.message : String(err)}`)
      }
    }
  })

  console.log('')
  console.log(`Done. Patched: ${patchedCount}, Errors: ${errorCount}, Skipped: ${skipped.length}`)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
