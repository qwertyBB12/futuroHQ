import {useFormValue} from 'sanity'
import type {SanityDocument} from 'sanity'
import {Component, type ReactNode} from 'react'
import {Stack, Card, Flex, Text, Box} from '@sanity/ui'
import {COMPLETENESS_CONFIG, checkCompleteness} from '../../lib/completeness'

const COPPER = '#B17E68'

// Error boundary to gracefully handle useFormValue outside FormValueProvider
// (e.g., during initial layout mount before form context is ready)
class BannerBoundary extends Component<{children: ReactNode}, {hasError: boolean}> {
  state = {hasError: false}
  static getDerivedStateFromError() {
    return {hasError: true}
  }
  render() {
    return this.state.hasError ? null : this.props.children
  }
}

function CompletenessBanner() {
  const doc = useFormValue([]) as SanityDocument | null
  const schemaType = doc?._type as string | undefined

  if (!schemaType || !COMPLETENESS_CONFIG[schemaType]) {
    return null
  }

  const {completed, total, missingFields} = checkCompleteness(
    doc as Record<string, unknown>,
    schemaType,
  )
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0
  const isComplete = pct === 100

  return (
    <Card padding={3} tone={isComplete ? 'positive' : 'caution'} border style={{borderRadius: 0}}>
      <Stack space={2}>
        <Flex justify="space-between" align="center">
          <Text size={1}>
            {isComplete ? 'Complete' : `${completed}/${total} fields complete (${pct}%)`}
          </Text>
          {!isComplete && (
            <Text size={1} muted>
              Missing: {missingFields.join(', ')}
            </Text>
          )}
        </Flex>
        {!isComplete && (
          <Box
            style={{
              background: 'rgba(0,0,0,0.2)',
              borderRadius: 4,
              height: 4,
              overflow: 'hidden',
            }}
          >
            <Box
              style={{
                width: `${pct}%`,
                height: '100%',
                background: COPPER,
                borderRadius: 4,
              }}
            />
          </Box>
        )}
      </Stack>
    </Card>
  )
}

export function CompletenessInput(props: any) {
  return (
    <Stack space={0}>
      <BannerBoundary>
        <CompletenessBanner />
      </BannerBoundary>
      {props.renderDefault(props)}
    </Stack>
  )
}
