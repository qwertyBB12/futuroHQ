import type { StructureBuilder } from 'sanity/structure'
import {
  ProjectsIcon,
  UsersIcon,
  VideoIcon,
  CogIcon,
  DocumentsIcon,
} from '@sanity/icons'

const groupedDocTypes = new Set([
  'project',
  'futuroSummit',
  'person',
  'alumni',
  'ledgerPerson',
  'collaborator',
  'opEd',
  'podcast',
  'podcastEpisode',
  'vlog',
  'clip',
  'curatedPost',
  'socialPost',
  'tag',
  'siteSettings_futuro',
])

export const deskStructure = (S: StructureBuilder) => {
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
        .title('🧩 Projects & Events')
        .icon(ProjectsIcon)
        .child(
          S.list()
            .title('Projects & Events')
            .items([
              S.documentTypeListItem('project').title('Projects'),
              S.documentTypeListItem('futuroSummit').title('Futuro Summits'),
            ]),
        ),

      S.divider(),

      S.listItem()
        .title('🧑‍🤝‍🧑 People & Collaborators')
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
        .title('📺 Media & Content')
        .icon(VideoIcon)
        .child(
          S.list()
            .title('Media & Content')
            .items([
              S.documentTypeListItem('opEd').title('Op-Eds'),
              S.documentTypeListItem('podcast').title('Podcasts'),
              S.documentTypeListItem('podcastEpisode').title('Podcast Episodes'),
              S.documentTypeListItem('vlog').title('Vlogs'),
              S.documentTypeListItem('clip').title('Clips'),
              S.documentTypeListItem('curatedPost').title('Curated Posts'),
              S.documentTypeListItem('socialPost').title('Social Posts'),
            ]),
        ),

      S.divider(),

      S.listItem()
        .title('🏷️ Taxonomy & Settings')
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
        .title('📄 All Documents (Ungrouped)')
        .icon(DocumentsIcon)
        .child(
          S.list()
            .title('All Documents (Ungrouped)')
            .items(ungroupedDocItems),
        ),
    ])
}

export default deskStructure
