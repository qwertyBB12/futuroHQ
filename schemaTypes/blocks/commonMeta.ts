import {defineField} from 'sanity'

export const commonMeta = [
  defineField({
    name: 'publish',
    title: 'Publish?',
    type: 'boolean',
    initialValue: true,
    description: 'Toggle visibility across the ecosystem',
  }),
  defineField({
    name: 'order',
    title: 'Order',
    type: 'number',
    description: 'Controls manual ordering across lists',
  }),
  defineField({
    name: 'publishedAt',
    title: 'Published At',
    type: 'datetime',
    initialValue: () => new Date().toISOString(),
    description: 'Canonical publish timestamp (used for scheduling & feeds)',
  }),
  defineField({
    name: 'updatedAt',
    title: 'Updated At',
    type: 'datetime',
    description: 'Last significant update',
  }),
  defineField({
    name: 'ai_derivatives',
    title: 'AI Derivatives',
    type: 'object',
    fields: [
      {name: 'summary', title: 'Summary', type: 'text'},
      {name: 'quotes', title: 'Quotes', type: 'array', of: [{type: 'string'}]},
      {name: 'captions', title: 'Captions', type: 'array', of: [{type: 'string'}]},
    ],
  }),
  defineField({
    name: 'distribution',
    title: 'Distribution (Links)',
    type: 'array',
    of: [{type: 'url'}],
  }),
  defineField({
    name: 'analytics',
    title: 'Analytics',
    type: 'object',
    fields: [
      {name: 'views', title: 'Views', type: 'number'},
      {name: 'likes', title: 'Likes', type: 'number'},
      {name: 'shares', title: 'Shares', type: 'number'},
      {name: 'source', title: 'Source', type: 'string'},
    ],
  }),
]
