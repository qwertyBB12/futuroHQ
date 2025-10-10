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

type PreviewContent =
  | {kind: 'iframe'; src: string; height?: number; allow?: string; allowFullscreen?: boolean}
  | {kind: 'audio'; src: string}
  | {kind: 'html'; markup: string}
  | {kind: 'none'}

const CSP_BLOCKED_IFRAME_HOSTS = new Set(['player.captivate.fm'])

function isUrl(candidate: string) {
  try {
    new URL(candidate)
    return true
  } catch {
    return false
  }
}

function parseHeight(value?: string | null) {
  if (!value) return undefined
  const fromStyle = value.match(/height\s*:\s*([0-9.]+)px/i)
  if (fromStyle) return Number(fromStyle[1])
  const pxMatch = value.match(/([0-9.]+)px/i)
  if (pxMatch) return Number(pxMatch[1])
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : undefined
}

function parseEmbedCode(embed: string): PreviewContent {
  const trimmed = embed.trim()
  if (!trimmed) return {kind: 'none'}

  if (typeof document === 'undefined') {
    return {kind: 'html', markup: trimmed}
  }

  const container = document.createElement('div')
  container.innerHTML = trimmed

  const iframe = container.querySelector('iframe')
  if (iframe?.src) {
    const heightFromStyle = parseHeight(iframe.getAttribute('style') || '')
    const heightAttr = parseHeight(iframe.getAttribute('height'))
    const allow = iframe.getAttribute('allow') ?? undefined
    const allowFullscreen =
      iframe.hasAttribute('allowfullscreen') ||
      iframe.getAttribute('allowFullScreen') === 'true' ||
      iframe.getAttribute('allowfullscreen') === 'true'

    return {
      kind: 'iframe',
      src: iframe.src,
      height: heightFromStyle ?? heightAttr,
      allow,
      allowFullscreen,
    }
  }

  const audio = container.querySelector('audio')
  if (audio?.src) {
    return {kind: 'audio', src: audio.src}
  }

  return {kind: 'html', markup: trimmed}
}

function buildCaptivateContent(platformId: string): PreviewContent {
  const url = platformId.trim()
  if (!url) return {kind: 'none'}
  const lower = url.toLowerCase()
  const isAudioFile =
    lower.endsWith('.mp3') ||
    lower.endsWith('.m4a') ||
    lower.includes('.mp3?') ||
    lower.includes('.m4a?')
  if (isAudioFile) {
    return {kind: 'audio', src: url}
  }

  const embedUrl = url.includes('player.captivate.fm')
    ? url
    : (() => {
        const withoutQuery = url.split('?')[0]
        const segments = withoutQuery.split('/').filter(Boolean)
        const lastSegment = segments[segments.length - 1] || withoutQuery
        return `https://player.captivate.fm/episode/${encodeURIComponent(lastSegment)}`
      })()

  return {
    kind: 'iframe',
    src: embedUrl,
    height: 600,
    allow: 'autoplay; clipboard-write; encrypted-media',
    allowFullscreen: true,
  }
}

function buildSpotifyContent(platformId: string): PreviewContent {
  const trimmed = platformId.trim()
  if (!trimmed) return {kind: 'none'}

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

  return {
    kind: 'iframe',
    src: baseUrl,
    height: 232,
    allow: 'autoplay; clipboard-write; encrypted-media',
    allowFullscreen: false,
  }
}

function buildSoundCloudContent(platformId: string): PreviewContent {
  const trimmed = platformId.trim()
  if (!trimmed) return {kind: 'none'}

  const trackUrl = isUrl(trimmed) ? trimmed : `https://soundcloud.com/${trimmed}`
  const embedUrl = `https://w.soundcloud.com/player/?url=${encodeURIComponent(
    trackUrl
  )}&color=%23ff5500&inverse=false&auto_play=false&show_user=true`

  return {
    kind: 'iframe',
    src: embedUrl,
    height: 166,
    allow: 'autoplay',
    allowFullscreen: false,
  }
}

function buildGenericAudioContent(platformId: string): PreviewContent {
  const trimmed = platformId.trim()
  if (!trimmed) return {kind: 'none'}
  return {kind: 'audio', src: trimmed}
}

function buildAudioPreviewContent(value: MediaBlockValue): PreviewContent {
  const platformId = typeof value.platformId === 'string' ? value.platformId.trim() : ''
  if (!platformId) return {kind: 'none'}

  const platform = value.platform?.toLowerCase()
  switch (platform) {
    case 'captivate':
      return buildCaptivateContent(platformId)
    case 'spotify':
      return buildSpotifyContent(platformId)
    case 'soundcloud':
      return buildSoundCloudContent(platformId)
    default:
      return buildGenericAudioContent(platformId)
  }
}

function buildBlockedIframeNotice(src: string): PreviewContent {
  const safeSrc = isUrl(src) ? src : '#'
  const markup = [
    '<div style="width:100%;padding:12px;border-radius:6px;background:#f5f6fa;">',
    '<strong>Preview blocked by Content Security Policy.</strong>',
    '<div style="margin-top:8px;font-size:0.85rem;">',
    'Open the player in a new tab to verify the embed:',
    ` <a href="${safeSrc}" target="_blank" rel="noopener noreferrer">${safeSrc}</a>`,
    '</div>',
    '</div>',
  ].join('')
  return {kind: 'html', markup}
}

function safeHostname(url: string) {
  try {
    return new URL(url).hostname
  } catch {
    return ''
  }
}

function resolvePreviewContent(value?: MediaBlockValue | null): PreviewContent {
  if (!value) return {kind: 'none'}
  const embed = typeof value.embedCode === 'string' ? value.embedCode.trim() : ''
  if (embed) {
    const parsed = parseEmbedCode(embed)
    if (parsed.kind === 'iframe') {
      const host = safeHostname(parsed.src)
      if (host && CSP_BLOCKED_IFRAME_HOSTS.has(host)) {
        const fallback: PreviewContent =
          value.assetType === 'audio' ? buildAudioPreviewContent(value) : {kind: 'none'}
        if (fallback.kind !== 'none') {
          return fallback
        }
        return buildBlockedIframeNotice(parsed.src)
      }
    }
    return parsed
  }
  if (value.assetType === 'audio') {
    return buildAudioPreviewContent(value)
  }
  return {kind: 'none'}
}

export function MediaBlockInput(props: ObjectInputProps) {
  const {renderDefault, value} = props

  const previewContent = useMemo(() => resolvePreviewContent(value as MediaBlockValue), [value])

  return (
    <Stack space={4}>
      {renderDefault(props)}
      {previewContent.kind !== 'none' ? (
        <Card radius={2} shadow={1} padding={3} tone="primary">
          <Text size={1} weight="semibold">
            Preview
          </Text>
          <Box marginTop={3} style={{overflow: 'hidden'}}>
            {previewContent.kind === 'iframe' ? (
              <iframe
                src={previewContent.src}
                height={previewContent.height ?? 320}
                style={{width: '100%', border: 0, borderRadius: '6px'}}
                allow={previewContent.allow}
                allowFullScreen={previewContent.allowFullscreen ?? true}
                loading="lazy"
                title="Media player preview"
              />
            ) : previewContent.kind === 'audio' ? (
              <audio controls src={previewContent.src} style={{width: '100%'}} />
            ) : (
              <div
                style={{width: '100%'}}
                dangerouslySetInnerHTML={{__html: previewContent.markup}}
              />
            )}
          </Box>
        </Card>
      ) : null}
    </Stack>
  )
}
