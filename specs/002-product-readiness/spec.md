# Feature Specification: Product Readiness (Demo-Proof + Mobile + Verified M-C)

**Feature Branch**: `002-product-readiness`

**Created**: 2026-10-05

**Status**: Implemented

**Input**: User description: "Ship A+B+C: demo-proof package (portfolio/README sync, reliable share/clipboard, correct/labeled M-C cold-start meta, ErrorBoundary, export-all backup) + mobile roster polish + verified Champions Reg M-C legality."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Demo and portfolio story match the live product (Priority: P1)

A hiring manager or player reads the portfolio case study and README, then opens the live Team Lab. Descriptions match what they see: four-step guided flow, Groq-backed AI coach, accurate test/capability claims, and no phantom features (for example favorites) that the app does not ship.

**Why this priority**: Narrative drift destroys trust in the first 30 seconds of a portfolio review.

**Independent Test**: Diff portfolio EN/PT copy and README against the live builder surface and documented capabilities; every claimed feature must exist; no outdated six-step / Hugging Face / favorites claims remain.

**Acceptance Scenarios**:

1. **Given** the portfolio VGC Team Lab case study (EN and PT), **When** a reader checks workflow claims, **Then** they see a four-step guided workflow (not six-step).
2. **Given** the same case study, **When** a reader checks AI claims, **Then** coaching is described as Groq-backed (or equivalent current provider), not Hugging Face.
3. **Given** README capability lists, **When** compared to the app, **Then** every listed capability exists; non-existent features (for example favorites) are removed or clearly out of scope.
4. **Given** README highlights, **When** test counts are stated, **Then** they match the automated suite currently run in CI (or use non-numeric wording that cannot go stale).

---

### User Story 2 - Share, copy, and import never fail silently (Priority: P1)

A player copies Showdown paste, plain text, or a share link, or opens a `?team=` URL. Success and failure are always visible. Broken or partial imports are explained; the user is not left thinking nothing happened.

**Why this priority**: Share and clipboard are the primary demo and real-user handoff moments.

**Independent Test**: Force clipboard denial; open malformed and partial share links; confirm toasts/messages without relying on meta or AI.

**Acceptance Scenarios**:

1. **Given** clipboard permission is denied or unavailable, **When** the user copies export/share content, **Then** they see a clear failure message and a usable fallback (for example selectable text) so they can still leave with the team.
2. **Given** a successful copy, **When** the action completes, **Then** a success confirmation appears.
3. **Given** a malformed or undecodable `?team=` link, **When** the app loads, **Then** the user sees an error toast (or equivalent) and the bad param is cleared without crashing.
4. **Given** a share payload whose species cannot all be resolved, **When** import finishes, **Then** the user is warned that the roster is incomplete relative to the link (not only a success undo toast).

---

### User Story 3 - Cold-start meta stays honest for the default format (Priority: P1)

When the live meta proxy is cold or offline, a player on the default Champions Reg M-C format still sees meta that is either keyed to M-C or explicitly labeled as older/fallback data — never a silent wrong-era ladder presented as current.

**Why this priority**: Free-tier cold starts are common; wrong meta silently shown as live is worse than labeled offline data.

**Independent Test**: Force offline/fallback path while default format is Reg M-C; inspect usage/meta labels and content provenance.

**Acceptance Scenarios**:

1. **Given** the API is unavailable and format is Reg M-C, **When** usage/meta loads from fallback, **Then** the UI shows an Offline (or equivalent) state and does not present M-A-era data as current M-C live meta without labeling.
2. **Given** fallback data exists for M-C (or a shared Champions snapshot tagged for M-C), **When** offline, **Then** that snapshot is preferred over an unlabeled older regulation dump.
3. **Given** only older fallback exists, **When** shown for M-C, **Then** the user can tell the data is stale/fallback for a different or older snapshot.

---

### User Story 4 - Crash shell and whole-library backup (Priority: P1)

If the UI hits an unexpected render error, the player sees a recovery shell instead of a blank page. Independently, they can download a backup of all saved teams and restore them later without accounts.

**Why this priority**: Demo risk and “no accounts” both need safety rails.

**Independent Test**: Trigger a route/render failure path (or mount recovery UI in isolation); export/import the all-teams backup file with multiple teams present.

**Acceptance Scenarios**:

1. **Given** an uncaught render error in the main app tree, **When** it occurs, **Then** the user sees a calm recovery screen with a way to reload (not an empty white page).
2. **Given** multiple saved teams, **When** the user chooses backup/export all, **Then** they receive a downloadable file containing those teams.
3. **Given** a valid backup file, **When** the user restores it, **Then** teams reappear in storage (with clear confirmation and a safe conflict policy documented in Assumptions).
4. **Given** an invalid backup file, **When** restore is attempted, **Then** the user sees an error and existing teams are not wiped.

---

### User Story 5 - Mobile roster is usable without horizontal scrolling (Priority: P2)

On a phone-width viewport, a player can see and edit all six slots without dragging a wide table sideways. Building a team on mobile feels intentional, not desktop-squeezed.

**Why this priority**: Recruiters and players often open the live demo on phones.

**Independent Test**: Open Team Builder at ~375px width with 0–6 Pokémon; confirm layout and primary slot actions without horizontal page scroll for the roster itself.

**Acceptance Scenarios**:

1. **Given** a viewport around phone width, **When** viewing the six slots, **Then** the roster does not require horizontal scrolling to reach every slot.
2. **Given** filled slots on mobile, **When** the user needs set completeness and basic slot actions, **Then** those remain reachable without a desktop-only min-width table.
3. **Given** desktop widths, **When** viewing the roster, **Then** the denser multi-column layout remains usable (no regression to an unusable stacked mess on large screens).

---

### User Story 6 - Default Reg M-C legality feels verified, not inherited-guess (Priority: P1)

A player on Champions Reg M-C builds a team and gets clear banned/restricted feedback for Legendary, Mythical, and Paradox species consistent with the published ban-only M-C rules. The “unverified / inherited” banner for the default format is removed once those checks are in place. The product still states it is not an official event authority.

**Why this priority**: Default format still advertising unverified legality undercuts the “user-ready product” story.

**Independent Test**: Place banned legendary/mythical/paradox and legal non-banned species on an M-C team; confirm Check/report outcomes and absence of the unverified banner for M-C.

**Acceptance Scenarios**:

1. **Given** Reg M-C as the team format, **When** viewing Check / legality notices, **Then** the format is not marked `legalityUnverified` / “inherited unverified” for the default product path.
2. **Given** a Legendary, Mythical, or Paradox species on an M-C team, **When** legality runs, **Then** the team shows a banned (or equivalent illegal) result for that species.
3. **Given** a clearly legal non-banned species allowed in M-C, **When** legality runs, **Then** that species alone does not trigger a ban failure.
4. **Given** any legality UI, **When** presented, **Then** a short disclaimer remains that this lab is not an official Championship/event authority.
5. **Given** older Champions formats (M-A / M-B) that share the same ban-only L/M/P rule, **When** updated, **Then** they either receive the same verified treatment or keep an explicit unverified label — no silent half-upgrade.

### Edge Cases

- Clipboard API missing (older browsers / insecure context): fallback text path still works.
- Share URL over length limit: existing length-gate behavior preserved with a visible error.
- Backup restore with duplicate team names: rename or keep both under a documented conflict policy (see Assumptions).
- Partial PokeAPI outage during share import: warn incomplete; do not pretend full success.
- Mega / form variants of banned base lines: treated consistently with existing species-id mapping rules.
- Offline meta with zero bundled snapshot for a format: honest empty/offline empty state, not a wrong format silently substituted without label.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Portfolio case study (EN + PT) MUST describe the current four-step workflow and current AI provider; MUST NOT claim removed or never-shipped features.
- **FR-002**: README highlights and capability tables MUST match the shipped product (workflow, AI provider, capabilities, test claims).
- **FR-003**: Team export/share copy actions MUST surface success and failure; on failure MUST provide a non-clipboard fallback to obtain the content.
- **FR-004**: Invalid share-link decode MUST notify the user and clear the bad parameter without crashing.
- **FR-005**: Partial species resolution on share import MUST warn that the imported roster is incomplete.
- **FR-006**: Offline/fallback meta for the default Reg M-C path MUST be M-C-keyed or explicitly labeled stale/wrong-era — never silent M-A-as-current.
- **FR-007**: The main application MUST show a recovery shell on unexpected render failures, with a reload path.
- **FR-008**: Users MUST be able to download a backup of all saved teams and restore from a valid backup without destroying unrelated data on invalid files.
- **FR-009**: On phone-width viewports, the six-slot roster MUST be usable without horizontal scrolling.
- **FR-010**: Champions Reg M-C MUST enforce ban-only rules for Legendary, Mythical, and Paradox species with curated data sufficient to clear the unverified flag for that format.
- **FR-011**: Reg M-C legality UI MUST retain a non-oracle disclaimer even after verification.
- **FR-012**: Existing guided four-step builder, Team report, Showdown import/export, per-team regulation, Groq coach, and localStorage schema MUST keep working.
- **FR-013**: Automated tests MUST cover new backup restore validation, share import failure/partial paths (or equivalent pure helpers), and M-C ban classification for representative species.

### Key Entities

- **Team library backup**: Portable snapshot of all saved teams plus schema version metadata for restore.
- **Fallback meta snapshot**: Bundled usage/meta payload tagged by regulation id and freshness label for offline display.
- **Regulation legality profile**: Format id, verified/unverified flag, ban/restrict rules, inheritance links, and user-facing notes/disclaimer.
- **Species legality class**: Classification used for Champions ban-only rules (e.g. legendary / mythical / paradox / normal) tied to species identity.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A reviewer comparing portfolio + README to the live app finds zero outdated workflow/AI/phantom-feature claims in the VGC Team Lab case study.
- **SC-002**: In forced clipboard-failure and bad-share-link tests, 100% of attempts produce a visible user message (no silent no-ops).
- **SC-003**: With the API offline and format Reg M-C, users can identify within 5 seconds whether meta is live, offline, or stale — without mistaking unlabeled older ladder data for current M-C live meta.
- **SC-004**: Injected render failure shows a recovery UI instead of a blank page in manual QA.
- **SC-005**: A user can back up and restore a library of at least 3 teams in under 2 minutes.
- **SC-006**: At 375px width, all six slots are reachable without horizontal scrolling the roster.
- **SC-007**: On Reg M-C, representative Legendary, Mythical, and Paradox picks fail legality; representative legal picks do not; the unverified banner is gone for M-C.

## Assumptions

- Portfolio updates live in the separate `portfolio-website` repo and ship with this feature’s “story sync” acceptance, even if versioned apart from the pokedex git history.
- “Verified” means curated, test-backed ban classification for Champions ban-only rules (Legendary / Mythical / Paradox, 0 restricted), sourced from publicly described M-C rules and documented in design notes — not a claim of official Pokémon Company certification.
- Mega Evolutions and alternate forms follow existing species-id mapping; if a base line is banned, forms that are the same competitive identity remain banned unless an explicit exception is documented.
- Backup restore conflict policy default: merge by appending restored teams (generate unique names on collision); never wipe the whole library on a failed parse.
- M-A and M-B receive the same verified ban-only treatment when they share the L/M/P rule; otherwise they keep explicit unverified labeling.
- No accounts, cloud sync, short-link service, or Render keepalive daemon are in scope.
- Mobile polish targets the Team Builder roster first; Browse/Detail may keep existing responsive behavior unless broken by roster changes.
- Official handbooks can change; the product keeps a dated note and disclaimer so future regulation shifts are honest.
