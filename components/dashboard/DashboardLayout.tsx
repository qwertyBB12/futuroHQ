import {Stack, Heading, Grid, Text, Flex} from '@sanity/ui'
import EcosystemHealthWidget from './EcosystemHealthWidget'
import RecentActivityWidget from './RecentActivityWidget'
import QuickActionsWidget from './QuickActionsWidget'
import EcosystemSitesWidget from './EcosystemSitesWidget'
import MyDraftsWidget from './MyDraftsWidget'
import PendingTasksWidget from './PendingTasksWidget'

export default function DashboardLayout() {
  return (
    <div
      style={{
        minHeight: '100vh',
        padding: '2.5rem',
        background: 'transparent',
      }}
    >
      <Stack space={5} style={{maxWidth: 1200, margin: '0 auto'}}>
        {/* Header */}
        <Flex align="center" gap={4}>
          <img
            src="/static/android-chrome-512x512.png"
            alt="Autori Mandatum"
            width={44}
            height={44}
            style={{objectFit: 'contain', borderRadius: 12}}
          />
          <Stack space={2}>
            <Heading
              size={3}
              style={{
                fontFamily: "'Oswald', sans-serif",
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              Autori Mandatum
            </Heading>
            <Text size={1} muted style={{letterSpacing: '0.14em', textTransform: 'uppercase', fontSize: 11}}>
              Ecosystem Command Center
            </Text>
          </Stack>
        </Flex>

        {/* Top row — Writer's focus */}
        <Grid columns={[1, 1, 2]} gap={4}>
          <MyDraftsWidget />
          <QuickActionsWidget />
        </Grid>

        {/* Middle row — Activity & Tasks */}
        <Grid columns={[1, 1, 2]} gap={4}>
          <RecentActivityWidget />
          <PendingTasksWidget />
        </Grid>

        {/* Bottom row — Ecosystem overview */}
        <Grid columns={[1, 1, 2]} gap={4}>
          <EcosystemHealthWidget />
          <EcosystemSitesWidget />
        </Grid>
      </Stack>
    </div>
  )
}
