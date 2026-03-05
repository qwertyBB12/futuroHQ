import {Children, isValidElement, cloneElement, useEffect} from 'react'

const FAVICON_VERSION = process.env.SANITY_STUDIO_FAVICON_VERSION || '2026-03c'

const OUR_ICONS = [
  {rel: 'icon', type: 'image/svg+xml', href: '/static/favicon.svg'},
  {rel: 'icon', type: 'image/png', sizes: '32x32', href: '/static/favicon-32x32.png'},
  {rel: 'icon', type: 'image/png', sizes: '16x16', href: '/static/favicon-16x16.png'},
  {rel: 'apple-touch-icon', sizes: '180x180', href: '/static/apple-touch-icon.png'},
  {rel: 'shortcut icon', href: '/static/favicon.ico'},
  {rel: 'icon', href: '/static/favicon.ico', sizes: 'any'},
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


/**
 * Inject a <style> tag at the END of <head> after styled-components.
 * This ensures our CSS overrides come last in the cascade.
 */
const AVATAR_STYLE_ID = 'am-avatar-override'
function useAvatarColorOverride() {
  useEffect(() => {
    function injectOverride() {
      const existing = document.getElementById(AVATAR_STYLE_ID)
      if (existing) {
        // Move to end of head to stay after styled-components
        document.head.appendChild(existing)
        return
      }
      const style = document.createElement('style')
      style.id = AVATAR_STYLE_ID
      style.textContent = `
        [data-ui="Avatar"] ellipse[class] { stroke: #C84841 !important; }
        [data-ui="Avatar"] svg ellipse { stroke: #C84841 !important; }
      `
      document.head.appendChild(style)
    }

    injectOverride()
    // Re-inject whenever styled-components adds new <style> tags
    const observer = new MutationObserver(injectOverride)
    observer.observe(document.head, {childList: true})
    return () => observer.disconnect()
  }, [])
}

export default function StudioHead(props: any) {
  const versionQuery = `?v=${FAVICON_VERSION}`
  const defaultNodes = props.renderDefault(props)
  const filteredDefault = Children.toArray(defaultNodes).map(pruneNode).filter(Boolean)

  useFaviconEnforcer()
  useAvatarColorOverride()

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
