import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: 'fo6n8ceo',
    dataset: 'production',
  },
  deployment: {
    /**
     * Enable auto-updates for studios.
     * Learn more at https://www.sanity.io/docs/cli#auto-updates
     */
    autoUpdates: true,

    // Add your Studio appId here to enable version tracking & updates
    appId: 'brard4oo9dkswctzj5pla8uh',
  },
})
