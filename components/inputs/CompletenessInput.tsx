/**
 * CompletenessInput — global document layout that prepends a completeness
 * banner above the standard form.
 *
 * Why useEditState and not useFormValue:
 *
 *   Sanity renders `unstable_layout` components in MORE contexts than just the
 *   live edit form: diff views, history comparisons, conflict resolution
 *   dialogs, and a few transient layout passes during navigation. In those
 *   contexts there is no FormValueProvider — and `useFormValue` throws by
 *   contract when it can't find one. The throw is caught by an error boundary
 *   at render time, but React still reports it to `window.onerror`, which
 *   Sanity Studio's error reporter turns into a visible "Uncaught error"
 *   toast in the lower-right.
 *
 *   `useEditState(documentId, schemaType)` reads from the document store
 *   directly. It does NOT require a form provider, so it works in every
 *   context where Sanity renders a doc. We get the same data (draft +
 *   published values) without ever triggering the throw.
 *
 * The previous error-boundary band-aid is removed because there is nothing
 * left to throw. The banner returns null when the doc isn't loaded yet or
 * the type isn't tracked, which is the correct fail-soft behavior.
 */

import {useEditState} from 'sanity'
import {Stack, Card, Flex, Text, Box} from '@sanity/ui'
import {COMPLETENESS_CONFIG, checkCompleteness} from '../../lib/completeness'

const COPPER = '#B17E68'

interface CompletenessInputProps {
  documentId: string
  schemaType: {name: string} | string
  renderDefault: (props: unknown) => React.ReactNode
}

function CompletenessBanner({documentId, schemaType}: {documentId: string; schemaType: string}) {
  // useEditState works in EVERY render context (form view, diff view, history,
  // conflict resolution). It pulls from the document store, not the form ctx.
  const editState = useEditState(documentId, schemaType)
  const doc = (editState.draft || editState.published) as Record<string, unknown> | null

  if (!doc || !COMPLETENESS_CONFIG[schemaType]) {
    return null
  }

  const {completed, total, missingFields} = checkCompleteness(doc, schemaType)
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

export function CompletenessInput(props: CompletenessInputProps) {
  // schemaType arrives as either a string or an object {name} depending on
  // the call site. Normalize to a string.
  const typeName =
    typeof props.schemaType === 'string' ? props.schemaType : props.schemaType?.name

  return (
    <Stack space={0}>
      {props.documentId && typeName && (
        <CompletenessBanner documentId={props.documentId} schemaType={typeName} />
      )}
      {props.renderDefault(props)}
    </Stack>
  )
}
