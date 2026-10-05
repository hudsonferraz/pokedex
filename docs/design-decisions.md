# Design decisions

This document records **why** the VGC Team Lab is shaped the way it is — not just what the code does. Each section follows the same structure where the trade-off matters.

---

## Static frontend + thin API proxy

**Context**  
The app needs live Pikalytics meta and optional AI coaching, but the portfolio site should stay free to host and never expose third-party API keys in the browser.

**Decision**  
Ship the React app as a static build on GitHub Pages. Run a small Express server on Render only for Pikalytics fetch/parse/cache and Groq AI coaching.

**Trade-off**  
Two deploy surfaces and Render cold starts, but zero database cost, no auth system, and secrets stay server-side.

**Revisit when**  
A single origin with SSR/edge functions replaces the split, or meta/AI are removed from scope.

---

## Teams in localStorage (no database)

**Context**  
Users need multi-team rosters, undo, and share links without accounts or backend persistence.

**Decision**  
Persist teams under `pokemon-teams` in `localStorage` with schema version 3. Share links encode the payload in `?team=` (base64 JSON). Users can download/restore a full library JSON backup (merge/append, never wipe on bad files).

**Trade-off**  
Data is still device-bound without accounts — backup is the escape hatch. Share URLs can exceed safe length (~1800 chars) for heavy sets; Showdown paste is the fallback.

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

## Guided four-step builder

**Context**  
The original six-step builder (Roster → Sets → Legality → Matchups → Coach → Export) plus health chips still felt clustered: duplicated format/export controls, a Sets step that repeated slot editing, and a Matchups scroll dump.

**Decision**  
Progressive disclosure via four steps (Build → Check → Tune → Share), set completeness on slots, a sticky ranked Team report instead of health chips, Tune as exclusive tabs, and Coach as optional under Tune. Thin chrome keeps Import/Export visible; New/Rename/Delete/Clear live in overflow.

**Trade-off**  
Power users who liked simultaneous matchup panels need one extra tab click. Returning visitors keep a short dismissible tip instead of a long six-step intro.

**Revisit when**  
User research shows experienced builders prefer a single-page “expert” layout again.

---

## Honest regulation legality

**Context**  
Bundled ban/restricted lists can lag official announcements. Champions formats ban all Legendary, Mythical, and Paradox Pokémon. Earlier builds inherited Regulation H while showing an “unverified” banner on the default format.

**Decision**  
Champions Reg M-A/B/C inject `champions-banned.json` and clear `legalityUnverified`. Other formats may still use `legalityInheritsFrom` / incomplete lists with `RegulationLegalityNotice`. Learnset checks show pending/unavailable states instead of silent passes. Product copy keeps a non-oracle disclaimer.

**Trade-off**  
Default format feels product-ready; curated lists still need refresh when handbooks change.

**Revisit when**  
Pokémon publishes machine-readable Champions ban lists for tooling.

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
Server fetches markdown, parses to structured meta (`pikalyticsParser.js`), caches 6 hours in memory. Bundled `vgcMeta.json` / `vgcUsage.json` used when API is cold or unreachable, with Reg M-C / M-B keys so offline default format is not silently unlabeled M-A data.

**Trade-off**  
Parser must track Pikalytics layout changes; fallback data can be stale relative to live ladder and is labeled as offline.

**Revisit when**  
Pikalytics offers a stable JSON API or official partnership.

---

## Server-side AI with guardrails (Groq)

**Context**  
AI coaching is a portfolio differentiator but must not become an open relay for arbitrary prompts or unbounded cost. Hugging Face Inference was too flaky for the free-tier product story.

**Decision**  
`POST /api/ai-team-tips` only, proxied to Groq chat completions (`GROQ_API_KEY`). Body validation (field whitelist, optional short history, length caps), CORS allowlist, per-IP rate limit, 45s upstream timeout. UI is a dedicated coach chat; rule-based tips remain the offline fallback.

**Trade-off**  
No streaming yet; Render cold starts still apply. Tips are advisory, not authoritative.

**Revisit when**  
Streaming or tool-calling over analysis APIs is needed.

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

## Curated Champions ban list (verified lab data)

**Context**  
Default format Champions Reg M-C bans all Legendary, Mythical, and Paradox Pokémon. Inheriting Regulation H lists while showing an “unverified” banner undercut the product story.

**Decision**  
Bundle `champions-banned.json` generated from PokeAPI `is_legendary` / `is_mythical` plus a curated Paradox set. Inject into Reg M-A/B/C, clear `legalityUnverified`, and keep a non-oracle disclaimer in regulation notes.

**Trade-off**  
Lists can lag official handbook changes; the app remains a lab, not Championship software.

**Revisit when**  
Pokémon publishes machine-readable Champions ban lists.

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
