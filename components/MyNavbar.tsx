import React, {useEffect} from 'react'

function hideWorkspaceBadgeOnce() {
  // Find any SVG <text> node that looks like a two-letter initials badge (e.g., FH)
  const texts = Array.from(document.querySelectorAll('svg text')) as SVGTextElement[]

  for (const t of texts) {
    const content = (t.textContent || '').trim()
    // Adjust this test if your workspace name yields other patterns
    if (content && /^[A-Z]{2}$/.test(content)) {
      // Walk up to find a reasonable container to hide
      let el: HTMLElement | null = t as unknown as HTMLElement
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

export default function MyNavbar(props: any) {
  useEffect(() => {
    // Hide immediately on mount
    hideWorkspaceBadgeOnce()

    // Keep it hidden on subsequent DOM updates
    const mo = new MutationObserver(() => {
      hideWorkspaceBadgeOnce()
    })
    mo.observe(document.body, {subtree: true, childList: true})
    return () => mo.disconnect()
  }, [])

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0 1rem',
      }}
    >
      {/* 🔴 Your custom logo */}
      <img
        src="/android-chrome-512x512.png"
        alt="BeNeXT Logo"
        width={28}
        height={28}
        style={{objectFit: 'contain', borderRadius: 6}}
        decoding="async"
        loading="eager"
      />

      {/* 🪶 Your custom Oswald title */}
      <span
        style={{
          fontFamily: "'Oswald', sans-serif",
          fontWeight: 700,
          fontSize: '1.5rem',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          color: 'var(--card-fg-color, #F2E5D5)',
          whiteSpace: 'nowrap',
        }}
      >
        Autori Mandatum
      </span>

      {/* Default Sanity navbar contents (search, icons, etc.) */}
      {props.renderDefault(props)}
    </div>
  )
}
