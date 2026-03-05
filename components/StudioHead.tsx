import {Children, isValidElement, cloneElement, useEffect} from 'react'

const FAVICON_VERSION = process.env.SANITY_STUDIO_FAVICON_VERSION || '2026-03c'

const OUR_ICONS = [
  {rel: 'icon', type: 'image/png', sizes: '32x32', href: '/static/favicon-32x32.png'},
  {rel: 'icon', type: 'image/png', sizes: '16x16', href: '/static/favicon-16x16.png'},
  {rel: 'apple-touch-icon', sizes: '180x180', href: '/static/apple-touch-icon.png'},
  {rel: 'shortcut icon', href: '/static/favicon.ico'},
  {rel: 'icon', href: '/static/favicon.ico'},
]

function pruneNode(node: any): any {
  if (!isValidElement(node)) return node

  const props = node.props as Record<string, any>
  const rel = typeof props?.rel === 'string' ? props.rel.toLowerCase() : ''
  if (rel.includes('icon')) return null
  if (node.type === 'title') return null

  if (node.type === 'meta' && props?.property === 'og:site_name') {
    return cloneElement(node as any, {...props, content: 'Autori Mandatum'})
  }

  if (node.type === 'meta' && props?.name === 'apple-mobile-web-app-title') {
    return cloneElement(node as any, {...props, content: 'Autori Mandatum'})
  }

  if (node.type === 'meta' && props?.name === 'application-name') {
    return cloneElement(node as any, {...props, content: 'Autori Mandatum'})
  }

  if (props?.children) {
    const prunedChildren = Children.toArray(props.children).map(pruneNode).filter(Boolean)
    if (prunedChildren.length !== Children.count(props.children)) {
      return cloneElement(node, props, prunedChildren)
    }
  }

  return node
}

/**
 * Aggressively enforce our favicon and presence color.
 * Sanity may inject its own favicons after initial render,
 * and sets inline border-color for presence rings.
 */
function useFaviconEnforcer() {
  useEffect(() => {
    const v = `?v=${FAVICON_VERSION}`

    function enforceFavicon() {
      // Remove any favicon link NOT pointing to our /static/ path
      document.querySelectorAll('link[rel*="icon"]').forEach((el) => {
        const href = el.getAttribute('href') || ''
        if (!href.includes('/static/')) {
          el.remove()
        }
      })

      // Ensure our primary favicon exists
      let found = false
      document.querySelectorAll('link[rel="icon"]').forEach((el) => {
        if ((el.getAttribute('href') || '').includes('/static/favicon.ico')) found = true
      })
      if (!found) {
        const link = document.createElement('link')
        link.rel = 'icon'
        link.href = `/static/favicon.ico${v}`
        document.head.appendChild(link)
      }
    }

    // Run immediately and observe for Sanity's late injections
    enforceFavicon()
    const observer = new MutationObserver(enforceFavicon)
    observer.observe(document.head, {childList: true, subtree: true})

    return () => observer.disconnect()
  }, [])
}

/** Override inline border-color on presence avatar rings */
function usePresenceColorOverride() {
  useEffect(() => {
    const VERMILLION = '#C84841'
    const VERMILLION_RGB = 'rgb(200, 72, 65)'

    // Known Sanity presence colors (neon pink/magenta/blue/green)
    const SANITY_COLORS = new Set([
      '#f03e2f', '#2276fc', '#e9a400', '#43b649', '#7928ca',
      'rgb(240, 62, 47)', 'rgb(34, 118, 252)', 'rgb(233, 164, 0)',
      'rgb(67, 182, 73)', 'rgb(121, 40, 202)',
    ])

    function isSanityPresenceColor(color: string): boolean {
      if (!color || color === 'transparent' || color === '') return false
      if (color === VERMILLION || color === VERMILLION_RGB) return false
      // Match any non-transparent color on avatar-related elements
      return true
    }

    function overridePresenceRings() {
      // Broad selector: Avatar elements, status buttons, and any element
      // Sanity might use for presence indicators
      const selectors = [
        '[data-ui="Avatar"] span',
        '[data-ui="Avatar"] div',
        '[data-ui="Avatar"]',
        '[data-ui="StatusButton"] span',
        '[data-ui="StatusButton"] div',
      ]
      document.querySelectorAll(selectors.join(', ')).forEach((el) => {
        const htmlEl = el as HTMLElement
        const bc = htmlEl.style.borderColor
        if (bc && isSanityPresenceColor(bc)) {
          htmlEl.style.borderColor = VERMILLION
        }
        // Also check outline-color which some Sanity versions use
        const oc = htmlEl.style.outlineColor
        if (oc && isSanityPresenceColor(oc)) {
          htmlEl.style.outlineColor = VERMILLION
        }
        // Check CSS custom property --user-color
        const userColor = htmlEl.style.getPropertyValue('--user-color')
        if (userColor && userColor !== VERMILLION) {
          htmlEl.style.setProperty('--user-color', VERMILLION)
          htmlEl.style.setProperty('--user-color-light', 'rgba(200, 72, 65, 0.4)')
        }
      })

      // Nuclear option: find ANY element with inline --user-color
      document.querySelectorAll('[style*="--user-color"]').forEach((el) => {
        const htmlEl = el as HTMLElement
        htmlEl.style.setProperty('--user-color', VERMILLION)
        htmlEl.style.setProperty('--user-color-light', 'rgba(200, 72, 65, 0.4)')
      })
    }

    overridePresenceRings()
    const observer = new MutationObserver(overridePresenceRings)
    observer.observe(document.body, {
      attributes: true,
      subtree: true,
      attributeFilter: ['style'],
      childList: true,
    })

    return () => observer.disconnect()
  }, [])
}

export default function StudioHead(props: any) {
  const versionQuery = `?v=${FAVICON_VERSION}`
  const defaultNodes = props.renderDefault(props)
  const filteredDefault = Children.toArray(defaultNodes).map(pruneNode).filter(Boolean)

  useFaviconEnforcer()
  usePresenceColorOverride()

  return (
    <>
      {filteredDefault}
      <title>Autori Mandatum</title>
      {OUR_ICONS.map((icon, index) => (
        <link key={index} {...icon} href={`${icon.href}${versionQuery}`} />
      ))}
      <meta name="theme-color" content="#0E0E0E" />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
    </>
  )
}
