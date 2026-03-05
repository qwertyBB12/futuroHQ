import type {DocumentBadgeComponent} from 'sanity'

const STATUS_MAP: Record<string, {label: string; color: 'primary' | 'success' | 'warning' | 'danger'}> = {
  ephemeral: {label: 'Ephemeral', color: 'warning'},
  archival: {label: 'Archival', color: 'success'},
  'alumni-only': {label: 'Alumni-Only', color: 'danger'},
}

export const ArchivalBadge: DocumentBadgeComponent = (props) => {
  const status = (props.published?.archivalStatus || props.draft?.archivalStatus) as string | undefined
  if (!status) return null

  const config = STATUS_MAP[status]
  if (!config) return null

  return {
    label: config.label,
    title: `Archival Status: ${config.label}`,
    color: config.color,
  }
}
