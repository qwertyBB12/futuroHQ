import type {StudioHeadProps} from 'sanity'
import {cloneElement, Fragment} from 'react'

const FAVICON_VERSION = process.env.SANITY_STUDIO_FAVICON_VERSION || '2025-10-09'

const OUR_ICONS = [
  {rel: 'icon', type: 'image/png', sizes: '32x32', href: '/static/favicon-32x32.png'},
  {rel: 'icon', type: 'image/png', sizes: '16x16', href: '/static/favicon-16x16.png'},
  {rel: 'apple-touch-icon', sizes: '180x180', href: '/static/apple-touch-icon.png'},
  {rel: 'icon', href: '/static/favicon.ico'},
]

export default function StudioHead(props: StudioHeadProps) {
  const versionQuery = `?v=${FAVICON_VERSION}`
  const defaultNodes = props.renderDefault(props)

  const filteredDefault = Array.isArray(defaultNodes)
    ? defaultNodes.filter(
        node =>
          !(
            node?.props?.rel &&
            typeof node.props.rel === 'string' &&
            node.props.rel.toLowerCase().includes('icon')
          ),
      )
    : defaultNodes

  return (
    <>
      {filteredDefault}
      {OUR_ICONS.map((icon, index) => (
        <link key={index} {...icon} href={`${icon.href}${versionQuery}`} />
      ))}
      <meta name="theme-color" content="#1B2A41" />
    </>
  )
}
