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

function buildAudioBlock(params: {
  title: string
  enclosureUrl?: string
  link?: string
  guid?: string
}) {
  const {title, enclosureUrl, link, guid} = params
  if (!enclosureUrl && !link) return null
  const sourceUrl = enclosureUrl || link
  return {
    _type: 'mediaBlock',
    title,
    assetType: 'audio',
    platform: 'other',
    platformId: guid || sourceUrl || '',
    playerColor: '1B2A41',
    embedCode: sourceUrl ? `<audio controls src="${sourceUrl}"></audio>` : undefined,
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
    const tagRefs = []
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

    const episodeDoc = {
      _id: docId,
      _type: 'podcastEpisode',
      title: item.title || 'Untitled Episode',
      description: item.contentSnippet || item.content || item.contentEncoded || '',
      slug: {current: slug},
      publishedAt,
      pubDate: item.isoDate ? new Date(item.isoDate).toISOString() : null,
      episodeNumber,
      seasonNumber,
      duration,
      audioEmbed: audioBlock,
      videoEmbed: null,
      series: {
        _type: 'reference',
        _ref: podcastId,
      },
      tags: legacyTags,
      tags_ref: tagRefs,
      language: defaultLanguage,
      order: episodeNumber ?? 0,
    }

    const patch = client
      .patch(docId)
      .setIfMissing({_type: 'podcastEpisode'})
      .set({
        title: episodeDoc.title,
        description: episodeDoc.description,
        slug: episodeDoc.slug,
        pubDate: episodeDoc.pubDate,
        publishedAt: episodeDoc.publishedAt,
        updatedAt: new Date().toISOString(),
        episodeNumber: episodeDoc.episodeNumber,
        seasonNumber: episodeDoc.seasonNumber,
        duration: episodeDoc.duration,
        audioEmbed: episodeDoc.audioEmbed,
        videoEmbed: episodeDoc.videoEmbed,
        series: episodeDoc.series,
        tags: episodeDoc.tags,
        tags_ref: episodeDoc.tags_ref,
        language: episodeDoc.language,
        order: episodeDoc.order,
      })
      .setIfMissing({
        publish: true,
        order: episodeDoc.order ?? 0,
        ai_derivatives: {summary: '', quotes: [], captions: []},
        distribution: [],
        analytics: {views: 0, likes: 0, shares: 0, source: 'unknown'},
      })
      .set({
        publishedAt: episodeDoc.publishedAt,
        updatedAt: new Date().toISOString(),
        publish: true,
      })

    console.log(`Upserting episode ${episodeDoc.title} (${docId})`)

    if (!dryRun) {
      await patch.commit()
    }
  }

  console.log('Import complete.')
}

run().catch(err => {
  console.error('Import failed:', err)
  process.exit(1)
})
