import type {NavbarProps} from 'sanity'

/**
 * Custom Navbar — passes through to Sanity default.
 * Workspace icon (set in sanity.config.ts) handles branding.
 */
export default function MyNavbar(props: NavbarProps) {
  return props.renderDefault(props)
}
