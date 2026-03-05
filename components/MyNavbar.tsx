import type {NavbarProps} from 'sanity'

/**
 * Custom Navbar — Civic Modern branding
 * Renders the brand mark + Sanity default controls.
 * Title comes from the workspace name in sanity.config.ts.
 */
export default function MyNavbar(props: NavbarProps) {
  return (
    <div style={{display: 'flex', alignItems: 'center', width: '100%'}}>
      {/* Brand logo */}
      <div style={{display: 'flex', alignItems: 'center', padding: '0 0.75rem', flexShrink: 0}}>
        <img
          src="/static/logo-benext.png"
          alt="Autori Mandatum"
          width={24}
          height={24}
          style={{objectFit: 'contain', borderRadius: 4}}
          decoding="async"
          loading="eager"
        />
      </div>

      {/* Sanity default navbar (workspace name, tools, search, user) */}
      <div style={{flex: 1, minWidth: 0}}>
        {props.renderDefault(props)}
      </div>
    </div>
  )
}
