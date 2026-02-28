/**
 * Import Video documents from a YouTube channel or playlist.
 *
 * Usage (dry run by default):
 *   YOUTUBE_API_KEY=XXXX \
 *   YOUTUBE_CHANNEL_HANDLE=benext \
 *   SANITY_PROJECT_ID=xxxx \
 *   SANITY_WRITE_TOKEN=xxxx \
 *   npx tsx scripts/import-youtube-videos.ts
 *
 * Required env vars:
 *   - SANITY_PROJECT_ID
 *   - SANITY_WRITE_TOKEN
 *   - YOUTUBE_API_KEY (or YOUTUBE_API_KEY_BENEXT / YOUTUBE_API_KEY_FUTURO)
 *   - (one of) YOUTUBE_CHANNEL_ID | YOUTUBE_CHANNEL_HANDLE | YOUTUBE_UPLOADS_PLAYLIST_ID | YOUTUBE_PLAYLIST_ID
 *   - Optional per-channel variants: YOUTUBE_API_KEY_BENEXT, YOUTUBE_CHANNEL_HANDLE_BENEXT, etc.
 *   - Use IMPORT_CHANNEL=BENEXT or IMPORT_CHANNEL=FUTURO to select per-channel vars
 *
 * Optional env vars:
 *   - SANITY_DATASET (defaults to "production")
 *   - VIDEO_LANGUAGE (defaults to "en")
 *   - VIDEO_PLATFORM (defaults to "YouTube")
 *   - VIDEO_TAGS (comma-separated list of tags to force-add)
 *   - VIDEO_NARRATIVE_OWNER (defaults to "benext")
 *   - VIDEO_PLATFORM_TIER (defaults to "institutional")
 *   - VIDEO_ARCHIVAL_STATUS (defaults to "archival")
 *   - VIDEO_POSTING_ENTITY (defaults to "benext-institutional")
 *   - YOUTUBE_MAX_RESULTS (defaults to 200)
 *   - YOUTUBE_INCLUDE_SHORTS (defaults to true)
 *   - YOUTUBE_SHORTS_MAX_SECONDS (defaults to 60)
 *   - YOUTUBE_INCLUDE_LIVE (defaults to true)
 *   - YOUTUBE_INCLUDE_UNLISTED (defaults to false)
 *   - DRY_RUN (true by default; set to false to write)
 *   - DOWNLOAD_THUMBNAILS (defaults to true; set to "false" to skip)
 *   - UPDATE_EXISTING (defaults to false; set to "true" to patch existing docs)
 *   - UPDATE_THUMBNAILS_ONLY (defaults to false; set to "true" to only replace thumbnailImage)
 *   - ONLY_UPDATE_IF_CHANGED (defaults to false; set to "true" to update only when title/description differ)
 */

import {config as loadEnv} from 'dotenv'
import {createClient} from '@sanity/client'

loadEnv({path: '.env.local', override: false})

const projectId = process.env.SANITY_PROJECT_ID
const dataset = process.env.SANITY_DATASET || 'production'
const token = process.env.SANITY_WRITE_TOKEN
const dryRun = process.env.DRY_RUN !== 'false'

const importChannel = process.env.IMPORT_CHANNEL?.toLowerCase()

const pickChannelValue = (base: string) => {
  if (!importChannel) return process.env[base]
  const key = `${base}_${importChannel.toUpperCase()}`
  return process.env[key] || process.env[base]
}

const youtubeApiKey = pickChannelValue('YOUTUBE_API_KEY')
const channelId = pickChannelValue('YOUTUBE_CHANNEL_ID')
const channelHandle = pickChannelValue('YOUTUBE_CHANNEL_HANDLE')?.replace(/^@/, '')
const uploadsPlaylistId = pickChannelValue('YOUTUBE_UPLOADS_PLAYLIST_ID')
const explicitPlaylistId = pickChannelValue('YOUTUBE_PLAYLIST_ID')

const defaultLanguage = process.env.VIDEO_LANGUAGE || 'en'
const defaultPlatform = process.env.VIDEO_PLATFORM || 'YouTube'
const forcedTags = (process.env.VIDEO_TAGS || '')
  .split(',')
  .map((tag) => tag.trim())
  .filter(Boolean)

const defaultNarrativeOwner = process.env.VIDEO_NARRATIVE_OWNER || 'benext'
const defaultPlatformTier = process.env.VIDEO_PLATFORM_TIER || 'institutional'
const defaultArchivalStatus = process.env.VIDEO_ARCHIVAL_STATUS || 'archival'
const defaultPostingEntity = process.env.VIDEO_POSTING_ENTITY || 'benext-institutional'

const maxResults = Number(process.env.YOUTUBE_MAX_RESULTS || 200)
const downloadThumbnails = process.env.DOWNLOAD_THUMBNAILS !== 'false'
const includeShorts = process.env.YOUTUBE_INCLUDE_SHORTS !== 'false'
const shortMaxSeconds = Number(process.env.YOUTUBE_SHORTS_MAX_SECONDS || 60)
const includeLive = process.env.YOUTUBE_INCLUDE_LIVE !== 'false'
const includeUnlisted = process.env.YOUTUBE_INCLUDE_UNLISTED === 'true'
const updateExisting = process.env.UPDATE_EXISTING === 'true'
const updateThumbnailsOnly = process.env.UPDATE_THUMBNAILS_ONLY === 'true'
const onlyUpdateIfChanged = process.env.ONLY_UPDATE_IF_CHANGED === 'true'

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
    liveBroadcastContent?: 'none' | 'upcoming' | 'live'
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
    duration?: string
  }
  status?: {
    privacyStatus?: 'public' | 'unlisted' | 'private'
  }
  liveStreamingDetails?: {
    actualStartTime?: string
    actualEndTime?: string
    scheduledStartTime?: string
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
    .slice(0, 80)
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

  const url = new URL('https://www.googleapis.com/youtube/v3/channels')
  url.searchParams.set('part', 'contentDetails')
  url.searchParams.set('key', youtubeApiKey)

  if (channelHandle) {
    url.searchParams.set('forHandle', channelHandle)
  } else if (channelId) {
    url.searchParams.set('id', channelId)
  } else {
    throw new Error(
      'Set one of YOUTUBE_PLAYLIST_ID, YOUTUBE_UPLOADS_PLAYLIST_ID, YOUTUBE_CHANNEL_ID, or YOUTUBE_CHANNEL_HANDLE.'
    )
  }

  const data = await fetchJSON<{
    items?: Array<{contentDetails?: {relatedPlaylists?: {uploads?: string}}}>
  }>(url.toString())

  const uploads = data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads
  if (!uploads) {
    throw new Error('Unable to resolve uploads playlist for the provided channel.')
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
    url.searchParams.set('part', 'snippet,contentDetails,status,liveStreamingDetails')
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
  const asset = await client.assets.upload('image', buffer, {
    filename,
    contentType,
  })

  return {_type: 'image', asset: {_type: 'reference', _ref: asset._id}}
}

async function ensureTags(tagNames: string[]): Promise<TagRef[]> {
  const uniqueNames = Array.from(new Set(tagNames.filter(Boolean)))
  const refs: TagRef[] = []

  for (const tag of uniqueNames) {
    const cleanTag = tag.trim()
    if (!cleanTag) continue
    const slug = slugify(cleanTag)
    if (!slug) continue
    const ref = await ensureTag(slug, cleanTag)
    refs.push(ref)
  }

  return refs
}

function mergeTagRefs(existing: TagRef[] = [], incoming: TagRef[] = []) {
  const merged = [...existing]
  for (const ref of incoming) {
    if (!merged.some((existingRef) => existingRef?._ref === ref._ref)) {
      merged.push(ref)
    }
  }
  return merged
}

async function loadExistingVideoIndex() {
  if (dryRun && !updateExisting) return new Map<string, { _id: string; slug?: {current?: string}; tags?: TagRef[] }>()
  const existing = await client.fetch<
    Array<{_id: string; videoUrl?: string; slug?: {current?: string}; tags?: TagRef[]}>
  >(`*[_type == "video" && defined(videoUrl)]{_id, videoUrl, slug, tags}`)

  const byUrl = new Map<string, { _id: string; slug?: {current?: string}; tags?: TagRef[] }>()
  for (const doc of existing) {
    if (doc.videoUrl) {
      byUrl.set(doc.videoUrl, doc)
    }
  }
  return byUrl
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
    const existingByUrl = await loadExistingVideoIndex()

    let created = 0
    let updated = 0
    let skipped = 0

    for (const videoId of videoIds) {
      const detail = videoDetails.get(videoId)
      if (!detail) {
        skipped += 1
        continue
      }

      const privacy = detail.status?.privacyStatus || 'public'
      if (privacy !== 'public' && !includeUnlisted) {
        console.log(`⏭️  Skipping ${videoId} (privacy=${privacy}).`)
        skipped += 1
        continue
      }

      const snippet = detail.snippet
      const title = snippet?.title || `YouTube Video ${videoId}`
      const publishDate =
        snippet?.publishedAt ||
        playlistItems.find(
          (item) =>
            item.contentDetails?.videoId === videoId ||
            item.snippet?.resourceId?.videoId === videoId
        )?.contentDetails?.videoPublishedAt

      if (!publishDate) {
        console.log(`⏭️  Skipping ${videoId} (${title}) — missing publish date.`)
        skipped += 1
        continue
      }

      const durationSeconds = isoDurationToSeconds(detail.contentDetails?.duration || null)
      const isShort = durationSeconds !== null && durationSeconds <= shortMaxSeconds
      const isLive =
        snippet?.liveBroadcastContent === 'live' ||
        snippet?.liveBroadcastContent === 'upcoming' ||
        Boolean(detail.liveStreamingDetails?.actualStartTime && !detail.liveStreamingDetails?.actualEndTime)

      if (isShort && !includeShorts) {
        console.log(`⏭️  Skipping short ${videoId} (${title}).`)
        skipped += 1
        continue
      }

      if (isLive && !includeLive) {
        console.log(`⏭️  Skipping live stream ${videoId} (${title}).`)
        skipped += 1
        continue
      }

      const format = isShort ? 'shortform' : 'longform'

      const slugBase = slugify(title || videoId)
      const slug = `${slugBase}-${videoId.slice(0, 6)}`.slice(0, 96)
      const docId = `video.youtube-${videoId}`
      const videoUrl = `https://www.youtube.com/watch?v=${videoId}`

      const existing = existingByUrl.get(videoUrl)
      if (existing && !updateExisting && !updateThumbnailsOnly) {
        console.log(`⏭️  Skipping existing video ${videoId} (${title}).`)
        skipped += 1
        continue
      }

      const thumbnailCandidate = selectBestThumbnail(snippet?.thumbnails)
      const thumbnailRef = await uploadThumbnailIfNeeded(videoId, thumbnailCandidate?.url)

      const tagRefs = await ensureTags(forcedTags)
      const mergedTags = existing?.tags ? mergeTagRefs(existing.tags, tagRefs) : tagRefs

      const baseDoc: Record<string, unknown> = {
        _id: existing?._id || docId,
        _type: 'video',
      }

      const fullDoc: Record<string, unknown> = {
        ...baseDoc,
        title,
        slug: {current: existing?.slug?.current || slug},
        language: defaultLanguage,
        videoFormat: format,
        platform: defaultPlatform,
        videoUrl,
        description: (snippet?.description || '').trim(),
        publishDate: new Date(publishDate).toISOString(),
        duration: durationSeconds ?? undefined,
        tags: mergedTags.length ? mergedTags : undefined,
        narrativeOwner: defaultNarrativeOwner,
        platformTier: defaultPlatformTier,
        archivalStatus: defaultArchivalStatus,
        postingEntity: defaultPostingEntity,
        ...(thumbnailRef ? {thumbnailImage: thumbnailRef} : {}),
      }

      const videoDoc: Record<string, unknown> = updateThumbnailsOnly && existing
        ? {
            ...baseDoc,
            ...(thumbnailRef ? {thumbnailImage: thumbnailRef} : {}),
          }
        : fullDoc

      const existingTitle = existing?.title || ''
      const existingDescription = existing?.description || ''
      const nextTitle = (videoDoc.title || '') as string
      const nextDescription = (videoDoc.description || '') as string
      const hasMetadataChanges = existing
        ? existingTitle !== nextTitle || existingDescription !== nextDescription
        : true

      if (onlyUpdateIfChanged && existing && !updateThumbnailsOnly && !hasMetadataChanges) {
        console.log(`⏭️  No title/description changes for ${videoId} (${title}).`)
        skipped += 1
        continue
      }

      if (onlyUpdateIfChanged && existing && hasMetadataChanges) {
        console.log(`✏️  Changes for ${videoId} (${title}):`)
        if (existingTitle !== nextTitle) {
          console.log(`   - title: "${existingTitle}" → "${nextTitle}"`)
        }
        if (existingDescription !== nextDescription) {
          console.log(`   - description: (${existingDescription.length} chars) → (${nextDescription.length} chars)`)
        }
      }

      if (dryRun) {
        console.log(`📝 [dry-run] Would upsert video ${videoDoc._id} (${title})`)
        continue
      }

      if (existing) {
        await client.patch(existing._id).set(videoDoc).commit()
        updated += 1
        console.log(`✅ Updated video ${existing._id} (${title})`)
      } else {
        await client.create(videoDoc)
        created += 1
        console.log(`✅ Created video ${videoDoc._id} (${title})`)
      }
    }

    if (!dryRun) {
      console.log(`Done. Created ${created}, updated ${updated}, skipped ${skipped}.`)
    } else {
      console.log(`Dry run complete. Processed ${videoIds.length} videos.`)
    }
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}

run()
