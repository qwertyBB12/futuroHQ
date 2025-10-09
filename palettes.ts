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
    '--component-text-color': '#1B2A41',
    '--card-bg-color': '#F2E5D5',
    '--card-fg-color': '#1B2A41',
    '--card-muted-fg-color': '#8A8D91',
    '--card-shadow-outline-color': 'rgba(27,42,65,0.08)',
    '--main-navigation-color': '#F2E5D5',
    '--main-navigation-color--inverted': '#1B2A41',
    '--brand-primary': '#FF6F61',
    '--focus-color': '#FF6F61',
    '--link-color': '#1B2A41',
    '--default-button-color': '#F2E5D5',
    '--default-button-primary-color': '#FF6F61',
    '--default-button-danger-color': '#FF6F61',
    '--default-button-success-color': '#F2E5D5',
    '--input-bg': '#F2E5D5',
    '--input-border-color': '#1B2A41',
    '--input-text-color': '#1B2A41',
    '--input-placeholder-color': '#8A8D91',
    '--state-success-color': '#FF6F61',
    '--state-info-color': '#1B2A41',
    '--state-warning-color': '#FF6F61',
    '--state-danger-color': '#FF6F61',
    '--badge-default-bg': '#1B2A41',
    '--badge-default-fg': '#F2E5D5',
    '--badge-primary-bg': '#FF6F61',
    '--badge-primary-fg': '#1B2A41',
    '--badge-success-bg': '#1B2A41',
    '--badge-success-fg': '#F2E5D5',
    '--badge-warning-bg': '#FF6F61',
    '--badge-warning-fg': '#1B2A41',
    '--badge-danger-bg': '#FF6F61',
    '--badge-danger-fg': '#1B2A41',
    '--hairline-color': '#1B2A41',
    '--border-color': '#1B2A41',
  }),
} as const satisfies Record<string, PaletteDefinition>

export type PaletteName = keyof typeof paletteDefinitions

const isPaletteName = (value: unknown): value is PaletteName =>
  typeof value === 'string' && value in paletteDefinitions

export const paletteOrder: PaletteName[] = [
  'midnightSlate',
  'sandstoneDawn',
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

type VisualOverrides = {
  surface: string
  surfaceText: string
  pane: string
  paneText: string
  card: string
  cardText: string
  nav: string
  navText: string
  button: string
  buttonText: string
  buttonPrimary: string
  buttonPrimaryText: string
}

const visualOverrides: Record<PaletteName, VisualOverrides> = {
  midnightSlate: {
    surface: '#0B1220',
    surfaceText: '#F2E5D5',
    pane: '#0B1220',
    paneText: '#F2E5D5',
    card: '#0B1220',
    cardText: '#F2E5D5',
    nav: '#0B1220',
    navText: '#F2E5D5',
    button: '#18243A',
    buttonText: '#F2E5D5',
    buttonPrimary: '#FF6F61',
    buttonPrimaryText: '#0B1220',
  },
  sandstoneDawn: {
    surface: '#F2E5D5',
    surfaceText: '#1B2A41',
    pane: '#F2E5D5',
    paneText: '#1B2A41',
    card: '#F2E5D5',
    cardText: '#1B2A41',
    nav: '#F2E5D5',
    navText: '#1B2A41',
    button: '#F2E5D5',
    buttonText: '#1B2A41',
    buttonPrimary: '#FF6F61',
    buttonPrimaryText: '#1B2A41',
  },
}

const assignStyles = (selector: string, styles: Record<string, string>) => {
  if (typeof document === 'undefined') return
  document.querySelectorAll<HTMLElement>(selector).forEach((element) => {
    Object.entries(styles).forEach(([property, value]) => {
      element.style.setProperty(property, value, 'important')
    })
  })
}

let currentPaletteName: PaletteName = defaultPaletteName
let paletteObserver: MutationObserver | null = null

const applyVisualOverrides = (name: PaletteName) => {
  if (typeof document === 'undefined') return

  const overrides = visualOverrides[name] ?? visualOverrides.midnightSlate

  assignStyles('body, #sanity', {
    'background-color': overrides.surface,
    color: overrides.surfaceText,
  })

  assignStyles(
    [
      '[data-ui="Pane"]',
      '[data-ui="PaneHeader"]',
      '[data-ui="PaneFooter"]',
      '[data-ui="PaneContent"]',
      '[data-ui="PaneLayout"]',
      '[data-ui="PaneItem"]',
    ].join(','),
    {
      'background-color': overrides.pane,
      color: overrides.paneText,
    }
  )

  assignStyles(
    [
      '[data-ui="Card"]',
      '[data-ui="PaneContent"] [data-ui="Card"]',
      '[data-ui="PaneItem"] [data-ui="Card"]',
      '[data-ui="ListItem"]',
      '[data-ui="TreeItem"]',
      '[data-ui="TreeItem"] [data-ui="Card"]',
    ].join(','),
    {
      'background-color': overrides.card,
      color: overrides.cardText,
    }
  )

  assignStyles('[data-ui="ListItem"] *', {
    color: overrides.cardText,
    fill: overrides.cardText,
    stroke: overrides.cardText,
  })

  assignStyles('button[data-ui="PaneItem"]', {
    'background-color': overrides.card,
    color: overrides.cardText,
    'border-color': `${overrides.paneText}1a`,
  })

  assignStyles('button[data-ui="PaneItem"] *', {
    color: overrides.cardText,
    fill: overrides.cardText,
    stroke: overrides.cardText,
  })

  assignStyles(
    '[data-ui="Navbar"], [data-ui="Navbar"] > *, [data-ui="Navbar"] [data-ui="Card"], [data-ui="Navbar"] [data-ui="Box"]',
    {
      'background-color': overrides.nav,
      color: overrides.navText,
    }
  )

  assignStyles('[data-ui="Navbar"] *, [data-ui="Navbar"] [data-ui]', {
    color: overrides.navText,
  })

  assignStyles('[data-ui="Button"]', {
    'background-color': overrides.button,
    color: overrides.buttonText,
  })

  assignStyles('[data-ui="Button"][data-tone="primary"]', {
    'background-color': overrides.buttonPrimary,
    color: overrides.buttonPrimaryText,
  })
}

const ensurePaletteObserver = () => {
  if (typeof document === 'undefined') return
  if (paletteObserver) return

  paletteObserver = new MutationObserver(() => applyVisualOverrides(currentPaletteName))
  paletteObserver.observe(document.body, {childList: true, subtree: true})
}

export const applyPalette = (name: PaletteName) => {
  if (typeof document === 'undefined') return
  const palette = getPaletteTokens(name)
  const root = document.documentElement
  currentPaletteName = name

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

  applyVisualOverrides(name)
  ensurePaletteObserver()
}

export const ensurePaletteOnLoad = () => {
  if (typeof document === 'undefined') return defaultPaletteName
  const stored =
    typeof window !== 'undefined' ? window.localStorage.getItem(paletteStorageKey) : null
  const initial = isValidPalette(stored) ? (stored as PaletteName) : defaultPaletteName
  applyPalette(initial)
  return initial
}
