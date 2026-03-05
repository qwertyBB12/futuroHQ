import {useEffect, useState} from 'react'
import {useClient} from 'sanity'
import {Card, Stack, Heading, Text, Grid, Flex, Box, Badge} from '@sanity/ui'
import type {ComponentType} from 'react'

type GovernanceViewProps = {
  document?: {
    displayed?: Record<string, unknown> | null
  }
  schemaType?: {
    name?: string
  }
}

const ENTITY_COLORS: Record<string, string> = {
  hector: '#B17E68',
  benext: '#C84841',
  futuro: '#C84841',
  next: '#B17E68',
  mitikah: '#8B8985',
  medikah: '#2C7A8C',
}

const ENTITY_LABELS: Record<string, string> = {
  hector: 'Hector H. Lopez',
  benext: 'BeNeXT Global',
  futuro: 'Futuro',
  next: 'NeXT Credentialing',
  mitikah: 'Mitikah Advisory',
  medikah: 'Medikah Healthcare',
}

const TIER_LABELS: Record<string, string> = {
  canonical: 'Canonical (Substack, Website)',
  personal: 'Personal (YouTube, Podcast)',
  distribution: 'Distribution (LinkedIn, Medium)',
  institutional: 'Institutional (BeNeXT, Futuro)',
}

const ARCHIVAL_LABELS: Record<string, string> = {
  ephemeral: 'Ephemeral (temporary, social-first)',
  archival: 'Archival (permanent, evergreen)',
  'alumni-only': 'Alumni-Only (restricted)',
}

function GovernanceField({label, value, color}: {label: string; value?: string; color?: string}) {
  if (!value) {
    return (
      <Card padding={3} radius={2} border>
        <Stack space={2}>
          <Text size={0} muted style={{textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600}}>
            {label}
          </Text>
          <Text size={1} muted>Not set</Text>
        </Stack>
      </Card>
    )
  }

  return (
    <Card padding={3} radius={2} border>
      <Stack space={2}>
        <Text size={0} muted style={{textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600}}>
          {label}
        </Text>
        <Flex align="center" gap={2}>
          {color && (
            <Box style={{width: 10, height: 10, borderRadius: '50%', backgroundColor: color, flexShrink: 0}} />
          )}
          <Text size={1} weight="semibold">{value}</Text>
        </Flex>
      </Stack>
    </Card>
  )
}

const GovernanceView: ComponentType<GovernanceViewProps> = ({document}) => {
  const data = document?.displayed

  if (!data) {
    return (
      <Card padding={4} tone="transparent">
        <Text muted>No document data available.</Text>
      </Card>
    )
  }

  const owner = data.narrativeOwner as string | undefined
  const tier = data.platformTier as string | undefined
  const archival = data.archivalStatus as string | undefined
  const entity = data.postingEntity as string | undefined
  const tracking = data.conversionTracking as Record<string, unknown> | undefined
  const surfaceOn = data.surfaceOn as string[] | undefined
  const publish = data.publish as boolean | undefined
  const fiveYear = data.fiveYearTest as boolean | undefined

  return (
    <Card padding={4} tone="transparent">
      <Stack space={5}>
        <Heading size={2} style={{fontFamily: "'Oswald', sans-serif", textTransform: 'uppercase', letterSpacing: '0.05em'}}>
          Governance Overview
        </Heading>

        {/* Entity & Ownership */}
        <Stack space={3}>
          <Text size={1} weight="semibold" style={{textTransform: 'uppercase', letterSpacing: '0.03em', color: '#8B8985'}}>
            Ownership & Voice
          </Text>
          <Grid columns={[1, 2]} gap={3}>
            <GovernanceField
              label="Narrative Owner"
              value={owner ? ENTITY_LABELS[owner] || owner : undefined}
              color={owner ? ENTITY_COLORS[owner] : undefined}
            />
            <GovernanceField
              label="Posting Entity"
              value={entity}
            />
          </Grid>
        </Stack>

        {/* Classification */}
        <Stack space={3}>
          <Text size={1} weight="semibold" style={{textTransform: 'uppercase', letterSpacing: '0.03em', color: '#8B8985'}}>
            Classification
          </Text>
          <Grid columns={[1, 2]} gap={3}>
            <GovernanceField
              label="Platform Tier"
              value={tier ? TIER_LABELS[tier] || tier : undefined}
            />
            <GovernanceField
              label="Archival Status"
              value={archival ? ARCHIVAL_LABELS[archival] || archival : undefined}
            />
          </Grid>
        </Stack>

        {/* Publication */}
        <Stack space={3}>
          <Text size={1} weight="semibold" style={{textTransform: 'uppercase', letterSpacing: '0.03em', color: '#8B8985'}}>
            Publication
          </Text>
          <Grid columns={[1, 2, 3]} gap={3}>
            <Card padding={3} radius={2} border>
              <Stack space={2}>
                <Text size={0} muted style={{textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600}}>
                  Published
                </Text>
                <Badge tone={publish ? 'positive' : 'caution'}>
                  {publish ? 'Yes' : 'No'}
                </Badge>
              </Stack>
            </Card>
            {typeof fiveYear === 'boolean' && (
              <Card padding={3} radius={2} border>
                <Stack space={2}>
                  <Text size={0} muted style={{textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600}}>
                    Five Year Test
                  </Text>
                  <Badge tone={fiveYear ? 'positive' : 'caution'}>
                    {fiveYear ? 'Passes' : 'Not yet'}
                  </Badge>
                </Stack>
              </Card>
            )}
          </Grid>
        </Stack>

        {/* Surface On */}
        {surfaceOn && surfaceOn.length > 0 && (
          <Stack space={3}>
            <Text size={1} weight="semibold" style={{textTransform: 'uppercase', letterSpacing: '0.03em', color: '#8B8985'}}>
              Surfaced On
            </Text>
            <Flex gap={2} wrap="wrap">
              {surfaceOn.map((site) => (
                <Badge key={site} tone="primary" mode="outline">
                  {site}
                </Badge>
              ))}
            </Flex>
          </Stack>
        )}

        {/* Conversion Tracking */}
        {tracking && (
          <Stack space={3}>
            <Text size={1} weight="semibold" style={{textTransform: 'uppercase', letterSpacing: '0.03em', color: '#8B8985'}}>
              Conversion Tracking
            </Text>
            <Grid columns={[1, 2, 3]} gap={3}>
              {tracking.sourceChannel && (
                <GovernanceField label="Source Channel" value={tracking.sourceChannel as string} />
              )}
              {tracking.destinationAction && (
                <GovernanceField label="Destination" value={tracking.destinationAction as string} />
              )}
              {tracking.conversionRate != null && (
                <GovernanceField label="Conversion Rate" value={`${tracking.conversionRate}%`} />
              )}
              {tracking.utmCampaign && (
                <GovernanceField label="UTM Campaign" value={tracking.utmCampaign as string} />
              )}
              {tracking.ctaUsed && (
                <GovernanceField label="CTA Used" value={tracking.ctaUsed as string} />
              )}
            </Grid>
          </Stack>
        )}
      </Stack>
    </Card>
  )
}

export default GovernanceView
