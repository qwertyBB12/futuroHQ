// sanity.config.ts
import './styles.css'
import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'
import {customTheme} from './theme'
import StudioLogo from './components/StudioLogo'
import MyNavbar from './components/MyNavbar'

export default defineConfig({
  name: 'default',
  title: 'BeNeXT Global HQ',
  projectId: 'fo6n8ceo',
  dataset: 'production',
  theme: customTheme,
  plugins: [structureTool(), visionTool()],
  schema: {types: schemaTypes},
  studio: {
    components: {
      navbar: MyNavbar, // 👈 Custom navbar with your logo
    },
  },
})
