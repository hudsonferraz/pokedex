# Design decisions

This document records **why** the VGC Team Lab is shaped the way it is — not just what the code does. Each section follows the same structure where the trade-off matters.

---

## Static frontend + thin API proxy

**Context**  
The app needs live Pikalytics meta and optional AI coaching, but the portfolio site should stay free to host and never expose third-party API keys in the browser.

**Decision**  
Ship the React app as a static build on GitHub Pages. Run a small Express server on Render only for Pikalytics fetch/parse/cache and Hugging Face proxying.

**Trade-off**  
Two deploy surfaces and Render cold starts, but zero database cost, no auth system, and secrets stay server-side.

**Revisit when**  
A single origin with SSR/edge functions replaces the split, or meta/AI are removed from scope.

---

## Teams in localStorage (no database)

**Context**  
Users need multi-team rosters, undo, and share links without accounts or backend persistence.

**Decision**  
Persist teams under `pokemon-teams` in `localStorage` with schema version 3. Share links encode the payload in `?team=` (base64 JSON).

**Trade-off**  
Data is device-bound and vulnerable to quota limits — `persist()` surfaces `storageError` to the UI. Share URLs can exceed safe length (~1800 chars) for heavy sets; Showdown paste is the fallback.

**Revisit when**  
Cloud sync, collaborative editing, or official event submission requires server-side storage.

---

## Compact Pokémon storage model

**Context**  
Full PokeAPI payloads (moves, sprites objects, learnsets) bloat `localStorage` and slow serialization.

**Decision**  
Store compact roster entries (`name`, `spriteUrl`, `types[]`, `stats`, `abilities[]`). Hydrate learnsets on demand when opening move picker, validating legality, or importing Showdown.

**Trade-off**  
Legality and move typing need lazy fetches; the UI must be honest when learnsets are not loaded yet.

**Revisit when**  
Offline-first mode requires bundling learnsets per species in the stored model.

---

## Per-team regulation (not global)

**Context**  
VGC players often keep teams for different formats in the same browser session.

**Decision**  
`regulationId` lives on each team record. `RegulationProvider` reads from the active team; Browse uses a separate stored preference.

**Trade-off**  
Slightly more migration logic when loading old data, but switching teams switches format context automatically.

**Revisit when**  
A global “workspace format” is needed for batch operations across all teams.

---

## Guided six-step builder

**Context**  
The original builder exposed many panels at once — powerful but overwhelming for new users and portfolio demos.

**Decision**  
Progressive disclosure via six steps (Roster → Sets → Legality → Matchups → Coach → Export) with a sticky health summary and auto-suggested next step from `computeTeamBuildHealth()`.

**Trade-off**  
Power users take an extra click to reach some panels; slots and core actions remain always visible.

**Revisit when**  
User research shows experienced builders prefer a single-page layout with optional “expert mode.”

---

## Honest regulation legality

**Context**  
Bundled ban/restricted lists can lag official announcements. Champions Reg M-A initially inherited Regulation I lists.

**Decision**  
`legalityUnverified` and `legalityInheritsFrom` in `regulations.json`. Prominent `RegulationLegalityNotice` above the selector. Validation warns when lists are inherited; learnset checks show pending/unavailable states instead of silent passes.

**Trade-off**  
More UI noise on unverified formats, but users are not misled into treating the app as an official legality oracle.

**Revisit when**  
Official lists are bundled and verified for each supported format — remove flags and notice.

---

## Lazy learnset validation

**Context**  
Compact roster entries do not include full learnsets. Validating moves against species requires PokeAPI data.

**Decision**  
Session `learnsetCache` + `useTeamLearnsets` hook. Fetch learnsets when sets have moves configured. Emit `learnset-unavailable` warnings when data is missing; show “Loading learnsets…” during fetch.

**Trade-off**  
Extra network calls on the legality step; first paint may lag briefly on slow connections.

**Revisit when**  
Bundled learnset index ships for Regulation-supported species only.

---

## Pikalytics proxy with cache and fallback

**Context**  
Pikalytics serves markdown, not JSON. CORS blocks direct browser access. Scraping must be respectful and resilient.

**Decision**  
Server fetches markdown, parses to structured meta (`pikalyticsParser.js`), caches 6 hours in memory. Bundled `vgcMeta.json` / `vgcUsage.json` used when API is cold or unreachable.

**Trade-off**  
Parser must track Pikalytics layout changes; fallback data can be stale relative to live ladder.

**Revisit when**  
Pikalytics offers a stable JSON API or official partnership.

---

## Server-side AI with guardrails

**Context**  
AI tips are a portfolio differentiator but must not become an open relay for arbitrary prompts or unbounded cost.

**Decision**  
`POST /api/ai-team-tips` only. Token in server env. Body validation (field whitelist, length caps), CORS allowlist, per-IP rate limit, 45s upstream timeout.

**Trade-off**  
No streaming responses; cold Render + HF latency can feel slow. Tips are advisory, not authoritative.

**Revisit when**  
Structured rule-based coaching alone satisfies the product goal.

---

## Showdown import/export fidelity

**Context**  
Players expect paste compatibility with Pokémon Showdown. PokeAPI slugs do not always match Showdown display names (e.g. `calyrex-ice-rider` → `Calyrex-Ice`).

**Decision**  
`showdownSpeciesNames.js` maps common VGC forms for export and import resolution. Round-trip tests cover nicknames, EVs, gender, shiny, happiness, team headers.

**Trade-off**  
Mapping table must grow for new formes; unmapped species still use mechanical title-case.

**Revisit when**  
Showdown publishes a stable species ID API consumable from the client.

---

## Undo without operational transform

**Context**  
Destructive actions (remove, clear, import, delete team) should be recoverable during a session.

**Decision**  
Single `undoSnapshotRef` in `TeamContext` — one level of undo via toast action. Snapshots taken before mutating operations; `persist()` handles save errors outside state updaters.

**Trade-off**  
Not a full history stack; undo is lost after a new mutation.

**Revisit when**  
Multi-step undo/redo is requested for set editing.

---

## Rate limiter memory hygiene

**Context**  
In-memory per-IP buckets grow if IPs never return after their window expires.

**Decision**  
`pruneExpiredBuckets()` runs periodically (default: every rate-limit window) during middleware execution.

**Trade-off**  
O(n) scan on prune interval — negligible at portfolio traffic; not distributed across Render instances.

**Revisit when**  
Traffic requires Redis-backed rate limiting across replicas.

---

## CSS design tokens over a component library

**Context**  
Create React App project; portfolio should feel cohesive without heavy UI dependencies.

**Decision**  
Custom CSS with shared variables (`--accent`, `--card-bg`, `--space-*`). Dark mode via `ThemeContext` class on root.

**Trade-off**  
More bespoke styling work; no accessible component primitives out of the box.

**Revisit when**  
The UI grows enough to justify Radix/Chakra or a design system extraction.

---

## Testing strategy

**Context**  
Portfolio credibility needs automated checks without brittle E2E for every PokéAPI response.

**Decision**  
Unit tests on pure utils (regulation, Showdown, team model, build health, HTTP protection, Pikalytics parser). Minimal `App.test.js` smoke with `MemoryRouter`.

**Trade-off**  
No full Playwright CI yet; portfolio screenshots regenerated via `npm run build:portfolio-assets`.

**Revisit when**  
CI adds browser E2E against a seeded team fixture.
