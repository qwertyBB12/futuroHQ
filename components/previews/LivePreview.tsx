import { Card, Stack, Heading, Text, Box, Spinner, Badge, Grid, Inline, Flex } from '@sanity/ui'
import { useClient } from 'sanity'
import type { ComponentType, ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'

type LivePreviewProps = {
  document?: {
    displayed?: Record<string, unknown> | null
    _id?: string
  }
  schemaType?: {
    title?: string
    name?: string
  }
}

type PreviewDocument = Record<string, any> | null

const previewProjections: Record<string, string> = {
  project: `
    ...,
    "participants": participants[]->{_id, _type, "displayName": coalesce(fullName, name, title)},
    "partnerOrgs": partnerOrgs[]->{_id, name},
    "featuredMedia": projectMedia[0]
  `,
  opEd: `
    ...,
    "author": author->{_id, _type, "displayName": coalesce(fullName, name)},
    "mediaItems": media
  `,
  clip: `
    ...,
    "mediaBlock": clipMedia
  `,
  vlog: `
    ...,
    "channelOwner": channelRef->{_id, name, title, fullName},
    "mediaBlock": video
  `,
  podcast: `
    ...,
    "cover": coverMedia
  `,
  podcastEpisode: `
    ...,
    "seriesRef": series->{_id, title},
    "audioBlock": audioEmbed,
    "videoBlock": videoEmbed
  `,
  futuroSummit: `
    ...,
    "host": hostInstitution->{_id, name},
    "featuredProjects": featuredProjects[]->{_id, title, "slug": slug.current}
  `,
}

const buildQuery = (schemaName?: string) => {
  const projection = previewProjections[schemaName ?? ''] ?? '...'
  return `
    *[_id in [$draftId, $publishedId]] | order(_updatedAt desc)[0]{
      ${projection}
    }
  `
}

const formatDate = (value?: string) => {
  if (!value) return ''
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, { dateStyle: 'medium' })
}

const formatDateRange = (start?: string, end?: string) => {
  if (!start && !end) return ''
  if (start && !end) return `Starts ${formatDate(start)}`
  if (!start && end) return `Through ${formatDate(end)}`
  return `${formatDate(start)} – ${formatDate(end)}`
}

const renderPortableText = (blocks?: any[]) => {
  if (!Array.isArray(blocks) || blocks.length === 0) return null

  return (
    <Stack space={3}>
      {blocks.map((block) => {
        if (!block || block._type !== 'block') return null
        const text = Array.isArray(block.children)
          ? block.children.map((child: any) => child.text).join('')
          : ''
        switch (block.style) {
          case 'h2':
            return (
              <Heading key={block._key} size={2}>
                {text}
              </Heading>
            )
          case 'h3':
            return (
              <Heading key={block._key} size={1}>
                {text}
              </Heading>
            )
          default:
            return (
              <Text key={block._key} size={2}>
                {text}
              </Text>
            )
        }
      })}
    </Stack>
  )
}

const PreviewField = ({ label, children }: { label: string; children?: ReactNode }) => {
  if (!children) return null
  return (
    <Stack space={2}>
      <Text size={1} weight="semibold">
        {label}
      </Text>
      {typeof children === 'string' ? <Text size={2}>{children}</Text> : children}
    </Stack>
  )
}

const PreviewList = ({
  label,
  items,
  getLabel,
}: {
  label: string
  items?: any[]
  getLabel: (item: any) => string | null
}) => {
  if (!Array.isArray(items) || items.length === 0) return null
  return (
    <PreviewField label={label}>
      <Stack space={2}>
        {items.map((item, index) => {
          const value = getLabel(item)
          return value ? (
            <Text key={`${value}-${index}`} size={2}>
              {value}
            </Text>
          ) : null
        })}
      </Stack>
    </PreviewField>
  )
}

const LivePreview: ComponentType<LivePreviewProps> = ({ document, schemaType }) => {
  const client = useClient({ apiVersion: '2024-10-23' })
  const [data, setData] = useState<PreviewDocument>(document?.displayed ?? null)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const schemaName = schemaType?.name
  const title = schemaType?.title || 'Document'

  useEffect(() => {
    setData(document?.displayed ?? null)
  }, [document?.displayed])

  useEffect(() => {
    const rawId = document?._id
    if (!rawId || !schemaName) return

    const baseId = rawId.replace(/^drafts\./, '')
    const params = {
      draftId: `drafts.${baseId}`,
      publishedId: baseId,
    }
    const query = buildQuery(schemaName)
    let cancelled = false

    const sync = async () => {
      setIsLoading(true)
      try {
        const next = await client.fetch<PreviewDocument>(query, params)
        if (!cancelled && next) {
          setData(next)
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    sync()

    const subscription = client
      .listen(query, params, { perspective: 'previewDrafts', includeResult: true })
      .subscribe((event: { result?: PreviewDocument }) => {
        if (!cancelled) {
          setData(event.result ?? null)
          setIsLoading(false)
        }
      })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [client, document?._id, schemaName])

  const content = useMemo(() => {
    if (!data) {
      return <Text muted>No content yet — start editing to see a preview.</Text>
    }

    const defaultHeader = (
      <Stack space={3}>
        <Heading size={3}>{data.title || 'Untitled'}</Heading>
        {data.description && (
          <Text muted size={2}>
            {data.description}
          </Text>
        )}
      </Stack>
    )

    switch (schemaName) {
      case 'project':
        return (
          <Stack space={4}>
            {defaultHeader}
            <Inline space={3}>
              {data.status && <Badge mode="outline">{(data.status as string).toUpperCase()}</Badge>}
            </Inline>
            <Grid columns={[1, 2]} gap={4}>
              <PreviewField label="Timeline">{formatDateRange(data.startDate, data.endDate)}</PreviewField>
              <PreviewField label="Slug">
                {(data.slug && data.slug.current) || '—'}
              </PreviewField>
            </Grid>
            <PreviewList
              label="Participants"
              items={data.participants}
              getLabel={(item) => item?.displayName || null}
            />
            <PreviewList
              label="Partner Organisations"
              items={data.partnerOrgs}
              getLabel={(item) => item?.name || null}
            />
            <PreviewField label="Narrative">
              {data.narrative?.openingPortrait && (
                <Text size={2}>{data.narrative.openingPortrait}</Text>
              )}
            </PreviewField>
          </Stack>
        )

      case 'opEd':
        return (
          <Stack space={4}>
            {defaultHeader}
            <Grid columns={[1, 2]} gap={4}>
              <PreviewField label="Language">{data.language}</PreviewField>
              <PreviewField label="Publish Date">{formatDate(data.publishDate)}</PreviewField>
            </Grid>
            <PreviewField label="Author">{data.author?.displayName || '—'}</PreviewField>
            <PreviewField label="Body">{renderPortableText(data.body)}</PreviewField>
          </Stack>
        )

      case 'clip':
        return (
          <Stack space={4}>
            {defaultHeader}
            <PreviewList
              label="Platforms"
              items={data.platforms}
              getLabel={(item) => (typeof item === 'string' ? item : null)}
            />
          </Stack>
        )

      case 'vlog':
        return (
          <Stack space={4}>
            {defaultHeader}
            <Grid columns={[1, 2]} gap={4}>
              <PreviewField label="Channel">{data.channelType}</PreviewField>
              <PreviewField label="Publish Date">{formatDate(data.datePublished)}</PreviewField>
            </Grid>
            <PreviewField label="Channel Owner">
              {data.channelOwner?.name || data.channelOwner?.title || data.channelOwner?.fullName || '—'}
            </PreviewField>
            <PreviewList
              label="Tags"
              items={data.tags}
              getLabel={(item) => (typeof item === 'string' ? item : null)}
            />
          </Stack>
        )

      case 'podcast':
        return (
          <Stack space={4}>
            {defaultHeader}
            <PreviewField label="Status">
              {data.status ? (data.status as string).toUpperCase() : '—'}
            </PreviewField>
            <PreviewField label="RSS Feed">{data.rssFeedUrl}</PreviewField>
            <PreviewField label="YouTube Channel">{data.youtubeChannelUrl}</PreviewField>
          </Stack>
        )

      case 'podcastEpisode':
        return (
          <Stack space={4}>
            {defaultHeader}
            <Grid columns={[1, 2]} gap={4}>
              <PreviewField label="Episode">{data.episodeNumber ? `#${data.episodeNumber}` : '—'}</PreviewField>
              <PreviewField label="Season">{data.seasonNumber ? `Season ${data.seasonNumber}` : '—'}</PreviewField>
              <PreviewField label="Duration">{data.duration || '—'}</PreviewField>
              <PreviewField label="Publish Date">{formatDate(data.pubDate)}</PreviewField>
            </Grid>
            <PreviewField label="Series">{data.seriesRef?.title || '—'}</PreviewField>
          </Stack>
        )

      case 'futuroSummit':
        return (
          <Stack space={4}>
            {defaultHeader}
            <PreviewField label="Subtitle">{data.subtitle}</PreviewField>
            <Grid columns={[1, 2]} gap={4}>
              <PreviewField label="Location">{data.location || '—'}</PreviewField>
              <PreviewField label="Dates">
                {formatDateRange(data.dateRange?.startDate, data.dateRange?.endDate)}
              </PreviewField>
            </Grid>
            <PreviewField label="Host Institution">
              {data.host?.name || 'Not selected'}
            </PreviewField>
            <PreviewList
              label="Featured Projects"
              items={data.featuredProjects}
              getLabel={(item) => item?.title || null}
            />
            <PreviewField label="Call To Action">
              {data.callToAction?.copy ? (
                <Stack space={1}>
                  <Text size={2}>{data.callToAction.copy}</Text>
                  <Text size={1} muted>
                    {data.callToAction.url}
                  </Text>
                </Stack>
              ) : null}
            </PreviewField>
          </Stack>
        )

      default:
        return (
          <Stack space={4}>
            {defaultHeader}
            <Box padding={3} radius={2} border>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {JSON.stringify(data, null, 2)}
              </pre>
            </Box>
          </Stack>
        )
    }
  }, [data, schemaName])

  return (
    <Card padding={4} tone="transparent">
      <Stack space={4}>
        <Heading size={2}>{`${title} Preview`}</Heading>
        {isLoading && (
          <Flex direction="column" align="center" paddingY={5} gap={3}>
            <Spinner />
            <Text muted size={1}>
              Fetching latest preview…
            </Text>
          </Flex>
        )}
        {content}
        {data && (
          <details>
            <summary>
              <Text size={1}>Debug JSON</Text>
            </summary>
            <Box paddingTop={3}>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {JSON.stringify(data, null, 2)}
              </pre>
            </Box>
          </details>
        )}
      </Stack>
    </Card>
  )
}

export default LivePreview
