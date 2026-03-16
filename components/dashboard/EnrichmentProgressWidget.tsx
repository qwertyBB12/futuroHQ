import {useEffect, useState} from 'react'
import {useClient} from 'sanity'
import {Stack, Heading, Text, Flex, Box} from '@sanity/ui'
import {glassPanel, glassCard} from './glassStyles'
import {GROQ_FILTERS} from '../../lib/completeness'

const COPPER = '#B17E68'
const SURFACE_RAISED = '#1A1714'

type TypeProgress = {
  type: string
  label: string
  total: number
  complete: number
}

const TRACKED_TYPES = [
  {type: 'alumni', label: 'Alumni'},
  {type: 'collaborator', label: 'Collaborators'},
  {type: 'ledgerPerson', label: 'Ledger People'},
  {type: 'video', label: 'Videos'},
  {type: 'podcastEpisode', label: 'Podcast Episodes'},
]

export default function EnrichmentProgressWidget() {
  const client = useClient({apiVersion: '2024-10-23'})
  const [progress, setProgress] = useState<TypeProgress[]>([])

  useEffect(() => {
    const fetchProgress = async () => {
      const results = await Promise.all(
        TRACKED_TYPES.map(async ({type, label}) => {
          const total = await client.fetch<number>(
            `count(*[_type == $type && !(_id in path("drafts.**"))])`,
            {type},
          )
          const incomplete = await client.fetch<number>(
            `count(*[${GROQ_FILTERS[type]}])`,
          )
          const complete = total - incomplete
          return {type, label, total, complete}
        }),
      )
      setProgress(results)
    }
    fetchProgress()
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
          Enrichment Progress
        </Heading>

        <Stack space={3}>
          {progress.map(({type, label, total, complete}) => {
            const pct = total > 0 ? Math.round((complete / total) * 100) : 0
            return (
              <div key={type} style={{...glassCard, padding: 16}}>
                <Stack space={2}>
                  <Flex justify="space-between" align="center">
                    <Text
                      size={1}
                      style={{
                        fontFamily: "'Oswald', sans-serif",
                        textTransform: 'uppercase',
                        letterSpacing: '0.03em',
                        fontWeight: 700,
                      }}
                    >
                      {label}
                    </Text>
                    <Text size={1} muted>
                      {complete}/{total} ({pct}%)
                    </Text>
                  </Flex>
                  <Box
                    style={{
                      background: SURFACE_RAISED,
                      borderRadius: 4,
                      height: 8,
                      overflow: 'hidden',
                    }}
                  >
                    <Box
                      style={{
                        width: `${pct}%`,
                        height: '100%',
                        background: COPPER,
                        borderRadius: 4,
                        transition: 'width 0.4s ease',
                      }}
                    />
                  </Box>
                </Stack>
              </div>
            )
          })}
        </Stack>
      </Stack>
    </div>
  )
}
