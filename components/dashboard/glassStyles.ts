import type {CSSProperties} from 'react'

/**
 * BeNeXT Dashboard surfaces — parchment cards on cream ground.
 *
 * Names kept (glassPanel / glassCard / glassButton) for import stability,
 * but the treatment is no longer liquid glass — it's institutional parchment
 * with a hairline copper border, matching benextglobal.com cards.
 */

/** Top-level panel — parchment with subtle elevation */
export const glassPanel: CSSProperties = {
  background: '#FBF6F0',
  border: '1px solid rgba(143, 98, 73, 0.18)',
  borderRadius: 12,
  boxShadow:
    '0 1px 0 rgba(255, 255, 255, 0.5) inset, ' +
    '0 4px 18px rgba(22, 41, 49, 0.06), ' +
    '0 1px 3px rgba(22, 41, 49, 0.04)',
}

/** Card inside a panel — slightly recessed cream */
export const glassCard: CSSProperties = {
  background: '#F5F2ED',
  border: '1px solid rgba(143, 98, 73, 0.14)',
  borderRadius: 8,
  boxShadow: '0 1px 0 rgba(255, 255, 255, 0.4) inset',
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
}

/** Clickable card — same surface, with copper hover */
export const glassButton: CSSProperties = {
  ...glassCard,
  cursor: 'pointer',
}
