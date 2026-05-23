/**
 * BeNeXT Studio — Parchment + Midnight + Burnished Copper
 *
 * Matches the public benextglobal.com design language:
 *   - Ground:   parchment #FAF8F5
 *   - Headings: midnight #162931
 *   - Accent:   burnished copper #C4725A (with #B17E68 for soft strokes)
 *   - Insets:   midnight panels (navbar, dialogs)
 *
 * KEY INSIGHT: --white controls card surfaces in light mode (which we force
 * via `color-scheme: only light` in styles.css). The CSS layer does the heavy
 * lifting; these tokens are the seed values Sanity's legacy theme reads.
 */

export const civicModernThemeProps = {
  '--black': '#162931',       // Midnight — used for dark insets (navbar, dialogs)
  '--white': '#FAF8F5',       // Parchment — card surfaces in light mode
  '--gray': '#8B8985',        // Archival slate — muted text
  '--gray-base': '#8B8985',

  '--component-bg': '#FBF6F0',          // Warm cream — writer's sanctuary
  '--component-text-color': '#162931',  // Midnight body text

  '--brand-primary': '#C4725A',         // Burnished copper
  '--focus-color': '#C4725A',

  '--main-navigation-color': '#162931',
  '--main-navigation-color--inverted': '#FAF8F5',

  '--default-button-color': '#8B8985',
  '--default-button-primary-color': '#C4725A',
  '--default-button-success-color': '#B17E68',
  '--default-button-warning-color': '#D49180',
  '--default-button-danger-color': '#A85E45',

  '--state-info-color': '#8B8985',
  '--state-success-color': '#B17E68',
  '--state-warning-color': '#D49180',
  '--state-danger-color': '#A85E45',
}
