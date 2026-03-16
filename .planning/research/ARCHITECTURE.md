# Architecture Patterns

**Domain:** Sanity Studio v5 — Content Enrichment, Cross-Site Surfacing, Media Pipeline
**Researched:** 2026-03-16
**Confidence:** HIGH (based on direct codebase reading + verified Sanity/Backblaze/Bunny docs)

---

## Existing Architecture (Baseline)

The studio is a React 19 + Sanity v5.13.0 TypeScript SPA with a well-established layered structure:

```
sanity.config.ts
  ├── sharedConfig (spread into production + staging workspaces)
  │   ├── plugins: structureTool(deskStructure), visionTool, assist, media
  │   ├── schema: schemaTypes (33 document types + 3 shared object types)
  │   ├── studio.components: StudioLogo, MyNavbar, StudioHead
  │   ├── tools: DashboardLayout (custom tool at position 0)
  │   └── document: badges(context) + actions(context) — gated by GOVERNED_TYPES Set
  │
  ├── deskStructure.ts
  │   └── 4 tiers: Writer's Desk / Daily / Programs & Projects / System
  │       └── documentViews(schemaType) → Content + Preview + Governance + References + SEO
  │
  └── schemaTypes/
      ├── blocks/governanceBlock.ts  ← ...spread pattern (5 fields)
      ├── blocks/commonMeta.ts       ← ...spread pattern
      ├── mediaBlock.ts              ← object type with custom input component
      ├── seoBlock.ts                ← object type with custom input component
      └── [33 document types]
```

**Key architectural invariant:** `GOVERNED_TYPES` Set in `sanity.config.ts` controls badge + action registration. A parallel `GOVERNED_TYPES` Set in `deskStructure.ts` controls view pane assignment. These two sets are currently slightly divergent (alumniContinuum missing from config's GOVERNED_TYPES — known debt).

---

## New Feature Integration Map

### Feature 1: Enrichment Tooling

**What it is:** Completeness indicators on individual documents, filtered desk lists for incomplete records, batch operation support, enrichment summary widget in the dashboard.

**Integration point: Document-level completeness indicator**

Sanity Studio v5 supports a document-level "form" component via the schema's `components.input` property. This is the same API used by `mediaBlock.ts` (`components: { input: MediaBlockInput }`). For document types, the component receives `DocumentInputProps` (which extends `ObjectInputProps`) and can wrap `renderDefault(props)` with an additional progress bar rendered above the form.

Pattern:
```typescript
// schemaTypes/video.ts
export default defineType({
  name: 'video',
  components: {
    input: VideoCompletenessInput,   // <-- new wrapper component
  },
  fields: [...],
})
```

```typescript
// components/inputs/CompletenessInput.tsx
// Generic factory: takes required field names, returns a wrapped input component
export function makeCompletenessInput(requiredFields: string[]) {
  return function CompletenessInput(props: ObjectInputProps) {
    const doc = props.value as Record<string, unknown> | undefined
    const filled = requiredFields.filter(f => doc?.[f] != null && doc[f] !== '')
    const pct = Math.round((filled.length / requiredFields.length) * 100)
    return (
      <Stack space={3}>
        <CompletenessBar percent={pct} filled={filled.length} total={requiredFields.length} />
        {props.renderDefault(props)}
      </Stack>
    )
  }
}
```

Each content type gets its own completeness definition (different required fields per type). `video` requires: title, slug, videoUrl, thumbnailImage, description, tags, seo, surfaceOn. `alumni` requires: name, slug, bio, cohortYear, generation, media.

**Integration point: Filtered desk lists ("Needs Enrichment" views)**

The existing `deskStructure.ts` uses `S.documentList().filter(groq).params({})` pattern — already demonstrated in the Writer's Desk tier (30-day filter). New filtered list items slot into the existing tier structure as sub-items under each content type list.

Pattern (add inside each `listWithPreview` block or alongside it):
```typescript
// In deskStructure.ts — alongside listWithPreview('video', 'Videos')
S.listItem()
  .title('Videos — Needs Enrichment')
  .schemaType('video')
  .child(
    S.documentList()
      .title('Videos — Needs Enrichment')
      .filter('_type == "video" && (defined(videoUrl) == false || defined(thumbnailImage) == false || defined(seo) == false)')
      .defaultOrdering([{field: '_updatedAt', direction: 'desc'}])
  )
```

These are additive items — they do not change existing structure, they append.

**Integration point: Enrichment dashboard widget**

A new `EnrichmentWidget.tsx` slots into `DashboardLayout.tsx` following the existing widget grid pattern (`Grid columns={[1,1,2]}`). It uses `useClient` + GROQ with `count()` to show per-type completion rates. This is purely additive — no changes to existing widgets.

The widget queries patterns like:
```groq
{
  "videoTotal": count(*[_type == "video"]),
  "videoWithThumbnail": count(*[_type == "video" && defined(thumbnailImage)]),
  "videoWithSEO": count(*[_type == "video" && defined(seo.title)]),
  "alumniTotal": count(*[_type == "alumni"]),
  "alumniWithBio": count(*[_type == "alumni" && defined(bio) && length(bio) > 20]),
  "alumniWithPhoto": count(*[_type == "alumni" && defined(media) && length(media) > 0])
}
```

**Component boundaries:**
- `CompletenessBar.tsx` — pure display component (progress bar, percent, field checklist)
- `makeCompletenessInput(fields)` — factory function, produces per-type wrapped input
- `EnrichmentWidget.tsx` — dashboard widget, talks to Sanity client only
- No new actions, no new badges, no deskStructure changes except additive list items

---

### Feature 2: surfaceOn Field Extension

**What it is:** The `surfaceOn` string array field (already on `essay`) extended to `video`, `podcast`, `podcastEpisode`, `keynote`, and `news`. Arkah added as 6th site option. The field becomes a shared block, not inline per-type.

**Current state:** `surfaceOn` is defined inline in `essay.ts` — 5 sites listed (missing Arkah). The same 14-line block would need to be duplicated across 5 more types.

**Integration pattern: Extract to shared helper (not a new block type)**

Unlike `governanceFields` (which is an exported array), `surfaceOn` is a single field definition. The correct pattern is to export it as a named field definition from a shared location, then spread it once per schema:

```typescript
// schemaTypes/blocks/surfaceOnField.ts
export const surfaceOnField = defineField({
  name: 'surfaceOn',
  title: 'Surface On',
  type: 'array',
  of: [{ type: 'string' }],
  options: {
    list: [
      { title: 'hectorhlopez.com', value: 'hectorhlopez' },
      { title: 'Futuro.ngo', value: 'futuro' },
      { title: 'BeNeXT Global', value: 'benext' },
      { title: 'Mítikah', value: 'mitikah' },
      { title: 'Medikah', value: 'medikah' },
      { title: 'NeXT', value: 'next' },
      { title: 'Arkah', value: 'arkah' },  // ← NEW
    ],
    layout: 'grid',
  },
  description: 'Which ecosystem sites should display this content',
})
```

Usage in each schema:
```typescript
import { surfaceOnField } from './blocks/surfaceOnField'
// ...inside fields array:
surfaceOnField,
```

**Update essay.ts first** — replace its inline surfaceOn definition with the import, and add Arkah to the list. Then add to video, podcast, podcastEpisode, keynote, news.

**GovernanceView.tsx already handles surfaceOn** — the view pane reads `data.surfaceOn as string[]` and renders badges. No changes needed to GovernanceView when new types get the field.

**Frontend impact:** Adding `surfaceOn` to a schema does not break existing frontend queries — it is additive. Frontends must opt-in to querying it. The field is not required, so existing documents without it return `null` gracefully.

**Types receiving surfaceOn:** essay (update existing), video, podcast, podcastEpisode, keynote, news. Not added to: alumni, person, accreditation types (no cross-site surfacing use case).

---

### Feature 3: Person/Alumni Tagging on Videos

**What it is:** A `featuredIn` array of references (`alumni` + `person`) added to the `video` schema. This enables cross-site alumni profile pages to surface videos by querying `*[_type == "video" && references($alumniId)]`.

**Integration pattern:** Single field addition to `video.ts`, following the same reference pattern used in `alumni.ts` (`featuredEssays`, `featuredVideos` fields):

```typescript
// In video.ts fields array
defineField({
  name: 'featuredIn',
  title: 'Featured People',
  type: 'array',
  of: [
    { type: 'reference', to: [{ type: 'alumni' }] },
    { type: 'reference', to: [{ type: 'person' }] },
  ],
  description: 'Alumni or people featured in this video — surfaces on their profiles',
}),
```

**No new schema types required.** The Sanity `references()` function in GROQ handles the reverse lookup efficiently.

**Component boundary:** No new component needed. The field uses Sanity's built-in reference array input. The `GovernanceView` does not need to display this field.

---

### Feature 4: B2 + Bunny CDN Media Pipeline

This is the most architecturally novel feature. It introduces an external system boundary with a Cloudflare Worker as the sync bridge.

**Overall data flow:**

```
[Upload Client]
     │
     ▼
[Backblaze B2 Bucket]
     │  Event Notification (b2:ObjectCreated webhook)
     ▼
[Cloudflare Worker: b2-sanity-sync]
     │  Validates B2 signature
     │  Extracts object key, bucket, metadata
     │  Constructs Sanity patch mutation
     ▼
[Sanity Content Lake API]
     │  Mutation: creates/patches video document
     │  Sets: b2Key, b2Bucket, bunnyVideoId fields
     ▼
[Studio: video document]
     │  Editor sees updated B2/Bunny fields
     │  Adds: title, description, tags, surfaceOn, featuredIn
     ▼
[Bunny Stream CDN]
     └  mediaBlock.platform = 'bunny', mediaBlock.platformId = [bunnyVideoId]
```

**B2 event notification:** When a video file is uploaded to a designated B2 bucket, B2 fires a `b2:ObjectCreated:Upload` webhook to a URL configured in the bucket's notification rule. The payload includes the object name, bucket name, content type, and size. Backblaze B2 Event Notifications are GA as of October 2024, with HMAC signature validation supported.

**Bunny Stream webhook:** When Bunny finishes encoding, it fires a webhook with payload `{ VideoLibraryId, VideoGuid, Status }`. Status 3 = Finished. The Worker also handles this to update `bunnyStatus` on the Sanity video document.

**Cloudflare Worker responsibilities:**
1. Receive B2 event → validate HMAC signature → extract object key/metadata → call Sanity Mutations API to create a draft `video` document with pre-populated B2 fields
2. Receive Bunny webhook → validate → extract VideoGuid + Status → patch Sanity `video.bunnyStatus` field

The Worker is stateless — it translates events to Sanity mutations. No database, no queue. All state lives in Sanity.

**Video schema changes (additive to existing `video.ts`):**

```typescript
// New field group: B2 / Bunny Media
defineField({
  name: 'b2Key',
  title: 'B2 Object Key',
  type: 'string',
  readOnly: true,
  description: 'Auto-populated by Cloudflare Worker on upload',
  group: 'media',
}),
defineField({
  name: 'b2Bucket',
  title: 'B2 Bucket',
  type: 'string',
  readOnly: true,
  group: 'media',
}),
defineField({
  name: 'bunnyVideoId',
  title: 'Bunny Video ID',
  type: 'string',
  description: 'VideoGuid from Bunny Stream — used to construct embed URL',
  group: 'media',
}),
defineField({
  name: 'bunnyLibraryId',
  title: 'Bunny Library ID',
  type: 'string',
  readOnly: true,
  group: 'media',
}),
defineField({
  name: 'bunnyStatus',
  title: 'Bunny Encoding Status',
  type: 'string',
  readOnly: true,
  options: {
    list: [
      { title: 'Queued', value: 'queued' },
      { title: 'Processing', value: 'processing' },
      { title: 'Encoding', value: 'encoding' },
      { title: 'Finished', value: 'finished' },
      { title: 'Failed', value: 'failed' },
    ],
  },
  group: 'media',
}),
```

**Relationship to existing `videoUrl` field:** `videoUrl` stays. For Bunny-hosted videos, the frontend constructs the embed URL from `bunnyVideoId` + `bunnyLibraryId` rather than `videoUrl`. For YouTube/Wistia legacy videos, `videoUrl` remains the source. This dual-path approach avoids a forced migration of all 50-200 existing records at once.

**Relationship to `mediaBlock`:** The `mediaBlock` object type already includes `platform: 'bunny'` as an option and a `platformId` field. However, the top-level `video` document does not embed a `mediaBlock` — it uses a direct `videoUrl` string field. The B2/Bunny fields are added directly to the `video` document, not wrapped in a `mediaBlock`. This keeps the schema flat and queryable without nested traversal.

`mediaBlock` remains the right pattern for embedded media within `podcastEpisode.videoEmbed`, `alumni.media` arrays, and `podcast.coverMedia` — it is not superseded by the new B2 fields.

**Environment variables needed:**
```
SANITY_STUDIO_BUNNY_LIBRARY_ID    # For constructing Bunny embed URLs in Studio preview
```

In the Cloudflare Worker (not Studio env):
```
B2_WEBHOOK_SIGNING_SECRET
BUNNY_WEBHOOK_SECRET
SANITY_PROJECT_ID=fo6n8ceo
SANITY_DATASET=production
SANITY_API_TOKEN    # write token (mutations)
```

**New file: `workers/b2-sanity-sync/index.ts`** (lives outside the Studio repo or in a separate subdir — not deployed with the Studio). The Worker is deployed independently via Wrangler to Cloudflare.

---

## Component Boundaries Summary

| Component | File Location | Talks To | Notes |
|-----------|--------------|----------|-------|
| `CompletenessBar` | `components/inputs/CompletenessBar.tsx` | None (pure display) | Copper/Archival Slate colors |
| `makeCompletenessInput(fields)` | `components/inputs/CompletenessInput.tsx` | Sanity form props | Factory function |
| `EnrichmentWidget` | `components/dashboard/EnrichmentWidget.tsx` | Sanity client (GROQ) | Dashboard only |
| `surfaceOnField` | `schemaTypes/blocks/surfaceOnField.ts` | Nothing (data) | Shared field export |
| B2/Bunny schema fields | `schemaTypes/video.ts` (inline) | Nothing (data) | readOnly on auto-populated |
| Cloudflare Worker | `workers/b2-sanity-sync/` | B2 events, Bunny webhooks, Sanity Mutations API | External to Studio |

---

## Data Flow Summary

### Enrichment Tooling Data Flow

```
Studio open → useClient in EnrichmentWidget → GROQ count queries → display percentages
Document open → CompletenessInput renders → reads props.value → calculates % → bar above form
Desk nav → S.documentList().filter(groq) → shows only incomplete records
```

### surfaceOn Data Flow

```
Editor selects sites in surfaceOn grid → stored as string[] in Content Lake
Frontend queries: *[_type == "video" && "hectorhlopez" in surfaceOn]
GovernanceView already reads surfaceOn from document.displayed → badge display unchanged
```

### B2 + Bunny CDN Data Flow

```
Video file uploaded to B2 bucket
  → B2 fires b2:ObjectCreated webhook
  → Cloudflare Worker receives POST, validates HMAC
  → Worker calls Sanity Mutations API: createIfNotExists video draft with b2Key, b2Bucket
  → Editor opens auto-created draft in Studio
  → Editor fills: title, slug, description, thumbnailImage, tags, surfaceOn, featuredIn
  → Editor triggers: upload to Bunny Stream (manual step or separate automation)
  → Bunny fires Status=3 webhook
  → Worker patches: bunnyVideoId, bunnyLibraryId, bunnyStatus = "finished"
  → videoUrl field updated or bunnyVideoId used by frontend embed logic
```

### Person/Alumni Tagging Data Flow

```
Editor adds alumni reference to video.featuredIn array
Frontend queries: *[_type == "video" && references($alumniId)]{ ... }
Alumni profile page surfaces matching videos without any Studio-side cross-linking needed
```

---

## Build Order (Phase Dependencies)

Dependencies run in this direction: later features depend on earlier ones being stable.

**Phase 1: Fix existing debt + shared surfaceOn field**
- Fix `alumniContinuum` missing from `sanity.config.ts` GOVERNED_TYPES
- Extract `surfaceOnField` to `schemaTypes/blocks/surfaceOnField.ts`
- Update `essay.ts` to use imported surfaceOnField (adds Arkah)
- Add surfaceOnField to video, podcast, podcastEpisode, keynote, news

Rationale: surfaceOn must be consistent before enrichment tooling can check for it as a completeness signal. Debt fix is trivially low-risk and blocks nothing but is correct to do first.

**Phase 2: Enrichment tooling — completeness indicators**
- Implement `CompletenessBar` component
- Implement `makeCompletenessInput` factory
- Add document-level `components.input` to video, alumni (highest priority types)
- Add filtered desk list items ("Needs Enrichment") per type
- Implement `EnrichmentWidget` in dashboard

Rationale: surfaceOnField must exist first so it can appear in the completeness checklist for video, keynote, news.

**Phase 3: Person/alumni tagging on video**
- Add `featuredIn` field to `video.ts`

Rationale: Pure schema addition, no dependencies. Could technically go in Phase 1 but lower priority than surfaceOn.

**Phase 4: B2 + Bunny schema fields in Studio**
- Add field group 'media' to video.ts
- Add b2Key, b2Bucket, bunnyVideoId, bunnyLibraryId, bunnyStatus fields
- Update video completeness definition (bunnyVideoId as required for Bunny-hosted)

Rationale: Schema changes can be staged before the Worker is ready. Editors can manually enter bunnyVideoId for videos uploaded outside the automated pipeline while Worker is being built.

**Phase 5: Cloudflare Worker (external)**
- Build `workers/b2-sanity-sync/index.ts`
- Configure B2 bucket Event Notification rule pointing to Worker URL
- Configure Bunny webhook pointing to Worker URL
- End-to-end test: upload video → Worker → Sanity draft appears

Rationale: Worker is infrastructure-only, independent of Studio code after Phase 4 schema fields exist. Can be built in parallel with Phase 4 but must come after it in deployment order.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: New `surfaceOnBlock` object type
**What goes wrong:** Wrapping surfaceOn as a full Sanity object type (like mediaBlock) adds unnecessary nesting — `surfaceOn.sites` instead of `surfaceOn`. Frontends would need to update all queries.
**Instead:** Export as a plain `defineField(...)` that schemas import and spread inline.

### Anti-Pattern 2: Completeness checks in badges
**What goes wrong:** Putting completeness indicators in document badges clutters the badge row (already has 3-4 badges per document) and badges cannot show progressive detail.
**Instead:** Use document-level `components.input` wrapper (renders above the form) and a dashboard widget.

### Anti-Pattern 3: mediaBlock for top-level video storage
**What goes wrong:** Wrapping B2/Bunny fields inside a `mediaBlock` on the `video` document adds a layer of nesting (`video.media.bunnyVideoId`) that makes GROQ queries and frontend access more complex.
**Instead:** Add B2/Bunny fields directly to `video` document top-level, in a collapsible field group. `mediaBlock` is for embedded media within arrays (alumni.media, podcast.coverMedia) not for the primary storage field on a dedicated video type.

### Anti-Pattern 4: Cloudflare Worker creating published documents
**What goes wrong:** Auto-publishing Sanity documents from the Worker bypasses editorial review. Videos would appear on frontends before title/description/tags are filled.
**Instead:** Worker creates draft documents only (`mutations: [{ createIfNotExists: { _id: 'drafts.videoId', ... } }]`). Editor must review and publish.

### Anti-Pattern 5: Duplicating GOVERNED_TYPES sets
**What goes wrong:** `sanity.config.ts` and `deskStructure.ts` each maintain their own `GOVERNED_TYPES` Set, and they have already diverged (alumniContinuum was in desk but not config). Future additions will repeat this divergence.
**Instead:** Export a single `GOVERNED_TYPES` Set from a shared constants file (`lib/constants.ts`) imported by both. Address this when fixing the alumniContinuum debt in Phase 1.

---

## Scalability Considerations

| Concern | Current (179 docs) | After milestone (~300 docs) |
|---------|------------------|---------------------------|
| Enrichment GROQ queries | Fast, single fetch | Still fast — count() is O(n) in Content Lake but low doc count |
| surfaceOn queries on frontends | Not relevant | Simple `in` filter, indexed automatically |
| B2 event volume | 0 | ~50-200 video uploads total — Worker is stateless, no concurrency issues |
| Dashboard widget queries | 7-8 parallel client.fetch() | Add 1 more (EnrichmentWidget) — acceptable, same pattern |

No scalability changes required for this milestone's scope.

---

## Sources

- Sanity Studio v5 form components API: [Form Components Reference](https://www.sanity.io/docs/studio/form-components-reference), [Custom Input Guide](https://www.sanity.io/guides/your-first-input-component-for-sanity-studio-v3), [Document Progress Component](https://www.sanity.io/docs/developer-guides/create-a-document-progress-root-level-component)
- Sanity Structure Builder filtered lists: [Dynamically Group List Items](https://www.sanity.io/docs/studio/dynamically-group-list-items-with-a-groq-filter)
- Backblaze B2 Event Notifications (GA Oct 2024): [Event Notifications Docs](https://www.backblaze.com/docs/cloud-storage-event-notifications), [Cloudflare Worker Integration](https://www.backblaze.com/blog/use-a-cloudflare-worker-to-send-notifications-on-backblaze-b2-events/), [cloudflare-b2-proxy sample](https://github.com/backblaze-b2-samples/cloudflare-b2-proxy)
- Bunny Stream webhook payload (Status codes 0-5, VideoGuid + VideoLibraryId): [Webhooks Docs](https://docs.bunny.net/stream/webhooks)
- Codebase: `schemaTypes/essay.ts` (existing surfaceOn), `schemaTypes/video.ts`, `schemaTypes/blocks/governanceBlock.ts`, `schemaTypes/mediaBlock.ts`, `components/views/GovernanceView.tsx`, `sanity.config.ts`, `deskStructure.ts`, `components/dashboard/EcosystemHealthWidget.tsx`
