// --- Core ---
import alumni from './alumni'
import collaborator from './collaborator'
import ledgerPerson from './ledgerPerson'
import essay from './essay'
import person from './person'
import project from './project'
import siteSettings_futuro from './siteSettings_futuro'
import futuroSummit from './futuroSummit'
import news from './news'
import impactMetric from './impactMetric'

// --- Media / Publishing ---
import podcast from './podcast'
import podcastEpisode from './podcastEpisode'
import video from './video'
import socialPost from './socialPost'
import opEd from './opEd'
import curatedPost from './curatedPost'
import keynote from './keynote'
import tag from './tag'

// --- Shared Objects ---
import mediaBlock from './mediaBlock'
import narrativeBlock from './narrativeBlock'
import seoBlock from './seoBlock'

// --- Enrollment ---
import enrollee from './enrollee'
import recruitmentAsset from './recruitmentAsset'

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

// --- Institutional Memory ---
import decision from './decision'

// --- Legacy (registered but hidden from desk) ---
import vlog from './vlog'
import alumniContinuum from './alumniContinuum'

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
  futuroSummit,
  news,
  impactMetric,

  // Enrollment (archive candidates — used by external enrollment system)
  enrollee,
  recruitmentAsset,

  // Media / Publishing
  podcast,
  podcastEpisode,
  video,
  socialPost,
  opEd,
  curatedPost,
  keynote,
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

  // Institutional Memory
  decision,

  // Legacy (hidden from desk)
  vlog,
  alumniContinuum,

  // Shared Objects
  mediaBlock,
  narrativeBlock,
  seoBlock,
]
