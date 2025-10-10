import { Card, Stack, Heading, Text, Box } from '@sanity/ui'
import type { ComponentType } from 'react'

type LivePreviewProps = {
  document?: {
    displayed?: Record<string, unknown> | null
  }
  schemaType?: {
    title?: string
    name?: string
  }
}

const LivePreview: ComponentType<LivePreviewProps> = ({ document, schemaType }) => {
  const data = document?.displayed
  const hasContent = data && Object.keys(data).length > 0

  return (
    <Card padding={4} tone="transparent">
      <Stack space={4}>
        <Heading size={2}>
          {schemaType?.title ? `${schemaType.title} Preview` : 'Live Preview'}
        </Heading>

        {!hasContent && (
          <Text muted>
            Start editing to see a live preview. Saved fields will render here automatically.
          </Text>
        )}

        {hasContent && (
          <>
            {'title' in (data as Record<string, unknown>) && (
              <Heading as="h3" size={3}>
                {(data as { title?: string }).title || 'Untitled'}
              </Heading>
            )}
            {'description' in (data as Record<string, unknown>) &&
              typeof (data as { description?: unknown }).description === 'string' && (
                <Text muted>{(data as { description?: string }).description}</Text>
              )}
            <Box padding={3} radius={2} border>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {JSON.stringify(data, null, 2)}
              </pre>
            </Box>
          </>
        )}
      </Stack>
    </Card>
  )
}

export default LivePreview
