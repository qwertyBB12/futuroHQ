#!/usr/bin/env node
import { createClient } from '@sanity/client'

const client = createClient({
  projectId: 'fo6n8ceo',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_TOKEN,
  useCdn: false,
})

const docs = await client.fetch('*[_type == "alumni" && name == "Laura Miller"]{_id}')
if (!docs.length) { console.log('NOT FOUND'); process.exit(1) }

await client.patch(docs[0]._id).set({
  bio: 'Laura Miller is originally from Barranquilla, Colombia. She participated in the Futuro MMXIX cohort at Georgetown University as an emerging leader. Laura is a psychologist in formation at Universidad del Norte, with additional studies at Universidad de Santiago de Compostela in Spain. Her work spans educational, clinical, and community psychology — with a particular focus on emotional wellbeing, mental health promotion, and designing interventions that generate social impact. Her project explored the intersection of psychology and virtuality, envisioning how digital environments can serve as vehicles for therapeutic and community-building initiatives across the Americas.',
  projectTitle: 'Psychology & Virtual Wellbeing',
  cohortYear: 2019,
  generation: 'emerging',
}).commit()

console.log('UPDATED: Laura Miller')
