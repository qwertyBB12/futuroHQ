import { getCliClient } from 'sanity/cli'

const client = getCliClient().withConfig({ apiVersion: '2024-01-01' })

async function migrate() {
  const videos = await client.fetch(
    '*[_type == "video" && defined(language)]{_id, language}'
  )
  console.log(`Found ${videos.length} videos to migrate`)

  const toMigrate = videos.filter((v: any) => typeof v.language === 'string')
  console.log(`${toMigrate.length} need migration (string → array)`)

  for (const video of toMigrate) {
    console.log(`Migrating ${video._id}: "${video.language}" → ["${video.language}"]`)
    await client.patch(video._id).set({ language: [video.language] }).commit()
  }

  console.log('Done')
}

migrate().catch(console.error)
