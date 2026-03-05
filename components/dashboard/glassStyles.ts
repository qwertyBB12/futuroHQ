import type {CSSProperties} from 'react'

/** Liquid glass panel — translucent with specular edges and blur */
export const glassPanel: CSSProperties = {
  background: 'rgba(26, 23, 20, 0.35)',
  backdropFilter: 'blur(40px) saturate(1.6) brightness(1.05)',
  WebkitBackdropFilter: 'blur(40px) saturate(1.6) brightness(1.05)',
  border: '1px solid rgba(242, 229, 213, 0.07)',
  borderTopColor: 'rgba(242, 229, 213, 0.13)',
  borderLeftColor: 'rgba(242, 229, 213, 0.1)',
  borderBottomColor: 'rgba(0, 0, 0, 0.12)',
  borderRightColor: 'rgba(0, 0, 0, 0.08)',
  borderRadius: 24,
  boxShadow:
    '0 1px 0 rgba(242, 229, 213, 0.04) inset, ' +
    '0 12px 48px rgba(0, 0, 0, 0.25), ' +
    '0 0 0 0.5px rgba(200, 72, 65, 0.06)',
}

/** Smaller glass card inside a glass panel */
export const glassCard: CSSProperties = {
  background: 'rgba(26, 23, 20, 0.3)',
  backdropFilter: 'blur(20px) saturate(1.3)',
  WebkitBackdropFilter: 'blur(20px) saturate(1.3)',
  border: '1px solid rgba(242, 229, 213, 0.06)',
  borderTopColor: 'rgba(242, 229, 213, 0.1)',
  borderLeftColor: 'rgba(242, 229, 213, 0.08)',
  borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  borderRightColor: 'rgba(0, 0, 0, 0.06)',
  borderRadius: 16,
  boxShadow:
    '0 1px 0 rgba(242, 229, 213, 0.03) inset, ' +
    '0 4px 20px rgba(0, 0, 0, 0.15)',
  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
}

/** Glass button card (clickable) */
export const glassButton: CSSProperties = {
  ...glassCard,
  cursor: 'pointer',
}
