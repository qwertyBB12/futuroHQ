#!/usr/bin/env node
/**
 * Populate bios and projectTitles for Nestor Gaytan and Samuel Rios.
 *
 * Usage: SANITY_TOKEN=$(grep SANITY_WRITE_TOKEN .env.local | cut -d'=' -f2) node scripts/populate-new-alumni-bios.mjs
 */
import { createClient } from '@sanity/client'

const client = createClient({
  projectId: 'fo6n8ceo',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_TOKEN,
  useCdn: false,
})

const updates = [
  {
    name: 'Nestor Gaytan',
    bio: `Nestor Gaytan is originally from Monterrey, Mexico. He participated in the Futuro MMXIX cohort at Georgetown University as an emerging leader and has since grown into a changemaker within the ecosystem. A graduate of Tecnológico de Monterrey, Nestor has collaborated extensively with Futuro in Mexico City and served on the alumni board — helping shape the community's institutional direction. He is currently in the executive track at CEMEX, one of the world's largest building materials companies, where he is building his career at the intersection of industrial leadership and hemispheric impact.`,
    projectTitle: 'Executive Leadership',
    cohortYear: 2019,
    generation: 'changemaker',
  },
  {
    name: 'Samuel Rios',
    bio: `Samuel Rios is originally from Panama City, Panama. He participated in the Futuro MMXIX cohort at Georgetown University as an emerging leader. Samuel is a chef whose project explored the intersection of food, culture, and technology — developing approaches to food preservation that address extreme conditions including aviation and remote environments. His work reflects a vision of culinary innovation as a vehicle for both cultural unity and practical problem-solving across borders.`,
    projectTitle: 'Food Technology & Preservation',
    cohortYear: 2019,
    generation: 'emerging',
  },
]

async function main() {
  for (const update of updates) {
    const docs = await client.fetch(
      '*[_type == "alumni" && name == $name]{_id}',
      { name: update.name }
    )
    if (!docs.length) {
      console.log(`NOT FOUND: ${update.name}`)
      continue
    }
    const { name, ...fields } = update
    await client.patch(docs[0]._id).set(fields).commit()
    console.log(`UPDATED: ${name}`)
  }
  console.log('\nDone.')
}

main().catch(console.error)
