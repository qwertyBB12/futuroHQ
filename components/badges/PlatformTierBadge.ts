import type {DocumentBadgeComponent} from 'sanity'

const TIER_MAP: Record<string, {label: string; color: 'primary' | 'success' | 'warning' | 'danger'}> = {
  canonical: {label: 'Canonical', color: 'success'},
  personal: {label: 'Personal', color: 'warning'},
  distribution: {label: 'Distribution', color: 'primary'},
  institutional: {label: 'Institutional', color: 'danger'},
}

export const PlatformTierBadge: DocumentBadgeComponent = (props) => {
  const tier = (props.published?.platformTier || props.draft?.platformTier) as string | undefined
  if (!tier) return null

  const config = TIER_MAP[tier]
  if (!config) return null

  return {
    label: config.label,
    title: `Platform Tier: ${config.label}`,
    color: config.color,
  }
}
