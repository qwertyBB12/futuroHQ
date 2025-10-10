/**
 * Import TikTok clips into Sanity `clip` documents.
 *
 * Usage (dry run by default):
 *   TIKTOK_HANDLE=hectorhlopez \
 *   DRY_RUN=true \
 *   npx tsx scripts/import-tiktok-clips.ts
 *
 * Required env vars:
 *   - SANITY_PROJECT_ID
 *   - SANITY_WRITE_TOKEN
 *   - (one of) TIKTOK_HANDLE | TIKTOK_RSS_URL
 *
 * Optional env vars:
 *   - SANITY_DATASET (defaults to "production")
 *   - DRY_RUN (true by default; set to "false" to write)
 *   - DOWNLOAD_THUMBNAILS (defaults to true; set to "false" to skip uploading images)
 *   - TIKTOK_DEFAULT_PLATFORMS (comma separated list, defaults to "TikTok")
 *   - TIKTOK_FORCE_TAGS (comma separated tags to append into description copy)
 *   - TIKTOK_VIDEO_LIMIT (defaults to 50)
 */

import {config as loadEnv} from 'dotenv'
import {createClient} from '@sanity/client'
import Parser from 'rss-parser'
import {Readable} from 'node:stream'

loadEnv({path: '.env.local', override: false})

const projectId = process.env.SANITY_PROJECT_ID
const dataset = process.env.SANITY_DATASET || 'production'
const token = process.env.SANITY_WRITE_TOKEN
const dryRun = process.env.DRY_RUN !== 'false'
const handle = process.env.TIKTOK_HANDLE?.trim()
const rssUrlEnv = process.env.TIKTOK_RSS_URL?.trim()

if (!projectId || !token) {
  console.error('Missing SANITY_PROJECT_ID or SANITY_WRITE_TOKEN environment variables.')
  process.exit(1)
}

const feedUrl = rssUrlEnv || (handle ? `https://www.tiktok.com/@${handle}/rss` : null)
if (!feedUrl) {
  console.error('Set TIKTOK_HANDLE or TIKTOK_RSS_URL so the script knows where to pull videos from.')
  process.exit(1)
}

const downloadThumbnails = process.env.DOWNLOAD_THUMBNAILS !== 'false'
const clipLimit = Number(process.env.TIKTOK_VIDEO_LIMIT || 50)
const defaultPlatforms = (process.env.TIKTOK_DEFAULT_PLATFORMS || 'TikTok')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean)
const forcedTags = (process.env.TIKTOK_FORCE_TAGS || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean)

const client = createClient({
  projectId,
  dataset,
  token,
  apiVersion: '2025-01-01',
  useCdn: false,
})

const parser = new Parser({
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.1 Safari/605.1.15',
    Accept: 'application/rss+xml, application/xml;q=0.9, */*;q=0.8',
  },
})

type TikTokFeedItem = {
  id?: string
  title?: string
  link?: string
  guid?: string
  contentSnippet?: string
  content?: string
  pubDate?: string
  isoDate?: string
  enclosure?: {
    url?: string
    type?: string
  }
}

type OEmbedResponse = {
  title?: string
  author_name?: string
  thumbnail_url?: string
  html?: string
}

function extractVideoId(link?: string | null): string | null {
  if (!link) return null
  try {
    const url = new URL(link)
    const match = url.pathname.match(/\/video\/([^/?]+)/)
    if (match?.[1]) return match[1]
  } catch {
    // ignore malformed URLs
  }
  const fallback = link.split('/').pop()
  return fallback && fallback.length > 0 ? fallback : null
}

function buildEmbedCode(videoId: string) {
  const iframeSrc = `https://www.tiktok.com/embed/v2/${encodeURIComponent(videoId)}`
  return `<div style="position:relative;padding-bottom:177.78%;height:0;overflow:hidden;"><iframe src="${iframeSrc}" allow="fullscreen; picture-in-picture" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;" title="TikTok video"></iframe></div>`
}

async function fetchOEmbedInfo(videoUrl: string): Promise<OEmbedResponse | null> {
  const endpoint = `https://www.tiktok.com/oembed?url=${encodeURIComponent(videoUrl)}`
  const response = await fetch(endpoint).catch(() => null)
  if (!response?.ok) return null
  const data = (await response.json().catch(() => null)) as OEmbedResponse | null
  return data
}

async function uploadThumbnailIfNeeded(
  videoId: string,
  thumbnailUrl?: string,
  existingAsset?: {_type: 'reference'; _ref: string}
) {
  if (!downloadThumbnails) {
    return existingAsset ? {_type: 'reference', _ref: existingAsset._ref} : undefined
  }

  if (!thumbnailUrl) {
    return existingAsset ? {_type: 'reference', _ref: existingAsset._ref} : undefined
  }

  if (dryRun) {
    return existingAsset ? {_type: 'reference', _ref: existingAsset._ref} : undefined
  }

  const response = await fetch(thumbnailUrl).catch(() => null)
  if (!response?.ok) {
      console.warn(
        `⚠️  Failed to download TikTok thumbnail for ${videoId} (${
          response?.status ?? 'unknown status'
        })`
      )
    return existingAsset ? {_type: 'reference', _ref: existingAsset._ref} : undefined
  }

  const arrayBuffer = await response.arrayBuffer().catch(() => null)
  if (!arrayBuffer) {
    console.warn(`⚠️  Could not read TikTok thumbnail bytes for ${videoId}`)
    return existingAsset ? {_type: 'reference', _ref: existingAsset._ref} : undefined
  }

  const buffer = Buffer.from(arrayBuffer)
  const contentType = response.headers.get('content-type') || 'image/jpeg'
  const extension = contentType.includes('png') ? 'png' : 'jpg'
  const filename = `${videoId}.${extension}`

  const asset = await client.assets
    .upload('image', Readable.from(buffer), {
      filename,
      contentType,
    })
    .catch((err) => {
      console.warn(`⚠️  Upload failed for TikTok thumbnail ${videoId}: ${err.message}`)
      return null
    })

  if (!asset?._id) return undefined

  return {_type: 'reference', _ref: asset._id}
}

async function run() {
  try {
    console.log(`Importing TikTok feed ${feedUrl} (dryRun=${dryRun ? 'true' : 'false'})...`)

    const feed = await parser.parseURL(feedUrl)
    if (!feed.items?.length) {
      console.log('No items in TikTok feed. Nothing to import.')
      return
    }

    let created = 0
    let updated = 0
    const limitedItems: TikTokFeedItem[] = feed.items.slice(0, clipLimit)

    for (const item of limitedItems) {
      const videoUrl = item.link || item.guid
      const videoId = extractVideoId(videoUrl)
      if (!videoId || !videoUrl) {
        console.warn('⚠️  Skipping item with missing video URL or ID:', item.title || item.guid)
        continue
      }

      const docId = `clip.tiktok-${videoId}`
      const existing = dryRun ? null : await client.getDocument<any>(docId).catch(() => null)

      const oEmbed = await fetchOEmbedInfo(videoUrl)
      const embedTitle =
        oEmbed?.title?.trim() || item.title?.trim() || existing?.title || `TikTok clip ${videoId}`
      const rawDescription = item.contentSnippet?.trim() || item.content?.trim() || ''
      const description =
        rawDescription ||
        (existing?.description as string | undefined) ||
        oEmbed?.title?.trim() ||
        ''

      const embedCode = buildEmbedCode(videoId)
      const thumbnailRef = await uploadThumbnailIfNeeded(
        videoId,
        oEmbed?.thumbnail_url,
        existing?.clipMedia?.thumbnail?.asset
      )

      const existingClipMedia = (existing?.clipMedia as Record<string, unknown>) || {}
      const mediaBlock: Record<string, unknown> = {
        ...existingClipMedia,
        _type: 'mediaBlock',
        title: embedTitle,
        assetType: 'video',
        platform: 'tiktok',
        platformId: videoUrl,
        embedCode,
        playerColor:
          typeof existingClipMedia?.['playerColor'] === 'string'
            ? (existingClipMedia['playerColor'] as string)
            : '000000',
      }

      const thumbnailImage =
        thumbnailRef && thumbnailRef._ref
          ? {_type: 'image', asset: {_type: 'reference', _ref: thumbnailRef._ref}}
          : existing?.clipMedia?.thumbnail
      if (thumbnailImage) {
        mediaBlock.thumbnail = thumbnailImage
      } else if ('thumbnail' in mediaBlock) {
        delete (mediaBlock as Record<string, unknown>).thumbnail
      }

      const existingPlatforms: string[] = Array.isArray(existing?.platforms)
        ? existing.platforms
        : []
      const mergedPlatforms = Array.from(
        new Set([...existingPlatforms, ...defaultPlatforms])
      )

      const sanitizedForcedTags = forcedTags
        .map((tag) => tag.replace(/^#/, '').trim())
        .filter(Boolean)
      const missingTags = sanitizedForcedTags.filter((tag) => {
        const regex = new RegExp(`#?${tag}\\b`, 'i')
        return !regex.test(description)
      })
      const descriptionWithTags =
        missingTags.length > 0
          ? [description, missingTags.map((tag) => `#${tag}`).join(' ')].filter(Boolean).join('\n\n')
          : description

      const clipDoc: Record<string, unknown> = {
        _id: docId,
        _type: 'clip',
        title: embedTitle,
    description: descriptionWithTags,
    clipMedia: mediaBlock,
        platforms: mergedPlatforms,
        order: existing?.order ?? 0,
        publish: existing?.publish ?? true,
        seo: existing?.seo ?? null,
      }

      if (dryRun) {
        console.log(`📝 [dry-run] Would upsert clip ${docId} (${embedTitle})`)
      } else {
        await client.createOrReplace(clipDoc)
        if (existing) {
          updated += 1
          console.log(`✅ Updated clip ${docId} (${embedTitle})`)
        } else {
          created += 1
          console.log(`✅ Created clip ${docId} (${embedTitle})`)
        }
      }
    }

    if (dryRun) {
      console.log(`Dry run complete. Processed ${limitedItems.length} TikTok items.`)
    } else {
      console.log(`Done. Created ${created} and updated ${updated} TikTok clips.`)
    }
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}

run()
