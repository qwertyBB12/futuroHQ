import {defineField} from 'sanity'
import {SURFACE_SITES} from '../../lib/constants'

/**
 * surfaceOn — which ecosystem sites should display this content.
 * Import and include in schema fields array. Add a 'distribution' group to the schema.
 */
export const surfaceOnField = defineField({
  name: 'surfaceOn',
  title: 'Surface On',
  type: 'array',
  of: [{type: 'string'}],
  group: 'distribution',
  options: {
    list: [...SURFACE_SITES],
    layout: 'grid',
  },
  description: 'Which ecosystem sites should display this content',
})
