import {buildLegacyTheme} from 'sanity'
import {civicModernThemeProps} from './palettes'

const VERMILLION = '#C84841'
const SANDSTONE = '#F2E5D5'

const baseTheme = buildLegacyTheme(civicModernThemeProps)

// Override all avatar hue colors to Vermillion so presence rings
// are always on-brand instead of Sanity's random neon colors.
const HUES = ['gray', 'blue', 'purple', 'magenta', 'red', 'orange', 'yellow', 'green', 'cyan'] as const

function overrideAvatarColors(colorScheme: any) {
  for (const state of Object.values(colorScheme) as any[]) {
    if (state?.avatar) {
      for (const hue of HUES) {
        if (state.avatar[hue]) {
          state.avatar[hue] = {bg: VERMILLION, fg: SANDSTONE}
        }
      }
    }
  }
}

if (baseTheme.color) {
  if (baseTheme.color.light) overrideAvatarColors(baseTheme.color.light)
  if (baseTheme.color.dark) overrideAvatarColors(baseTheme.color.dark)
}

export const customTheme = baseTheme
