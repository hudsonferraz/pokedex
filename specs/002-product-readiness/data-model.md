# Data Model: Product Readiness

## Team library backup file

```text
TeamLibraryBackup
├── version: number          # TEAM_SCHEMA_VERSION (3)
├── exportedAt: string       # ISO timestamp
└── teams: TeamRecord[]      # compact storage shape (same as localStorage teams[])
```

**Restore**: For each team → new `id` via `generateId()`, resolve name collisions, `saveToStorage` merge with existing library. Reject if `version` missing/unsupported or `teams` not array.

## Fallback meta entry (bundled)

```text
UsageFallbackEntry
├── updated: string
├── source: string
└── usage: { [speciesName]: number|object }

MetaFallbackEntry
├── topPokemon: string[]
├── cores: object[]
└── sourceNote?: string      # e.g. "Offline snapshot for Champions Reg M-C"
```

Keys MUST include `champions-reg-mc` (default). Fallthrough to older keys only with explicit stale labeling in the service result.

## Champions legality profile

```text
ChampionsRegulation
├── id: champions-reg-mc | champions-reg-mb | champions-reg-ma
├── legalityUnverified: false   # after this feature
├── maxRestricted: 0
├── banned: string[]            # from champions-banned.json
├── restricted: []
└── notes: string               # includes non-oracle / handbook reminder
```

No `legalityInheritsFrom` once own bans are authoritative.

## Species ban identity

Existing `normalizeSpeciesId` + `speciesMatchesList` (clause aliases + base form) apply. Ban list stores canonical Showdown/PokeAPI-style ids (`mewtwo`, `koraidon`, `flutter-mane`, …).
