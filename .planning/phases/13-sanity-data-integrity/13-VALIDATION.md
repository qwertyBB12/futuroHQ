---
phase: 13
slug: sanity-data-integrity
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-26
---

# Phase 13 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js scripts + bash (no test framework — audit/patch scripts with exit codes) |
| **Config file** | none — scripts are standalone |
| **Quick run command** | `node scripts/audit-sanity-urls.js --dry-run` |
| **Full suite command** | `node scripts/audit-sanity-urls.js && node scripts/audit-person-tags.js` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node scripts/audit-sanity-urls.js --dry-run`
- **After every plan wave:** Run full suite command
- **Before `/gsd:verify-work`:** Full suite must be green (zero failures)
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 13-01-01 | 01 | 1 | DINT-01 | audit | `node scripts/audit-sanity-urls.js` | ❌ W0 | ⬜ pending |
| 13-01-02 | 01 | 1 | DINT-02 | audit | `node scripts/audit-b2key-match.js` | ❌ W0 | ⬜ pending |
| 13-02-01 | 02 | 1 | DINT-03 | audit | `node scripts/audit-person-tags.js` | ❌ W0 | ⬜ pending |
| 13-02-02 | 02 | 1 | DINT-03 | patch | `node scripts/patch-person-tags.js --dry-run` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `scripts/audit-sanity-urls.js` — audit all cdnUrl fields against B2 keys
- [ ] `scripts/audit-b2key-match.js` — verify cdnUrl matches b2Key filename pattern
- [ ] `scripts/audit-person-tags.js` — audit featuredIn references against diarization
- [ ] `scripts/patch-person-tags.js` — clear wrong person tags with --dry-run support

*Scripts follow existing pattern from populate-sanity-videos.py*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| MMXXV speaker identification | DINT-03 | Diarization only has SPEAKER_xx — real names require human review | After clearing wrong tags, review flagged clips and assign correct speakers |
| CDN HTTP accessibility | DINT-01 | Bunny CDN returns 401 — no auth token available | Once Bunny token is configured, re-run URL audit with HTTP HEAD checks |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
