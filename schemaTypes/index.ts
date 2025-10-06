// --- Core ---
import alumni from './alumni'
import collaborator from './collaborator'
import ledgerPerson from './ledgerPerson'
import opEd from './opEd'
import person from './person'
import project from './project'

// --- Media / Publishing ---
import podcast from './podcast'
import podcastEpisode from './podcastEpisode'
import vlog from './vlog'
import clip from './clip'
import curatedPost from './curatedPost'
import socialPost from './socialPost'

// --- Shared Objects ---
import mediaBlock from './mediaBlock'
import narrativeBlock from './narrativeBlock'
import seoBlock from './seoBlock'

// --- Export combined schema array ---
export const schemaTypes = [
  // Core
  alumni,
  collaborator,
  ledgerPerson,
  opEd,
  person,
  project,
  
  // Media / Publishing
  podcast,
  podcastEpisode,
  vlog,
  clip,
  curatedPost,
  socialPost,

  // Shared Objects
  mediaBlock,
  narrativeBlock,
  seoBlock,
]