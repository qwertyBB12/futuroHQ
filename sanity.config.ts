// sanity.config.ts
import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'

import {schemaTypes} from './schemaTypes'
import {customTheme} from './theme'     // if you added theme.ts
import './styles.css'                   // if you added styles.css

export default defineConfig({
  name: 'default',
  title: 'Futuro HQ Studio',
  projectId: 'fo6n8ceo',
  dataset: 'production',

  // optional: your custom theme (using buildLegacyTheme)
  theme: customTheme,

  plugins: [
    structureTool(),
    visionTool(),
  ],

  schema: {
    types: schemaTypes,
  },
})
