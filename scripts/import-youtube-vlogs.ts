/**
 * Import Vlog documents from a YouTube channel or playlist.
 *
 * Usage (dry run by default):
 *   YOUTUBE_API_KEY=XXXX \
 *   YOUTUBE_CHANNEL_ID=UC123... \
 *   VLOG_CHANNEL_TYPE=personal \
 *   VLOG_LANGUAGE=English \
 *   DRY_RUN=true \
 *   npx tsx scripts/import-youtube-vlogs.ts
 *
 * Required env vars:
 *   - SANITY_PROJECT_ID
 *   - SANITY_WRITE_TOKEN
 *   - YOUTUBE_API_KEY
 *   - (one of) YOUTUBE_CHANNEL_ID | YOUTUBE_UPLOADS_PLAYLIST_ID | YOUTUBE_PLAYLIST_ID
 *
 * Optional env vars:
 *   - SANITY_DATASET (defaults to "production")
 *   - VLOG_CHANNEL_TYPE (personal | benext | futuro | mitikah | other)
 *   - VLOG_LANGUAGE (defaults to "English")
 *   - VLOG_TAGS (comma-separated list of tags to force-add)
 *   - YOUTUBE_CHANNEL_REF_ID (Sanity _id of person/collaborator document)
 *   - YOUTUBE_MAX_RESULTS (defaults to 200)
 *   - YOUTUBE_INCLUDE_SHORTS (defaults to true; set to "false" to skip <=60s Shorts)
 *   - YOUTUBE_INCLUDE_LIVE (defaults to true; set to "false" to skip live streams)
 *   - DRY_RUN (true by default; set to false to write)
 *   - DOWNLOAD_THUMBNAILS (defaults to true; set to "false" to skip uploading thumbnails)
 */

import {config as loadEnv} from 'dotenv'
import {createClient} from '@sanity/client'
import {Readable} from 'node:stream'

loadEnv({path: '.env.local', override: false})

const projectId = process.env.SANITY_PROJECT_ID
const dataset = process.env.SANITY_DATASET || 'production'
const token = process.env.SANITY_WRITE_TOKEN
const dryRun = process.env.DRY_RUN !== 'false'

const youtubeApiKey = process.env.YOUTUBE_API_KEY
const channelId = process.env.YOUTUBE_CHANNEL_ID
const uploadsPlaylistId = process.env.YOUTUBE_UPLOADS_PLAYLIST_ID
const explicitPlaylistId = process.env.YOUTUBE_PLAYLIST_ID

const defaultChannelType = process.env.VLOG_CHANNEL_TYPE || 'personal'
const defaultLanguage = process.env.VLOG_LANGUAGE || 'English'
const forcedTags = (process.env.VLOG_TAGS || '')
  .split(',')
  .map((tag) => tag.trim())
  .filter(Boolean)

const channelRefId = process.env.YOUTUBE_CHANNEL_REF_ID?.trim()
const maxResults = Number(process.env.YOUTUBE_MAX_RESULTS || 200)
const downloadThumbnails = process.env.DOWNLOAD_THUMBNAILS !== 'false'
const includeShorts = process.env.YOUTUBE_INCLUDE_SHORTS !== 'false'
const includeLive = process.env.YOUTUBE_INCLUDE_LIVE !== 'false'

if (!projectId || !token) {
  console.error('Missing SANITY_PROJECT_ID or SANITY_WRITE_TOKEN environment variables.')
  process.exit(1)
}

if (!youtubeApiKey) {
  console.error('Missing YOUTUBE_API_KEY environment variable.')
  process.exit(1)
}

const client = createClient({
  projectId,
  dataset,
  token,
  apiVersion: '2025-01-01',
  useCdn: false,
})

type YouTubePlaylistItem = {
  snippet?: {
    title?: string
    description?: string
    publishedAt?: string
    resourceId?: {
      videoId?: string
    }
    thumbnails?: Record<
      string,
      {
        url?: string
        width?: number
        height?: number
      }
    >
  }
  contentDetails?: {
    videoId?: string
    videoPublishedAt?: string
  }
}

type YouTubeVideoDetail = {
  id: string
  snippet?: {
    title?: string
    description?: string
    publishedAt?: string
    tags?: string[]
    thumbnails?: Record<
      string,
      {
        url?: string
        width?: number
        height?: number
      }
    >
    liveBroadcastContent?: 'none' | 'upcoming' | 'live'
  }
  contentDetails?: {
    duration?: string
  }
  statistics?: {
    viewCount?: string
    likeCount?: string
    favoriteCount?: string
  }
  liveStreamingDetails?: {
    actualStartTime?: string
    actualEndTime?: string
    scheduledStartTime?: string
    concurrentViewers?: string
  }
}

type TagRef = {_type: 'reference'; _ref: string; _key: string}

function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64)
}

function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size))
  }
  return chunks
}

async function ensureTag(slug: string, label: string): Promise<TagRef> {
  const _id = `tag.${slug}`
  const tagRef: TagRef = {_type: 'reference', _ref: _id, _key: slug}
  if (dryRun) {
    return tagRef
  }

  await client.createIfNotExists({
    _id,
    _type: 'tag',
    label,
    slug: {current: slug},
  })

  return tagRef
}

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Request failed (${res.status}): ${url}\n${body}`)
  }
  return (await res.json()) as T
}

async function resolveUploadsPlaylist(): Promise<string> {
  if (explicitPlaylistId) return explicitPlaylistId
  if (uploadsPlaylistId) return uploadsPlaylistId
  if (!channelId) {
    throw new Error(
      'Set one of YOUTUBE_PLAYLIST_ID, YOUTUBE_UPLOADS_PLAYLIST_ID, or YOUTUBE_CHANNEL_ID.'
    )
  }

  const url = new URL('https://www.googleapis.com/youtube/v3/channels')
  url.searchParams.set('part', 'contentDetails')
  url.searchParams.set('id', channelId)
  url.searchParams.set('key', youtubeApiKey)

  const data = await fetchJSON<{
    items?: Array<{contentDetails?: {relatedPlaylists?: {uploads?: string}}}>
  }>(url.toString())

  const uploads = data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads
  if (!uploads) {
    throw new Error('Unable to resolve uploads playlist for the provided channel ID.')
  }
  return uploads
}

async function fetchPlaylistItems(playlistId: string): Promise<YouTubePlaylistItem[]> {
  const items: YouTubePlaylistItem[] = []
  let nextPageToken: string | undefined

  do {
    const url = new URL('https://www.googleapis.com/youtube/v3/playlistItems')
    url.searchParams.set('part', 'snippet,contentDetails')
    url.searchParams.set('playlistId', playlistId)
    url.searchParams.set('maxResults', '50')
    url.searchParams.set('key', youtubeApiKey)
    if (nextPageToken) {
      url.searchParams.set('pageToken', nextPageToken)
    }

    const data = await fetchJSON<{
      nextPageToken?: string
      items?: YouTubePlaylistItem[]
    }>(url.toString())

    if (data.items?.length) {
      items.push(...data.items)
    }
    nextPageToken = data.nextPageToken
  } while (nextPageToken && items.length < maxResults)

  return items.slice(0, maxResults)
}

async function fetchVideoDetails(videoIds: string[]): Promise<Map<string, YouTubeVideoDetail>> {
  const details = new Map<string, YouTubeVideoDetail>()

  for (const idChunk of chunk(videoIds, 50)) {
    const url = new URL('https://www.googleapis.com/youtube/v3/videos')
    url.searchParams.set('part', 'snippet,contentDetails,statistics,liveStreamingDetails')
    url.searchParams.set('id', idChunk.join(','))
    url.searchParams.set('key', youtubeApiKey)

    const data = await fetchJSON<{items?: YouTubeVideoDetail[]}>(url.toString())
    for (const item of data.items || []) {
      details.set(item.id, item)
    }
  }

  return details
}

function selectBestThumbnail(
  thumbnails?: YouTubeVideoDetail['snippet']['thumbnails']
): {url: string; width?: number; height?: number} | null {
  if (!thumbnails) return null
  const priority = ['maxres', 'standard', 'high', 'medium', 'default']
  for (const key of priority) {
    const thumb = thumbnails[key]
    if (thumb?.url) return {url: thumb.url, width: thumb.width, height: thumb.height}
  }
  const first = Object.values(thumbnails)[0]
  return first?.url ? {url: first.url, width: first.width, height: first.height} : null
}

function isoDurationToSeconds(duration?: string | null): number | null {
  if (!duration) return null
  const match =
    /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/i.exec(duration) ||
    /P(?:(\d+)D)?T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/i.exec(duration)
  if (!match) return null
  const [, hours, minutes, seconds] = match
  const total =
    (Number(hours) || 0) * 3600 + (Number(minutes) || 0) * 60 + (Number(seconds) || 0)
  return total > 0 ? total : null
}

async function uploadThumbnailIfNeeded(
  videoId: string,
  thumbnailUrl?: string
): Promise<{_type: 'image'; asset: {_type: 'reference'; _ref: string}} | undefined> {
  if (!thumbnailUrl || !downloadThumbnails) return undefined
  if (dryRun) {
    return undefined
  }

  const response = await fetch(thumbnailUrl)
  if (!response.ok) {
    console.warn(`⚠️  Failed to download thumbnail for ${videoId}: ${response.status}`)
    return undefined
  }

  const contentType = response.headers.get('content-type') || 'image/jpeg'
  const extension = contentType.includes('png') ? 'png' : 'jpg'
  const filename = `${videoId}.${extension}`

  const arrayBuffer = await response.arrayBuffer().catch(() => null)
  if (!arrayBuffer) {
    console.warn(`⚠️  Could not read thumbnail bytes for ${videoId}`)
    return undefined
  }

  const buffer = Buffer.from(arrayBuffer)
  const stream = Readable.from(buffer)

  const asset = await client.assets.upload('image', stream, {
    filename,
    contentType,
  })

  return {_type: 'image', asset: {_type: 'reference', _ref: asset._id}}
}

async function ensureTags(tagNames: string[]): Promise<{strings: string[]; refs: TagRef[]}> {
  const uniqueNames = Array.from(new Set(tagNames.filter(Boolean)))
  const strings: string[] = []
  const refs: TagRef[] = []

  for (const tag of uniqueNames) {
    const cleanTag = tag.trim()
    if (!cleanTag) continue
    const slug = slugify(cleanTag)
    if (!slug) continue
    strings.push(cleanTag)
    const ref = await ensureTag(slug, cleanTag)
    refs.push(ref)
  }

  return {strings, refs}
}

function buildMediaBlock({
  videoId,
  title,
  thumbnailRef,
}: {
  videoId: string
  title: string
  thumbnailRef?: {_type: 'image'; asset: {_type: 'reference'; _ref: string}}
}) {
  const embedUrl = `https://www.youtube.com/embed/${encodeURIComponent(videoId)}`
  const embedCode = `<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;"><iframe src="${embedUrl}" title="${title.replace(/"/g, '&quot;')}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;"></iframe></div>`

  return {
    _type: 'mediaBlock',
    title,
    assetType: 'video',
    platform: 'youtube',
    platformId: videoId,
    embedCode,
    thumbnail: thumbnailRef,
    playerColor: 'FF0000',
  }
}

async function run() {
  try {
    const playlistId = await resolveUploadsPlaylist()
    console.log(
      `Importing YouTube playlist ${playlistId} (dryRun=${dryRun ? 'true' : 'false'})...`
    )

    const playlistItems = await fetchPlaylistItems(playlistId)
    if (!playlistItems.length) {
      console.log('No videos found in playlist. Nothing to import.')
      return
    }

    const videoIds = Array.from(
      new Set(
        playlistItems
          .map((item) => item.contentDetails?.videoId || item.snippet?.resourceId?.videoId)
          .filter((id): id is string => typeof id === 'string' && Boolean(id))
      )
    )

    const videoDetails = await fetchVideoDetails(videoIds)
    const nowIso = new Date().toISOString()

    let created = 0
    let updated = 0

    for (const videoId of videoIds) {
      const detail = videoDetails.get(videoId)
      const snippet = detail?.snippet
      const title = snippet?.title || `YouTube Video ${videoId}`
      const publishDate =
        snippet?.publishedAt ||
        playlistItems.find(
          (item) =>
            item.contentDetails?.videoId === videoId ||
            item.snippet?.resourceId?.videoId === videoId
        )?.contentDetails?.videoPublishedAt

      const durationSeconds = isoDurationToSeconds(detail?.contentDetails?.duration || null)
      const isShort = durationSeconds !== null && durationSeconds <= 60
      const isLive =
        snippet?.liveBroadcastContent === 'live' ||
        snippet?.liveBroadcastContent === 'upcoming' ||
        Boolean(detail?.liveStreamingDetails?.actualStartTime && !detail?.liveStreamingDetails?.actualEndTime)

      if (isShort && !includeShorts) {
        console.log(`⏭️  Skipping short ${videoId} (${title}) — set YOUTUBE_INCLUDE_SHORTS=true to import.`)
        continue
      }

      if (isLive && !includeLive) {
        console.log(`⏭️  Skipping live stream ${videoId} (${title}) — set YOUTUBE_INCLUDE_LIVE=true to import.`)
        continue
      }

      const format = isLive ? 'live' : isShort ? 'short' : 'longform'

      const slugBase = slugify(title || videoId)
      const slug = `${slugBase}-${videoId.slice(0, 6)}`.slice(0, 96)
      const docId = `vlog.youtube-${videoId}`
      const videoUrl = `https://www.youtube.com/watch?v=${videoId}`
      const shortUrl = `https://youtu.be/${videoId}`

      const existing = dryRun ? null : await client.getDocument<any>(docId).catch(() => null)
      const rawDescription = (snippet?.description || '').trim()
      const description = rawDescription || (existing?.description as string | undefined) || ''

      const thumbnailCandidate = selectBestThumbnail(snippet?.thumbnails)
      const thumbnailRef = await uploadThumbnailIfNeeded(videoId, thumbnailCandidate?.url)

      const youtubeTags = snippet?.tags || []
      const derivedTags: string[] = []
      if (isShort) derivedTags.push('YouTube Shorts')
      if (isLive) derivedTags.push('YouTube Live')
      const combinedTags = Array.from(new Set([...youtubeTags, ...forcedTags, ...derivedTags]))
      const {strings: stringTags, refs: tagRefs} = await ensureTags(combinedTags)

      const existingStringTags = Array.isArray(existing?.tags) ? existing.tags : []
      const mergedStringTags = Array.from(new Set([...existingStringTags, ...stringTags]))

      const existingTagRefs: TagRef[] = Array.isArray(existing?.tags_ref) ? existing.tags_ref : []
      const mergedTagRefs = [...existingTagRefs]
      for (const ref of tagRefs) {
        if (!mergedTagRefs.some((existingRef) => existingRef?._ref === ref._ref)) {
          mergedTagRefs.push(ref)
        }
      }

      const mediaBlock = buildMediaBlock({
        videoId,
        title,
        thumbnailRef: thumbnailRef ?? existing?.video?.thumbnail,
      })

      const analytics =
        detail?.statistics && (detail.statistics.viewCount || detail.statistics.likeCount)
          ? {
              views: Number(detail.statistics.viewCount || existing?.analytics?.views || 0),
              likes: Number(detail.statistics.likeCount || existing?.analytics?.likes || 0),
              shares: existing?.analytics?.shares || 0,
              source: 'youtube',
            }
          : existing?.analytics ?? {views: 0, likes: 0, shares: 0, source: 'youtube'}

      const vlogDoc: Record<string, unknown> = {
        _id: docId,
        _type: 'vlog',
        title,
        slug: {current: slug},
        description,
        language: existing?.language || defaultLanguage,
        channelType: existing?.channelType || defaultChannelType,
        channelRef: channelRefId
          ? {_type: 'reference', _ref: channelRefId}
          : existing?.channelRef ?? null,
        contentFormat: format,
        datePublished: publishDate ? new Date(publishDate).toISOString() : null,
        videoUrl,
        video: mediaBlock,
        tags: mergedStringTags,
        tags_ref: mergedTagRefs,
        publish: existing?.publish ?? true,
        order: existing?.order ?? 0,
        publishedAt: publishDate ? new Date(publishDate).toISOString() : existing?.publishedAt ?? nowIso,
        updatedAt: nowIso,
        ai_derivatives: existing?.ai_derivatives ?? {summary: '', quotes: [], captions: []},
        distribution: Array.from(
          new Set([...(existing?.distribution || []), videoUrl, shortUrl].filter(Boolean))
        ),
        analytics,
        gallery: existing?.gallery ?? [],
        narrative: existing?.narrative ?? null,
        seo: existing?.seo ?? null,
      }

      if (dryRun) {
        console.log(`📝 [dry-run] Would upsert vlog ${docId} (${title})`)
      } else {
        await client.createOrReplace(vlogDoc)
        if (existing) {
          updated += 1
          console.log(`✅ Updated vlog ${docId} (${title})`)
        } else {
          created += 1
          console.log(`✅ Created vlog ${docId} (${title})`)
        }
      }
    }

    if (!dryRun) {
      console.log(`Done. Created ${created} and updated ${updated} vlog documents.`)
    } else {
      console.log(`Dry run complete. Processed ${videoIds.length} videos.`)
    }
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}

run()
