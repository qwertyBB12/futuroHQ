/**
 * Hector Ecosystem — Civic Modern Studio Palette
 *
 * Aligned with @hector-ecosystem/design-system
 * Colors: Founder's Black, Copper, Vermillion, Sandstone, Archival Slate
 * Warm dark theme — no blue tint
 */

type TokenMap = Record<string, string>

// ---------------------------------------------------------------------------
// Civic Modern tokens — warm dark palette derived from design system
// ---------------------------------------------------------------------------

const civicModernTokens: TokenMap = {
  // Surface hierarchy (warm blacks, no blue tint)
  '--component-bg': '#0E0E0E',
  '--component-text-color': '#F2E5D5',

  // Cards — subtle warm lift
  '--card-bg-color': '#1A1714',
  '--card-fg-color': '#F2E5D5',
  '--card-muted-fg-color': '#8B8985',
  '--card-shadow-outline-color': 'rgba(14, 14, 14, 0.35)',

  // Navigation
  '--main-navigation-color': '#0E0E0E',
  '--main-navigation-color--inverted': '#F2E5D5',

  // Brand — Vermillion (action, interactivity)
  '--brand-primary': '#C84841',
  '--focus-color': '#C84841',

  // Links — Sandstone on dark
  '--link-color': '#F2E5D5',

  // Buttons
  '--default-button-color': '#8B8985',
  '--default-button-primary-color': '#C84841',
  '--default-button-danger-color': '#813531',
  '--default-button-success-color': '#B17E68',

  // Inputs — warm dark
  '--input-bg': '#1A1714',
  '--input-border-color': '#2A2520',
  '--input-text-color': '#F2E5D5',
  '--input-placeholder-color': '#8B8985',
  '--input-shadow': 'none',

  // State colors
  '--state-success-color': '#B17E68',
  '--state-info-color': '#F2E5D5',
  '--state-warning-color': '#E8D5C0',
  '--state-danger-color': '#813531',

  // Badges
  '--badge-default-bg': '#8B8985',
  '--badge-default-fg': '#0E0E0E',
  '--badge-primary-bg': '#C84841',
  '--badge-primary-fg': '#F2E5D5',
  '--badge-success-bg': '#B17E68',
  '--badge-success-fg': '#0E0E0E',
  '--badge-warning-bg': '#E8D5C0',
  '--badge-warning-fg': '#0E0E0E',
  '--badge-danger-bg': '#813531',
  '--badge-danger-fg': '#F2E5D5',

  // Lines
  '--hairline-color': '#2A2520',
  '--border-color': '#2A2520',
}

export const getPaletteTokens = (): TokenMap => civicModernTokens
