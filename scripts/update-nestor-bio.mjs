#!/usr/bin/env node
import { createClient } from '@sanity/client'

const client = createClient({
  projectId: 'fo6n8ceo',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_TOKEN,
  useCdn: false,
})

const docs = await client.fetch('*[_type == "alumni" && name == "Nestor Gaytan"]{_id}')
if (!docs.length) { console.log('NOT FOUND'); process.exit(1) }

await client.patch(docs[0]._id).set({
  bio: `Néstor Abraham Gaytán Villanueva is originally from Monterrey, Mexico. He participated in the Futuro MMXIX cohort at Georgetown University as an emerging leader and has since grown into a changemaker within the ecosystem. During his time in Washington, D.C., Nestor developed "Holographic Connectivity" — a project envisioning how holographic technology could bridge societies across the Americas. He interviewed OAS Secretary General Luis Almagro and conducted research at the Library of Congress. A student of Innovation and Development Engineering at Tecnológico de Monterrey, Nestor co-founded The Bold News and conducted research on constitutional courts and populism in Latin America. He has collaborated extensively with Futuro in Mexico City and served on the alumni board. Nestor is currently a Profesionista en Desarrollo at CEMEX México — selected through the company's elite "Red de Talento" pipeline, which identifies future leadership from among hundreds of candidates.`,
  projectTitle: 'Holographic Connectivity',
}).commit()

console.log('UPDATED: Nestor Gaytan')
