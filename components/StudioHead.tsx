import {Children, isValidElement, cloneElement} from 'react'

const FAVICON_VERSION = process.env.SANITY_STUDIO_FAVICON_VERSION || '2026-03'

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
    return cloneElement(node as any, {...props, content: 'BeNeXT Global HQ'})
  }

  if (node.type === 'meta' && props?.name === 'apple-mobile-web-app-title') {
    return cloneElement(node as any, {...props, content: 'BeNeXT Global HQ'})
  }

  if (node.type === 'meta' && props?.name === 'application-name') {
    return cloneElement(node as any, {...props, content: 'BeNeXT Global HQ'})
  }

  if (props?.children) {
    const prunedChildren = Children.toArray(props.children).map(pruneNode).filter(Boolean)
    if (prunedChildren.length !== Children.count(props.children)) {
      return cloneElement(node, props, prunedChildren)
    }
  }

  return node
}

export default function StudioHead(props: any) {
  const versionQuery = `?v=${FAVICON_VERSION}`
  const defaultNodes = props.renderDefault(props)
  const filteredDefault = Children.toArray(defaultNodes).map(pruneNode).filter(Boolean)

  return (
    <>
      {filteredDefault}
      <title>BeNeXT Global HQ</title>
      {OUR_ICONS.map((icon, index) => (
        <link key={index} {...icon} href={`${icon.href}${versionQuery}`} />
      ))}
      {/* Ecosystem-aligned theme color */}
      <meta name="theme-color" content="#06090F" />
      {/* Preconnect fonts */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
    </>
  )
}
