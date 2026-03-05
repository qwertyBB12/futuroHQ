import {useEffect, useState} from 'react'
import {useClient} from 'sanity'
import {Stack, Heading, Text, Flex, Box} from '@sanity/ui'
import {glassPanel} from './glassStyles'

type SanityTask = {
  _id: string
  title?: string
  status?: string
  dueBy?: string
  _createdAt: string
  target?: {
    documentType?: string
  }
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = date.getTime() - now.getTime()
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24))

  if (days < 0) return `${Math.abs(days)}d overdue`
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  if (days <= 7) return `${days}d`
  return date.toLocaleDateString('en-US', {month: 'short', day: 'numeric'})
}

export default function PendingTasksWidget() {
  const client = useClient({apiVersion: '2024-10-23'})
  const [tasks, setTasks] = useState<SanityTask[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    // Sanity Tasks are stored as tasks.task documents when created via the Tasks panel
    client
      .fetch<SanityTask[]>(
        `*[_type == "tasks.task" && status != "done"] | order(coalesce(dueBy, _createdAt) asc)[0...5]{
          _id, title, status, dueBy, _createdAt,
          "target": target.document->{ "documentType": _type }
        }`,
      )
      .then((result) => {
        setTasks(result)
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [client])

  return (
    <div style={{...glassPanel, padding: 24}}>
      <Stack space={4}>
        <Heading
          size={1}
          style={{
            fontFamily: "'Oswald', sans-serif",
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          Pending Tasks
        </Heading>

        {loaded && tasks.length === 0 ? (
          <Stack space={3}>
            <Text size={1} muted>
              No open tasks.
            </Text>
            <Text size={0} muted>
              Create tasks from the Tasks panel in the navbar, or use comments on
              any document to leave notes for your future self.
            </Text>
          </Stack>
        ) : (
          <Stack space={1}>
            {tasks.map((task) => (
              <div
                key={task._id}
                style={{
                  padding: '12px 14px',
                  borderRadius: 12,
                  transition: 'background 0.2s ease',
                }}
              >
                <Flex align="center" gap={3}>
                  <Box
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor:
                        task.status === 'open' ? '#B17E68' : '#8B8985',
                      flexShrink: 0,
                    }}
                  />
                  <Stack space={1} style={{flex: 1, minWidth: 0}}>
                    <span
                      style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        display: 'block',
                        fontFamily: "'Mulish', sans-serif",
                        fontWeight: 600,
                        fontSize: 13,
                      }}
                    >
                      {task.title || 'Untitled task'}
                    </span>
                    {task.target?.documentType && (
                      <Text size={0} muted>
                        {task.target.documentType}
                      </Text>
                    )}
                  </Stack>
                  {task.dueBy && (
                    <Text
                      size={0}
                      style={{
                        flexShrink: 0,
                        color:
                          new Date(task.dueBy) < new Date()
                            ? '#C84841'
                            : '#8B8985',
                        fontWeight:
                          new Date(task.dueBy) < new Date() ? 600 : 400,
                      }}
                    >
                      {formatDate(task.dueBy)}
                    </Text>
                  )}
                </Flex>
              </div>
            ))}
          </Stack>
        )}
      </Stack>
    </div>
  )
}
