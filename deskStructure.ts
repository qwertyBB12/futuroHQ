import { StructureBuilder } from 'sanity/structure'

const groupedDocTypes = [
  'siteSettings_futuro',
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
]

export const deskStructure = (S: StructureBuilder) =>
  S.list()
    .title('BeNeXT HQ')
    .items([
      S.listItem()
        .title('📌 Singleton Settings')
        .child(
          S.list()
            .title('Singleton Settings')
            .items([
              S.listItem()
                .title('Futuro Site Settings')
                .child(
                  S.document()
                    .schemaType('siteSettings_futuro')
                    .documentId('siteSettings_futuro'),
                ),
            ]),
        ),

      S.divider(),

      S.listItem()
        .title('🧩 Projects & Events')
        .child(
          S.list()
            .title('Projects & Events')
            .items([
              S.documentTypeListItem('project').title('Projects'),
              S.documentTypeListItem('futuroSummit').title('Futuro Summits'),
            ]),
        ),

      S.listItem()
        .title('🧑‍🤝‍🧑 People & Collaborators')
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

      S.listItem()
        .title('📺 Media & Content')
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

      S.listItem()
        .title('🏷️ Taxonomy & Metadata')
        .child(
          S.list()
            .title('Taxonomy & Metadata')
            .items([S.documentTypeListItem('tag').title('Tags')]),
        ),

      S.listItem()
        .title('🧱 Reusable Blocks')
        .child(
          S.list()
            .title('Reusable Blocks')
            .items([
              S.listItem()
                .title('mediaBlock (object type)')
                .child(
                  S.component()
                    .title('mediaBlock')
                    .component(() => 'Object schema; reusable via field selectors'),
                ),
              S.listItem()
                .title('narrativeBlock (object type)')
                .child(
                  S.component()
                    .title('narrativeBlock')
                    .component(() => 'Object schema; reusable via field selectors'),
                ),
              S.listItem()
                .title('seoBlock (object type)')
                .child(
                  S.component()
                    .title('seoBlock')
                    .component(() => 'Object schema; reusable via field selectors'),
                ),
            ]),
        ),

      S.divider(),

      S.listItem()
        .title('📄 All Documents')
        .child(
          S.list()
            .title('All Documents')
            .items(
              S.documentTypeListItems().filter(
                (listItem) => !groupedDocTypes.includes(listItem.getId() || ''),
              ),
            ),
        ),
    ])

export default deskStructure
