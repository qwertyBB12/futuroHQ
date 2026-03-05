import {buildLegacyTheme} from 'sanity'
import {getPaletteTokens} from './palettes'

export const customTheme = buildLegacyTheme(
  getPaletteTokens() as unknown as Record<string, string>,
)
