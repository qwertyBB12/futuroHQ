import type {CSSProperties} from 'react'

/**
 * BeNeXT Dashboard surfaces — warm parchment cards with copper gradient hint.
 *
 * Names kept (glassPanel / glassCard / glassButton) for import stability,
 * but the treatment is now institutional parchment with a subtle copper
 * gradient inside, hairline copper border, and an inset highlight — matching
 * the warmth of the public benextglobal.com cards.
 */

/** Top-level panel — parchment with a copper inner glow */
export const glassPanel: CSSProperties = {
  background:
    'radial-gradient(ellipse 90% 70% at 100% 0%, rgba(196, 114, 90, 0.08) 0%, transparent 55%), ' +
    'radial-gradient(ellipse 70% 60% at 0% 100%, rgba(177, 126, 104, 0.06) 0%, transparent 50%), ' +
    'linear-gradient(180deg, #FBF6F0 0%, #F5F2ED 100%)',
  border: '1px solid rgba(143, 98, 73, 0.18)',
  borderTopColor: 'rgba(143, 98, 73, 0.22)',
  borderRadius: 12,
  boxShadow:
    '0 1px 0 rgba(255, 255, 255, 0.55) inset, ' +
    '0 6px 22px rgba(22, 41, 49, 0.07), ' +
    '0 1px 3px rgba(22, 41, 49, 0.04)',
}

/** Card inside a panel — slightly cooler cream, soft inner */
export const glassCard: CSSProperties = {
  background:
    'linear-gradient(180deg, #F5F2ED 0%, #F0EBE3 100%)',
  border: '1px solid rgba(143, 98, 73, 0.14)',
  borderRadius: 8,
  boxShadow:
    '0 1px 0 rgba(255, 255, 255, 0.45) inset, ' +
    '0 1px 2px rgba(22, 41, 49, 0.03)',
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
}

/** Clickable card — same surface, hover handled inline by widgets */
export const glassButton: CSSProperties = {
  ...glassCard,
  cursor: 'pointer',
}
