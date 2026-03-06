import {Stack, Heading, Text, Flex, Box, Grid} from '@sanity/ui'
import {LinkIcon} from '@sanity/icons'
import {glassPanel, glassCard} from './glassStyles'

type Site = {
  name: string
  url: string
  entity: string
  accent: string
  status: 'live' | 'development' | 'planned'
}

const SITES: Site[] = [
  {name: 'hectorhlopez.com', url: 'https://hectorhlopez.com', entity: 'Hector', accent: '#B17E68', status: 'live'},
  {name: 'benextglobal.com', url: 'https://benextglobal.com', entity: 'BeNeXT', accent: '#C84841', status: 'live'},
  {name: 'futuro.ngo', url: 'https://futuro.ngo', entity: 'Futuro', accent: '#C84841', status: 'live'},
  {name: 'next.ngo', url: 'https://next.ngo', entity: 'NeXT', accent: '#B17E68', status: 'live'},
  {name: 'mitikah.com', url: 'https://mitikah.com', entity: 'Mitikah', accent: '#8B8985', status: 'planned'},
  {name: 'medikah.com', url: 'https://medikah.com', entity: 'Medikah', accent: '#2C7A8C', status: 'live'},
  {name: 'arkah.co', url: 'https://arkah.co', entity: 'Arkah', accent: '#1D3FAF', status: 'development'},
]

const STATUS_STYLES: Record<string, {bg: string; text: string}> = {
  live: {bg: '#B17E68', text: '#0E0E0E'},
  development: {bg: '#C84841', text: '#F2E5D5'},
  planned: {bg: '#8B8985', text: '#0E0E0E'},
}

export default function EcosystemSitesWidget() {
  return (
    <div style={{...glassPanel, padding: 24}}>
      <Stack space={4}>
        <Heading size={1} style={{fontFamily: "'Oswald', sans-serif", textTransform: 'uppercase', letterSpacing: '0.05em'}}>
          Ecosystem Sites
        </Heading>

        <Grid columns={[1, 2]} gap={3}>
          {SITES.map((site) => {
            const statusStyle = STATUS_STYLES[site.status]
            return (
              <div key={site.name} style={{...glassCard, padding: 14}}>
                <Stack space={2}>
                  <Flex align="center" gap={2}>
                    <Box
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        backgroundColor: site.accent,
                        flexShrink: 0,
                      }}
                    />
                    <Text size={1} weight="semibold" style={{fontFamily: "'Oswald', sans-serif", textTransform: 'uppercase'}}>
                      {site.entity}
                    </Text>
                  </Flex>
                  <Flex align="center" gap={2}>
                    <Text size={0}>
                      <LinkIcon />
                    </Text>
                    <Text size={0} muted>
                      {site.name}
                    </Text>
                  </Flex>
                  <Box>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '3px 10px',
                        borderRadius: 20,
                        fontSize: 10,
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        backgroundColor: statusStyle.bg,
                        color: statusStyle.text,
                      }}
                    >
                      {site.status}
                    </span>
                  </Box>
                </Stack>
              </div>
            )
          })}
        </Grid>
      </Stack>
    </div>
  )
}
