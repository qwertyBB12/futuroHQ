import { defineField } from 'sanity'
import { TranscriptSegmentsInput } from '../../components/inputs/TranscriptSegmentsInput'

/**
 * Transcript fields for video and podcastEpisode schemas.
 * Import and spread into document schemas: ...transcriptFields
 * Add the group: transcriptGroup
 *
 * Populated by the transcription pipeline (Phase 10).
 * Both fields are readOnly — editors cannot modify pipeline output.
 */
export const transcriptGroup = { name: 'transcript', title: 'Transcript' }

export const transcriptFields = [
  defineField({
    name: 'fullText',
    title: 'Full Transcript',
    type: 'text',
    description: 'Complete transcript text (populated by pipeline)',
    readOnly: true,
    rows: 10,
    group: 'transcript',
  }),

  defineField({
    name: 'speakerSegments',
    title: 'Speaker Segments',
    type: 'array',
    description: 'Speaker-diarized transcript segments (populated by pipeline)',
    readOnly: true,
    group: 'transcript',
    of: [
      {
        type: 'object',
        fields: [
          defineField({ name: 'speaker', title: 'Speaker', type: 'string' }),
          defineField({ name: 'start', title: 'Start (seconds)', type: 'number' }),
          defineField({ name: 'end', title: 'End (seconds)', type: 'number' }),
          defineField({ name: 'text', title: 'Text', type: 'text' }),
        ],
        preview: {
          select: {
            title: 'speaker',
            start: 'start',
            end: 'end',
          },
          prepare({ title, start, end }: { title?: string; start?: number; end?: number }) {
            return {
              title: title || 'Unknown Speaker',
              subtitle: `${start ?? 0}s - ${end ?? 0}s`,
            }
          },
        },
      },
    ],
    components: {
      input: TranscriptSegmentsInput,
    },
  }),
]
