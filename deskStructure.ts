import type {StructureBuilder} from 'sanity/structure'
import {
  EditIcon,
  ComposeIcon,
  ProjectsIcon,
  CogIcon,
  DocumentsIcon,
} from '@sanity/icons'
import LivePreview from './components/previews/LivePreview'
import GovernanceView from './components/views/GovernanceView'
import ReferencesView from './components/views/ReferencesView'
import SeoAuditView from './components/views/SeoAuditView'

// Types that get SEO Audit tab
const SEO_TYPES = new Set([
  'essay', 'video', 'podcastEpisode', 'opEd', 'curatedPost', 'socialPost',
  'project', 'futuroSummit', 'collaborator', 'news',
])

// Types that get the full view panes (Content + Preview + Governance + References)
const GOVERNED_TYPES = new Set([
  'essay',
  'video',
  'podcast',
  'podcastEpisode',
  'opEd',
  'curatedPost',
  'socialPost',
  'project',
  'futuroSummit',
  'person',
  'alumni',
  'collaborator',
  'alumniDream',
  'alumniConversation',
  'projectUpdate',
  'news',
  'keynote',
])

// Every type explicitly placed in a tier — used to compute ungrouped fallback
const groupedDocTypes = new Set([
  // Tier 2 — Daily
  'essay', 'video', 'podcast', 'podcastEpisode', 'socialPost', 'opEd', 'curatedPost', 'news',
  'person',
  // Tier 3 — Programs & Projects
  'futuroSummit', 'project', 'alumni', 'enrollee',
  'alumniDream', 'alumniConversation', 'projectUpdate', 'participantConnection',
  'accreditationRecord', 'credential', 'accreditationHourLog',
  'keynote', 'recruitmentAsset',
  'ledgerPerson', 'collaborator',
  // Tier 4 — System
  'tag', 'siteSettings_futuro', 'impactMetric',
  'pricingTier', 'usageRecord',
  'decision',
  // Legacy (hidden)
  'vlog', 'alumniContinuum',
])

export const deskStructure = (S: StructureBuilder) => {
  // Build view tabs based on document type
  const documentViews = (schemaType: string) => {
    const views = [
      S.view.form().title('Content'),
      S.view.component(LivePreview).title('Preview'),
    ]

    if (GOVERNED_TYPES.has(schemaType)) {
      views.push(S.view.component(GovernanceView).title('Governance'))
      views.push(S.view.component(ReferencesView).title('References'))
    }

    if (SEO_TYPES.has(schemaType)) {
      views.push(S.view.component(SeoAuditView).title('SEO'))
    }

    return views
  }

  const listWithPreview = (schemaType: string, title: string) =>
    S.listItem()
      .title(title)
      .schemaType(schemaType)
      .child(
        S.documentTypeList(schemaType)
          .title(title)
          .child((documentId) =>
            S.document()
              .schemaType(schemaType)
              .documentId(documentId)
              .views(documentViews(schemaType)),
          ),
      )

  // Ungrouped fallback
  const allDocumentTypeListItems = S.documentTypeListItems()
  const ungroupedDocItems = allDocumentTypeListItems.filter((listItem) => {
    const typeNames =
      typeof (listItem as any).getTypeNames === 'function'
        ? (listItem as any).getTypeNames()
        : typeof listItem.getId === 'function'
        ? [listItem.getId() as string]
        : []

    return (
      typeNames.length > 0 &&
      typeNames.every((typeName: string) => !groupedDocTypes.has(typeName))
    )
  })

  // -------------------------------------------------------------------------
  // Thirty-day cutoff for Writer's Desk
  // -------------------------------------------------------------------------
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  return S.list()
    .title('BeNeXT HQ')
    .items([
      // =====================================================================
      // TIER 1 — Writer's Desk
      // =====================================================================
      S.listItem()
        .title("Writer's Desk")
        .icon(EditIcon)
        .child(
          S.documentList()
            .title("Writer's Desk")
            .filter('_updatedAt > $thirtyDaysAgo')
            .params({thirtyDaysAgo})
            .defaultOrdering([{field: '_updatedAt', direction: 'desc'}]),
        ),

      S.divider(),

      // =====================================================================
      // TIER 2 — Daily (high-frequency content types)
      // =====================================================================
      S.listItem()
        .title('Daily')
        .icon(ComposeIcon)
        .child(
          S.list()
            .title('Daily')
            .items([
              listWithPreview('essay', 'Essays'),
              listWithPreview('video', 'Videos'),
              listWithPreview('podcast', 'Podcasts'),
              listWithPreview('podcastEpisode', 'Podcast Episodes'),
              listWithPreview('socialPost', 'Social Posts'),
              listWithPreview('opEd', 'Op-Eds'),
              listWithPreview('curatedPost', 'Curated Posts'),
              listWithPreview('news', 'News'),
              S.divider(),
              listWithPreview('person', 'People'),
            ]),
        ),

      S.divider(),

      // =====================================================================
      // TIER 3 — Programs & Projects
      // =====================================================================
      S.listItem()
        .title('Programs & Projects')
        .icon(ProjectsIcon)
        .child(
          S.list()
            .title('Programs & Projects')
            .items([
              listWithPreview('futuroSummit', 'Futuro Summits'),
              listWithPreview('project', 'Projects'),
              listWithPreview('alumni', 'Alumni'),
              S.documentTypeListItem('enrollee').title('Enrollees'),
              S.divider(),
              listWithPreview('keynote', 'Keynotes'),
              S.documentTypeListItem('recruitmentAsset').title('Recruitment Assets'),
              S.divider(),
              listWithPreview('collaborator', 'Collaborators & Organizations'),
              S.documentTypeListItem('ledgerPerson').title('Ledger People'),
              S.divider(),
              listWithPreview('alumniDream', 'Alumni Dreams'),
              listWithPreview('alumniConversation', 'Conversations'),
              listWithPreview('projectUpdate', 'Project Updates'),
              S.documentTypeListItem('participantConnection').title('Participant Connections'),
              S.divider(),
              S.documentTypeListItem('accreditationRecord').title('Accreditation Records'),
              S.documentTypeListItem('credential').title('Credentials'),
              S.documentTypeListItem('accreditationHourLog').title('Hour Logs'),
            ]),
        ),

      S.divider(),

      // =====================================================================
      // TIER 4 — System
      // =====================================================================
      S.listItem()
        .title('System')
        .icon(CogIcon)
        .child(
          S.list()
            .title('System')
            .items([
              S.documentTypeListItem('tag').title('Tags'),
              S.listItem()
                .title('Futuro Site Settings')
                .child(
                  S.document()
                    .schemaType('siteSettings_futuro')
                    .documentId('siteSettings_futuro'),
                ),
              S.documentTypeListItem('impactMetric').title('Impact Metrics'),
              S.divider(),
              S.documentTypeListItem('pricingTier').title('Pricing Tiers'),
              S.documentTypeListItem('usageRecord').title('Usage Records'),
              S.divider(),
              S.documentTypeListItem('decision').title('Decisions'),
            ]),
        ),

      S.divider(),

      // =====================================================================
      // Ungrouped fallback
      // =====================================================================
      S.listItem()
        .title('All Documents (Ungrouped)')
        .icon(DocumentsIcon)
        .child(S.list().title('All Documents (Ungrouped)').items(ungroupedDocItems)),
    ])
}

export default deskStructure
