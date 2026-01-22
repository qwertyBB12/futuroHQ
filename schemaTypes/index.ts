// --- Core ---
import alumni from './alumni'
import alumniContinuum from './alumniContinuum'
import collaborator from './collaborator'
import ledgerPerson from './ledgerPerson'
import opEd from './opEd'
import essay from './essay'
import person from './person'
import project from './project'
import siteSettings_futuro from './siteSettings_futuro'
import futuroSummit from './futuroSummit'

// --- Media / Publishing ---
import podcast from './podcast'
import podcastEpisode from './podcastEpisode'
import vlog from './vlog'
import video from './video'
import curatedPost from './curatedPost'
import socialPost from './socialPost'
import tag from './tag'

// --- Shared Objects ---
import mediaBlock from './mediaBlock'
import narrativeBlock from './narrativeBlock'
import seoBlock from './seoBlock'

// --- Export combined schema array ---
export const schemaTypes = [
  // Core
  alumni,
  alumniContinuum,
  collaborator,
  ledgerPerson,
  opEd,
  essay,
  person,
  project,
  siteSettings_futuro,
  futuroSummit,

  // Media / Publishing
  podcast,
  podcastEpisode,
  vlog,
  video,
  curatedPost,
  socialPost,
  tag,

  // Shared Objects
  mediaBlock,
  narrativeBlock,
  seoBlock,
]
