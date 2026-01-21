import type { StructureBuilder } from 'sanity/structure'
import {
  ProjectsIcon,
  UsersIcon,
  VideoIcon,
  CogIcon,
  DocumentsIcon,
} from '@sanity/icons'
import LivePreview from './components/previews/LivePreview'

const groupedDocTypes = new Set([
  'project',
  'futuroSummit',
  'person',
  'alumni',
  'alumniContinuum',
  'ledgerPerson',
  'collaborator',
  'opEd',
  'podcast',
  'podcastEpisode',
  'vlog',
  'clip',
  'curatedPost',
  'socialPost',
  'substackEssay',
  'tag',
  'siteSettings_futuro',
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
              S.documentTypeListItem('alumniContinuum').title('Alumni Continuum'),
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
              listWithPreview('substackEssay', 'Substack Essays'),
              listWithPreview('opEd', 'Op-Eds'),
              listWithPreview('podcast', 'Podcasts'),
              listWithPreview('podcastEpisode', 'Podcast Episodes'),
              listWithPreview('vlog', 'Vlogs'),
              listWithPreview('clip', 'Clips'),
              S.documentTypeListItem('curatedPost').title('Curated Posts'),
              S.documentTypeListItem('socialPost').title('Social Posts'),
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
        .title('All Documents (Ungrouped)')
        .icon(DocumentsIcon)
        .child(S.list().title('All Documents (Ungrouped)').items(ungroupedDocItems)),
    ])
}

export default deskStructure
