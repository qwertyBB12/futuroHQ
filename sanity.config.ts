import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'
import {customTheme} from './theme'
import StudioLogo from './components/StudioLogo'
import './styles.css'

export default defineConfig({
  name: 'default',
  title: 'HQ',   // TEMP so we confirm the live build
  projectId: 'fo6n8ceo',
  dataset: 'production',
  theme: customTheme,
  plugins: [structureTool(), visionTool()],
  schema: {types: schemaTypes},
  studio: {
    components: {
      logo: StudioLogo,
    },
  },
})
