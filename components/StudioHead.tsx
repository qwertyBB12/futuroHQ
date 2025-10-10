import type {StudioHeadProps} from 'sanity'

const FAVICON_VERSION = process.env.SANITY_STUDIO_FAVICON_VERSION || '2025-10-09'

export default function StudioHead(props: StudioHeadProps) {
  const versionQuery = `?v=${FAVICON_VERSION}`
  return (
    <>
      {props.renderDefault(props)}
      <link rel="icon" type="image/png" sizes="32x32" href={`/static/favicon-32x32.png${versionQuery}`} />
      <link rel="icon" type="image/png" sizes="16x16" href={`/static/favicon-16x16.png${versionQuery}`} />
      <link rel="apple-touch-icon" sizes="180x180" href={`/static/apple-touch-icon.png${versionQuery}`} />
      <link rel="icon" href={`/static/favicon.ico${versionQuery}`} />
      <meta name="theme-color" content="#1B2A41" />
    </>
  )
}
