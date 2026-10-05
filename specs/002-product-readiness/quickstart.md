# Quickstart: Product Readiness

## Local verify

```bash
cd pokedex
npm test -- --watchAll=false
npm start
# optional API
npm run start:server
```

## Manual QA checklist

1. **Portfolio/README**: EN/PT case study + README say 4-step + Groq; no favorites / HF / six-step.
2. **Clipboard**: Deny clipboard (or stub) → error toast + fallback text path for Showdown/share/plain.
3. **Share link**: Open `/?team=not-valid` → error toast. Build share with 6 mons; break one name in payload → incomplete warning.
4. **Offline meta**: With API down / wrong `REACT_APP_API_URL`, default M-C shows Offline and M-C-keyed or labeled stale data — not silent unlabeled M-A-as-live.
5. **ErrorBoundary**: Temporarily throw in a child → recovery UI + reload works.
6. **Backup**: Export all teams → clear site data or new profile → restore merge → teams return.
7. **Mobile**: ~375px width — six slots visible without horizontal roster scroll.
8. **M-C legality**: Add Mewtwo / Miraidon / Flutter Mane → banned. Add Incineroar → not banned-as-legendary. No “unverified” banner on M-C. Disclaimer still visible in notes/Check.

## Portfolio

Edit and deploy `portfolio-website` messages separately after pokedex verify.
