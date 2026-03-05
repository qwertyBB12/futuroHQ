import {Card, Stack, Heading, Grid, Text, Flex, Box} from '@sanity/ui'
import EcosystemHealthWidget from './EcosystemHealthWidget'
import RecentActivityWidget from './RecentActivityWidget'
import QuickActionsWidget from './QuickActionsWidget'
import EcosystemSitesWidget from './EcosystemSitesWidget'

export default function DashboardLayout() {
  return (
    <Card padding={5} sizing="border" style={{minHeight: '100vh'}}>
      <Stack space={5} style={{maxWidth: 1200, margin: '0 auto'}}>
        {/* Header */}
        <Flex align="center" gap={4}>
          <img
            src="/static/android-chrome-512x512.png"
            alt="BeNeXT"
            width={40}
            height={40}
            style={{objectFit: 'contain', borderRadius: 8}}
          />
          <Stack space={2}>
            <Heading
              size={3}
              style={{
                fontFamily: "'Oswald', sans-serif",
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              BeNeXT Global HQ
            </Heading>
            <Text size={1} muted>
              Ecosystem Command Center
            </Text>
          </Stack>
        </Flex>

        {/* Top row: Quick Actions + Ecosystem Health */}
        <Grid columns={[1, 1, 2]} gap={4}>
          <QuickActionsWidget />
          <EcosystemHealthWidget />
        </Grid>

        {/* Bottom row: Recent Activity + Sites */}
        <Grid columns={[1, 1, 2]} gap={4}>
          <RecentActivityWidget />
          <EcosystemSitesWidget />
        </Grid>
      </Stack>
    </Card>
  )
}
