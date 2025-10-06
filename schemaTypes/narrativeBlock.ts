import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'narrativeBlock',
  title: 'Narrative Development',
  type: 'object',
  fields: [
    defineField({
      name: 'openingPortrait',
      title: 'Opening Portrait',
      type: 'text',
      description: '2–3 sentence cinematic reveal',
    }),
    defineField({
      name: 'originSignal',
      title: 'Origin Signal',
      type: 'text',
      description: 'Early life, education, inflection points',
    }),
    defineField({
      name: 'strategicIdentity',
      title: 'Strategic Identity',
      type: 'text',
      description: 'Archetype, pressure response, differentiator',
    }),
    defineField({
      name: 'alignmentGrid',
      title: 'Futuro Alignment Grid',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'pillar', title: 'Pillar', type: 'string' },
            { name: 'signal', title: 'Signal', type: 'string' },
            { name: 'order', title: 'Order', type: 'number' }, // ✅ new
          ],
        },
      ],
    }),
    defineField({
      name: 'soulmarkSignals',
      title: 'Soulmark Signals',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Humanizing details (hobbies, quirks, cultural markers)',
    }),
    defineField({
      name: 'doctrinalLens',
      title: 'Doctrinal Lens',
      type: 'text',
      description: 'Their philosophy or values in action',
    }),
    defineField({
      name: 'animaKey',
      title: 'Anima Key',
      type: 'string',
      description: 'Quote, symbolic phrase, or key story beat',
    }),
    defineField({
      name: 'whyTheyBelong',
      title: 'Why They Belong',
      type: 'array',
      of: [{ type: 'string' }],
      description: '1–2 lines connecting them back to Futuro',
    }),
    defineField({
      name: 'engagementProtocol',
      title: 'Engagement Protocol',
      type: 'text',
      description: 'Guidance on how to engage / suggested openers',
    }),
    defineField({
      name: 'legacyVector',
      title: 'Legacy Vector',
      type: 'text',
      description: 'Where their work points; horizon ahead',
    }),
    defineField({
      name: 'countercurrents',
      title: 'Countercurrents',
      type: 'text',
      description: 'Obstacles they face and their responses',
    }),
    defineField({
      name: 'ethosValues',
      title: 'Ethos & Values',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'futuroEcho',
      title: 'Futuro Echo',
      type: 'text',
      description: 'How their journey reflects Futuro DNA',
    }),
  ],

  preview: {
    select: { title: 'openingPortrait', subtitle: 'animaKey' },
    prepare({ title, subtitle }) {
      return {
        title: title ? title.slice(0, 50) + '…' : 'Narrative Block',
        subtitle: subtitle || '—',
      }
    }
  }
})