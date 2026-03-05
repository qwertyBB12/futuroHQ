import type {CSSProperties} from 'react'

/** Liquid glass panel — visible specular edges, warm inner glow */
export const glassPanel: CSSProperties = {
  background:
    'linear-gradient(180deg, rgba(242, 229, 213, 0.03) 0%, transparent 40%), ' +
    'rgba(22, 19, 16, 0.65)',
  backdropFilter: 'blur(40px) saturate(1.6) brightness(1.05)',
  WebkitBackdropFilter: 'blur(40px) saturate(1.6) brightness(1.05)',
  border: '1px solid rgba(242, 229, 213, 0.10)',
  borderTopColor: 'rgba(242, 229, 213, 0.18)',
  borderLeftColor: 'rgba(242, 229, 213, 0.13)',
  borderBottomColor: 'rgba(0, 0, 0, 0.15)',
  borderRightColor: 'rgba(0, 0, 0, 0.10)',
  borderRadius: 24,
  boxShadow:
    '0 1px 0 rgba(242, 229, 213, 0.06) inset, ' +
    '0 12px 48px rgba(0, 0, 0, 0.30), ' +
    '0 0 0 0.5px rgba(242, 229, 213, 0.04)',
}

/** Smaller glass card inside a glass panel */
export const glassCard: CSSProperties = {
  background:
    'linear-gradient(180deg, rgba(242, 229, 213, 0.02) 0%, transparent 50%), ' +
    'rgba(26, 23, 20, 0.45)',
  backdropFilter: 'blur(20px) saturate(1.3)',
  WebkitBackdropFilter: 'blur(20px) saturate(1.3)',
  border: '1px solid rgba(242, 229, 213, 0.08)',
  borderTopColor: 'rgba(242, 229, 213, 0.14)',
  borderLeftColor: 'rgba(242, 229, 213, 0.10)',
  borderBottomColor: 'rgba(0, 0, 0, 0.12)',
  borderRightColor: 'rgba(0, 0, 0, 0.08)',
  borderRadius: 16,
  boxShadow:
    '0 1px 0 rgba(242, 229, 213, 0.04) inset, ' +
    '0 4px 20px rgba(0, 0, 0, 0.20)',
  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
}

/** Glass button card (clickable) */
export const glassButton: CSSProperties = {
  ...glassCard,
  cursor: 'pointer',
}
