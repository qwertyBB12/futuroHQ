import {config} from 'dotenv'
import {createClient} from '@sanity/client'
import {randomUUID} from 'node:crypto'

config({path: '.env.local', override: false})

type DocWithTags = {
  _id: string
  _type: string
  tags: string[]
  sluggedRefs?: (string | null)[]
}

const projectId = process.env.SANITY_PROJECT_ID
const dataset = process.env.SANITY_DATASET || 'production'
const token = process.env.SANITY_WRITE_TOKEN

if (!projectId) {
  console.error('Missing SANITY_PROJECT_ID environment variable.')
  process.exit(1)
}

if (!token) {
  console.error('Missing SANITY_WRITE_TOKEN environment variable.')
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
const targetTypes =
  process.env.TAG_DOCUMENT_TYPES?.split(',').map(part => part.trim()).filter(Boolean) ?? [
    'curatedPost',
    'vlog',
    'socialPost',
  ]

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 96)

async function ensureTagDocuments(slugs: Map<string, string>) {
  if (!slugs.size) return

  const slugArray = Array.from(slugs.keys())
  const existing: {_id: string; slug: string}[] = await client.fetch(
    `*[_type == "tag" && slug.current in $slugs]{_id, "slug": slug.current}`,
    {slugs: slugArray},
  )

  const existingSlugs = new Set(existing.map(entry => entry.slug))
  const creations = slugArray
    .filter(slug => !existingSlugs.has(slug))
    .map(slug => ({
      _type: 'tag',
      _id: `tag.${slug}`,
      label: slugs.get(slug),
      slug: {current: slug},
    }))

  if (!creations.length) return

  console.log(`Preparing to create ${creations.length} new tag document(s).`)
  if (dryRun) {
    creations.forEach(doc => console.log(`  - dry-run create tag -> ${doc.slug.current}`))
    return
  }

  for (const doc of creations) {
    await client.createIfNotExists(doc)
    console.log(`  - created tag ${doc.slug.current}`)
  }
}

async function migrate() {
  console.log(
    `Starting tag migration for ${targetTypes.join(', ')} (dryRun=${dryRun ? 'true' : 'false'}).`,
  )

  const docs: DocWithTags[] = await client.fetch(
    `*[_type in $types && defined(tags) && count(tags) > 0]{_id, _type, tags, "sluggedRefs": tags_ref[]->slug.current}`,
    {types: targetTypes},
  )

  if (!docs.length) {
    console.log('No documents with legacy string tags found. Nothing to do.')
    return
  }

  const tagSlugMap = new Map<string, string>()

  docs.forEach(doc => {
    doc.tags.forEach(tagValue => {
      if (typeof tagValue !== 'string' || !tagValue.trim()) return
      const slug = slugify(tagValue)
      if (!slug) return
      if (!tagSlugMap.has(slug)) {
        tagSlugMap.set(slug, tagValue.trim())
      }
    })
  })

  await ensureTagDocuments(tagSlugMap)

  let patchedCount = 0
  for (const doc of docs) {
    const existing = new Set((doc.sluggedRefs || []).filter((entry): entry is string => !!entry))

    const references = Array.from(
      new Set(
        doc.tags
          .map(tagValue => slugify(tagValue))
          .filter(slug => slug && !existing.has(slug)),
      ),
    )

    if (!references.length) continue

    const refPayload = references.map(slug => ({
      _type: 'reference' as const,
      _ref: `tag.${slug}`,
      _key: randomUUID(),
    }))

    console.log(
      `Preparing to append ${references.length} tag reference(s) to ${doc._type} (${doc._id}).`,
    )

    if (dryRun) {
      references.forEach(slug => console.log(`  - would append reference -> tag.${slug}`))
      continue
    }

    await client
      .patch(doc._id)
      .setIfMissing({tags_ref: []})
      .append('tags_ref', refPayload)
      .commit()

    patchedCount += 1
    console.log(`  - appended references to ${doc._id}`)
  }

  console.log(`Completed migration. Patched ${patchedCount} document(s).`)
}

migrate().catch(err => {
  console.error('Tag migration failed:', err)
  process.exit(1)
})
