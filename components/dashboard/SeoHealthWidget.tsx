import {useEffect, useState} from 'react'
import {useClient} from 'sanity'
import {Stack, Heading, Text, Flex, Box} from '@sanity/ui'
import {glassPanel, glassCard} from './glassStyles'

type TypeSeoStatus = {
  type: string
  label: string
  withSeo: number
  total: number
  withTags: number
}

const SEO_TYPES = [
  {type: 'essay', label: 'Essays'},
  {type: 'video', label: 'Videos'},
  {type: 'podcastEpisode', label: 'Episodes'},
  {type: 'opEd', label: 'Op-Eds'},
  {type: 'news', label: 'News'},
  {type: 'keynote', label: 'Keynotes'},
  {type: 'project', label: 'Projects'},
  {type: 'collaborator', label: 'Collaborators'},
  {type: 'futuroSummit', label: 'Summits'},
]

const COPPER = '#B17E68'
const VERMILLION = '#C84841'

function getBarColor(pct: number): string {
  if (pct >= 100) return COPPER
  if (pct >= 75) return '#D4A574'
  if (pct >= 50) return '#E8D5C0'
  return VERMILLION
}

export default function SeoHealthWidget() {
  const client = useClient({apiVersion: '2024-10-23'})
  const [statuses, setStatuses] = useState<TypeSeoStatus[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAll = async () => {
      const results = await Promise.all(
        SEO_TYPES.map(async ({type, label}) => {
          const [withSeo, total, withTags] = await Promise.all([
            client.fetch<number>(`count(*[_type == $type && defined(seo)])`, {type}),
            client.fetch<number>(`count(*[_type == $type])`, {type}),
            client.fetch<number>(`count(*[_type == $type && defined(tags) && count(tags) > 0])`, {type}),
          ])
          return {type, label, withSeo, total, withTags}
        }),
      )
      setStatuses(results)
      setLoading(false)
    }
    fetchAll()
  }, [client])

  const totalWithSeo = statuses.reduce((s, r) => s + r.withSeo, 0)
  const totalDocs = statuses.reduce((s, r) => s + r.total, 0)
  const totalWithTags = statuses.reduce((s, r) => s + r.withTags, 0)
  const overallPct = totalDocs > 0 ? Math.round((totalWithSeo / totalDocs) * 100) : 0
  const tagPct = totalDocs > 0 ? Math.round((totalWithTags / totalDocs) * 100) : 0

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
          SEO Health
        </Heading>

        {loading ? (
          <Text size={1} muted>
            Scanning content lake…
          </Text>
        ) : (
          <>
            {/* Score cards */}
            <Flex gap={4}>
              <div style={{...glassCard, padding: 16, flex: 1}}>
                <Stack space={2} style={{textAlign: 'center'}}>
                  <span
                    style={{
                      fontSize: 36,
                      fontWeight: 700,
                      fontFamily: "'Oswald', sans-serif",
                      color: overallPct >= 90 ? COPPER : VERMILLION,
                    }}
                  >
                    {overallPct}%
                  </span>
                  <Text size={0} muted>
                    SEO Coverage
                  </Text>
                  <Text size={0} muted>
                    {totalWithSeo}/{totalDocs}
                  </Text>
                </Stack>
              </div>
              <div style={{...glassCard, padding: 16, flex: 1}}>
                <Stack space={2} style={{textAlign: 'center'}}>
                  <span
                    style={{
                      fontSize: 36,
                      fontWeight: 700,
                      fontFamily: "'Oswald', sans-serif",
                      color: tagPct >= 75 ? COPPER : '#E8D5C0',
                    }}
                  >
                    {tagPct}%
                  </span>
                  <Text size={0} muted>
                    Tag Coverage
                  </Text>
                  <Text size={0} muted>
                    {totalWithTags}/{totalDocs}
                  </Text>
                </Stack>
              </div>
            </Flex>

            {/* Per-type breakdown */}
            <Stack space={2}>
              {statuses
                .filter((s) => s.total > 0)
                .map((s) => {
                  const pct = Math.round((s.withSeo / s.total) * 100)
                  return (
                    <Flex key={s.type} align="center" gap={3}>
                      <Text
                        size={0}
                        style={{
                          width: 90,
                          fontFamily: "'Oswald', sans-serif",
                          textTransform: 'uppercase',
                          letterSpacing: '0.03em',
                          color: '#8B8985',
                          flexShrink: 0,
                        }}
                      >
                        {s.label}
                      </Text>
                      <Box style={{flex: 1, position: 'relative', height: 14}}>
                        <Box
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: '#1A1714',
                            borderRadius: 7,
                          }}
                        />
                        <Box
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            bottom: 0,
                            width: `${pct}%`,
                            backgroundColor: getBarColor(pct),
                            borderRadius: 7,
                            transition: 'width 0.6s ease',
                          }}
                        />
                      </Box>
                      <Text
                        size={0}
                        style={{
                          width: 48,
                          textAlign: 'right',
                          fontFamily: "'JetBrains Mono', monospace",
                          color: pct === 100 ? COPPER : '#8B8985',
                          flexShrink: 0,
                        }}
                      >
                        {s.withSeo}/{s.total}
                      </Text>
                    </Flex>
                  )
                })}
            </Stack>
          </>
        )}
      </Stack>
    </div>
  )
}
