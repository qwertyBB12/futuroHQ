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
        {type: 'news'},
        // `keynote` and `opEd` were archived (2026-05-20); use `video` with
        // contentCategory='keynote' and `essay` with category='op-ed' instead.
      ],
    },
  ],
  description: 'Content where this person is featured or appears',
})
