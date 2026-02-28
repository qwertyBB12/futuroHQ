import {getCliClient} from 'sanity/cli'

const client = getCliClient().withConfig({apiVersion: '2024-10-23'})

const keynotes = [
  {
    _id: 'drafts.keynote-georgetown-commencement-2025',
    _type: 'keynote',
    title: 'Georgetown University Commencement Address',
    slug: {_type: 'slug', current: 'georgetown-commencement-2025'},
    venue: 'Georgetown University',
    location: 'Washington, DC',
    // date: TBD — May 2025, exact date needed from Héctor
    description: 'Commencement address at Georgetown University.',
    category: 'commencement',
    featured: true,
    displayOrder: 1,
    platformTier: 'canonical',
    archivalStatus: 'archival',
    narrativeOwner: 'hector',
  },
  {
    _id: 'drafts.keynote-georgetown-hemispheric-leadership',
    _type: 'keynote',
    title: 'The Future of Hemispheric Leadership',
    slug: {_type: 'slug', current: 'future-hemispheric-leadership'},
    venue: 'Georgetown University',
    // date: TBD — exact date needed from Héctor
    description:
      'Address on building cross-border institutions and the next generation of Americas leadership.',
    category: 'institution',
    featured: true,
    displayOrder: 2,
    platformTier: 'canonical',
    archivalStatus: 'archival',
    narrativeOwner: 'hector',
  },
  {
    _id: 'drafts.keynote-narrative-power-digital-age',
    _type: 'keynote',
    title: 'Narrative Power in the Digital Age',
    slug: {_type: 'slug', current: 'narrative-power-digital-age'},
    venue: 'Center for International Studies',
    // date: TBD — exact date needed from Héctor
    description:
      'On the power of story in shaping institutional identity and public perception.',
    category: 'conference',
    featured: true,
    displayOrder: 3,
    platformTier: 'canonical',
    archivalStatus: 'archival',
    narrativeOwner: 'hector',
  },
  {
    _id: 'drafts.keynote-oas-social-enterprise',
    _type: 'keynote',
    title: 'Building Social Enterprise Across the Americas',
    slug: {_type: 'slug', current: 'social-enterprise-americas'},
    venue: 'Organization of American States (OAS)',
    location: 'Washington, DC',
    // date: TBD — exact date needed from Héctor
    description:
      'Keynote on the convergence of technology, education, and community-driven development.',
    category: 'policy',
    featured: true,
    displayOrder: 4,
    platformTier: 'canonical',
    archivalStatus: 'archival',
    narrativeOwner: 'hector',
  },
]

async function seed() {
  const tx = client.transaction()
  for (const doc of keynotes) {
    tx.createOrReplace(doc)
  }
  const result = await tx.commit()
  console.log(`Created ${keynotes.length} keynote drafts:`)
  for (const k of keynotes) {
    console.log(`  - ${k.title} (${k._id})`)
  }
  console.log(`Transaction ID: ${result.transactionId}`)
}

seed().catch((err) => {
  console.error('Failed:', err.message)
  process.exit(1)
})
