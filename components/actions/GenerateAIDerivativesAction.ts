import {useState} from 'react'
import type {DocumentActionComponent} from 'sanity'
import {SparklesIcon} from '@sanity/icons'

/**
 * Auto-generate AI derivatives (summary, quotes, captions) for content documents.
 * Uses the AI SEO generator endpoint or can be extended for any AI provider.
 */
export const GenerateAIDerivativesAction: DocumentActionComponent = (props) => {
  const [generating, setGenerating] = useState(false)
  const {patch, publish} = props

  const doc = props.draft || props.published
  if (!doc) return null

  // Only show on content types that have ai_derivatives
  const hasBody = 'body' in doc || 'description' in doc || 'excerpt' in doc
  if (!hasBody) return null

  const endpoint =
    typeof process !== 'undefined'
      ? process.env.SANITY_STUDIO_AI_ENDPOINT
      : undefined

  return {
    label: generating ? 'Generating…' : 'Generate AI Derivatives',
    icon: SparklesIcon,
    disabled: generating || !endpoint,
    title: endpoint
      ? 'Generate summary, quotes, and captions using AI'
      : 'Set SANITY_STUDIO_AI_ENDPOINT to enable',
    onHandle: async () => {
      if (!endpoint) return

      setGenerating(true)
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            documentId: props.id,
            documentType: props.type,
            title: doc.title,
            body: doc.body,
            description: doc.description,
            excerpt: doc.excerpt,
          }),
        })

        if (res.ok) {
          const data = await res.json()
          patch.execute([
            {
              set: {
                ai_derivatives: {
                  summary: data.summary || '',
                  quotes: data.quotes || [],
                  captions: data.captions || [],
                },
              },
            },
          ])
        }
      } catch {
        // Fail silently — user can retry
      } finally {
        setGenerating(false)
      }
    },
  }
}
