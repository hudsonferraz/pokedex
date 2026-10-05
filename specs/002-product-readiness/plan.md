# Implementation Plan: Product Readiness

**Branch**: `002-product-readiness` | **Date**: 2026-10-05 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/002-product-readiness/spec.md`

## Summary

Make VGC Team Lab demo-proof and user-ready: sync portfolio/README narrative, harden share/clipboard/import UX, honest M-C offline meta, ErrorBoundary + team-library backup, mobile roster without horizontal scroll, and verified Champions Reg M-C ban-only legality (Legendary / Mythical / Paradox) with non-oracle disclaimer retained.

## Technical Context

**Language/Version**: JavaScript (React 18 CRA) + Express proxy (unchanged for this feature except docs)

**Primary Dependencies**: React, React Router, existing Team/Toast/Meta contexts; sibling `portfolio-website` Next.js messages

**Storage**: `localStorage` team schema v3 + new portable backup JSON (same schema version)

**Testing**: Jest + React Testing Library (`npm test`); colocated `*.test.js`

**Target Platform**: Static SPA (GitHub Pages) + Render API; phone + desktop viewports

**Project Type**: Web application (frontend-heavy) + portfolio copy in sibling repo

**Performance Goals**: No new required network calls for legality (bundled ban list); backup/restore is local file I/O only

**Constraints**: No accounts/DB/short-links/keepalive; keep Showdown I/O, Groq coach, four-step IA; legality remains non-official

**Scale/Scope**: TeamBuilder + teamStorage/export/import + meta fallback + regulations data + App shell + portfolio EN/PT + README/docs

## Constitution Check

Hudson Speckit constitution applies at process level. Pokedex has no local constitution — follow approved spec and existing honesty principles in `docs/design-decisions.md`.

**Gates**: Pass — no unjustified new services; honesty for legality/meta preserved.

## Project Structure

### Documentation (this feature)

```text
specs/002-product-readiness/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── checklists/requirements.md
├── spec.md
└── tasks.md
```

### Source Code (touched)

```text
# pokedex
src/App.js
src/components/ErrorBoundary.js (+ css)
src/components/TeamBuilder.js (+ css)
src/components/TeamLibraryBackup.js (or inline Share/overflow actions)
src/hooks/useTeamImport.js
src/services/metaDataService.js
src/utils/teamStorage.js (+ tests)
src/utils/teamExport.js (+ clipboard helper / tests)
src/utils/clipboard.js (optional small helper)
src/utils/regulation.js (+ tests)
src/data/regulations.json
src/data/champions-banned.json (new)
src/data/vgcUsage.json
src/data/vgcMeta.json
docs/design-decisions.md
README.md

# portfolio-website (sibling)
messages/en.ts
messages/pt.ts
```

## Complexity Tracking

| Aspect | Why needed |
|--------|------------|
| Bundled Champions ban list | Verification without live PokeAPI; clears unverified for default format |
| Backup merge policy | No-accounts product needs escape hatch without wipe risk |
| Explicit M-C fallback keys | Prevents silent wrong-era meta on Render cold start |

## Phase 0 / 1 notes

See `research.md` and `data-model.md`. No new HTTP API contracts.
