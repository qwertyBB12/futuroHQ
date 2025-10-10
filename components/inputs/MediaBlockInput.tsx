import {useMemo} from 'react'
import type {ObjectInputProps} from 'sanity'
import {Stack, Card, Text, Box} from '@sanity/ui'

export function MediaBlockInput(props: ObjectInputProps) {
  const {renderDefault, value} = props

  const previewMarkup = useMemo(() => {
    const embed = typeof value?.embedCode === 'string' ? value.embedCode.trim() : ''
    if (embed) {
      return embed
    }
    const platformId = typeof value?.platformId === 'string' ? value.platformId.trim() : ''
    if (value?.assetType === 'audio' && platformId) {
      return `<audio controls src="${platformId}" style="width:100%"></audio>`
    }
    return ''
  }, [value])

  return (
    <Stack space={4}>
      {renderDefault(props)}
      {previewMarkup ? (
        <Card radius={2} shadow={1} padding={3} tone="primary">
          <Text size={1} weight="semibold">
            Preview
          </Text>
          <Box marginTop={3} style={{overflow: 'hidden'}}>
            <div
              style={{width: '100%'}}
              dangerouslySetInnerHTML={{__html: previewMarkup}}
            />
          </Box>
        </Card>
      ) : null}
    </Stack>
  )
}
