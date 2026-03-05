import {useState} from 'react'
import type {DocumentActionComponent} from 'sanity'
import {ShareIcon} from '@sanity/icons'

/**
 * Trigger social media distribution via Make.com / webhook.
 * Sends document metadata to an automation endpoint that can post to
 * LinkedIn, X/Twitter, Instagram, etc.
 */
export const SocialDistributeAction: DocumentActionComponent = (props) => {
  const [sending, setSending] = useState(false)

  const doc = props.draft || props.published
  if (!doc) return null

  // Only show on publishable content types
  const isContent = ['essay', 'video', 'podcastEpisode', 'opEd', 'curatedPost'].includes(
    props.type,
  )
  if (!isContent) return null

  const webhookUrl =
    typeof process !== 'undefined'
      ? process.env.SANITY_STUDIO_SOCIAL_WEBHOOK_URL
      : undefined

  return {
    label: sending ? 'Sending...' : 'Distribute to Social',
    icon: ShareIcon,
    disabled: sending || !webhookUrl,
    title: webhookUrl
      ? 'Send to social media automation (Make.com)'
      : 'Set SANITY_STUDIO_SOCIAL_WEBHOOK_URL to enable',
    onHandle: async () => {
      if (!webhookUrl) return

      setSending(true)
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            _id: props.id,
            _type: props.type,
            title: doc.title,
            excerpt: doc.excerpt || doc.description,
            slug: (doc.slug as any)?.current,
            narrativeOwner: doc.narrativeOwner,
            postingEntity: doc.postingEntity,
            language: doc.language || 'en',
            coverImage: doc.coverImage,
            surfaceOn: doc.surfaceOn,
            socialTargets: doc.socialTargets,
            ai_derivatives: doc.ai_derivatives,
          }),
        })
      } catch {
        // Fire and forget
      } finally {
        setSending(false)
      }
    },
  }
}
