#!/usr/bin/env node
import { createClient } from '@sanity/client'

const client = createClient({
  projectId: 'fo6n8ceo',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_TOKEN,
  useCdn: false,
})

const docs = await client.fetch('*[_type == "alumni" && name == "Samuel Rios"]{_id}')
if (!docs.length) { console.log('NOT FOUND'); process.exit(1) }

await client.patch(docs[0]._id).set({
  bio: `Samuel Ulisses Rios Barrias is originally from Panama City, Panama. He participated in the Futuro MMXIX cohort at Georgetown University as an emerging leader. Samuel is pursuing a Licenciatura en Gastronomía at Universidad de Panamá, driven by a vision of opening his own restaurant after gaining experience across the industry. His project explored the intersection of food, culture, and technology — developing approaches to food preservation that address extreme conditions including aviation and remote environments. Samuel represents the conviction that culinary innovation is a vehicle for cultural diplomacy and practical problem-solving across the Americas.`,
}).commit()

console.log('UPDATED: Samuel Rios')
