# Research: Product Readiness

**Feature**: `002-product-readiness`  
**Date**: 2026-10-05

## R1 — Clipboard failure handling

**Decision**: Shared `copyTextToClipboard(text)` helper returning `{ ok, error }`; on failure show error toast and open a selectable textarea/modal fallback (or reuse existing paste modal pattern). Wire all TeamBuilder export/share copy paths through it.

**Alternatives**: `navigator.clipboard` only; `document.execCommand('copy')` only.  
**Why**: Clipboard permission failures are common on Safari / insecure contexts; demo must never silent-fail.

## R2 — Share import honesty

**Decision**: On decode failure → error toast + clear param. On partial resolve → import what resolved + warning toast with missing count/names. Track expected vs resolved length from decoded payload.

**Alternatives**: Block import until all resolve; fail entirely on any miss.  
**Why**: Partial success with warning matches VGC paste reality (typos / API blips) without lying.

## R3 — Offline meta for Reg M-C

**Decision**: Duplicate (or alias) current best Champions ladder snapshot under `champions-reg-mc` (and `champions-reg-mb` if useful) in `vgcUsage.json` / `vgcMeta.json`, with `sourceNote` stating offline/fallback and snapshot provenance. Change `loadFallbackMeta` to prefer exact key; if forced to older key, set `label`/`source` to explicitly say stale fallback from that regulation.

**Alternatives**: Always show empty offline; keep silent M-A fallthrough.  
**Why**: Spec forbids silent wrong-era-as-current; exact key + label is cheapest honesty.

## R4 — ErrorBoundary

**Decision**: Class `ErrorBoundary` wrapping provider tree (or routes) in `App.js` with reload CTA and short message. No error reporting service.

**Alternatives**: Route-level only; third-party monitoring.  
**Why**: Blank white page kills demos; reload is enough for portfolio scope.

## R5 — Team library backup

**Decision**: Portable JSON `{ version, exportedAt, teams }` using compact storage shape. Export download via Blob. Restore merges: append teams with new ids; on name collision suffix ` (restored)` / numeric. Invalid file → toast, no wipe.

**Alternatives**: Replace-all restore; per-team only.  
**Why**: Spec assumes merge/append; safest for no-account users.

## R6 — Mobile roster

**Decision**: Below ~768px, drop `min-width` forcing horizontal scroll; use 2-column (or stacked) slot grid. Keep denser grid on desktop.

**Alternatives**: Card carousel; keep horizontal scroll with snap.  
**Why**: Spec requires all six slots without horizontal roster scroll.

## R7 — Verified Champions M-C legality

**Decision**: Ship `champions-banned.json` listing species ids for Legendary, Mythical, and Paradox (plus known form aliases covered by existing `speciesMatchesList` base-form logic). For `champions-reg-mc` / `mb` / `ma`: set `banned` via map injection (like Reg H), clear `legalityUnverified`, remove `legalityInheritsFrom` (or stop inheriting Reg H bans that do not match Champions ban-only rule). Keep handbook disclaimer in notes + existing non-oracle copy.

**Source**: Public Champions Reg M-C description (ban-only: all Legendary, Mythical, Paradox; 0 Restricted) + PokeAPI `is_legendary` / `is_mythical` flags and curated Paradox list for generation of the bundled file. Document generation date in design-decisions.

**Alternatives**: Runtime PokeAPI classification; keep unverified inheritance.  
**Why**: Default format must feel product-ready offline; bundled list is testable and honest.

## R8 — Portfolio / README sync

**Decision**: Update EN/PT `vgcTeamLab` blocks and README: four-step IA, Groq, Team report, remove favorites / six-step / Hugging Face / stale test counts (use current count or “automated tests + CI”).

**Why**: Story sync is P1 acceptance.
