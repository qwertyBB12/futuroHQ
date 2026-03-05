import type {DocumentBadgeComponent} from 'sanity'

/**
 * Vessel color mapping — aligned with @hector-ecosystem/design-system vesselTokens
 */
const VESSEL_COLORS: Record<string, {color: 'primary' | 'success' | 'warning' | 'danger'; label: string}> = {
  hector: {color: 'warning', label: 'HHL'},
  benext: {color: 'primary', label: 'BeNeXT'},
  futuro: {color: 'primary', label: 'Futuro'},
  next: {color: 'success', label: 'NeXT'},
  mitikah: {color: 'warning', label: 'Mitikah'},
  medikah: {color: 'success', label: 'Medikah'},
}

export const EntityBadge: DocumentBadgeComponent = (props) => {
  const owner = (props.published?.narrativeOwner || props.draft?.narrativeOwner) as string | undefined
  if (!owner) return null

  const config = VESSEL_COLORS[owner]
  if (!config) return null

  return {
    label: config.label,
    title: `Narrative Owner: ${config.label}`,
    color: config.color,
  }
}
