import {useState} from 'react'
import type {DocumentActionComponent} from 'sanity'
import {RocketIcon} from '@sanity/icons'

/**
 * Trigger a Netlify deploy for the ecosystem site(s) relevant to this document.
 * Uses SANITY_STUDIO_NETLIFY_BUILD_HOOK_URL env var.
 */
export const TriggerDeployAction: DocumentActionComponent = (props) => {
  const [deploying, setDeploying] = useState(false)

  const hookUrl =
    typeof process !== 'undefined'
      ? process.env.SANITY_STUDIO_NETLIFY_BUILD_HOOK_URL
      : undefined

  if (!hookUrl) return null

  return {
    label: deploying ? 'Deploying…' : 'Deploy to Sites',
    icon: RocketIcon,
    disabled: deploying,
    title: 'Trigger a new build on Netlify for ecosystem sites',
    onHandle: async () => {
      setDeploying(true)
      try {
        await fetch(hookUrl, {method: 'POST'})
      } catch {
        // Silently fail — Netlify hook is fire-and-forget
      } finally {
        setDeploying(false)
      }
    },
  }
}
