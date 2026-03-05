import {useState} from 'react'
import type {DocumentActionComponent} from 'sanity'
import {ArchiveIcon} from '@sanity/icons'

/**
 * One-click archive: sets archivalStatus to 'alumni-only'
 * and unpublishes the document from public frontends.
 */
export const ArchiveAction: DocumentActionComponent = (props) => {
  const [confirming, setConfirming] = useState(false)
  const {patch} = props

  const doc = props.draft || props.published
  if (!doc) return null

  // Only show on documents that have governance fields
  if (!('archivalStatus' in doc)) return null

  // Don't show if already archived
  if (doc.archivalStatus === 'alumni-only') return null

  return {
    label: 'Archive to Alumni-Only',
    icon: ArchiveIcon,
    tone: 'caution',
    title: 'Move this content to alumni-only access',
    onHandle: () => {
      setConfirming(true)
    },
    dialog: confirming
      ? {
          type: 'confirm',
          message:
            'This will mark the content as Alumni-Only and set publish to false. Frontend sites will no longer display this content publicly.',
          onConfirm: () => {
            patch.execute([
              {
                set: {
                  archivalStatus: 'alumni-only',
                  publish: false,
                },
              },
            ])
            setConfirming(false)
          },
          onCancel: () => {
            setConfirming(false)
          },
        }
      : undefined,
  }
}
