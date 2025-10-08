// theme.ts
import {buildLegacyTheme} from 'sanity'

import {getPaletteTokens} from './palettes'

// Cast so TS accepts all keys (runtime already does)
export const customTheme = buildLegacyTheme(
  getPaletteTokens() as unknown as Record<string, string>
)
