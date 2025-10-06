// theme.ts
import {buildLegacyTheme} from 'sanity'

const HOYA_BLUE = '#0057FF'
const SANDSTONE = '#D4B996'

export const customTheme = buildLegacyTheme({
  '--component-bg': '#FAFAFB',
  '--component-text-color': '#0F1115',
  '--brand-primary': HOYA_BLUE,
  '--default-button-primary-color': HOYA_BLUE,
  '--main-navigation-color': HOYA_BLUE,
  '--main-navigation-color--inverted': '#FFFFFF',
  '--focus-color': HOYA_BLUE,
  /* you can override more CSS variables here as needed */
})

