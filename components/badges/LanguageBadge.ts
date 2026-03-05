import type {DocumentBadgeComponent} from 'sanity'

export const LanguageBadge: DocumentBadgeComponent = (props) => {
  const lang = (props.published?.language || props.draft?.language) as string | undefined
  if (!lang) return null

  return {
    label: lang.toUpperCase(),
    title: `Language: ${lang === 'en' ? 'English' : lang === 'es' ? 'Spanish' : lang}`,
    color: lang === 'es' ? 'warning' : 'primary',
  }
}
