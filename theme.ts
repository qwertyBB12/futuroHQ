// theme.ts
import {buildLegacyTheme} from 'sanity'

// Brand palette (yours)
const FOUNDERS_BLACK    = '#0B1220'
const ARCHIVAL_SLATE    = '#8A8D91'
const SANDSTONE_NEUTRAL = '#F2E5D5'
const SCHOLAR_GOLD      = '#D4AF37'
const HOYAS_MIDNIGHT    = '#1B2A41'
const GLOBAL_GARNET     = '#8C1E4A'
const CORAL             = '#FF6F61'

// Derived inks/surfaces
const OFFWHITE     = '#F5F7FA'
const CARD_BG      = '#22334E'
const INPUT_BG     = '#263957'
const INPUT_BORDER = '#314662'
const DIVIDER      = '#2B3E5B'

// Put your overrides in a plain record so TS doesn’t argue about keys
const tokens = {
  // App surfaces
  '--component-bg': HOYAS_MIDNIGHT,      // main canvas
  '--component-text-color': SANDSTONE_NEUTRAL,    // primary text

  // Cards/panels
  '--card-bg-color': HOYAS_MIDNIGHT,
  '--card-fg-color': SANDSTONE_NEUTRAL,
  '--card-muted-fg-color': ARCHIVAL_SLATE,
  '--card-shadow-outline-color': 'rgba(0,0,0,0.35)',

  // Navigation
  '--main-navigation-color': HOYAS_MIDNIGHT,
  '--main-navigation-color--inverted': SANDSTONE_NEUTRAL,

  // Brand & focus
  '--brand-primary': CORAL,
  '--focus-color': CORAL,
  '--link-color': SANDSTONE_NEUTRAL,

  // Buttons
  '--default-button-color': ARCHIVAL_SLATE,
  '--default-button-primary-color': CORAL,
  '--default-button-danger-color': GLOBAL_GARNET,
  '--default-button-success-color': CORAL,

  // Inputs
  '--input-bg': INPUT_BG,
  '--input-border-color': INPUT_BORDER,
  '--input-text-color': SANDSTONE_NEUTRAL,
  '--input-placeholder-color': ARCHIVAL_SLATE,
  '--input-shadow': 'none',

  // Status mapping
  '--state-success-color': CORAL,
  '--state-info-color': SANDSTONE_NEUTRAL,
  '--state-warning-color': SANDSTONE_NEUTRAL,
  '--state-danger-color': GLOBAL_GARNET,

  // Badges/labels
  '--badge-default-bg': ARCHIVAL_SLATE,
  '--badge-default-fg': HOYAS_MIDNIGHT,
  '--badge-primary-bg': CORAL,
  '--badge-primary-fg': HOYAS_MIDNIGHT,
  '--badge-success-bg': CORAL,
  '--badge-success-fg': HOYAS_MIDNIGHT,
  '--badge-warning-bg': SANDSTONE_NEUTRAL,
  '--badge-warning-fg': HOYAS_MIDNIGHT,
  '--badge-danger-bg': GLOBAL_GARNET,
  '--badge-danger-fg': SANDSTONE_NEUTRAL,

  // Borders/Dividers
  '--hairline-color': DIVIDER,
  '--border-color': INPUT_BORDER,
} as const

// Cast so TS accepts all keys (runtime already does)
export const customTheme = buildLegacyTheme(tokens as unknown as Record<string, string>)
