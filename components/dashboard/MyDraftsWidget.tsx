import {useEffect, useState} from 'react'
import {useClient} from 'sanity'
import {useRouter} from 'sanity/router'
import {Stack, Heading, Text, Flex, Box} from '@sanity/ui'
import {glassPanel} from './glassStyles'

type DraftDoc = {
  _id: string
  _type: string
  title?: string
  _updatedAt: string
  narrativeOwner?: string
}

const ENTITY_COLORS: Record<string, string> = {
  hector: '#B17E68',
  benext: '#C84841',
  futuro: '#C84841',
  next: '#B17E68',
  mitikah: '#8B8985',
  medikah: '#2C7A8C',
}

const TYPE_LABELS: Record<string, string> = {
  essay: 'Essay',
  video: 'Video',
  project: 'Project',
  podcast: 'Podcast',
  podcastEpisode: 'Episode',
  futuroSummit: 'Summit',
  person: 'Person',
  alumni: 'Alumni',
  collaborator: 'Collaborator',
  opEd: 'Op-Ed',
  curatedPost: 'Curated',
  socialPost: 'Social',
  news: 'News',
  keynote: 'Keynote',
  decision: 'Decision',
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export default function MyDraftsWidget() {
  const client = useClient({apiVersion: '2024-10-23'})
  const router = useRouter()
  const [drafts, setDrafts] = useState<DraftDoc[]>([])

  useEffect(() => {
    client
      .fetch<DraftDoc[]>(
        `*[_id in path("drafts.**") && defined(title)] | order(_updatedAt desc)[0...5]{
          _id, _type, title, _updatedAt, narrativeOwner
        }`,
      )
      .then(setDrafts)
  }, [client])

  return (
    <div style={{...glassPanel, padding: 24}}>
      <Stack space={4}>
        <Heading
          size={1}
          style={{
            fontFamily: "'Oswald', sans-serif",
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          My Drafts
        </Heading>

        {drafts.length === 0 ? (
          <Text size={1} muted>
            No drafts — everything is published.
          </Text>
        ) : (
          <Stack space={1}>
            {drafts.map((doc) => {
              const docId = doc._id.replace(/^drafts\./, '')
              return (
                <div
                  key={doc._id}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 12,
                    cursor: 'pointer',
                    transition: 'background 0.2s ease',
                  }}
                  onClick={() =>
                    router.navigateIntent('edit', {id: docId, type: doc._type})
                  }
                >
                  <Flex align="center" gap={3}>
                    <Box
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor:
                          ENTITY_COLORS[doc.narrativeOwner || ''] || '#8B8985',
                        flexShrink: 0,
                      }}
                    />
                    <Stack space={1} style={{flex: 1, minWidth: 0}}>
                      <span
                        style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          display: 'block',
                          fontFamily: "'Mulish', sans-serif",
                          fontWeight: 600,
                          fontSize: 13,
                        }}
                      >
                        {doc.title || 'Untitled'}
                      </span>
                      <Flex align="center" gap={2}>
                        <Text
                          size={0}
                          style={{
                            color: '#C84841',
                            fontWeight: 600,
                            fontSize: 10,
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                          }}
                        >
                          Draft
                        </Text>
                        <Text size={0} muted>
                          {TYPE_LABELS[doc._type] || doc._type}
                        </Text>
                      </Flex>
                    </Stack>
                    <Text size={0} muted style={{flexShrink: 0}}>
                      {timeAgo(doc._updatedAt)}
                    </Text>
                  </Flex>
                </div>
              )
            })}
          </Stack>
        )}
      </Stack>
    </div>
  )
}
