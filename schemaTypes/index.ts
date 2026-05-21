// --- Core ---
import alumni from './alumni'
import collaborator from './collaborator'
import ledgerPerson from './ledgerPerson'
import essay from './essay'
import person from './person'
import project from './project'
import siteSettings_futuro from './siteSettings_futuro'
import siteSettings_hector from './siteSettings_hector'
import siteSettings_benext from './siteSettings_benext'
import siteSettings_next from './siteSettings_next'
import siteSettings_mitikah from './siteSettings_mitikah'
import siteSettings_medikah from './siteSettings_medikah'
import siteSettings_arkah from './siteSettings_arkah'
import futuroSummit from './futuroSummit'
import news from './news'
import impactMetric from './impactMetric'
import pageContent_hhl_about from './pageContent_hhl_about'

// --- Media / Publishing ---
import podcast from './podcast'
import podcastEpisode from './podcastEpisode'
import video from './video'
import socialPost from './socialPost'
import tag from './tag'

// --- Shared Objects ---
import mediaBlock from './mediaBlock'
import narrativeBlock from './narrativeBlock'
import seoBlock from './seoBlock'

// --- Enrollment ---
import enrollee from './enrollee'

// --- Companion Platform ---
import alumniDream from './alumniDream'
import alumniConversation from './alumniConversation'
import projectUpdate from './projectUpdate'
import participantConnection from './participantConnection'

// --- NeXT Accreditation ---
import accreditationRecord from './accreditationRecord'
import credential from './credential'
import accreditationHourLog from './accreditationHourLog'

// --- Platform Business ---
import pricingTier from './pricingTier'
import usageRecord from './usageRecord'

// --- Archived (2026-05-20) ---
// The following schemas were moved to ../_deprecated_schemas/ (outside the
// schemaTypes/ tree so Sanity's manifest extractor doesn't scan them) after
// a usage audit showed zero reads in any app or query and zero writes from
// any code path:
//   alumniContinuum, curatedPost, decision, opEd, recruitmentAsset,
//   keynote (superseded by `video.contentCategory == "keynote"`),
//   vlog (superseded by `video.videoFormat == "shortform"`).
// See .planning/notes/audit-sanity-schema-2026-05-20.md in hector-ecosystem.
// Existing documents of these types are preserved in the dataset — only the
// schema definitions are unregistered so they stop appearing in the Studio.

// --- Export combined schema array ---
export const schemaTypes = [
  // Core
  alumni,
  collaborator,
  ledgerPerson,
  essay,
  person,
  project,
  siteSettings_futuro,
  siteSettings_hector,
  siteSettings_benext,
  siteSettings_next,
  siteSettings_mitikah,
  siteSettings_medikah,
  siteSettings_arkah,
  futuroSummit,
  news,
  impactMetric,
  pageContent_hhl_about,

  // Enrollment
  enrollee,

  // Media / Publishing
  podcast,
  podcastEpisode,
  video,
  socialPost,
  tag,

  // Companion Platform
  alumniDream,
  alumniConversation,
  projectUpdate,
  participantConnection,

  // NeXT Accreditation
  accreditationRecord,
  credential,
  accreditationHourLog,

  // Platform Business
  pricingTier,
  usageRecord,

  // Shared Objects
  mediaBlock,
  narrativeBlock,
  seoBlock,
]
