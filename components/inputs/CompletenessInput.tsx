import {useFormValue} from 'sanity'
import type {SanityDocument} from 'sanity'
import {Stack, Card, Flex, Text, Box} from '@sanity/ui'
import {COMPLETENESS_CONFIG, checkCompleteness} from '../../lib/completeness'

const COPPER = '#B17E68'

export function CompletenessInput(props: any) {
  const doc = useFormValue([]) as SanityDocument | null
  const schemaType = doc?._type as string | undefined

  // Guard: skip banner for non-tracked types
  if (!schemaType || !COMPLETENESS_CONFIG[schemaType]) {
    return props.renderDefault(props)
  }

  const {completed, total, missingFields} = checkCompleteness(
    doc as Record<string, unknown>,
    schemaType,
  )
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0
  const isComplete = pct === 100

  return (
    <Stack space={0}>
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
      {props.renderDefault(props)}
    </Stack>
  )
}
