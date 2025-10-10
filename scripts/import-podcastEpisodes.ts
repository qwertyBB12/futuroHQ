/**
 * Podcast episode importer
 *
 * Usage (dry run by default):
 *   PODCAST_FEED_URL="https://feeds.captivate.fm/theembassyfile/" \
 *   PODCAST_PARENT_ID="podcast.theEmbassyFile" \
 *   PODCAST_LANGUAGE="English" \
 *   DRY_RUN=true \
 *   npx tsx scripts/import-podcastEpisodes.ts
 *
 * Set DRY_RUN=false to persist changes once output looks correct.
 */

import {config} from 'dotenv'
import {createClient} from '@sanity/client'
import Parser from 'rss-parser'
import crypto from 'node:crypto'

config({path: '.env.local', override: false})

const projectId = process.env.SANITY_PROJECT_ID
const dataset = process.env.SANITY_DATASET || 'production'
const token = process.env.SANITY_WRITE_TOKEN

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

const dryRun = process.env.DRY_RUN !== 'false'
const feedUrl = process.env.PODCAST_FEED_URL
const podcastId = process.env.PODCAST_PARENT_ID
const defaultLanguage = process.env.PODCAST_LANGUAGE || 'English'

if (!feedUrl) {
  console.error('Set PODCAST_FEED_URL to the Captivate RSS feed URL.')
  process.exit(1)
}

if (!podcastId) {
  console.error('Set PODCAST_PARENT_ID to the Sanity _id of the parent podcast document.')
  process.exit(1)
}

const parser = new Parser({
  customFields: {
    item: [
      ['itunes:episode', 'itunesEpisode'],
      ['itunes:episodeType', 'itunesEpisodeType'],
      ['itunes:season', 'itunesSeason'],
      ['itunes:duration', 'itunesDuration'],
      ['content:encoded', 'contentEncoded'],
    ],
  },
})

function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96)
}

function buildAudioBlock({
  title,
  enclosureUrl,
  link,
  guid,
}: {
  title: string
  enclosureUrl?: string
  link?: string
  guid?: string
}) {
  const sourceUrl = enclosureUrl || link
  if (!sourceUrl) return null
  const trimmedGuid = guid?.trim()
  const showId = process.env.CAPTIVATE_SHOW_ID?.trim()
  const iframeSrc =
    trimmedGuid && showId
      ? `https://player.captivate.fm/episode/${encodeURIComponent(trimmedGuid)}`
      : null
  const iframeWrapper = iframeSrc
    ? `<div style="width:100%;height:600px;margin-bottom:20px;border-radius:6px;overflow:hidden;"><iframe style="width:100%;height:600px;" frameborder="no" scrolling="no" allow="clipboard-write" seamless src="${iframeSrc}"></iframe></div>`
    : null
  const fallbackAudio = `<audio controls src="${sourceUrl}" style="width:100%"></audio>`

  return {
    _type: 'mediaBlock',
    title,
    assetType: 'audio',
    platform: 'captivate',
    platformId: sourceUrl,
    playerColor: '1B2A41',
    embedCode: iframeWrapper ?? fallbackAudio,
  }
}

async function ensureTag(slug: string, label: string) {
  const id = `tag.${slug}`
  if (dryRun) {
    return {_type: 'reference', _ref: id, _key: slug}
  }
  await client.createIfNotExists({
    _id: id,
    _type: 'tag',
    label,
    slug: {current: slug},
  })
  return {_type: 'reference', _ref: id, _key: slug}
}

async function run() {
  console.log(`Importing feed ${feedUrl} (dryRun=${dryRun ? 'true' : 'false'})`)
  const feed = await parser.parseURL(feedUrl)
  if (!feed.items?.length) {
    console.log('No items in feed. Nothing to import.')
    return
  }

  for (const item of feed.items) {
    const baseSlug = item.isoDate
      ? `${item.isoDate}-${item.title}`
      : item.title || item.guid || crypto.randomUUID()
    const slug = slugify(baseSlug || crypto.randomUUID())
    const docId = `podcastEpisode.${slug}`
    const publishedAt = item.isoDate
      ? new Date(item.isoDate).toISOString()
      : new Date().toISOString()

    const legacyTags = Array.isArray(item.categories)
      ? Array.from(new Set(item.categories.filter(Boolean)))
      : []
    const tagRefs: Array<{_type: 'reference'; _ref: string; _key: string}> = []
    for (const tag of legacyTags) {
      const tagSlug = slugify(tag)
      if (!tagSlug) continue
      const ref = await ensureTag(tagSlug, tag)
      tagRefs.push(ref)
    }

    const episodeNumber = item.itunesEpisode ? Number(item.itunesEpisode) : undefined
    const seasonNumber = item.itunesSeason ? Number(item.itunesSeason) : undefined
    const duration = item.itunesDuration || null

    const audioBlock = buildAudioBlock({
      title: item.title || 'Episode audio',
      enclosureUrl: item.enclosure?.url,
      link: item.link,
      guid: item.guid,
    })

    const existing = dryRun
      ? null
      : await client.getDocument<any>(docId).catch(() => null)

    const nowIso = new Date().toISOString()

    const existingStringTags = Array.isArray(existing?.tags) ? existing.tags : []
    const mergedStringTags = Array.from(new Set([...existingStringTags, ...legacyTags]))

    const existingTagRefs: typeof tagRefs = Array.isArray(existing?.tags_ref)
      ? existing.tags_ref
      : []
    const mergedTagRefs: typeof tagRefs = [...existingTagRefs]
    for (const ref of tagRefs) {
      if (!mergedTagRefs.some(existingRef => existingRef?._ref === ref._ref)) {
        mergedTagRefs.push(ref)
      }
    }

    const episodeDoc: Record<string, unknown> = {
      _id: docId,
      _type: 'podcastEpisode',
      title: item.title || 'Untitled Episode',
      description: item.contentSnippet || item.content || item.contentEncoded || '',
      slug: {current: slug},
      publishedAt,
      updatedAt: nowIso,
      pubDate: item.isoDate ? new Date(item.isoDate).toISOString() : null,
      episodeNumber,
      seasonNumber,
      duration,
      audioEmbed: audioBlock ?? (existing as any)?.audioEmbed ?? null,
      videoEmbed: (existing as any)?.videoEmbed ?? null,
      series: {
        _type: 'reference' as const,
        _ref: podcastId,
      },
      tags: mergedStringTags,
      tags_ref: mergedTagRefs,
      language: defaultLanguage,
      publish: true,
      order: episodeNumber ?? (existing as any)?.order ?? 0,
      ai_derivatives:
        (existing as any)?.ai_derivatives ?? {summary: '', quotes: [], captions: []},
      distribution: (existing as any)?.distribution ?? [],
      analytics:
        (existing as any)?.analytics ?? {views: 0, likes: 0, shares: 0, source: 'unknown'},
    }

    if (audioBlock) {
      episodeDoc.audioEmbed = audioBlock
    } else if (existing?.audioEmbed) {
      episodeDoc.audioEmbed = existing.audioEmbed
    }

    if (existing?.videoEmbed) {
      episodeDoc.videoEmbed = existing.videoEmbed
    }

    console.log(`Upserting episode ${episodeDoc.title} (${docId})`)

    if (!dryRun) {
      await client.createOrReplace(episodeDoc)
    }
  }

  console.log('Import complete.')
}

run().catch(err => {
  console.error('Import failed:', err)
  process.exit(1)
})
