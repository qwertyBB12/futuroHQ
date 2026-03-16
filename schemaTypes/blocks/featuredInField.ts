import {defineField} from 'sanity'

/**
 * featuredIn — people who appear in or are featured by this content.
 * Import and spread in the schema fields array of content types.
 */
export const featuredInField = defineField({
  name: 'featuredIn',
  title: 'Featured In',
  type: 'array',
  of: [
    {
      type: 'reference',
      to: [
        {type: 'alumni'},
        {type: 'person'},
        {type: 'ledgerPerson'},
        {type: 'collaborator'},
      ],
    },
  ],
  description: 'People who appear in or are featured by this content',
})
