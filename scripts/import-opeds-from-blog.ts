/**
 * Import op-ed entries from a remote blog feed into Sanity.
 *
 * Usage (dry run by default):
 *   BLOG_FEED_URL=https://www.benextglobal.com/blog?format=rss \
 *   OPED_LANGUAGE=English \
 *   OPED_AUTHOR_REF=person.someone \
 *   DRY_RUN=true \
 *   npx tsx scripts/import-opeds-from-blog.ts
 *
 * Required env vars:
 *   - SANITY_PROJECT_ID
 *   - SANITY_WRITE_TOKEN
 *   - BLOG_FEED_URL (RSS/Atom feed that contains the blog articles)
 *
 * Optional env vars:
 *   - SANITY_DATASET (defaults to "production")
 *   - OPED_LANGUAGE (defaults to "English")
 *   - OPED_AUTHOR_REF (Sanity _id for the author reference)
 *   - OPED_FORCE_TAGS (comma separated list appended to the body as hashtags)
 *   - OPED_MAX_ITEMS (defaults to 30)
 *   - DOWNLOAD_IMAGES (defaults to true; set to "false" to skip hero uploads)
 *   - DRY_RUN (true by default; set to "false" to persist documents)
 */

import {config as loadEnv} from 'dotenv'
import {createClient} from '@sanity/client'
import Parser from 'rss-parser'
import {Readable} from 'node:stream'
import crypto from 'node:crypto'

loadEnv({path: '.env.local', override: false})

const projectId = process.env.SANITY_PROJECT_ID
const dataset = process.env.SANITY_DATASET || 'production'
const token = process.env.SANITY_WRITE_TOKEN
const dryRun = process.env.DRY_RUN !== 'false'
const feedUrl = process.env.BLOG_FEED_URL?.trim()

if (!projectId || !token) {
  console.error('Missing SANITY_PROJECT_ID or SANITY_WRITE_TOKEN environment variables.')
  process.exit(1)
}

if (!feedUrl) {
  console.error('Missing BLOG_FEED_URL environment variable.')
  process.exit(1)
}

const defaultLanguage = process.env.OPED_LANGUAGE || 'English'
const authorRefId = process.env.OPED_AUTHOR_REF?.trim()
const downloadImages = process.env.DOWNLOAD_IMAGES !== 'false'
const maxItems = Number(process.env.OPED_MAX_ITEMS || 30)
const forcedTags = (process.env.OPED_FORCE_TAGS || '')
  .split(',')
  .map((tag) => tag.trim())
  .filter(Boolean)

const client = createClient({
  projectId,
  dataset,
  token,
  apiVersion: '2025-01-01',
  useCdn: false,
})

const parser = new Parser({
  customFields: {
    item: [
      ['content:encoded', 'contentEncoded'],
      ['media:thumbnail', 'mediaThumbnail'],
      ['media:content', 'mediaContent'],
    ],
  },
})

type FeedItem = {
  title?: string
  link?: string
  guid?: string
  content?: string
  contentSnippet?: string
  contentEncoded?: string
  mediaThumbnail?: {url?: string} | Array<{url?: string}>
  mediaContent?: {url?: string} | Array<{url?: string}>
  isoDate?: string
  pubDate?: string
}

type UploadedImage = {_type: 'image'; asset: {_type: 'reference'; _ref: string}}

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

function stripHtml(html?: string | null): string {
  if (!html) return ''
  return html
    .replace(/<\/?(script|style)[^>]*>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/?(div|p|h\d|li|blockquote)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function htmlToPortableTextBlocks(html?: string | null) {
  const text = stripHtml(html)
  if (!text) {
    return []
  }

  return text.split(/\n{2,}/g).map((para) => ({
    _key: crypto.randomUUID(),
    _type: 'block' as const,
    style: 'normal' as const,
    markDefs: [],
    children: [
      {
        _key: crypto.randomUUID(),
        _type: 'span' as const,
        text: para.trim(),
        marks: [],
      },
    ],
  }))
}

function extractImageSources(item: FeedItem, html?: string | null): string[] {
  const results = new Set<string>()

  const media = Array.isArray(item.mediaContent) ? item.mediaContent : [item.mediaContent]
  for (const entry of media) {
    if (entry?.url) results.add(entry.url)
  }

  const thumbs = Array.isArray(item.mediaThumbnail) ? item.mediaThumbnail : [item.mediaThumbnail]
  for (const thumb of thumbs) {
    if (thumb?.url) results.add(thumb.url)
  }

  const contentHtml = html || item.contentEncoded || item.content
  if (contentHtml) {
    const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi
    let match: RegExpExecArray | null
    while ((match = imgRegex.exec(contentHtml))) {
      const src = match[1]
      if (src) {
        results.add(src)
      }
    }
  }

  return Array.from(results)
}

async function fetchArticleHtml(url: string): Promise<string | null> {
  const response = await fetch(url).catch(() => null)
  if (!response?.ok) return null
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
    return null
  }
  return await response.text().catch(() => null)
}

async function uploadImage(imageUrl: string): Promise<UploadedImage | undefined> {
  if (!downloadImages) return undefined
  if (dryRun) return undefined

  const response = await fetch(imageUrl).catch(() => null)
  if (!response?.ok) {
    console.warn(
      `⚠️  Failed to download image ${imageUrl} (${response?.status ?? 'unknown status'})`
    )
    return undefined
  }

  const arrayBuffer = await response.arrayBuffer().catch(() => null)
  if (!arrayBuffer) {
    console.warn(`⚠️  Could not read image bytes for ${imageUrl}`)
    return undefined
  }

  const buffer = Buffer.from(arrayBuffer)
  const contentType = response.headers.get('content-type') || 'image/jpeg'
  const extension = contentType.includes('png')
    ? 'png'
    : contentType.includes('webp')
      ? 'webp'
      : 'jpg'
  const cleanName = slugify(imageUrl.split('/').pop() || 'image')
  const filename = `${cleanName}.${extension}`

  const asset = await client.assets
    .upload('image', Readable.from(buffer), {
      filename,
      contentType,
    })
    .catch((err) => {
      console.warn(`⚠️  Upload failed for image ${imageUrl}: ${err.message}`)
      return null
    })

  if (!asset?._id) return undefined

  return {_type: 'image', asset: {_type: 'reference', _ref: asset._id}}
}

async function buildMediaGallery(
  imageUrls: string[],
  existingMedia: unknown[] | undefined
): Promise<UploadedImage[]> {
  const uniqueUrls = Array.from(new Set(imageUrls.filter(Boolean)))
  if (!uniqueUrls.length) {
    return Array.isArray(existingMedia)
      ? (existingMedia.filter((entry) => entry?._type === 'image') as UploadedImage[])
      : []
  }

  const existingImages: UploadedImage[] = Array.isArray(existingMedia)
    ? (existingMedia.filter((entry) => entry?._type === 'image') as UploadedImage[])
    : []
  const results: UploadedImage[] = []
  let reuseIndex = 0

  for (const url of uniqueUrls) {
    if (reuseIndex < existingImages.length) {
      results.push(existingImages[reuseIndex])
      reuseIndex += 1
      continue
    }

    const uploaded = await uploadImage(url)
    if (uploaded) {
      results.push(uploaded)
    }
  }

  return results
}

async function run() {
  try {
    console.log(`Importing blog feed ${feedUrl} (dryRun=${dryRun ? 'true' : 'false'})...`)
    const feed = await parser.parseURL(feedUrl)
    const items: FeedItem[] = feed.items?.slice(0, maxItems) || []

    let authorReference: {_type: 'reference'; _ref: string} | null = null
    if (authorRefId) {
      const authorExists = await client
        .getDocument(authorRefId)
        .then((doc) => Boolean(doc))
        .catch(() => false)
      if (!authorExists) {
        console.warn(
          `⚠️  Author document "${authorRefId}" not found. Skipping author reference assignment.`
        )
      } else {
        authorReference = {_type: 'reference', _ref: authorRefId}
      }
    }

    if (!items.length) {
      console.log('No entries found in feed. Nothing to import.')
      return
    }

    let created = 0
    let updated = 0
    const nowIso = new Date().toISOString()

    for (const item of items) {
      const title = item.title?.trim()
      const link = item.link?.trim()
      if (!title || !link) {
        console.warn('⚠️  Skipping feed item without a title or link')
        continue
      }

      const slugBase = slugify(title)
      const docId = `opEd.${slugBase}`

      const existing = dryRun ? null : await client.getDocument<any>(docId).catch(() => null)

      const htmlContent = item.contentEncoded || item.content || (await fetchArticleHtml(link))
      const bodyBlocks = htmlToPortableTextBlocks(htmlContent)
      const imageUrls = extractImageSources(item, htmlContent)
      const galleryImages = await buildMediaGallery(imageUrls, existing?.media)

      const publishDate =
        (item.isoDate ? new Date(item.isoDate) : item.pubDate ? new Date(item.pubDate) : null) || null
      const publishIso = publishDate ? publishDate.toISOString() : null

      const hashedTags = forcedTags.length
        ? forcedTags.map((tag) => tag.replace(/^#/, '').trim()).filter(Boolean)
        : []
      const finalBody =
        hashedTags.length > 0
          ? [
              ...bodyBlocks,
              {
                _type: 'block' as const,
                style: 'normal' as const,
                markDefs: [],
                children: [
                  {
                    _type: 'span' as const,
                    text: hashedTags.map((tag) => `#${tag}`).join(' '),
                    marks: [],
                  },
                ],
              },
            ]
          : bodyBlocks

      const opEdDoc: Record<string, unknown> = {
        _id: docId,
        _type: 'opEd',
        title,
        slug: {current: slugBase},
        language: existing?.language || defaultLanguage,
        body: finalBody,
        publishDate: publishIso || existing?.publishDate || null,
        publishedAt: publishIso || existing?.publishedAt || nowIso,
        updatedAt: nowIso,
        media: [
          ...galleryImages,
          ...(
            Array.isArray(existing?.media)
              ? existing.media.filter((entry: any) => entry?._type !== 'image')
              : []
          ),
        ],
        seo: existing?.seo ?? null,
        publish: existing?.publish ?? true,
        order: existing?.order ?? 0,
        narrative: existing?.narrative ?? null,
        ai_derivatives: existing?.ai_derivatives ?? {summary: '', quotes: [], captions: []},
        distribution: existing?.distribution ?? [],
        analytics: existing?.analytics ?? {views: 0, likes: 0, shares: 0, source: 'blog'},
      }

      if (authorReference) {
        opEdDoc['author'] = authorReference
      } else if (existing?.author) {
        opEdDoc['author'] = existing.author
      }

      if (dryRun) {
        console.log(`📝 [dry-run] Would upsert opEd ${docId} (${title})`)
      } else {
        await client.createOrReplace(opEdDoc)
        if (existing) {
          updated += 1
          console.log(`✅ Updated opEd ${docId} (${title})`)
        } else {
          created += 1
          console.log(`✅ Created opEd ${docId} (${title})`)
        }
      }
    }

    if (dryRun) {
      console.log(`Dry run complete. Processed ${items.length} entries.`)
    } else {
      console.log(`Done. Created ${created} and updated ${updated} op-eds.`)
    }
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}

run()
