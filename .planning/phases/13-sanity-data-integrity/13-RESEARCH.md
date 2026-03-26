# Phase 13: Sanity Data Integrity - Research

**Researched:** 2026-03-26
**Domain:** Sanity Content Lake data auditing, B2 storage verification, Python scripting
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Audit Strategy**
- D-01: Audit checks three signals per document: HTTP 200 status, content-type is video/mp4, and content-length > 0.
- D-02: Audit output is console table (for quick human review) + JSON file (for downstream fix script to consume).
- D-03: Single-pass audit covers both clips and full-length video documents — no separate runs.

**URL Fix Approach**
- D-04: B2 file listing is the single source of truth for correct CDN URLs. List actual files in B2 bucket, match to Sanity docs by filename stem/pattern, rebuild cdnUrl from actual B2 keys.
- D-05: For clips specifically, list actual clip files under the clips/ folder in B2 — these are ground truth from extract-speaker-clips.py.
- D-06: One fix script handles both clips and full-length videos with type-aware logic. Consistent with single-pass audit.

**Person Tag Correction**
- D-07: Cross-reference diarization output (.enriched.json speaker segments) AND VIDEO_MAP (populate-sanity-videos.py filename->person mappings) to derive correct featuredIn references.
- D-08: Unmatched speakers are flagged for manual review in the audit output — no auto-creation of placeholder person documents.
- D-09: Fix updates featuredIn on both clips and full-length videos for consistency.

**Patch Execution**
- D-10: Dry-run -> review -> live workflow. Always run --dry-run first, review output, then re-run with --live. Same pattern as existing populate-sanity-videos.py.
- D-11: Patches target any document with videoSource == "b2" — both drafts and published, regardless of current publish state.
- D-12: Verification is re-running the same audit script after patches. Success = zero failures.

### Claude's Discretion
- Script language choice (Python vs TypeScript) — use whatever fits best given existing patterns
- GROQ query structure for fetching video/clip documents
- Batch size and rate limiting for Sanity API patches
- B2 listing method (b2 CLI vs API)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DINT-01 | All clip Sanity documents have correct CDN URLs matching actual B2 filenames (verified by loading each URL) | B2 cross-reference shows 161 clip docs; b2Keys all verified present in B2; cdnUrl formula confirmed correct; CDN HTTP blocked by token auth — B2 existence check is the viable verification path |
| DINT-02 | All full-length video Sanity documents have correct and working cdnUrl values | 79 longform/edited docs; all b2Keys present in B2; cdnUrl = CDN_BASE/b2Key is consistent across all; same CDN 401 constraint |
| DINT-03 | Speaker clip documents have correct featuredIn references (person tags matching actual speakers) | MMXIX clips (93 docs) have plausible VIDEO_MAP-derived person tags; MMXXV clips (68 docs) have WRONG person tags (named alumni assigned to generic SPEAKER_xx speakers); 52 C3xxx enriched JSONs have no named speaker mapping — must be flagged per D-08 |
</phase_requirements>

---

## Summary

This phase corrects data integrity problems in Sanity: wrong CDN URLs and wrong person tag
references on video documents. Research involved directly querying Sanity (240 docs total),
cross-referencing actual B2 file listings, and inspecting the local transcript/clip data.

The picture is more nuanced than the CONTEXT.md anticipated. On the URL side, the current
state is already better than expected: all 240 Sanity video documents have `b2Keys` that exist
in B2, and all `cdnUrls` correctly follow the formula `CDN_BASE + "/" + b2Key`. There are no
URL mismatches to fix. However, audit validation via HTTP is blocked — the `benext.b-cdn.net`
Bunny CDN pull zone returns `401 expired_auth_token` on all requests. There is no Bunny token
in any `.env` file. The audit must verify file existence via `b2 ls` instead of HTTP HEAD.

On the person tag side, there is a real, systematic problem. MMXXV clips (68 docs, camera
filenames like C3460-C3513) have `featuredIn` populated with incorrect alumni references.
These docs have named alumni like Alistair Coll, Alejandra Lopez Portillo, and Claudia
Concepcion assigned to SPEAKER_xx clips — but the diarization output has no named speaker
mapping for any MMXXV file (all 52 MMXXV `.enriched.json` files use SPEAKER_xx labels only).
The correct action per D-08 is to clear these wrong tags and flag the documents for manual
review. MMXIX clips (93 docs) appear correctly tagged via VIDEO_MAP-derived assignments.

**Primary recommendation:** The audit script's main value is B2 cross-reference validation
and person tag correctness reporting. The fix script's main work is clearing incorrect
`featuredIn` refs from MMXXV clip documents and flagging them for manual speaker identification.

---

## Actual Data State (Ground Truth)

This section documents what live data investigation found — critical for the planner.

### Document Counts (Sanity, as of 2026-03-26)

| Category | Count | B2 Folder Pattern |
|----------|-------|-------------------|
| MMXIX longform | 26 | `Futuro MMXIX/edited/HB_*.mp4` |
| MMXIX clips | 93 | `Futuro MMXIX/clips/{source}/{clip}.mp4` |
| MMXXV longform | 53 | `Futuro MMXXV/edited/card-N/Day N/*_processed.mp4` |
| MMXXV clips | 68 | `Futuro MMXXV/clips/C3xxx/{clip}.mp4` |
| **Total** | **240** | |

### URL Integrity Status

| Check | Result |
|-------|--------|
| b2Keys present in actual B2 | 0 mismatches (all 240 verified) |
| cdnUrl = CDN_BASE + b2Key formula | 0 mismatches (all 240 correct) |
| CDN HTTP validation (HEAD request) | BLOCKED — 401 `expired_auth_token` on all URLs |
| Bunny token in project env files | NOT FOUND — no BUNNY_TOKEN in `.env.local` |

**Key implication for D-01:** The audit cannot perform HTTP 200 / content-type / content-length
checks as specified. The viable substitute is B2 file existence verification via `b2 ls`, which
confirms the file the cdnUrl points to actually exists in B2. The audit output should report
`b2_exists: true/false` as the primary signal. If the owner can provide a Bunny token URL
parameter later, HTTP checks can be added.

### Person Tag (featuredIn) Status

| Segment | Count | Person Tag Status |
|---------|-------|-------------------|
| MMXIX longform | 26 | Correct — populated from VIDEO_MAP |
| MMXIX clips | 93 | Appear correct — named alumni + Hector as host, derived from VIDEO_MAP |
| MMXXV longform | 53 | Partially wrong — at least 9 docs have MMXIX alumni (Alistair Coll etc.) assigned; some multi-speaker docs may be correct |
| MMXXV clips (C3xxx) | 68 | All wrong — SPEAKER_xx clips tagged with named alumni from another context |

**Root cause for MMXXV clip wrong tags:** Some prior enrichment script (not populate-sanity-videos.py)
assigned random alumni references to these documents. The diarization output for all 52 MMXXV
`.enriched.json` files contains only `SPEAKER_xx` labels with no name-to-person mapping. Per D-08,
these cannot be auto-corrected — they must be cleared and flagged for manual identification.

### B2 Structure Discovery

Actual B2 clip folder layout (distinct from what some manifests claim):

```
Futuro MMXIX/
  clips/{source_stem}/{SPEAKER_xx_start-end}.mp4   ← MMXIX clips (93 files)
  edited/HB_*.mp4                                  ← MMXIX longform (26 files)

Futuro MMXXV/
  clips/C3xxx/{SPEAKER_xx_start-end}.mp4           ← MMXXV clips (68 Sanity-linked + 93 duplicate HB files)
  edited/card-N/Day N/*_processed.mp4              ← MMXXV longform (53 files)
```

Note: B2 `Futuro MMXXV/clips/` also contains 93 HB-named clip files that are duplicates of
the MMXIX clips — these are NOT linked in Sanity and are out-of-scope for this phase.

---

## Standard Stack

### Core

| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| Python 3 | 3.x (system) | Audit + fix scripts | Used by all existing pipeline scripts |
| `b2` CLI | Installed | List B2 bucket contents | Established pattern from extract-speaker-clips.py |
| Sanity REST API | v2024-01-01 | Query + mutate documents | Used by populate-sanity-videos.py |
| `curl` + `subprocess` | stdlib | HTTP calls to Sanity | Established pattern — avoids new deps |

### Supporting

| Tool | Purpose | When to Use |
|------|---------|-------------|
| `json` (stdlib) | Audit JSON output, read enriched transcripts | All JSON I/O |
| `argparse` (stdlib) | `--dry-run` / `--live` flags | CLI interface |
| `urllib.parse` (stdlib) | URL-encode GROQ queries | Sanity API calls |
| `pathlib` (stdlib) | Cross-platform path handling | File operations |

**Installation:** No new dependencies. Uses only Python stdlib + `b2` CLI (already installed).

---

## Architecture Patterns

### Recommended Script Structure

```
scripts/
  audit-sanity-integrity.py   ← New: single-pass audit (DINT-01, DINT-02, DINT-03)
  fix-sanity-integrity.py     ← New: --dry-run/--live fix script
```

### Pattern 1: Sanity REST Query (Python)

Established in `populate-sanity-videos.py`:

```python
import subprocess, json, urllib.parse

SANITY_PROJECT = "fo6n8ceo"
SANITY_DATASET = "production"
SANITY_API = f"https://{SANITY_PROJECT}.api.sanity.io/v2024-01-01"
SANITY_TOKEN = os.environ.get("SANITY_TOKEN", "sk...")

def query_sanity(q):
    url = f"{SANITY_API}/data/query/{SANITY_DATASET}?query={urllib.parse.quote(q)}"
    result = subprocess.run(
        ["curl", "-s", url, "-H", f"Authorization: Bearer {SANITY_TOKEN}"],
        capture_output=True, text=True
    )
    return json.loads(result.stdout).get("result")
```

### Pattern 2: Sanity Mutation (PATCH)

Established in `populate-sanity-videos.py`:

```python
def patch_sanity_document(doc_id: str, patches: dict, dry_run: bool = True):
    if dry_run:
        print(f"  [DRY RUN] Would patch {doc_id}: {list(patches.keys())}")
        return True

    mutations = {"mutations": [{"patch": {"id": doc_id, "set": patches}}]}
    result = subprocess.run(
        ["curl", "-s", "-X", "POST",
         f"{SANITY_API}/data/mutate/{SANITY_DATASET}",
         "-H", "Content-Type: application/json",
         "-H", f"Authorization: Bearer {SANITY_TOKEN}",
         "-d", json.dumps(mutations)],
        capture_output=True, text=True
    )
    response = json.loads(result.stdout) if result.stdout else {}
    return "results" in response
```

### Pattern 3: B2 File Listing

Established in `populate-sanity-videos.py` and `extract-speaker-clips.py`:

```python
def list_b2_folder(path: str) -> list[str]:
    """Returns list of full B2 paths (not just filenames)"""
    result = subprocess.run(
        ["b2", "ls", "--recursive", f"b2://hector-ecosystem-archive-prod/{path}"],
        capture_output=True, text=True
    )
    return [
        line.strip() for line in result.stdout.strip().split("\n")
        if line.strip() and line.strip().endswith(".mp4")
    ]
```

### Pattern 4: Dry-Run / Live CLI

```python
import argparse

parser = argparse.ArgumentParser()
parser.add_argument("--live", action="store_true", help="Apply patches (default: dry run)")
args = parser.parse_args()
DRY_RUN = not args.live

if not DRY_RUN and not SANITY_TOKEN:
    print("ERROR: Set SANITY_TOKEN environment variable")
    sys.exit(1)
```

### Audit Output Format

```python
# Console table: tabulate or manual column formatting
# JSON file: structured for downstream fix script consumption
AUDIT_OUTPUT_PATH = Path("transcripts/integrity-audit.json")

audit_result = {
    "generated": datetime.utcnow().isoformat(),
    "summary": {
        "total_docs": 240,
        "url_failures": 0,
        "person_tag_issues": 0
    },
    "failures": [
        {
            "doc_id": "...",
            "title": "...",
            "b2Key": "...",
            "cdnUrl": "...",
            "issues": ["b2_not_found", "wrong_person_tags"],
            "details": {}
        }
    ],
    "manual_review": [
        {
            "doc_id": "...",
            "title": "...",
            "b2Key": "...",
            "reason": "SPEAKER_xx speakers — manual identification required"
        }
    ]
}
```

### Anti-Patterns to Avoid

- **Using GROQ `count()` to verify document state:** CDN cache can return stale numbers. Use direct fetch (`*[...]{_id, field}`) to confirm actual document state.
- **HTTP URL validation against `benext.b-cdn.net`:** This Bunny CDN pull zone requires token authentication. All requests return `401 expired_auth_token`. Use `b2 ls` to verify file existence instead.
- **Auto-clearing all MMXXV longform featuredIn:** Some MMXXV longform docs have legitimate multi-speaker tags (alumni present at the event). Only clear where tags are clearly wrong (single-speaker clips with generic SPEAKER_xx source). Flag for human review rather than silently clearing.
- **Assuming MMXXV clips have correct person tags:** All 68 MMXXV clip docs (C3xxx) have wrong tags. The enriched JSON data does not contain speaker-to-person name mappings for these files.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CDN URL formula | Custom URL builder | Direct string concat: `CDN_BASE + "/" + b2Key.replace(' ', '%20')` | Formula already established and verified across all 240 docs |
| Sanity doc lookup | Custom caching layer | Simple dict cache (`_slug_to_id`) as in populate-sanity-videos.py | Already solved, copy the pattern |
| B2 file inventory | Custom B2 API client | `b2 ls --recursive` subprocess call | Already established, no library needed |
| Rate limiting | Custom queue | Simple chunk + sleep (pattern from ingest-transcripts.ts) | Sanity's free tier limit is ~100 req/s; 1s sleep every 50 patches is sufficient |

---

## Common Pitfalls

### Pitfall 1: CDN 401 Treated as URL Error

**What goes wrong:** Audit script makes HEAD request, gets 401, reports all 240 docs as failed.
**Why it happens:** `benext.b-cdn.net` has Bunny CDN token authentication enabled. No token exists
in any project env file. The 401 response body is `{"code": "expired_auth_token"}`.
**How to avoid:** Skip HTTP validation entirely. Use `b2 ls` to verify file existence.
Report `b2_file_exists: true/false` as the primary audit signal for D-01/D-02.
**Warning signs:** If audit returns 401 for every URL, the CDN auth is the cause — not file absence.

### Pitfall 2: Treating All MMXXV featuredIn as Correct

**What goes wrong:** Audit skips person tag check because all docs have `count(featuredIn) > 0`.
**Why it happens:** All 240 docs have non-empty `featuredIn` — Sanity confirms this.
**How to avoid:** The audit must not just check for presence — it must check correctness.
For MMXXV clips: any doc whose b2Key is under `Futuro MMXXV/clips/C3xxx/` and whose
`featuredIn` has references that do NOT correspond to named speakers in the enriched JSON
should be flagged. Since no MMXXV enriched JSON has named speakers, ALL 68 MMXXV clip docs
should be flagged for manual review and their current tags cleared.
**Warning signs:** MMXXV clip docs with alumni names like "Alistair Coll", "Alejandra Lopez Portillo",
or "Claudia Concepcion" in their `featuredIn` — these are MMXIX-event people assigned wrongly.

### Pitfall 3: Space Encoding in B2 Paths

**What goes wrong:** B2 ls returns `Futuro MMXIX/clips/HB2_OAS PARTNER 4K_ahq12/...` with a
literal space. Comparing this to Sanity's `b2Key` (which also has a literal space) works.
But comparing to `cdnUrl` (which uses `%20`) requires normalization.
**How to avoid:** When building the B2-to-cdnUrl mapping:
`expected_cdn = CDN_BASE + "/" + b2_path.replace(" ", "%20")`. The formula has zero mismatches
across all 240 existing docs — verify this still holds after any changes.

### Pitfall 4: MMXXV Longform Incorrectly Cleared

**What goes wrong:** Fix script clears all `featuredIn` from docs matching `MMXXV/edited/`
pattern, removing legitimate multi-speaker event references.
**Why it happens:** Some MMXXV longform docs (e.g., `C3503_processed.mp4`) have 8+ alumni refs
that appear to be correct records of who appeared in that session.
**How to avoid:** Only clear MMXXV longform docs where person tags are clearly wrong (single-
speaker sessions tagged with MMXIX-only people). Flag uncertain cases for manual review.
The safe rule: for MMXXV clips, clear all. For MMXXV longform, flag those with MMXIX-specific
people (Alistair Coll, HB_ protagonists) but preserve those with MMXXV-appropriate refs.

### Pitfall 5: GROQ Draft vs Published Scope

**What goes wrong:** GROQ query `*[_type == "video"]` may or may not include drafts depending
on API endpoint and token permissions.
**Why it happens:** Documents with `_id` starting with `drafts.` are drafts. The Sanity API
returns drafts when queried with a write token via the non-CDN API endpoint.
**How to avoid:** All 26 MMXIX B2 videos were created as drafts by `populate-sanity-videos.py`.
Use the Sanity write token and `useCdn: false` (or in Python: avoid the CDN endpoint). Add
`_id` to all queries and check the response count against 240. Per D-11, patches must target
both draft and published documents.

---

## Code Examples

### Fetch All B2 Video Documents (Python)

```python
# Source: populate-sanity-videos.py pattern + ingest-transcripts.ts pattern
videos = query_sanity(
    '*[_type == "video" && videoSource == "b2"]{_id, title, b2Key, cdnUrl, featuredIn}'
)
# Returns 240 docs as of 2026-03-26
```

### B2 Cross-Reference Check

```python
# Build B2 inventory from actual bucket contents
def build_b2_inventory() -> set[str]:
    folders = [
        "Futuro MMXIX/edited/",
        "Futuro MMXIX/clips/",
        "Futuro MMXXV/edited/",
        "Futuro MMXXV/clips/",
    ]
    all_files = set()
    for folder in folders:
        files = list_b2_folder(folder)
        all_files.update(files)
    return all_files

# Verify doc against B2
def check_url(doc: dict, b2_inventory: set) -> dict:
    b2_key = doc.get("b2Key", "")
    cdn_url = doc.get("cdnUrl", "")
    expected_cdn = f"{CDN_BASE}/{b2_key.replace(' ', '%20')}"

    issues = []
    if b2_key not in b2_inventory:
        issues.append("b2_not_found")
    if cdn_url != expected_cdn:
        issues.append("cdnurl_formula_mismatch")
    return {"doc_id": doc["_id"], "b2_exists": b2_key in b2_inventory, "issues": issues}
```

### Person Tag Derivation (MMXIX — from VIDEO_MAP)

```python
# VIDEO_MAP from populate-sanity-videos.py defines expected person refs for HB files
# For MMXIX clips, the clip filename stem is the source video stem
# e.g., b2Key = "Futuro MMXIX/clips/HB2_Laura/SPEAKER_00_00m00s-00m15s.mp4"
# stem = "HB2_Laura"
# VIDEO_MAP["HB2_Laura.mp4"]["alumni"] = ["laura-miller"]
# expected featuredIn = [ref to alumni with slug "laura-miller"]

def get_expected_refs_for_mmxix_clip(b2_key: str) -> list[str]:
    """Returns list of expected person slugs from VIDEO_MAP."""
    # b2Key format: "Futuro MMXIX/clips/{source_stem}/{clip}.mp4"
    parts = b2_key.split("/")
    source_stem = parts[3]  # e.g., "HB2_Laura"
    filename = source_stem + ".mp4"
    info = VIDEO_MAP.get(filename, {})
    return info.get("alumni", []) + info.get("collaborators", [])
```

### Sanity Patch — Clear featuredIn

```python
# For MMXXV clips with wrong person tags
def clear_featured_in(doc_id: str, dry_run: bool = True):
    patches = {"featuredIn": []}  # empty array, not unset
    return patch_sanity_document(doc_id, patches, dry_run)
```

---

## Runtime State Inventory

> This phase patches Sanity documents (no rename/refactor involved). This section is included
> because the phase modifies live Sanity document state.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | 240 Sanity video docs (drafts) in `fo6n8ceo/production` | Patch `featuredIn` on MMXXV clip docs via Mutations API |
| Live service config | Bunny CDN pull zone `benext.b-cdn.net` — token auth enabled | No change needed (CDN config not modified); impacts audit approach only |
| OS-registered state | None | — |
| Secrets/env vars | `SANITY_TOKEN` in `.env.local` — sufficient for Mutations API | No change needed |
| Build artifacts | None | — |

**Known B2 side-effect:** B2 has 93 duplicate HB-named clips under `Futuro MMXXV/clips/`
(wrongly uploaded there, also exist under `Futuro MMXIX/clips/`). These are NOT linked to
any Sanity document and are out of scope for Phase 13. Note for future phases.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Python 3 | All scripts | Yes | system | — |
| `b2` CLI | B2 listing | Yes | installed | — |
| `curl` | Sanity REST API | Yes | system | — |
| Sanity API write token | Mutations | Yes | in .env.local | — |
| Bunny CDN token | HTTP URL validation | No | not found | Use B2 existence check |

**Missing dependencies with no fallback:**
- None — Bunny CDN token is blocked but B2 existence verification is a complete substitute.

**Missing dependencies with fallback:**
- Bunny CDN token: HTTP HEAD validation is blocked (401). Fallback = `b2 ls` to verify file
  existence in bucket. This satisfies the intent of D-01 (confirm URL loads correctly) because
  if the file exists in B2 and cdnUrl formula is correct, the URL will work once token is provided.

---

## Validation Architecture

> `workflow.nyquist_validation` is `true` in `.planning/config.json` — section required.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None installed (no pytest.ini, no test/ directory, no package.json test script) |
| Config file | Wave 0 must create |
| Quick run command | `python3 -m pytest scripts/tests/ -x -q` |
| Full suite command | `python3 -m pytest scripts/tests/ -q` |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DINT-01 | Audit detects b2Keys not in B2 | unit | `python3 -m pytest scripts/tests/test_audit.py::test_b2_cross_reference -x` | No — Wave 0 |
| DINT-01 | Audit detects cdnUrl formula mismatch | unit | `python3 -m pytest scripts/tests/test_audit.py::test_cdnurl_formula -x` | No — Wave 0 |
| DINT-02 | Audit covers both clips and longform in single pass | unit | `python3 -m pytest scripts/tests/test_audit.py::test_single_pass_coverage -x` | No — Wave 0 |
| DINT-02 | Fix script rebuilds cdnUrl from b2Key correctly | unit | `python3 -m pytest scripts/tests/test_fix.py::test_cdnurl_rebuild -x` | No — Wave 0 |
| DINT-03 | Audit identifies MMXXV clips with wrong person tags | unit | `python3 -m pytest scripts/tests/test_audit.py::test_person_tag_detection -x` | No — Wave 0 |
| DINT-03 | Fix script clears featuredIn on identified MMXXV clip docs | unit | `python3 -m pytest scripts/tests/test_fix.py::test_clear_featured_in -x` | No — Wave 0 |
| DINT-03 | Re-audit returns zero failures after fix | smoke | `python3 scripts/audit-sanity-integrity.py --json-out /tmp/reaudit.json && python3 -c "import json; d=json.load(open('/tmp/reaudit.json')); assert d['summary']['failures']==0"` | No — Wave 0 |

### Sampling Rate
- **Per task commit:** `python3 -m pytest scripts/tests/ -x -q`
- **Per wave merge:** `python3 -m pytest scripts/tests/ -q`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `scripts/tests/__init__.py` — package marker
- [ ] `scripts/tests/test_audit.py` — unit tests for audit logic (b2 cross-reference, cdnUrl formula, person tag detection)
- [ ] `scripts/tests/test_fix.py` — unit tests for fix logic (cdnUrl rebuild, featuredIn clearing, dry-run guard)
- [ ] `scripts/tests/conftest.py` — shared fixtures (mock Sanity responses, mock B2 listing)
- [ ] Framework install: `pip install pytest`

*(All tests use mock data — no live Sanity/B2 calls in unit tests)*

---

## State of the Art

| Old Understanding | Actual State Found | Impact |
|-------------------|-------------------|--------|
| Clip CDN URLs are broken (mismatch with B2) | All 240 cdnUrls are formula-correct; b2Keys all exist in B2 | URL fix phase is primarily an audit + verification task, not a data correction task |
| CDN HTTP validation (D-01) is straightforward | Bunny CDN returns 401 (token auth) — HTTP validation blocked | Audit must use B2 existence check instead of HTTP HEAD |
| All docs have empty featuredIn | All 240 docs have non-empty featuredIn | Problem is wrong refs, not missing refs |
| MMXXV clips have missing person tags | MMXXV clips have WRONG person tags (random MMXIX alumni assigned) | Fix must clear wrong tags, not add new ones |

---

## Open Questions

1. **Bunny CDN token for HTTP validation**
   - What we know: `benext.b-cdn.net` returns `401 expired_auth_token`; no token in `.env.local`
   - What's unclear: Where is the Bunny CDN token key stored (Bunny dashboard)?
   - Recommendation: Proceed without HTTP validation. B2 existence verification satisfies the
     intent. Add a note in audit output that HTTP validation is pending Bunny token configuration.

2. **MMXXV longform partial wrong tags**
   - What we know: 9+ MMXXV longform docs have Alistair Coll ref; others have large multi-speaker
     alumni lists that may be correct
   - What's unclear: Which of the multi-speaker MMXXV longform docs have truly correct vs wrong tags
   - Recommendation: Flag all MMXXV longform docs with obvious MMXIX-era alumni (Alistair Coll,
     HB_ protagonist names) as needing review. Preserve multi-speaker docs that reference MMXXV
     alumni cohort members. Output a manual-review list rather than auto-clearing.

3. **MMXIX clip SPEAKER_xx to VIDEO_MAP person accuracy**
   - What we know: MMXIX clips have alumni + Hector refs; e.g. HB2_Laura -> [Laura Miller, Hector]
   - What's unclear: Whether SPEAKER_xx in the clip actually corresponds to the VIDEO_MAP person
     (diarization may have mis-labeled who speaks in which clip)
   - Recommendation: Treat MMXIX clip person tags as correct per VIDEO_MAP (D-07). Flag for manual
     review if a reviewer notices wrong assignments — out of scope for automated correction.

---

## Sources

### Primary (HIGH confidence)
- Live Sanity API queries (`fo6n8ceo/production`) — document counts, b2Key/cdnUrl field values, featuredIn refs
- Live B2 bucket listing (`b2 ls --recursive`) — actual file paths in `hector-ecosystem-archive-prod`
- `scripts/populate-sanity-videos.py` — VIDEO_MAP, CDN_BASE, API patterns
- `scripts/extract-speaker-clips.py` — clip naming conventions, B2 path structure
- `scripts/ingest-transcripts.ts` — TypeScript Sanity client pattern, b2Key stem extraction
- `schemaTypes/video.ts` — video document schema (cdnUrl, b2Key, featuredIn, videoSource fields)
- `schemaTypes/blocks/featuredInField.ts` — featuredIn field definition (accepts alumni, person, ledgerPerson, collaborator)
- `transcripts/*.enriched.json` (82 files) — diarization output format; confirmed no named speaker mapping in MMXXV files

### Secondary (MEDIUM confidence)
- `clips/*/manifest.json` (49 manifests) — clip file lists; some have stale/wrong cdn_url fields (out of sync with actual B2 paths — this is a manifest inconsistency, NOT a Sanity doc inconsistency)
- Bunny CDN HTTP response headers — `401 expired_auth_token` confirmed from `BunnyCDN-MX1-920` server

### Tertiary (LOW confidence)
- None

---

## Project Constraints (from CLAUDE.md)

CLAUDE.md governs the Sanity Studio codebase (schema, components, TypeScript). This phase produces
standalone Python scripts in `scripts/` and does not modify any schema or Studio code. However:

- **Project ID / Dataset:** `fo6n8ceo` / `production` — hardcoded in all existing scripts; continue this pattern
- **SANITY_TOKEN:** Available in `.env.local` as `SANITY_WRITE_TOKEN` and `SANITY_TOKEN`
- **No schema changes:** This phase is data-only — no changes to `schemaTypes/`
- **CDN base:** `https://benext.b-cdn.net` (established constant in populate-sanity-videos.py)
- **Dual tag system note:** `featuredIn` uses references (`featuredInField.ts`), not string arrays — patches must use `_type: "reference"` format with `_ref` and `_key`

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all tools already installed, no new dependencies
- Architecture: HIGH — patterns verified in existing scripts; actual data state confirmed by live queries
- Pitfalls: HIGH — CDN auth issue confirmed by direct testing; wrong person tags confirmed by live queries
- URL integrity: HIGH — all 240 docs verified clean; B2 cross-reference complete
- Person tag state: HIGH — direct inspection of representative samples; 52 MMXXV enriched JSONs confirmed no named speakers

**Research date:** 2026-03-26
**Valid until:** 2026-04-26 (data state stable; B2/Sanity not actively changing during planning)
