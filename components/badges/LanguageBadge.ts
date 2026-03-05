import type {DocumentBadgeComponent} from 'sanity'

export const LanguageBadge: DocumentBadgeComponent = (props) => {
  const raw = props.published?.language || props.draft?.language
  if (!raw) return null

  // video uses language as array, others as string
  const lang = Array.isArray(raw) ? raw[0] : raw
  if (typeof lang !== 'string') return null

  return {
    label: lang.toUpperCase(),
    title: `Language: ${lang === 'en' ? 'English' : lang === 'es' ? 'Spanish' : lang}`,
    color: lang === 'es' ? 'warning' : 'primary',
  }
}
