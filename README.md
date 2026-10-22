# DebtVision

[![CI](https://github.com/ChrispyCode21/DebtVision_v1/actions/workflows/ci.yml/badge.svg)](https://github.com/ChrispyCode21/DebtVision_v1/actions/workflows/ci.yml)

> **Status: on hold (October 2026).** V1 is complete and usable. V2 (Cloudflare, offline sync, Plaid) is specified in [SPEC.md](SPEC.md) §9 but is not under active development. The nightshift builder skips issues labeled `on-hold`; remove that label from #35 and #36 to resume.

A debt payoff optimizer that produces a personalized, month-by-month payment plan across multiple debts. It accounts for promotional APR windows, deferred-interest traps, and budget constraints that generic snowball/avalanche calculators ignore.

## Why This Exists

People managing multiple debts juggle balances, interest rates, promotional windows, and payment strategies across bank apps and spreadsheets. DebtVision holds the full picture and tells you exactly what to pay, how much, and when.

V1 is a browser-only app: you enter your income, fixed expenses and debts, and it simulates the payoff. Connecting real accounts (via Plaid) and moving beyond localStorage is the planned next version; see [SPEC.md](SPEC.md) §5, §7.10 and §8.

## Quick Start

```bash
npm install
npm run dev          # dev server on http://localhost:5173
npm test             # run the tests once
npm run check:fast   # lint + typecheck + tests (what CI runs first)
npm run build        # production build
```

Requires Node 22.

## Tech Stack

- **React 19** + **TypeScript 5.9** (strict mode)
- **Vite 8** for builds, **Vitest** + Testing Library for tests
- **Tailwind CSS 4** for styling
- **Recharts 3** for data visualization
- **localStorage** for persistence (no backend)

## Documentation

| File | What it is |
|---|---|
| [SPEC.md](SPEC.md) | Product spec, the engine's algorithm (§7), and the decision log (§8). The source of truth. |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Folder map and data flow, as the code is today. |
| [CLAUDE.md](CLAUDE.md) | Standing rules for AI-assisted development in this repo. |

## How the Engine Works

The engine (`src/engine/simulate.ts`) runs a month-by-month simulation that accrues interest (handling promo rates and expiration dates), scores debts by priority (deferred-interest risk > promo urgency > effective rate > your avalanche/snowball preference), pays minimums first and then the extra by priority, and carries freed minimums forward when a debt is paid off. It compares the result with a minimums-only baseline to report interest saved. Details, scoring formulas and a worked example are in [SPEC.md](SPEC.md) §7.

**Promo types.** A standard 0% balance transfer just changes rate when the promo ends. A *deferred-interest* promotion (store or medical financing, "no interest if paid in full") charges all the promo-period interest if any balance remains at the deadline. Only turn on the "Deferred Interest" option for the second kind.

## Testing

```bash
npm test                              # all tests, once
npm run test:watch                    # watch mode
npx vitest run src/engine             # just the engine
```

Tests cover income conversion, storage round-tripping and migration, input validation, chart error handling, and the engine: single and multi-debt runs, promo expiry, deferred interest, budget shortfalls, avalanche vs. snowball ordering, and edge cases.

## Known Limitations

- **localStorage only.** Clearing browser data erases everything; there is no sync or backup.
- **Fixed minimum payments.** The engine holds each minimum constant, though real minimums shrink as balances fall.
- **No export.** The plan can't be exported or printed.
- **Single strategy view.** Avalanche and snowball can't be compared side by side.

## Path Aliases

`@/` maps to `src/` (configured in `tsconfig.app.json` and `vite.config.ts`).
