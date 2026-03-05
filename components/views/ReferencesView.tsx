import {useEffect, useState} from 'react'
import {useClient} from 'sanity'
import {Card, Stack, Heading, Text, Flex, Box, Badge, Spinner} from '@sanity/ui'
import type {ComponentType} from 'react'

type ReferencesViewProps = {
  document?: {
    displayed?: Record<string, unknown> | null
    _id?: string
  }
}

type RefDoc = {
  _id: string
  _type: string
  title?: string
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

const ReferencesView: ComponentType<ReferencesViewProps> = ({document}) => {
  const client = useClient({apiVersion: '2024-10-23'})
  const [incoming, setIncoming] = useState<RefDoc[]>([])
  const [loading, setLoading] = useState(true)

  const rawId = document?._id
  const baseId = rawId?.replace(/^drafts\./, '')

  useEffect(() => {
    if (!baseId) return

    setLoading(true)
    client
      .fetch<RefDoc[]>(
        `*[references($id) && !(_id in path("drafts.**"))]{
          _id, _type, title, narrativeOwner
        } | order(_type asc, title asc)`,
        {id: baseId},
      )
      .then(setIncoming)
      .finally(() => setLoading(false))
  }, [client, baseId])

  return (
    <Card padding={4} tone="transparent">
      <Stack space={5}>
        <Heading size={2} style={{fontFamily: "'Oswald', sans-serif", textTransform: 'uppercase', letterSpacing: '0.05em'}}>
          References
        </Heading>

        <Stack space={3}>
          <Text size={1} weight="semibold" style={{textTransform: 'uppercase', letterSpacing: '0.03em', color: '#8B8985'}}>
            Incoming References ({incoming.length})
          </Text>
          <Text size={0} muted>
            Documents that reference this one
          </Text>

          {loading ? (
            <Flex align="center" justify="center" padding={4}>
              <Spinner />
            </Flex>
          ) : incoming.length === 0 ? (
            <Card padding={3} radius={2} border>
              <Text size={1} muted>No other documents reference this one.</Text>
            </Card>
          ) : (
            <Stack space={1}>
              {incoming.map((doc) => (
                <Card key={doc._id} padding={3} radius={2} border>
                  <Flex align="center" gap={3}>
                    <Box
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: ENTITY_COLORS[doc.narrativeOwner || ''] || '#8B8985',
                        flexShrink: 0,
                      }}
                    />
                    <Stack space={1} style={{flex: 1}}>
                      <Text size={1} weight="semibold">
                        {doc.title || doc._id}
                      </Text>
                      <Text size={0} muted>{doc._type}</Text>
                    </Stack>
                    {doc.narrativeOwner && (
                      <Badge mode="outline" tone="primary" fontSize={0}>
                        {doc.narrativeOwner}
                      </Badge>
                    )}
                  </Flex>
                </Card>
              ))}
            </Stack>
          )}
        </Stack>
      </Stack>
    </Card>
  )
}

export default ReferencesView
