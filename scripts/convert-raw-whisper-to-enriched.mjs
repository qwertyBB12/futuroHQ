#!/usr/bin/env node
/**
 * Convert raw Whisper JSON output to the .enriched.json format consumed by
 * ingest-transcripts.ts.
 *
 * Raw Whisper format:   { task, language, duration, text, segments: [{start, end, text}] }
 * Enriched format:      { full_text, language, duration, speaker_segments: [{speaker, start, end, text}] }
 *
 * For undiarized clips, all segments are labeled with a single speaker
 * ("SPEAKER_00"). This is correct for single-speaker hero clips; multi-speaker
 * pieces should go through transcribe-with-speakers.py for real diarization.
 *
 * Usage:
 *   node scripts/convert-raw-whisper-to-enriched.mjs <input-glob>
 *   node scripts/convert-raw-whisper-to-enriched.mjs 'transcripts/Author-x-ai__V2-*.json'
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs'
import { dirname, basename, join } from 'node:path'

const pattern = process.argv[2]
if (!pattern) {
  console.error('Usage: convert-raw-whisper-to-enriched.mjs <input-glob-or-pattern>')
  console.error('  e.g. transcripts/Author-x-ai__V2-*.json')
  process.exit(1)
}

// Minimal glob: split into dir + prefix*
const dir = dirname(pattern) || '.'
const base = basename(pattern)
const [pre, post] = base.split('*')
const files = readdirSync(dir).filter((f) =>
  (!pre || f.startsWith(pre)) &&
  (!post || f.endsWith(post)) &&
  !f.endsWith('.enriched.json')
)

console.log(`Found ${files.length} raw transcript file(s) in ${dir}`)
let converted = 0
let skipped = 0

for (const file of files) {
  const inPath = join(dir, file)
  const outPath = join(dir, file.replace(/\.json$/, '.enriched.json'))
  if (existsSync(outPath)) {
    skipped++
    continue
  }
  let raw
  try {
    raw = JSON.parse(readFileSync(inPath, 'utf8'))
  } catch (e) {
    console.warn(`  ✗ ${file}: ${e.message}`)
    continue
  }
  if (!raw.text || !raw.segments) {
    console.warn(`  ✗ ${file}: missing text or segments`)
    continue
  }
  const enriched = {
    full_text: raw.text.trim(),
    language: raw.language || raw.detected_language || 'unknown',
    duration: raw.duration,
    speakers: ['SPEAKER_00'],
    pipeline: 'whisper-only (undiarized)',
    speaker_segments: raw.segments.map((s) => ({
      speaker: 'SPEAKER_00',
      start: s.start,
      end: s.end,
      text: (s.text || '').trim(),
    })),
  }
  writeFileSync(outPath, JSON.stringify(enriched, null, 2))
  converted++
  if (converted <= 3) console.log(`  ✓ ${file} → ${basename(outPath)}`)
}

console.log(`\nConverted ${converted}, skipped ${skipped} (already exist)`)
