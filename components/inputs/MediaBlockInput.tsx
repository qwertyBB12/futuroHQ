import {useMemo} from 'react'
import type {ObjectInputProps} from 'sanity'
import {Stack, Card, Text, Box} from '@sanity/ui'

type MediaBlockValue = {
  assetType?: string
  platform?: string
  platformId?: string
  embedCode?: string
  playerColor?: string
}

function isUrl(candidate: string) {
  try {
    new URL(candidate)
    return true
  } catch {
    return false
  }
}

function buildCaptivateEmbed(platformId: string) {
  const url = platformId.trim()
  if (!url) return ''
  const lower = url.toLowerCase()
  const isAudioFile =
    lower.endsWith('.mp3') || lower.endsWith('.m4a') || lower.includes('.mp3?') || lower.includes('.m4a?')
  if (isAudioFile) {
    return `<audio controls src="${url}" style="width:100%"></audio>`
  }
  const embedUrl = url.includes('player.captivate.fm')
    ? url
    : (() => {
        const withoutQuery = url.split('?')[0]
        const segments = withoutQuery.split('/').filter(Boolean)
        const lastSegment = segments[segments.length - 1] || withoutQuery
        return `https://player.captivate.fm/episode/${encodeURIComponent(lastSegment)}`
      })()

  return `<div style="width:100%;height:600px;margin-bottom:20px;border-radius:6px;overflow:hidden;"><iframe style="width:100%;height:600px;" frameborder="no" scrolling="no" allow="clipboard-write" seamless src="${embedUrl}"></iframe></div>`
}

function buildSpotifyEmbed(platformId: string) {
  const trimmed = platformId.trim()
  if (!trimmed) return ''

  const baseUrl = (() => {
    if (trimmed.includes('embed/episode')) return trimmed
    if (trimmed.includes('open.spotify.com/episode')) {
      return trimmed
        .replace('open.spotify.com/episode', 'open.spotify.com/embed/episode')
        .replace(/(\?.*)$/, '')
    }
    if (isUrl(trimmed)) {
      return trimmed.replace('open.spotify.com/', 'open.spotify.com/embed/')
    }
    return `https://open.spotify.com/embed/episode/${trimmed}`
  })()

  return `<iframe style="border-radius:12px" src="${baseUrl}" width="100%" height="232" frameborder="0" allowtransparency="true" allow="clipboard-write; encrypted-media"></iframe>`
}

function buildSoundCloudEmbed(platformId: string) {
  const trimmed = platformId.trim()
  if (!trimmed) return ''

  const trackUrl = isUrl(trimmed) ? trimmed : `https://soundcloud.com/${trimmed}`
  const embedUrl = `https://w.soundcloud.com/player/?url=${encodeURIComponent(trackUrl)}&color=%23ff5500&inverse=false&auto_play=false&show_user=true`

  return `<iframe width="100%" height="166" scrolling="no" frameborder="no" allow="autoplay" src="${embedUrl}"></iframe>`
}

function buildGenericAudioEmbed(platformId: string) {
  const trimmed = platformId.trim()
  if (!trimmed) return ''
  return `<audio controls src="${trimmed}" style="width:100%"></audio>`
}

function buildAudioPreviewMarkup(value: MediaBlockValue) {
  const platformId = typeof value.platformId === 'string' ? value.platformId.trim() : ''
  if (!platformId) return ''

  const platform = value.platform?.toLowerCase()
  switch (platform) {
    case 'captivate':
      return buildCaptivateEmbed(platformId)
    case 'spotify':
      return buildSpotifyEmbed(platformId)
    case 'soundcloud':
      return buildSoundCloudEmbed(platformId)
    default:
      return buildGenericAudioEmbed(platformId)
  }
}

export function MediaBlockInput(props: ObjectInputProps) {
  const {renderDefault, value} = props

  const previewMarkup = useMemo(() => {
    const embed = typeof value?.embedCode === 'string' ? value.embedCode.trim() : ''
    if (embed) {
      return embed
    }
    const platformId = typeof value?.platformId === 'string' ? value.platformId.trim() : ''
    if (value?.assetType === 'audio' && platformId) {
      return buildAudioPreviewMarkup(value as MediaBlockValue)
    }
    return ''
  }, [value])

  return (
    <Stack space={4}>
      {renderDefault(props)}
      {previewMarkup ? (
        <Card radius={2} shadow={1} padding={3} tone="primary">
          <Text size={1} weight="semibold">
            Preview
          </Text>
          <Box marginTop={3} style={{overflow: 'hidden'}}>
            <div
              style={{width: '100%'}}
              dangerouslySetInnerHTML={{__html: previewMarkup}}
            />
          </Box>
        </Card>
      ) : null}
    </Stack>
  )
}
