# Tasks: Product Readiness

**Input**: [spec.md](./spec.md) + [plan.md](./plan.md)  
**Branch**: `002-product-readiness`

## Phase 1 — Foundations

- [x] T001 Add `src/utils/clipboard.js` with `copyTextToClipboard` (+ tests)
- [x] T002 Extend `src/utils/teamStorage.js` with `exportTeamLibraryBackup` / `parseTeamLibraryBackup` / `mergeRestoredTeams` (+ tests)
- [x] T003 Generate + commit `src/data/champions-banned.json`; wire into `regulation.js` map for Champions formats; update `regulations.json` (clear unverified, drop Reg H inherit for M-A/B/C)
- [x] T004 Add `champions-reg-mc` (and mb if needed) keys to `vgcUsage.json` / `vgcMeta.json`; update `loadFallbackMeta` labeling in `metaDataService.js` (+ tests if pure extract)

## Phase 2 — User stories P1

- [x] T005 [US2] Wire TeamBuilder copy handlers through clipboard helper + failure fallback UI
- [x] T006 [US2] Harden `useTeamImport.js` decode failure toast + partial-resolve warning
- [x] T007 [US3] Verify offline M-C path uses new keys / stale labels (manual + any unit coverage)
- [x] T008 [US4] Add `ErrorBoundary` and wrap `App.js`
- [x] T009 [US4] Add backup/restore UI (Share step or overflow) using teamStorage helpers
- [x] T010 [US6] Expand `regulation.test.js` for M-C legendary/mythical/paradox bans + verified flag
- [x] T011 [US1] Sync README + `docs/design-decisions.md`; sync portfolio `messages/en.ts` + `pt.ts`

## Phase 3 — Mobile P2

- [x] T012 [US5] Restyle `TeamBuilder.css` roster for ≤768px without horizontal scroll; spot-check desktop

## Phase 4 — Polish

- [x] T013 Run full `npm test -- --watchAll=false`; fix regressions
- [x] T014 Mark spec Status Approved→Implemented notes; ensure quickstart QA items covered

## Dependencies

T001→T005; T002→T009; T003→T010; T004→T007; T011 can parallel after narrative facts stable; T012 independent after builder stable.

## Notes

- Frontend: **73** tests passing; server: **14** via `npm run test:server`.
- Portfolio copy lives in sibling repo `portfolio-website` (changed, not pokedex commit).
- Deviation: `buildTeamLibraryBackup` naming (not `exportTeamLibraryBackup`) — same behavior.
