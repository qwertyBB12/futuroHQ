// sanity.config.ts
import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'
import {customTheme} from './theme'
import StudioLogo from './components/StudioLogo'   // ⬅️ add this line
import './styles.css'

export default defineConfig({
  name: 'default',
  title: 'Futuro HQ Studio (TEST)',
  projectId: 'fo6n8ceo',
  dataset: 'production',
  theme: customTheme,
  plugins: [structureTool(), visionTool()],
  schema: {types: schemaTypes},
  studio: {
    components: {
      logo: StudioLogo,    // ⬅️ add this block
    },
  },
})
