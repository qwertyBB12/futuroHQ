import {Card, Stack, Heading, Text, Flex, Box, Badge, Grid} from '@sanity/ui'
import type {ComponentType} from 'react'

type SeoAuditViewProps = {
  document?: {
    displayed?: Record<string, any> | null
  }
}

type Check = {
  label: string
  status: 'pass' | 'warn' | 'fail'
  detail: string
}

function runChecks(data: Record<string, any>): Check[] {
  const checks: Check[] = []
  const seo = data.seo as Record<string, any> | undefined
  const title = (data.title as string) || ''
  const slug = data.slug?.current || seo?.slug?.current || ''
  const titleTag = (seo?.titleTag as string) || ''
  const metaDescription = (seo?.metaDescription as string) || ''
  const socialImage = seo?.socialImage
  const keywords = (seo?.keywords as string[]) || []
  const excerpt = (data.excerpt as string) || (data.description as string) || ''
  const coverImage = data.coverImage || data.thumbnailImage

  // Title
  if (!title) {
    checks.push({label: 'Document Title', status: 'fail', detail: 'Missing title'})
  } else if (title.length > 70) {
    checks.push({label: 'Document Title', status: 'warn', detail: `${title.length} chars — consider shortening to under 70`})
  } else {
    checks.push({label: 'Document Title', status: 'pass', detail: `${title.length} chars`})
  }

  // Slug
  if (!slug) {
    checks.push({label: 'Slug', status: 'fail', detail: 'No slug set'})
  } else if (slug.includes(' ') || slug !== slug.toLowerCase()) {
    checks.push({label: 'Slug', status: 'warn', detail: 'Slug should be lowercase with hyphens'})
  } else {
    checks.push({label: 'Slug', status: 'pass', detail: slug})
  }

  // Title Tag
  if (!titleTag) {
    checks.push({label: 'SEO Title Tag', status: 'warn', detail: 'Not set — will fall back to document title'})
  } else if (titleTag.length > 60) {
    checks.push({label: 'SEO Title Tag', status: 'warn', detail: `${titleTag.length} chars — keep under 60`})
  } else {
    checks.push({label: 'SEO Title Tag', status: 'pass', detail: `${titleTag.length} chars`})
  }

  // Meta Description
  if (!metaDescription) {
    checks.push({label: 'Meta Description', status: 'fail', detail: 'Missing — critical for search snippets'})
  } else if (metaDescription.length > 160) {
    checks.push({label: 'Meta Description', status: 'warn', detail: `${metaDescription.length} chars — may be truncated (keep under 160)`})
  } else if (metaDescription.length < 50) {
    checks.push({label: 'Meta Description', status: 'warn', detail: `${metaDescription.length} chars — too short (aim for 50-160)`})
  } else {
    checks.push({label: 'Meta Description', status: 'pass', detail: `${metaDescription.length} chars`})
  }

  // Social Image
  if (!socialImage && !coverImage) {
    checks.push({label: 'Social Image', status: 'fail', detail: 'No social or cover image — links will have no preview'})
  } else if (!socialImage && coverImage) {
    checks.push({label: 'Social Image', status: 'warn', detail: 'Using cover image as fallback — set a dedicated social image'})
  } else {
    checks.push({label: 'Social Image', status: 'pass', detail: 'Set'})
  }

  // Keywords
  if (keywords.length === 0) {
    checks.push({label: 'Keywords', status: 'warn', detail: 'No keywords — add 3-10 for discoverability'})
  } else if (keywords.length > 10) {
    checks.push({label: 'Keywords', status: 'warn', detail: `${keywords.length} keywords — focus on top 10`})
  } else {
    checks.push({label: 'Keywords', status: 'pass', detail: `${keywords.length} keyword${keywords.length !== 1 ? 's' : ''}`})
  }

  // Excerpt / Description
  if (!excerpt) {
    checks.push({label: 'Excerpt / Description', status: 'warn', detail: 'Missing — used for RSS feeds and previews'})
  } else {
    checks.push({label: 'Excerpt / Description', status: 'pass', detail: `${excerpt.length} chars`})
  }

  return checks
}

function getScore(checks: Check[]): number {
  if (checks.length === 0) return 0
  const points = checks.reduce((sum, c) => {
    if (c.status === 'pass') return sum + 1
    if (c.status === 'warn') return sum + 0.5
    return sum
  }, 0)
  return Math.round((points / checks.length) * 100)
}

function getScoreTone(score: number): 'positive' | 'caution' | 'critical' {
  if (score >= 80) return 'positive'
  if (score >= 50) return 'caution'
  return 'critical'
}

const STATUS_TONES: Record<string, 'positive' | 'caution' | 'critical'> = {
  pass: 'positive',
  warn: 'caution',
  fail: 'critical',
}

const SeoAuditView: ComponentType<SeoAuditViewProps> = ({document}) => {
  const data = document?.displayed

  if (!data) {
    return (
      <Card padding={4} tone="transparent">
        <Text muted>No document data available.</Text>
      </Card>
    )
  }

  const checks = runChecks(data)
  const score = getScore(checks)
  const tone = getScoreTone(score)
  const passCount = checks.filter((c) => c.status === 'pass').length
  const warnCount = checks.filter((c) => c.status === 'warn').length
  const failCount = checks.filter((c) => c.status === 'fail').length

  return (
    <Card padding={4} tone="transparent">
      <Stack space={5}>
        <Heading
          size={2}
          style={{
            fontFamily: "'Oswald', sans-serif",
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          SEO Audit
        </Heading>

        {/* Score */}
        <Flex gap={4} align="center">
          <Card padding={4} radius={2} tone={tone} border>
            <Stack space={2} style={{textAlign: 'center'}}>
              <span style={{fontSize: 36, fontWeight: 700, fontFamily: "'Oswald', sans-serif"}}>
                {score}
              </span>
              <Text size={0} muted>/ 100</Text>
            </Stack>
          </Card>
          <Stack space={2}>
            <Flex gap={2}>
              <Badge tone="positive">{passCount} pass</Badge>
              <Badge tone="caution">{warnCount} warn</Badge>
              <Badge tone="critical">{failCount} fail</Badge>
            </Flex>
            <Text size={1} muted>
              {score >= 80
                ? 'Looking good — minor improvements possible'
                : score >= 50
                  ? 'Needs attention — fill in missing SEO fields'
                  : 'Critical gaps — complete SEO metadata before publishing'}
            </Text>
          </Stack>
        </Flex>

        {/* Checks */}
        <Stack space={2}>
          <Text
            size={1}
            weight="semibold"
            style={{textTransform: 'uppercase', letterSpacing: '0.03em', color: '#8B8985'}}
          >
            Checks
          </Text>
          <Stack space={1}>
            {checks.map((check) => (
              <Card key={check.label} padding={3} radius={2} border>
                <Flex align="center" gap={3}>
                  <Box
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      backgroundColor:
                        check.status === 'pass'
                          ? '#B17E68'
                          : check.status === 'warn'
                            ? '#E8D5C0'
                            : '#C84841',
                      flexShrink: 0,
                    }}
                  />
                  <Stack space={1} style={{flex: 1}}>
                    <Text size={1} weight="semibold">
                      {check.label}
                    </Text>
                    <Text size={0} muted>
                      {check.detail}
                    </Text>
                  </Stack>
                  <Badge tone={STATUS_TONES[check.status]} mode="outline">
                    {check.status}
                  </Badge>
                </Flex>
              </Card>
            ))}
          </Stack>
        </Stack>
      </Stack>
    </Card>
  )
}

export default SeoAuditView
