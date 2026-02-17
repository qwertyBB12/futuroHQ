/**
 * Migrate collaborator documents:
 * 1. Detect and log duplicates (by name)
 * 2. Upsert canonical institution list with governance-compliant bios
 *
 * Run: npx tsx scripts/migrate-collaborators.ts
 */
import { config } from 'dotenv'
import { createClient } from '@sanity/client'
import * as readline from 'readline'

config({ path: '.env.local', override: false })

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID || 'fo6n8ceo',
  dataset: process.env.SANITY_DATASET || 'production',
  token: process.env.SANITY_WRITE_TOKEN || '',
  apiVersion: '2025-01-01',
  useCdn: false,
})

// ---------------------------------------------------------------------------
// Institution definitions
// ---------------------------------------------------------------------------

interface InstitutionDef {
  name: string
  orgType: 'university' | 'ngo' | 'government' | 'corporation' | 'foundation' | 'highschool' | 'other'
  isFuturoHost: boolean
  order: number
  bio: string
  website?: string
}

const INSTITUTIONS: InstitutionDef[] = [
  {
    name: 'Georgetown University',
    orgType: 'university',
    isFuturoHost: true,
    order: 1,
    bio: "The intellectual anchor of FUTURO in North America. Georgetown's School of Foreign Service and its Jesuit tradition of cura personalis\u2014care for the whole person\u2014provide the academic architecture where project authors formalize Legacy Projects at the intersection of governance, diplomacy, and hemispheric policy.",
    website: 'https://www.georgetown.edu',
  },
  {
    name: 'Universidad Mondrag\u00f3n',
    orgType: 'university',
    isFuturoHost: true,
    order: 2,
    bio: "The Mexican extension of the Basque cooperative tradition. Mondrag\u00f3n\u2019s model\u2014where education, industry, and social enterprise converge\u2014has provided FUTURO with an institutional foothold in Mexico\u2019s industrial corridor. Project authors engage a university built not on theory alone but on the architecture of cooperative economies.",
    website: 'https://www.mondragon.mx',
  },
  {
    name: 'Ciudad del Saber / City of Knowledge',
    orgType: 'ngo',
    isFuturoHost: true,
    order: 3,
    bio: 'An international campus on the former Clayton military base in Panama, where barracks became laboratories and a canal zone became a knowledge corridor. The City of Knowledge convenes international organizations, research centers, and academic programs at the geographic crossroads of the Americas.',
    website: 'https://www.ciudaddelsaber.org',
  },
  {
    name: 'Smithsonian Institution',
    orgType: 'government',
    isFuturoHost: true,
    order: 4,
    bio: "The world\u2019s largest museum and research complex. Project authors engage the Smithsonian\u2019s nineteen museums, nine research centers, and the National Zoo\u2014not as visitors, but as practitioners whose Legacy Projects intersect with collections that archive the hemisphere\u2019s scientific, cultural, and artistic record.",
    website: 'https://www.si.edu',
  },
  {
    name: 'Organization of American States (OAS)',
    orgType: 'government',
    isFuturoHost: true,
    order: 5,
    bio: 'The principal hemispheric forum for multilateral political dialogue. FUTURO has convened at OAS headquarters for G20 sideline sessions and diplomatic engagements, connecting project authors with the institutional machinery of hemispheric governance\u2014where policy is not discussed in the abstract but authored in real time.',
    website: 'https://www.oas.org',
  },
  {
    name: 'Library of Congress',
    orgType: 'government',
    isFuturoHost: true,
    order: 6,
    bio: "The world\u2019s largest library and the institutional memory of the hemisphere. Project authors access its 173 million items not as researchers browsing a catalog, but as authors engaging a living archive whose Hispanic Division and inter-American collections provide the documentary foundation for Legacy Projects with cross-border reach.",
    website: 'https://www.loc.gov',
  },
  {
    name: 'Diplomatic Missions',
    orgType: 'government',
    isFuturoHost: true,
    order: 7,
    bio: 'Embassies of Panama, the Dominican Republic, Colombia, and Mexico have opened their diplomatic residences to FUTURO, providing project authors direct access to hemispheric diplomacy. These are not courtesy visits\u2014they are working sessions where Legacy Projects meet the ambassadors and attach\u00e9s who shape bilateral policy.',
  },
  {
    name: 'EarthJustice',
    orgType: 'ngo',
    isFuturoHost: false,
    order: 10,
    bio: "The largest nonprofit environmental law organization in the United States. EarthJustice\u2019s attorneys have litigated landmark cases that define environmental protection across the hemisphere. Their collaboration with FUTURO connects project authors to the institutional frontier where environmental law meets advocacy.",
    website: 'https://earthjustice.org',
  },
  {
    name: 'Council of International Schools (CIS)',
    orgType: 'ngo',
    isFuturoHost: false,
    order: 11,
    bio: 'A global membership community of international schools and post-secondary institutions. CIS has provided BeNeXT with access to its network of schools across the Americas, connecting the institution with educators and administrators who identify emerging project authors within their student bodies.',
    website: 'https://www.cois.org',
  },
  {
    name: 'G20 / Grupo de los Veinte',
    orgType: 'government',
    isFuturoHost: false,
    order: 12,
    bio: "The premier forum for international economic cooperation. BeNeXT has participated in G20 sideline events, positioning project authors and their Legacy Projects within the world\u2019s most consequential conversations about economic policy, development, and hemispheric integration.",
  },
  {
    name: 'SXSW (South by Southwest)',
    orgType: 'corporation',
    isFuturoHost: false,
    order: 13,
    bio: "The convergence of technology, film, music, and education in Austin, Texas. SXSW EDU has featured BeNeXT\u2019s approach to hemispheric leadership development, placing the institution\u2019s methodology alongside the world\u2019s most innovative approaches to education and civic engagement.",
    website: 'https://www.sxsw.com',
  },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '')
}

/** Score how "complete" a collaborator doc is (more fields = higher) */
function dataScore(doc: any): number {
  let score = 0
  if (doc.logo) score += 3
  if (doc.bio && doc.bio.length > 0) score += 2
  if (doc.website) score += 1
  if (doc.orgType) score += 1
  if (doc.order !== undefined && doc.order !== null) score += 1
  if (doc.media && doc.media.length > 0) score += 1
  if (doc.relatedProjects && doc.relatedProjects.length > 0) score += 1
  if (doc.relatedPeople && doc.relatedPeople.length > 0) score += 1
  return score
}

function askQuestion(query: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  return new Promise(resolve => {
    rl.question(query, answer => {
      rl.close()
      resolve(answer.trim())
    })
  })
}

/**
 * Case-insensitive fuzzy match: checks if the normalized existing name
 * contains (or is contained by) the normalized target name, or vice versa.
 */
function fuzzyMatch(existingName: string, targetName: string): boolean {
  const a = normalize(existingName)
  const b = normalize(targetName)
  return a === b || a.includes(b) || b.includes(a)
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function run() {
  console.log('=== Collaborator Migration ===\n')

  // -----------------------------------------------------------------------
  // Step 1: Fetch all collaborator documents
  // -----------------------------------------------------------------------
  const allDocs = await client.fetch<any[]>(
    `*[_type == "collaborator"]{
      _id, name, bio, orgType, isFuturoHost, order, website, publish,
      "hasLogo": defined(logo),
      "mediaCount": count(media),
      "relatedProjectsCount": count(relatedProjects),
      "relatedPeopleCount": count(relatedPeople),
      logo
    } | order(name asc)`
  )

  console.log(`Found ${allDocs.length} collaborator document(s) in Sanity.\n`)

  // -----------------------------------------------------------------------
  // Step 2: Detect duplicates by normalized name
  // -----------------------------------------------------------------------
  const byName = new Map<string, any[]>()
  for (const doc of allDocs) {
    const key = normalize(doc.name || '')
    if (!byName.has(key)) byName.set(key, [])
    byName.get(key)!.push(doc)
  }

  const duplicateGroups = [...byName.entries()].filter(([, docs]) => docs.length > 1)

  if (duplicateGroups.length > 0) {
    console.log('--- DUPLICATE DETECTION ---\n')
    for (const [key, docs] of duplicateGroups) {
      console.log(`Duplicate group "${docs[0].name}" (${docs.length} docs):`)
      for (const doc of docs) {
        const score = dataScore(doc)
        console.log(
          `  _id: ${doc._id}  |  logo: ${doc.hasLogo ? 'YES' : 'no'}  |  bio: ${doc.bio ? doc.bio.length + ' chars' : 'none'}  |  score: ${score}`
        )
      }
      // Recommend keeping the one with the highest score
      const sorted = [...docs].sort((a, b) => dataScore(b) - dataScore(a))
      const keep = sorted[0]
      const remove = sorted.slice(1)
      console.log(`  >> RECOMMEND KEEP: ${keep._id} (score ${dataScore(keep)})`)
      for (const r of remove) {
        console.log(`  >> RECOMMEND DELETE: ${r._id} (score ${dataScore(r)})`)
      }
      console.log()

      // -----------------------------------------------------------------
      // Uncomment the block below to interactively delete duplicates.
      // The script will ask for confirmation before each deletion.
      // -----------------------------------------------------------------
      // const answer = await askQuestion(
      //   `  Delete ${remove.length} duplicate(s) and keep ${keep._id}? (y/n): `
      // )
      // if (answer.toLowerCase() === 'y') {
      //   for (const r of remove) {
      //     console.log(`    Deleting ${r._id}...`)
      //     await client.delete(r._id)
      //     console.log(`    Deleted.`)
      //   }
      // } else {
      //   console.log('    Skipped.')
      // }
    }
    console.log('--- END DUPLICATES ---\n')
    console.log(
      'NOTE: Duplicate deletion is commented out. Review the recommendations above,\n' +
        'then uncomment the deletion block in the script and re-run if desired.\n'
    )
  } else {
    console.log('No duplicates detected.\n')
  }

  // -----------------------------------------------------------------------
  // Step 3: Upsert institutions
  // -----------------------------------------------------------------------
  console.log('--- UPSERT INSTITUTIONS ---\n')

  // Re-fetch after potential deletions (in case user uncommented delete code)
  const currentDocs = await client.fetch<any[]>(
    `*[_type == "collaborator"]{ _id, name, bio, orgType, isFuturoHost, order, website, publish }`
  )

  const created: string[] = []
  const patched: string[] = []
  const skipped: string[] = []

  for (const inst of INSTITUTIONS) {
    // Find existing doc by fuzzy name match
    const existing = currentDocs.find(doc => fuzzyMatch(doc.name || '', inst.name))

    if (existing) {
      // Patch existing document
      console.log(`PATCH: "${inst.name}" (matched existing _id: ${existing._id})`)

      const patchFields: Record<string, any> = {
        bio: inst.bio,
        orgType: inst.orgType,
        isFuturoHost: inst.isFuturoHost,
        order: inst.order,
        publish: true,
      }
      if (inst.website) {
        patchFields.website = inst.website
      }

      await client.patch(existing._id).set(patchFields).commit()
      patched.push(inst.name)
    } else {
      // Create new document
      console.log(`CREATE: "${inst.name}"`)

      const newDoc: { _type: string; [key: string]: any } = {
        _type: 'collaborator',
        name: inst.name,
        bio: inst.bio,
        orgType: inst.orgType,
        isFuturoHost: inst.isFuturoHost,
        order: inst.order,
        publish: true,
      }
      if (inst.website) {
        newDoc.website = inst.website
      }

      await client.create(newDoc)
      created.push(inst.name)
    }
  }

  // -----------------------------------------------------------------------
  // Summary
  // -----------------------------------------------------------------------
  console.log('\n=== SUMMARY ===\n')
  console.log(`Total institutions processed: ${INSTITUTIONS.length}`)
  console.log(`Created: ${created.length}`)
  if (created.length > 0) {
    for (const name of created) console.log(`  + ${name}`)
  }
  console.log(`Patched: ${patched.length}`)
  if (patched.length > 0) {
    for (const name of patched) console.log(`  ~ ${name}`)
  }
  if (duplicateGroups.length > 0) {
    console.log(`\nDuplicate groups found: ${duplicateGroups.length} (review above for cleanup recommendations)`)
  }

  console.log('\nDone.')
}

run().catch(err => {
  console.error(err)
  process.exit(1)
})
