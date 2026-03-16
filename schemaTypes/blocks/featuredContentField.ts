import {defineField} from 'sanity'

/**
 * featuredContent — content where this person is featured or appears.
 * Import and spread in the schema fields array of people types.
 */
export const featuredContentField = defineField({
  name: 'featuredContent',
  title: 'Featured Content',
  type: 'array',
  of: [
    {
      type: 'reference',
      to: [
        {type: 'video'},
        {type: 'essay'},
        {type: 'podcast'},
        {type: 'podcastEpisode'},
        {type: 'keynote'},
        {type: 'opEd'},
        {type: 'news'},
      ],
    },
  ],
  description: 'Content where this person is featured or appears',
})
