import {useState} from 'react'
import type {ObjectInputProps} from 'sanity'
import {set} from 'sanity'
import {Button, Card, Flex, Spinner, Stack, Text} from '@sanity/ui'
import {useFormValue} from 'sanity'
import type {SanityDocument} from 'sanity'
import {fetchSeoSuggestion} from '../utils/fetchSeoSuggestion'
import type {SeoSuggestion} from '../utils/fetchSeoSuggestion'

export function SeoGeneratorInput(props: ObjectInputProps) {
  const {renderDefault, value, onChange, path} = props
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const doc = useFormValue([]) as SanityDocument | null

  const hasEndpoint = Boolean(process.env.AI_SEO_GENERATOR_ENDPOINT)

  const handleApply = (suggestion: SeoSuggestion) => {
    const nextValue: Record<string, unknown> = {
      ...((value as Record<string, unknown> | undefined) ?? {}),
    }

    if (suggestion.title) {
      nextValue.titleTag = suggestion.title
    }
    if (suggestion.description) {
      nextValue.metaDescription = suggestion.description
    }
    if (Array.isArray(suggestion.keywords) && suggestion.keywords.length) {
      nextValue.keywords = suggestion.keywords
    }

    onChange(set(nextValue))
  }

  const onGenerate = async () => {
    if (!doc) return
    setIsLoading(true)
    setError(null)
    try {
      const suggestion = await fetchSeoSuggestion({
        doc,
        fieldPath: path.join('.'),
      })
      if (!suggestion.title && !suggestion.description && !suggestion.keywords) {
        setError('No suggestion returned. Check your automation endpoint logs.')
        return
      }
      handleApply(suggestion)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error generating SEO')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Stack space={3}>
      {renderDefault(props)}
      <Card tone={hasEndpoint ? 'primary' : 'critical'} border>
        <Flex align="center" justify="space-between" padding={3} gap={3}>
          <Text size={1}>
            {hasEndpoint
              ? 'Generate SEO metadata with your automation endpoint.'
              : 'Set AI_SEO_GENERATOR_ENDPOINT in .env.local to enable one-click SEO.'}
          </Text>
          <Flex align="center" gap={3}>
            {isLoading ? <Spinner /> : null}
            <Button
              fontSize={1}
              disabled={!hasEndpoint || isLoading}
              text="Generate"
              onClick={onGenerate}
              tone="primary"
            />
          </Flex>
        </Flex>
        {error ? (
          <Card tone="critical" padding={3}>
            <Text size={1}>{error}</Text>
          </Card>
        ) : null}
      </Card>
    </Stack>
  )
}
