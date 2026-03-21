import { useState } from 'react'
import type { ArrayOfObjectsInputProps } from 'sanity'
import { Card, Stack, Flex, Text, Box } from '@sanity/ui'

interface Segment {
  _key?: string
  speaker?: string
  start?: number
  end?: number
  text?: string
}

/**
 * Custom read-only renderer for speaker-diarized transcript segments.
 * Displays segments as a collapsible list with speaker label and time range.
 * This is a full custom renderer — does NOT call renderDefault.
 *
 * Colors: Copper #B17E68 (speaker label), Archival Slate #8B8985 (time muted)
 */
export function TranscriptSegmentsInput(props: ArrayOfObjectsInputProps) {
  const value = props.value as Segment[] | undefined
  const segments = value ?? []
  const [expandedAll, setExpandedAll] = useState(false)
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({})

  if (segments.length === 0) {
    return (
      <Card padding={4} radius={2} tone="transparent" border>
        <Text size={1} muted>
          No transcript segments — run pipeline to populate
        </Text>
      </Card>
    )
  }

  const toggleAll = () => {
    const next = !expandedAll
    setExpandedAll(next)
    const newState: Record<number, boolean> = {}
    segments.forEach((_, i) => { newState[i] = next })
    setExpandedItems(newState)
  }

  const toggleItem = (index: number) => {
    setExpandedItems((prev) => ({ ...prev, [index]: !prev[index] }))
  }

  return (
    <Stack space={2}>
      {/* Header bar */}
      <Flex align="center" justify="space-between" paddingBottom={2}>
        <Text size={1} weight="semibold" style={{ color: '#8B8985' }}>
          Speaker Segments ({segments.length})
        </Text>
        <button
          type="button"
          onClick={toggleAll}
          style={{
            background: 'none',
            border: '1px solid #2A2520',
            borderRadius: '4px',
            color: '#8B8985',
            cursor: 'pointer',
            fontSize: '12px',
            padding: '4px 8px',
          }}
        >
          {expandedAll ? 'Collapse All' : 'Expand All'}
        </button>
      </Flex>

      {/* Segment list */}
      <Card border radius={2} tone="transparent" style={{ overflow: 'hidden' }}>
        {segments.map((segment, index) => {
          const isExpanded = expandedItems[index] ?? false
          const isLast = index === segments.length - 1

          return (
            <Box
              key={segment._key ?? index}
              style={{ borderBottom: isLast ? 'none' : '1px solid #2A2520' }}
            >
              {/* Segment header (always visible) */}
              <button
                type="button"
                onClick={() => toggleItem(index)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'block',
                  padding: '10px 12px',
                  textAlign: 'left',
                  width: '100%',
                }}
              >
                <Flex align="center" gap={3}>
                  <Text
                    size={1}
                    weight="semibold"
                    style={{ color: '#B17E68', minWidth: '100px' }}
                  >
                    {segment.speaker ?? 'UNKNOWN'}
                  </Text>
                  <Text size={1} style={{ color: '#8B8985' }}>
                    {(segment.start ?? 0).toFixed(1)}s – {(segment.end ?? 0).toFixed(1)}s
                  </Text>
                  <Text size={0} style={{ color: '#8B8985', marginLeft: 'auto' }}>
                    {isExpanded ? '▲' : '▼'}
                  </Text>
                </Flex>
              </button>

              {/* Segment text (collapsible) */}
              {isExpanded && (
                <Box padding={3} paddingTop={0}>
                  <Text size={1} style={{ color: '#F2E5D5', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                    {segment.text ?? ''}
                  </Text>
                </Box>
              )}
            </Box>
          )
        })}
      </Card>
    </Stack>
  )
}
