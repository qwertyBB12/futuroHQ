import {Stack, Heading, Grid, Text, Flex} from '@sanity/ui'
import {
  ComposeIcon,
  PlayIcon,
  ProjectsIcon,
  UsersIcon,
  MicrophoneIcon,
  TagIcon,
} from '@sanity/icons'
import {useRouter} from 'sanity/router'
import type {ComponentType} from 'react'
import {glassPanel, glassButton} from './glassStyles'

type QuickAction = {
  label: string
  type: string
  icon: ComponentType
  color: string
}

const ACTIONS: QuickAction[] = [
  {label: 'New Essay', type: 'essay', icon: ComposeIcon, color: '#B17E68'},
  {label: 'New Video', type: 'video', icon: PlayIcon, color: '#C84841'},
  {label: 'New Project', type: 'project', icon: ProjectsIcon, color: '#B17E68'},
  {label: 'New Person', type: 'person', icon: UsersIcon, color: '#8B8985'},
  {label: 'New Episode', type: 'podcastEpisode', icon: MicrophoneIcon, color: '#C84841'},
  {label: 'New Tag', type: 'tag', icon: TagIcon, color: '#8B8985'},
]

export default function QuickActionsWidget() {
  const router = useRouter()

  return (
    <div style={{...glassPanel, padding: 24}}>
      <Stack space={4}>
        <Heading size={1} style={{fontFamily: "'Oswald', sans-serif", textTransform: 'uppercase', letterSpacing: '0.05em'}}>
          Quick Actions
        </Heading>

        <Grid columns={[2, 3]} gap={3}>
          {ACTIONS.map((action) => (
            <div
              key={action.type}
              style={glassButton}
              onClick={() => router.navigateIntent('create', {type: action.type})}
            >
              <Flex align="center" gap={2} style={{padding: 12}}>
                <Text style={{color: action.color}}>
                  <action.icon />
                </Text>
                <Text size={1} weight="semibold">
                  {action.label}
                </Text>
              </Flex>
            </div>
          ))}
        </Grid>
      </Stack>
    </div>
  )
}
