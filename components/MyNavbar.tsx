import type {NavbarProps} from 'sanity'

/**
 * Custom Navbar — Civic Modern branding
 * Simplified: no MutationObserver, no palette switching (single theme)
 * Uses Oswald for brand text, Mulish inherited for everything else
 */
export default function MyNavbar(props: NavbarProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0 1rem',
        flexWrap: 'wrap',
        backgroundColor: '#0E0E0E',
      }}
    >
      {/* Brand logo */}
      <img
        src="/static/android-chrome-512x512.png"
        alt="BeNeXT Logo"
        width={28}
        height={28}
        style={{objectFit: 'contain', borderRadius: 6}}
        decoding="async"
        loading="eager"
      />

      {/* Oswald brand title */}
      <span
        style={{
          fontFamily: "'Oswald', sans-serif",
          fontWeight: 700,
          fontSize: '1.5rem',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          color: '#F2E5D5',
          whiteSpace: 'nowrap',
        }}
      >
        Autori Mandatum
      </span>

      {/* Sanity default navbar controls */}
      <div
        style={{
          marginLeft: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          flexWrap: 'wrap',
        }}
      >
        {props.renderDefault(props)}
      </div>
    </div>
  )
}
