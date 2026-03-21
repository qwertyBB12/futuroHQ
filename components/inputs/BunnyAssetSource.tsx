import React, {useEffect, useState, useCallback} from 'react'
import {useClient} from 'sanity'
import {Card, Stack, Text, Button, Flex, Grid, Spinner, TextInput, Box} from '@sanity/ui'
import {PlayIcon, SearchIcon, CloseIcon} from '@sanity/icons'

interface AssetSourceProps {
  onSelect: (assets: Array<{kind: 'url'; value: string}>) => void
  onClose: () => void
}

interface CdnVideo {
  _id: string
  title: string
  cdnUrl: string
  b2Key: string
  bunnyStatus: string | null
  duration: number | null
  resolution: string | null
}

const QUERY = `*[_type == "video" && videoSource == "b2" && defined(cdnUrl) && cdnUrl != ""] | order(_createdAt desc) {
  _id,
  title,
  cdnUrl,
  b2Key,
  bunnyStatus,
  duration,
  resolution
}`

export function BunnyAssetSource({onSelect, onClose}: AssetSourceProps) {
  const client = useClient({apiVersion: '2024-01-01'})
  const [videos, setVideos] = useState<CdnVideo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    client
      .fetch<CdnVideo[]>(QUERY)
      .then((result) => {
        setVideos(result || [])
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [client])

  const handleSelect = useCallback(
    (cdnUrl: string) => {
      onSelect([{kind: 'url', value: cdnUrl}])
    },
    [onSelect],
  )

  const filtered = search
    ? videos.filter(
        (v) =>
          v.title?.toLowerCase().includes(search.toLowerCase()) ||
          v.b2Key?.toLowerCase().includes(search.toLowerCase()),
      )
    : videos

  const statusColor = (status: string | null): string => {
    switch (status) {
      case 'ready':
        return '#B17E68' // Copper
      case 'processing':
        return '#8B8985' // Archival Slate
      case 'error':
        return '#C84841' // Vermillion
      default:
        return '#8B8985'
    }
  }

  return (
    <Card
      padding={4}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        backgroundColor: '#0E0E0E',
        overflow: 'auto',
      }}
    >
      <Stack space={4}>
        <Flex justify="space-between" align="center">
          <Text
            size={3}
            weight="bold"
            style={{fontFamily: 'Oswald, sans-serif', color: '#F2E5D5'}}
          >
            Bunny CDN Videos
          </Text>
          <Button icon={CloseIcon} mode="bleed" tone="default" onClick={onClose} title="Close" />
        </Flex>

        <TextInput
          icon={SearchIcon}
          placeholder="Search by title or B2 key..."
          value={search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.currentTarget.value)}
        />

        {loading && (
          <Flex justify="center" padding={5}>
            <Spinner muted />
          </Flex>
        )}

        {error && (
          <Card padding={3} tone="critical" border>
            <Text size={1}>Error loading videos: {error}</Text>
          </Card>
        )}

        {!loading && !error && filtered.length === 0 && (
          <Card padding={4} border style={{borderColor: '#2A2520'}}>
            <Text size={1} muted>
              {search ? 'No videos match your search.' : 'No B2/Bunny videos found in Sanity.'}
            </Text>
          </Card>
        )}

        <Grid columns={[1, 1, 2, 3]} gap={3}>
          {filtered.map((video) => (
            <Card
              key={video._id}
              padding={3}
              border
              style={{
                borderColor: '#2A2520',
                backgroundColor: '#1A1714',
                cursor: 'pointer',
              }}
              onClick={() => handleSelect(video.cdnUrl)}
            >
              <Stack space={3}>
                <Flex align="center" gap={2}>
                  <PlayIcon style={{color: '#B17E68'}} />
                  <Text
                    size={1}
                    weight="semibold"
                    style={{color: '#F2E5D5'}}
                    textOverflow="ellipsis"
                  >
                    {video.title || 'Untitled'}
                  </Text>
                </Flex>
                <Text size={0} muted style={{color: '#8B8985'}} textOverflow="ellipsis">
                  {video.b2Key}
                </Text>
                <Flex gap={2} align="center">
                  {video.bunnyStatus && (
                    <Box
                      padding={1}
                      style={{
                        backgroundColor: statusColor(video.bunnyStatus),
                        borderRadius: '4px',
                        display: 'inline-block',
                      }}
                    >
                      <Text size={0} style={{color: '#0E0E0E'}}>
                        {video.bunnyStatus}
                      </Text>
                    </Box>
                  )}
                  {video.resolution && (
                    <Text size={0} muted>
                      {video.resolution}
                    </Text>
                  )}
                  {video.duration && (
                    <Text size={0} muted>
                      {Math.floor(video.duration / 60)}:
                      {String(video.duration % 60).padStart(2, '0')}
                    </Text>
                  )}
                </Flex>
              </Stack>
            </Card>
          ))}
        </Grid>
      </Stack>
    </Card>
  )
}

// Asset source definition for Sanity config registration
export const bunnyAssetSource = {
  name: 'bunny-cdn',
  title: 'Bunny CDN',
  component: BunnyAssetSource,
  icon: PlayIcon,
}
