import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'mediaBlock',
  title: 'Media Block',
  type: 'object',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string' }),

    defineField({
      name: 'assetType',
      title: 'Asset Type',
      type: 'string',
      options: {
        list: [
          { title: 'Video', value: 'video' },
          { title: 'Audio', value: 'audio' },
          { title: 'Image', value: 'image' },
        ]
      }
    }),

    defineField({
      name: 'platform',
      title: 'Platform',
      type: 'string',
      options: {
        list: [
          { title: 'Wistia', value: 'wistia' },
          { title: 'YouTube', value: 'youtube' },
          { title: 'Vimeo', value: 'vimeo' },
          { title: 'Spotify', value: 'spotify' },
          { title: 'SoundCloud', value: 'soundcloud' },
          { title: 'Other', value: 'other' },
        ]
      }
    }),

    defineField({
      name: 'platformId',
      title: 'Platform ID',
      type: 'string',
      description: 'e.g. Wistia hashed ID like vlrgj43xjo or YouTube video ID'
    }),

    defineField({
      name: 'thumbnail',
      title: 'Thumbnail',
      type: 'image',
      options: { hotspot: true }
    }),

    defineField({
      name: 'altText',
      title: 'Alt Text',
      type: 'string',
      description: 'Accessibility description for thumbnail (important for SEO & screen readers)'
    }),

    defineField({
      name: 'customPlayButton',
      title: 'Custom Play Button',
      type: 'image',
      description: 'Optional override for play button overlay'
    }),

    defineField({
      name: 'playerColor',
      title: 'Player Color',
      type: 'string',
      initialValue: '1B2A41',
      description: 'Defaults to Hoya Blue (#1B2A41)'
    }),

    defineField({
      name: 'embedCode',
      title: 'Embed Code (manual override)',
      type: 'text',
      description: 'Paste raw iframe/HTML (e.g. with custom play button overlay)'
    })
  ],

  preview: {
    select: { 
      title: 'title', 
      platform: 'platform', 
      platformId: 'platformId', 
      assetType: 'assetType' 
    },
    prepare({ title, platform, platformId, assetType }) {
      const subtitle = [
        assetType || 'Unspecified',
        platform || 'Unknown',
        platformId ? `(${platformId})` : ''
      ].filter(Boolean).join(' – ')

      return {
        title: title || 'Untitled Media',
        subtitle
      }
    }
  }
})