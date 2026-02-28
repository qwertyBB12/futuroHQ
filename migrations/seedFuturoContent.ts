/**
 * Seed script for Futuro.ngo Phase 2 — News articles + Impact metrics
 *
 * Run from the clean-studio directory:
 *   npx sanity exec migrations/seedFuturoContent.ts --with-user-token
 *
 * Creates:
 *   - 4 impact metrics (from current hardcoded stats)
 *   - 3 sample news articles
 *
 * DECISION: futuroSummit used as-is (Option C from rebuild proposal).
 * No program content seeded — convening data lives in futuroSummit.
 */

import {getCliClient} from 'sanity/cli'

const client = getCliClient().withConfig({apiVersion: '2024-10-23'})

// =============================================================================
// IMPACT METRICS (replacing hardcoded stats on homepage, /impact, /alumni)
// =============================================================================

const impactMetrics = [
  {
    _id: 'impactMetric-project-authors',
    _type: 'impactMetric',
    label: 'Project Authors',
    value: '150+',
    description: 'Social impact project authors convened across the Americas',
    displayOrder: 1,
    showOnHomepage: true,
  },
  {
    _id: 'impactMetric-countries',
    _type: 'impactMetric',
    label: 'Countries',
    value: '12',
    description: 'Countries represented in the Futuro alumni body',
    displayOrder: 2,
    showOnHomepage: true,
  },
  {
    _id: 'impactMetric-mobilized',
    _type: 'impactMetric',
    label: 'Mobilized',
    value: '$28M',
    description: 'Resources mobilized across author-led initiatives',
    displayOrder: 3,
    showOnHomepage: true,
  },
  {
    _id: 'impactMetric-projects-deployed',
    _type: 'impactMetric',
    label: 'Projects Deployed',
    value: '40+',
    description: 'Initiatives deployed through institutional partnerships',
    displayOrder: 4,
    showOnHomepage: true,
  },
]

// =============================================================================
// NEWS ARTICLES (replacing hardcoded sample content on /news)
// =============================================================================

const newsArticles = [
  {
    _id: 'drafts.news-submissions-open-2026',
    _type: 'news',
    publish: true,
    title: 'Project Submissions Now Open',
    slug: {_type: 'slug', current: 'project-submissions-open-2026'},
    publishDate: '2026-01-15',
    excerpt:
      'We are now accepting project submissions for the next Futuro convening. Education, civic innovation, environment, and social enterprise initiatives welcome.',
    category: 'event',
    featured: true,
    body: [
      {
        _type: 'block',
        _key: 'block-1',
        style: 'normal',
        markDefs: [],
        children: [
          {
            _type: 'span',
            _key: 'span-1',
            text: 'Futuro is now accepting project submissions for our next convening. We seek project authors with clearly defined initiatives in education reform, civic innovation, environmental stewardship, or social enterprise.',
            marks: [],
          },
        ],
      },
      {
        _type: 'block',
        _key: 'block-2',
        style: 'normal',
        markDefs: [],
        children: [
          {
            _type: 'span',
            _key: 'span-2',
            text: 'Submissions are managed through BeNeXT Global, our parent organization. Visit benextglobal.com/apply to begin your submission.',
            marks: [],
          },
        ],
      },
    ],
  },
  {
    _id: 'drafts.news-convening-recap-mexico-city',
    _type: 'news',
    publish: true,
    title: 'Convening Recap: Mexico City',
    slug: {_type: 'slug', current: 'convening-recap-mexico-city-2025'},
    publishDate: '2025-12-10',
    excerpt:
      '32 project authors gathered in Mexico City for our latest convening. 8 projects achieved deployment-ready status through institutional partnerships.',
    category: 'update',
    featured: false,
    body: [
      {
        _type: 'block',
        _key: 'block-3',
        style: 'normal',
        markDefs: [],
        children: [
          {
            _type: 'span',
            _key: 'span-3',
            text: '32 project authors from across the Americas gathered in Mexico City for Futuro\'s latest convening. Over 10 intensive days, authors refined, resourced, and deployed their social impact initiatives through our institutional network.',
            marks: [],
          },
        ],
      },
      {
        _type: 'block',
        _key: 'block-4',
        style: 'normal',
        markDefs: [],
        children: [
          {
            _type: 'span',
            _key: 'span-4',
            text: 'Eight projects achieved deployment-ready status, with three securing direct pathways through OAS and Smithsonian partnerships. All 32 authors join the Alumni Continuum for ongoing collaboration and support.',
            marks: [],
          },
        ],
      },
    ],
  },
  {
    _id: 'drafts.news-spotlight-escuelas-abiertas',
    _type: 'news',
    publish: true,
    title: 'Project Spotlight: Escuelas Abiertas',
    slug: {_type: 'slug', current: 'project-spotlight-escuelas-abiertas'},
    publishDate: '2025-11-20',
    excerpt:
      'Maria Rodriguez\'s education initiative, incubated at Futuro, now reaches 12,000 students through OAS partnership across Mexico and Guatemala.',
    category: 'alumni',
    featured: false,
    body: [
      {
        _type: 'block',
        _key: 'block-5',
        style: 'normal',
        markDefs: [],
        children: [
          {
            _type: 'span',
            _key: 'span-5',
            text: 'Escuelas Abiertas, the education reform initiative created by Futuro alumni Maria Rodriguez, has reached a landmark milestone: 12,000 students served across Mexico and Guatemala through a deployment pathway established via our OAS partnership.',
            marks: [],
          },
        ],
      },
      {
        _type: 'block',
        _key: 'block-6',
        style: 'normal',
        markDefs: [],
        children: [
          {
            _type: 'span',
            _key: 'span-6',
            text: 'Rodriguez first developed Escuelas Abiertas during a Futuro convening, where she refined the initiative\'s pedagogical model and secured institutional access to deploy across borders. The project now operates in partnership with 23 local school districts.',
            marks: [],
          },
        ],
      },
    ],
  },
]

// =============================================================================
// EXECUTE
// =============================================================================

async function seed() {
  console.log('Seeding Futuro content...\n')

  const tx = client.transaction()

  // Impact metrics — use createOrReplace (published, not drafts)
  for (const metric of impactMetrics) {
    tx.createOrReplace(metric)
  }

  // News articles — use createOrReplace (as drafts for editorial review)
  for (const article of newsArticles) {
    tx.createOrReplace(article)
  }

  const result = await tx.commit()

  console.log(`Impact Metrics created (${impactMetrics.length}):`)
  for (const m of impactMetrics) {
    console.log(`  ${m.value} ${m.label}`)
  }

  console.log(`\nNews Articles created as drafts (${newsArticles.length}):`)
  for (const a of newsArticles) {
    console.log(`  - ${a.title} (${a.publishDate})`)
  }

  console.log(`\nTransaction ID: ${result.transactionId}`)
  console.log('Done! Open Sanity Studio to review and publish news articles.')
}

seed().catch((err) => {
  console.error('Seed failed:', err.message)
  process.exit(1)
})
