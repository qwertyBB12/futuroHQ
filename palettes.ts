/**
 * Autori Mandatum — Civic Modern Palette (hectorhlopez.com aligned)
 *
 * Warm dark. Copper distinction. Vermillion action.
 * These are the ONLY keys that buildLegacyTheme() reads.
 *
 * KEY INSIGHT: --black controls ALL card backgrounds in dark mode.
 * Raising it lifts the entire UI. Body bg stays darker via CSS.
 */

export const civicModernThemeProps = {
  '--black': '#201D19',       // Card surfaces — warm dark (body stays #0E0E0E via CSS)
  '--white': '#FFFFFF',
  '--gray': '#B5B1AC',
  '--gray-base': '#B5B1AC',

  '--component-bg': '#262220',
  '--component-text-color': '#FBF6F0',

  '--brand-primary': '#C84841',
  '--focus-color': '#C84841',

  '--main-navigation-color': '#151311',
  '--main-navigation-color--inverted': '#FBF6F0',

  '--default-button-color': '#9E9A96',
  '--default-button-primary-color': '#C84841',
  '--default-button-success-color': '#B17E68',
  '--default-button-warning-color': '#E8D5C0',
  '--default-button-danger-color': '#813531',

  '--state-info-color': '#F2E5D5',
  '--state-success-color': '#B17E68',
  '--state-warning-color': '#E8D5C0',
  '--state-danger-color': '#813531',
}
