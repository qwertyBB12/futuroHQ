// components/MyNavbar.tsx
import {useEffect, useMemo, useState} from 'react'

import {
  applyPalette,
  defaultPaletteName,
  isValidPalette,
  paletteOptions,
  paletteStorageKey,
  type PaletteName,
} from '../palettes'

const NAVBAR_SELECTOR = '[data-ui="Navbar"]'

const RUN_ONCE_ATTRIBUTE = 'data-branding-applied'

function hideWorkspaceBadgeOnce() {
  // Find any SVG <text> node that looks like two-letter initials (e.g., FH)
  const texts = Array.from(document.querySelectorAll('svg text')) as SVGTextElement[]
  for (const t of texts) {
    const content = (t.textContent || '').trim()
    if (content && /^[A-Z]{2}$/.test(content)) {
      // Walk up to a reasonable container (button/badge) and hide it
      let el: HTMLElement | null = (t as unknown) as HTMLElement
      for (let i = 0; i < 8 && el; i++) {
        if (
          el.matches?.(
            [
              'button',
              '[role="button"]',
              '[data-testid*="workspace"]',
              '[data-testid*="badge"]',
              '[data-ui="Badge"]',
            ].join(',')
          )
        ) {
          el.style.display = 'none'
          return true
        }
        el = el.parentElement
      }
      // Fallback: hide the immediate SVG parent group/button-ish container
      const fallback = (t.closest('button,[role="button"]') ||
        t.parentElement?.parentElement ||
        t.parentElement) as HTMLElement | null
      if (fallback) {
        fallback.style.display = 'none'
        return true
      }
    }
  }
  return false
}

function styleWorkspaceName() {
  const navbar = document.querySelector(NAVBAR_SELECTOR) as HTMLElement | null
  if (!navbar) return

  const target =
    (navbar.querySelector('[data-testid="workspace-name"]') as HTMLElement | null) ||
    (Array.from(navbar.querySelectorAll('button,[role="button"]'))
      .map((b) => b.querySelector('span'))
      .find(Boolean) as HTMLElement | null)

  if (target && !target.hasAttribute(RUN_ONCE_ATTRIBUTE)) {
    Object.assign(target.style, {
      fontFamily: "'Oswald', sans-serif",
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      color: 'var(--main-navigation-color--inverted, #ffffff)',
    } as CSSStyleDeclaration)
    target.setAttribute(RUN_ONCE_ATTRIBUTE, 'true')
  }
}

export default function MyNavbar(props: any) {
  const [palette, setPalette] = useState<PaletteName>(defaultPaletteName)

  useEffect(() => {
    const applyBranding = () => {
      hideWorkspaceBadgeOnce()
      styleWorkspaceName()
    }

    const scheduleBranding = (() => {
      let rafHandle = 0
      return () => {
        if (rafHandle) return
        rafHandle = window.requestAnimationFrame(() => {
          rafHandle = 0
          applyBranding()
        })
      }
    })()

    const mutationTouchesNavbar = (records: MutationRecord[]) => {
      const touchesNode = (node: Node) => {
        if (!(node instanceof HTMLElement)) return false
        return Boolean(
          node.matches(NAVBAR_SELECTOR) ||
            node.closest(NAVBAR_SELECTOR) ||
            node.querySelector(NAVBAR_SELECTOR)
        )
      }

      for (const record of records) {
        if (record.type !== 'childList') continue

        if (record.target instanceof HTMLElement && record.target.closest(NAVBAR_SELECTOR)) {
          return true
        }

        for (const added of Array.from(record.addedNodes)) {
          if (touchesNode(added)) return true
        }
      }

      return false
    }

    applyBranding()

    const mo = new MutationObserver((records) => {
      if (mutationTouchesNavbar(records)) {
        scheduleBranding()
      }
    })

    mo.observe(document.body, {subtree: true, childList: true})

    return () => {
      mo.disconnect()
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = window.localStorage.getItem(paletteStorageKey)
    const initial = isValidPalette(stored) ? stored : defaultPaletteName
    setPalette(initial)
    applyPalette(initial)
  }, [])

  const options = useMemo(() => paletteOptions, [])
  const hasMultiplePalettes = options.length > 1

  const onPaletteChange = (value: PaletteName) => {
    setPalette(value)
    applyPalette(value)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(paletteStorageKey, value)
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0 1rem',
        flexWrap: 'wrap',
      }}
    >
      {/* Brand logo (served from /static) */}
      <img
        src="/android-chrome-512x512.png"
        alt="BeNeXT Logo"
        width={28}
        height={28}
        style={{objectFit: 'contain', borderRadius: 6}}
        decoding="async"
        loading="eager"
      />

      {/* Oswald title */}
      <span
        style={{
          fontFamily: "'Oswald', sans-serif",
          fontWeight: 700,
          fontSize: '1.5rem',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          color: 'var(--main-navigation-color--inverted, #F2E5D5)',
          whiteSpace: 'nowrap',
        }}
      >
        Autori Mandatum
      </span>

      <div
        style={{
          marginLeft: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          flexWrap: 'wrap',
        }}
      >
        {hasMultiplePalettes && (
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--main-navigation-color--inverted, #F2E5D5)',
              fontWeight: 600,
            }}
          >
            Theme
            <select
              value={palette}
              onChange={(event) => onPaletteChange(event.target.value as PaletteName)}
              style={{
                appearance: 'none',
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                padding: '0.35rem 1.75rem 0.35rem 0.75rem',
                borderRadius: '0.75rem',
                border: '1px solid rgba(255,255,255,0.25)',
                backgroundColor: 'rgba(0,0,0,0.25)',
                color: 'var(--main-navigation-color--inverted, #F2E5D5)',
                fontSize: '0.75rem',
                fontFamily: "'Oswald', sans-serif",
                fontWeight: 600,
                letterSpacing: '0.05em',
                position: 'relative',
              }}
            >
              {options.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                  style={{color: '#0B1220', fontFamily: "'Oswald', sans-serif"}}
                >
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        )}

        {/* Keep the default Sanity navbar (search, +, Drafts, icons) */}
        {props.renderDefault(props)}
      </div>
    </div>
  )
}
