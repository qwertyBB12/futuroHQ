import type { StructureBuilder } from 'sanity/structure'
import {
  ProjectsIcon,
  UsersIcon,
  VideoIcon,
  CogIcon,
  DocumentsIcon,
  RobotIcon,
  StarIcon,
  CreditCardIcon,
} from '@sanity/icons'
import LivePreview from './components/previews/LivePreview'

const groupedDocTypes = new Set([
  'project',
  'futuroSummit',
  'person',
  'alumni',
  'ledgerPerson',
  'collaborator',
  'essay',
  'podcast',
  'podcastEpisode',
  'video',
  'tag',
  'siteSettings_futuro',
  // Companion Platform
  'alumniDream',
  'alumniConversation',
  'projectUpdate',
  'participantConnection',
  // NeXT Accreditation
  'accreditationRecord',
  'credential',
  'accreditationHourLog',
  // Platform Business
  'pricingTier',
  'usageRecord',
])

export const deskStructure = (S: StructureBuilder) => {
  const documentViews = (schemaType: string) => [
    S.view.form().title('Content'),
    S.view.component(LivePreview).title('Preview'),
  ]

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

  return S.list()
    .title('BeNeXT HQ')
    .items([
      S.listItem()
        .title('Projects & Events')
        .icon(ProjectsIcon)
        .child(
          S.list()
            .title('Projects & Events')
            .items([
              listWithPreview('project', 'Projects'),
              listWithPreview('futuroSummit', 'Futuro Summits'),
            ]),
        ),

      S.divider(),

      S.listItem()
        .title('People & Collaborators')
        .icon(UsersIcon)
        .child(
          S.list()
            .title('People & Collaborators')
            .items([
              S.documentTypeListItem('person').title('People'),
              S.documentTypeListItem('alumni').title('Alumni'),
              S.documentTypeListItem('ledgerPerson').title('Ledger People'),
              S.documentTypeListItem('collaborator').title('Collaborators & Organizations'),
            ]),
        ),

      S.divider(),

      S.listItem()
        .title('Media & Content')
        .icon(VideoIcon)
        .child(
          S.list()
            .title('Media & Content')
            .items([
              listWithPreview('essay', 'Essays'),
              listWithPreview('video', 'Videos'),
              listWithPreview('podcast', 'Podcasts'),
              listWithPreview('podcastEpisode', 'Podcast Episodes'),
            ]),
        ),

      S.divider(),

      S.listItem()
        .title('Taxonomy & Settings')
        .icon(CogIcon)
        .child(
          S.list()
            .title('Taxonomy & Settings')
            .items([
              S.listItem()
                .title('Futuro Site Settings')
                .child(
                  S.document()
                    .schemaType('siteSettings_futuro')
                    .documentId('siteSettings_futuro'),
                ),
              S.documentTypeListItem('tag').title('Tags'),
            ]),
        ),

      S.divider(),

      S.listItem()
        .title('Companion Platform')
        .icon(RobotIcon)
        .child(
          S.list()
            .title('Companion Platform')
            .items([
              S.documentTypeListItem('alumniDream').title('Alumni Dreams'),
              S.documentTypeListItem('alumniConversation').title('Conversations'),
              S.documentTypeListItem('projectUpdate').title('Project Updates'),
              S.documentTypeListItem('participantConnection').title('Participant Connections'),
            ]),
        ),

      S.listItem()
        .title('NeXT Accreditation')
        .icon(StarIcon)
        .child(
          S.list()
            .title('NeXT Accreditation')
            .items([
              S.documentTypeListItem('accreditationRecord').title('Accreditation Records'),
              S.documentTypeListItem('credential').title('Credentials'),
              S.documentTypeListItem('accreditationHourLog').title('Hour Logs'),
            ]),
        ),

      S.listItem()
        .title('Platform Business')
        .icon(CreditCardIcon)
        .child(
          S.list()
            .title('Platform Business')
            .items([
              S.documentTypeListItem('pricingTier').title('Pricing Tiers'),
              S.documentTypeListItem('usageRecord').title('Usage Records'),
            ]),
        ),

      S.divider(),

      S.listItem()
        .title('All Documents (Ungrouped)')
        .icon(DocumentsIcon)
        .child(S.list().title('All Documents (Ungrouped)').items(ungroupedDocItems)),
    ])
}

export default deskStructure