/**
 * Hector Ecosystem — Civic Modern Studio Palette
 *
 * These are the ONLY keys that buildLegacyTheme() actually reads.
 * Everything else must be handled via CSS custom properties in styles.css.
 *
 * Colors: Founder's Black, Copper, Vermillion, Sandstone, Archival Slate
 * Warm dark theme — no blue tint
 */

export const civicModernThemeProps = {
  /* Base scale */
  '--black': '#0E0E0E',
  '--white': '#F2E5D5',
  '--gray': '#8B8985',
  '--gray-base': '#8B8985',

  /* Component surfaces */
  '--component-bg': '#1A1714',
  '--component-text-color': '#F2E5D5',

  /* Brand — Vermillion */
  '--brand-primary': '#C84841',

  /* Focus ring */
  '--focus-color': '#C84841',

  /* Navigation */
  '--main-navigation-color': '#0E0E0E',
  '--main-navigation-color--inverted': '#F2E5D5',

  /* Buttons */
  '--default-button-color': '#8B8985',
  '--default-button-primary-color': '#C84841',
  '--default-button-success-color': '#B17E68',
  '--default-button-warning-color': '#E8D5C0',
  '--default-button-danger-color': '#813531',

  /* State feedback */
  '--state-info-color': '#F2E5D5',
  '--state-success-color': '#B17E68',
  '--state-warning-color': '#E8D5C0',
  '--state-danger-color': '#813531',
}
