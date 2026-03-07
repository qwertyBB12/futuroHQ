#!/usr/bin/env node
/**
 * Populate projectTitle on alumni documents from bio analysis.
 *
 * Usage: SANITY_TOKEN=$(grep SANITY_WRITE_TOKEN .env.local | cut -d'=' -f2) node scripts/populate-project-titles.mjs
 */
import { createClient } from '@sanity/client'

const client = createClient({
  projectId: 'fo6n8ceo',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_TOKEN,
  useCdn: false,
})

// Manually curated project titles derived from bios
const projectTitles = {
  'Claudia Concepcion': 'Natural Product Innovation',
  'Diego Hernandez': 'Music Las Americas',
  'Thant Htet Oo': 'Cultural & Environmental Documentary',
  'Felipe Eleta': 'Startup Las Americas',
  'Maria Sofia': 'Hemispheric Medical Collaboration',
  'Pierina Diana': 'Startup Las Americas',
  'Nicolas Ugalde Ortiz': 'Sports for Community Unity',
  'Javier Lezcano': 'Startup Las Americas',
  'Nicolas Cisneros Palma': 'Philosophy & Education Reform',
  'Ricardo Adames': 'Environmental Sustainability',
  'Pavel Osorio': 'Music Las Americas',
  'Luis Lopez Garcia': 'Futuro Executive Director',
  'Gerdyn Jose Mojica': 'Dominican Heritage & Culture',
  'Diego Gracia': 'Eco-Friendly Fashion',
  'Diego Gordon': 'Hologram Diplomacy',
  'Alejandra Lopez Portillo': 'Institutional Ventures',
  'Santiago Ramirez Anguiano': 'AI-Powered Lake Remediation',
  'Mariana Vlieg': 'Theater & Startup Las Americas',
  'Mateo Porras Bermúdez': 'Diplomacy & International Affairs',
  'Maria Alexandra Sheppard': 'Neurolinguistics for Social Cohesion',
  'Luis Gerardo Cardenas Reyes': 'Education Reform',
  'Santiago Chapa De Vecchi': 'Technology & Entrepreneurship',
  'Stephanie Segura León': 'Education System Unification',
  'Mark Franklin': 'Cultural Music Marketing',
  'Priscila Putzulu': 'Renewable Energy in the Caribbean',
  'Alistair Coll': 'Startup Las Americas',
  'Jose Pablo Ugalde Ortiz': 'AI-Driven Medical Diagnostics',
  'Grace Porosky': 'Cultural Media Content Library',
  'Nestor Gaytan': null, // No bio
  'Maria Inoa': null, // No bio
}

async function main() {
  const alumni = await client.fetch('*[_type == "alumni" && publish == true]{_id, name, projectTitle}')

  let updated = 0
  let skipped = 0

  for (const person of alumni) {
    const title = projectTitles[person.name]
    if (!title) {
      console.log(`  SKIP: ${person.name} (no title mapped)`)
      skipped++
      continue
    }
    if (person.projectTitle) {
      console.log(`  EXISTS: ${person.name} → "${person.projectTitle}"`)
      skipped++
      continue
    }

    await client.patch(person._id).set({ projectTitle: title }).commit()
    console.log(`  SET: ${person.name} → "${title}"`)
    updated++
  }

  console.log(`\nDone. Updated: ${updated}, Skipped: ${skipped}`)
}

main().catch(console.error)
