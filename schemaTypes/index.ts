// --- Core ---
import alumni from './alumni'
import alumniContinuum from './alumniContinuum'
import collaborator from './collaborator'
import ledgerPerson from './ledgerPerson'
import opEd from './opEd'
import person from './person'
import project from './project'
import siteSettings_futuro from './siteSettings_futuro'
import futuroSummit from './futuroSummit'

// --- Media / Publishing ---
import podcast from './podcast'
import podcastEpisode from './podcastEpisode'
import vlog from './vlog'
import clip from './clip'
import curatedPost from './curatedPost'
import socialPost from './socialPost'
import substackEssay from './substackEssay'
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
  person,
  project,
  siteSettings_futuro,
  futuroSummit,

  // Media / Publishing
  podcast,
  podcastEpisode,
  vlog,
  clip,
  curatedPost,
  socialPost,
  substackEssay,
  tag,

  // Shared Objects
  mediaBlock,
  narrativeBlock,
  seoBlock,
]
