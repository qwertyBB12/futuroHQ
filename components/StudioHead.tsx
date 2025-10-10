import type {StudioHeadProps} from 'sanity'
import {Children, isValidElement, cloneElement} from 'react'

const FAVICON_VERSION = process.env.SANITY_STUDIO_FAVICON_VERSION || '2025-10-09'

const OUR_ICONS = [
  {rel: 'icon', type: 'image/png', sizes: '32x32', href: '/static/favicon-32x32.png'},
  {rel: 'icon', type: 'image/png', sizes: '16x16', href: '/static/favicon-16x16.png'},
  {rel: 'apple-touch-icon', sizes: '180x180', href: '/static/apple-touch-icon.png'},
  {rel: 'shortcut icon', href: '/static/favicon.ico'},
  {rel: 'icon', href: '/static/favicon.ico'},
]

function pruneNode(node: any): any {
  if (!isValidElement(node)) {
    return node
  }

  const rel = typeof node.props?.rel === 'string' ? node.props.rel.toLowerCase() : ''
  if (rel.includes('icon')) {
    return null
  }

  if (node.type === 'title') {
    return null
  }

  if (node.type === 'meta' && node.props?.property === 'og:site_name') {
    return cloneElement(node, {...node.props, content: 'BeNeXT Global HQ'})
  }

  if (node.type === 'meta' && node.props?.name === 'apple-mobile-web-app-title') {
    return cloneElement(node, {...node.props, content: 'BeNeXT Global HQ'})
  }

  if (
    node.type === 'meta' &&
    node.props?.name === 'application-name'
  ) {
    return cloneElement(node, {...node.props, content: 'BeNeXT Global HQ'})
  }

  if (node.props?.children) {
    const prunedChildren = Children.toArray(node.props.children)
      .map(pruneNode)
      .filter(Boolean)
    if (prunedChildren.length !== Children.count(node.props.children)) {
      return cloneElement(node, node.props, prunedChildren)
    }
  }

  return node
}

export default function StudioHead(props: StudioHeadProps) {
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
      <meta name="theme-color" content="#1B2A41" />
    </>
  )
}
