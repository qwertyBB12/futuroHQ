import type {SanityDocument} from 'sanity'

export type SeoSuggestion = {
  title?: string
  description?: string
  keywords?: string[]
}

export type SeoRequestPayload = {
  doc: SanityDocument
  fieldPath: string
}

const endpoint = process.env.AI_SEO_GENERATOR_ENDPOINT

export async function fetchSeoSuggestion(payload: SeoRequestPayload): Promise<SeoSuggestion> {
  if (!endpoint) {
    console.warn('[seo-generator] Missing AI_SEO_GENERATOR_ENDPOINT env variable.')
    return {}
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    console.warn('[seo-generator] Request failed', response.statusText)
    return {}
  }

  const data = (await response.json()) as SeoSuggestion | null
  return data ?? {}
}
