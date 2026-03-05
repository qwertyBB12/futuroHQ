import {useEffect, useState} from 'react'
import {useClient} from 'sanity'
import {Card, Stack, Heading, Text, Grid, Flex, Box} from '@sanity/ui'

type EntityCount = {
  entity: string
  label: string
  accent: string
  total: number
  drafts: number
  published: number
}

const ENTITIES = [
  {entity: 'hector', label: 'Hector', accent: '#B17E68'},
  {entity: 'benext', label: 'BeNeXT', accent: '#C84841'},
  {entity: 'futuro', label: 'Futuro', accent: '#C84841'},
  {entity: 'next', label: 'NeXT', accent: '#B17E68'},
  {entity: 'mitikah', label: 'Mitikah', accent: '#8B8985'},
  {entity: 'medikah', label: 'Medikah', accent: '#2C7A8C'},
]

export default function EcosystemHealthWidget() {
  const client = useClient({apiVersion: '2024-10-23'})
  const [counts, setCounts] = useState<EntityCount[]>([])
  const [totalDocs, setTotalDocs] = useState(0)
  const [totalDrafts, setTotalDrafts] = useState(0)

  useEffect(() => {
    const fetchCounts = async () => {
      const results = await Promise.all(
        ENTITIES.map(async ({entity, label, accent}) => {
          const total = await client.fetch<number>(
            `count(*[narrativeOwner == $entity && !(_id in path("drafts.**"))])`,
            {entity},
          )
          const drafts = await client.fetch<number>(
            `count(*[narrativeOwner == $entity && _id in path("drafts.**")])`,
            {entity},
          )
          return {entity, label, accent, total, drafts, published: total}
        }),
      )

      setCounts(results)

      const allTotal = await client.fetch<number>(
        `count(*[!(_id in path("drafts.**")) && !(_type match "system.*")])`,
      )
      const allDrafts = await client.fetch<number>(
        `count(*[_id in path("drafts.**")])`,
      )
      setTotalDocs(allTotal)
      setTotalDrafts(allDrafts)
    }

    fetchCounts()
  }, [client])

  return (
    <Card padding={4} radius={2} shadow={1}>
      <Stack space={4}>
        <Heading size={1} style={{fontFamily: "'Oswald', sans-serif", textTransform: 'uppercase', letterSpacing: '0.05em'}}>
          Ecosystem Health
        </Heading>

        <Flex gap={4}>
          <Card padding={3} radius={2} tone="primary">
            <Stack space={2}>
              <Text size={4} weight="bold">{totalDocs}</Text>
              <Text size={1} muted>Published</Text>
            </Stack>
          </Card>
          <Card padding={3} radius={2} tone="caution">
            <Stack space={2}>
              <Text size={4} weight="bold">{totalDrafts}</Text>
              <Text size={1} muted>Drafts</Text>
            </Stack>
          </Card>
        </Flex>

        <Grid columns={[2, 3]} gap={3}>
          {counts.map(({entity, label, accent, total, drafts}) => (
            <Card key={entity} padding={3} radius={2} border>
              <Stack space={2}>
                <Flex align="center" gap={2}>
                  <Box
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      backgroundColor: accent,
                      flexShrink: 0,
                    }}
                  />
                  <Text size={1} weight="semibold" style={{fontFamily: "'Oswald', sans-serif", textTransform: 'uppercase', letterSpacing: '0.03em'}}>
                    {label}
                  </Text>
                </Flex>
                <Text size={3} weight="bold">{total}</Text>
                {drafts > 0 && (
                  <Text size={0} muted>
                    {drafts} draft{drafts !== 1 ? 's' : ''}
                  </Text>
                )}
              </Stack>
            </Card>
          ))}
        </Grid>
      </Stack>
    </Card>
  )
}
