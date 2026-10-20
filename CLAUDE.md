# CLAUDE.md

Standing instructions for every Claude session in this repo. Every run reads this whole file, so it stays short: rules live here, detail lives in the files below.

## Read first

- **SPEC.md**: what the app does and why, the engine's algorithm (§7) and the decision log (§8). The source of truth.
- **ARCHITECTURE.md**: folder map and data flow, as the code is today.

## Source of truth

- Build to SPEC.md. If it doesn't cover a behavior, stop and ask the owner, with a recommended default. Never guess and move on.
- Open questions are GitHub issues labeled `question`, never notes in the docs.
- When the owner decides something, update SPEC.md (and the §8 decision log) in the same PR, committed before the code that implements it.
- SPEC.md §7 is the engine's contract. Its priority weights are decisions of record: do not change one without a worked example and a §8 entry.

## Stack

- React 19 + TypeScript (strict), built with Vite. Tailwind CSS 4. Recharts for charts.
- Persistence is `localStorage` only (one versioned key, `src/services/storage.ts`). There is no backend yet.
- Vitest + Testing Library (jsdom). ESLint.

## Architecture rules

- **The engine is pure TypeScript** in `src/engine/`: no React, no `fetch`, no storage, no randomness. The only clock read is the default for `runSimulation`'s `startDate`; every test passes a fixed start date.
- **Money is rounded to cents with `round2` after every operation.** Do not introduce a second rounding convention. (Integer cents is a planned V2 change; do not start it piecemeal.)
- **Stored data must keep loading.** Any change to the saved `AppState` shape bumps `schemaVersion` and adds a migration in `src/services/storage.ts` with a test.
- **No secrets, ever.** This repo is public. No keys, tokens, `.env` files, or real account data in code, fixtures, tests or screenshots. Use obviously fake sample data.
- Forms validate with the helpers in `src/services/debtValidation.ts`; do not duplicate validation in components.

## Tests

- Every worked example in SPEC.md §7 is a unit test. If a test and the spec disagree, the spec wins. If the spec looks wrong, stop and ask.
- Hand-compute expected values for engine tests; never paste the engine's own output into an assertion.

## Pull requests

- `main` is protected. Work on a branch, push it, and open a PR with the template.
- **One slice per PR:** one issue, one behavior. Aim for 300 changed lines or fewer, not counting tests, lockfiles and generated files.
- Tests ship in the same PR as the code they cover.
- Run `npm run check:fast` (lint, typecheck, tests) and `npm run build` before pushing. Never push red and wait for CI to find it.
- No drive-by refactors. Note them in an issue instead.

## Keeping token use lean

- Read only the files the task touches. Find them with grep or glob instead of reading whole folders.
- While working, run only the affected test file (`npx vitest run <path>`). Run `check:fast` once, before pushing.
