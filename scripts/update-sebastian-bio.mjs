#!/usr/bin/env node
import { createClient } from '@sanity/client'

const client = createClient({
  projectId: 'fo6n8ceo',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_TOKEN,
  useCdn: false,
})

await client.patch('5128cea2-70ff-4dbc-b777-4ed5bb159b44').set({
  bio: `Sebastian Gonzalez is originally from Panama City, Panama. He participated in the Futuro MMXIX cohort at Georgetown University as an emerging leader through the Music Las Americas track. Sebastian collaborated closely with fellow alumni Diego Hernandez and Pavel Osorio on projects exploring how music can serve as a vehicle for cultural diplomacy and hemispheric connection. His work reflects a vision of the arts as a bridge between communities across the Americas.`,
  projectTitle: 'Music Las Americas',
  cohortYear: 2019,
  generation: 'emerging',
}).commit()

console.log('UPDATED: Sebastian Gonzalez')
