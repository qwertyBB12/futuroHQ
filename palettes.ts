type TokenMap = Record<string, string>

type PaletteDefinition = {
  label: string
  tokens: TokenMap
}

const baseTokens: TokenMap = {
  '--component-bg': '#0B1220',
  '--component-text-color': '#F2E5D5',
  '--card-bg-color': '#111A2C',
  '--card-fg-color': '#F2E5D5',
  '--card-muted-fg-color': '#8A8D91',
  '--card-shadow-outline-color': 'rgba(0,0,0,0.35)',
  '--main-navigation-color': '#0B1220',
  '--main-navigation-color--inverted': '#F2E5D5',
  '--brand-primary': '#FF6F61',
  '--focus-color': '#FF6F61',
  '--link-color': '#F2E5D5',
  '--default-button-color': '#8A8D91',
  '--default-button-primary-color': '#FF6F61',
  '--default-button-danger-color': '#8C1E4A',
  '--default-button-success-color': '#FF6F61',
  '--input-bg': '#18243A',
  '--input-border-color': '#1F2D46',
  '--input-text-color': '#F2E5D5',
  '--input-placeholder-color': '#8A8D91',
  '--input-shadow': 'none',
  '--state-success-color': '#FF6F61',
  '--state-info-color': '#F2E5D5',
  '--state-warning-color': '#F2E5D5',
  '--state-danger-color': '#8C1E4A',
  '--badge-default-bg': '#8A8D91',
  '--badge-default-fg': '#1B2A41',
  '--badge-primary-bg': '#FF6F61',
  '--badge-primary-fg': '#1B2A41',
  '--badge-success-bg': '#FF6F61',
  '--badge-success-fg': '#1B2A41',
  '--badge-warning-bg': '#F2E5D5',
  '--badge-warning-fg': '#1B2A41',
  '--badge-danger-bg': '#8C1E4A',
  '--badge-danger-fg': '#F2E5D5',
  '--hairline-color': '#1C2A42',
  '--border-color': '#1F2D46',
}

const createPalette = (label: string, overrides: Partial<TokenMap>): PaletteDefinition => ({
  label,
  tokens: {...baseTokens, ...overrides},
})

const paletteDefinitions = {
  midnightSlate: createPalette('Midnight Slate', {}),
  sandstoneDawn: createPalette('Sandstone Dawn', {
    '--component-bg': '#F2E5D5',
    '--component-text-color': '#0B1220',
    '--card-bg-color': '#F5F7FA',
    '--card-fg-color': '#0B1220',
    '--card-muted-fg-color': '#8A8D91',
    '--card-shadow-outline-color': 'rgba(0,0,0,0.15)',
    '--main-navigation-color': '#F2E5D5',
    '--main-navigation-color--inverted': '#0B1220',
    '--brand-primary': '#8C1E4A',
    '--focus-color': '#8C1E4A',
    '--link-color': '#0B1220',
    '--default-button-primary-color': '#8C1E4A',
    '--default-button-success-color': '#FF6F61',
    '--input-bg': '#F5F7FA',
    '--input-border-color': '#8A8D91',
    '--input-text-color': '#0B1220',
    '--input-placeholder-color': '#8A8D91',
    '--state-success-color': '#FF6F61',
    '--state-info-color': '#0B1220',
    '--state-warning-color': '#D4AF37',
    '--state-danger-color': '#8C1E4A',
    '--badge-default-bg': '#8A8D91',
    '--badge-default-fg': '#F2E5D5',
    '--badge-primary-bg': '#8C1E4A',
    '--badge-primary-fg': '#F2E5D5',
    '--badge-success-bg': '#FF6F61',
    '--badge-success-fg': '#0B1220',
    '--badge-warning-bg': '#D4AF37',
    '--badge-warning-fg': '#0B1220',
    '--badge-danger-bg': '#8C1E4A',
    '--badge-danger-fg': '#F2E5D5',
    '--hairline-color': '#D4AF37',
    '--border-color': '#8A8D91',
  }),
  garnetEmber: createPalette('Garnet Ember', {
    '--component-bg': '#1B2A41',
    '--component-text-color': '#F2E5D5',
    '--card-bg-color': '#0B1220',
    '--card-muted-fg-color': '#8A8D91',
    '--card-shadow-outline-color': 'rgba(0,0,0,0.45)',
    '--main-navigation-color': '#8C1E4A',
    '--main-navigation-color--inverted': '#0B1220',
    '--brand-primary': '#FF6F61',
    '--focus-color': '#FF6F61',
    '--link-color': '#F2E5D5',
    '--default-button-color': '#0B1220',
    '--default-button-primary-color': '#8C1E4A',
    '--default-button-success-color': '#FF6F61',
    '--input-bg': '#111A2C',
    '--input-border-color': '#0B1220',
    '--input-text-color': '#F2E5D5',
    '--input-placeholder-color': '#8A8D91',
    '--state-success-color': '#FF6F61',
    '--state-info-color': '#F2E5D5',
    '--state-warning-color': '#D4AF37',
    '--state-danger-color': '#8C1E4A',
    '--badge-default-bg': '#0B1220',
    '--badge-default-fg': '#F2E5D5',
    '--badge-primary-bg': '#8C1E4A',
    '--badge-primary-fg': '#0B1220',
    '--badge-success-bg': '#FF6F61',
    '--badge-success-fg': '#0B1220',
    '--badge-warning-bg': '#D4AF37',
    '--badge-warning-fg': '#0B1220',
    '--badge-danger-bg': '#8C1E4A',
    '--badge-danger-fg': '#F2E5D5',
    '--hairline-color': '#0B1220',
    '--border-color': '#0B1220',
  }),
  scholarNoir: createPalette('Scholar Noir', {
    '--component-bg': '#0B1220',
    '--component-text-color': '#F5F7FA',
    '--card-bg-color': '#111A2C',
    '--card-fg-color': '#F5F7FA',
    '--card-muted-fg-color': '#8A8D91',
    '--card-shadow-outline-color': 'rgba(0,0,0,0.35)',
    '--main-navigation-color': '#FF6F61',
    '--main-navigation-color--inverted': '#0B1220',
    '--brand-primary': '#D4AF37',
    '--focus-color': '#D4AF37',
    '--link-color': '#FF6F61',
    '--default-button-color': '#111A2C',
    '--default-button-primary-color': '#D4AF37',
    '--default-button-success-color': '#FF6F61',
    '--default-button-danger-color': '#8C1E4A',
    '--input-bg': '#111A2C',
    '--input-border-color': '#1F2D46',
    '--input-text-color': '#F5F7FA',
    '--input-placeholder-color': '#8A8D91',
    '--state-success-color': '#FF6F61',
    '--state-info-color': '#F5F7FA',
    '--state-warning-color': '#D4AF37',
    '--state-danger-color': '#8C1E4A',
    '--badge-default-bg': '#111A2C',
    '--badge-default-fg': '#F5F7FA',
    '--badge-primary-bg': '#D4AF37',
    '--badge-primary-fg': '#0B1220',
    '--badge-success-bg': '#FF6F61',
    '--badge-success-fg': '#0B1220',
    '--badge-warning-bg': '#D4AF37',
    '--badge-warning-fg': '#0B1220',
    '--badge-danger-bg': '#8C1E4A',
    '--badge-danger-fg': '#F5F7FA',
    '--hairline-color': '#1F2D46',
    '--border-color': '#1F2D46',
  }),
} as const satisfies Record<string, PaletteDefinition>

export type PaletteName = keyof typeof paletteDefinitions

const isPaletteName = (value: unknown): value is PaletteName =>
  typeof value === 'string' && value in paletteDefinitions

export const paletteOrder: PaletteName[] = [
  'midnightSlate',
  'sandstoneDawn',
  'garnetEmber',
  'scholarNoir',
]

export const defaultPaletteName: PaletteName = isPaletteName(process.env.SANITY_THEME)
  ? (process.env.SANITY_THEME as PaletteName)
  : 'midnightSlate'

export const getPaletteTokens = (name: PaletteName = defaultPaletteName): TokenMap => {
  const palette = paletteDefinitions[name] ?? paletteDefinitions.midnightSlate
  return palette.tokens
}

export const paletteOptions = paletteOrder.map((name) => ({
  value: name,
  label: paletteDefinitions[name].label,
}))

export const paletteLabels = paletteOrder.reduce<Record<PaletteName, string>>(
  (acc, name) => {
    acc[name] = paletteDefinitions[name].label
    return acc
  },
  {} as Record<PaletteName, string>
)

export const paletteStorageKey = 'studio:palette'

export const isValidPalette = isPaletteName

export const applyPalette = (name: PaletteName) => {
  if (typeof document === 'undefined') return
  const palette = getPaletteTokens(name)
  const root = document.documentElement
  root.dataset.palette = name
  Object.entries(palette).forEach(([token, value]) => {
    root.style.setProperty(token, value)
  })

  document
    .querySelectorAll<HTMLElement>('[data-sanity-ui-theme]')
    .forEach((el) => {
      Object.entries(palette).forEach(([token, value]) => {
        el.style.setProperty(token, value)
      })
    })
}

export const ensurePaletteOnLoad = () => {
  if (typeof document === 'undefined') return defaultPaletteName
  const stored =
    typeof window !== 'undefined' ? window.localStorage.getItem(paletteStorageKey) : null
  const initial = isValidPalette(stored) ? (stored as PaletteName) : defaultPaletteName
  applyPalette(initial)
  return initial
}
