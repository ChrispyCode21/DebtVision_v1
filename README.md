# DebtVision v1

A debt payoff optimizer that produces a personalized, month-by-month payment plan across multiple debts. It accounts for promotional APR windows, retroactive interest traps, and budget constraints that generic snowball/avalanche calculators ignore.

## Why This Exists

People managing multiple debts juggle balances, interest rates, promotional windows, and payment strategies across bank apps and spreadsheets. DebtVision holds the full picture and tells you exactly what to pay, how much, and when.

## Quick Start

```bash
npm install
npm run dev       # dev server on http://localhost:5173
npm test          # run tests (69 passing)
npm run build     # production build
```

## Tech Stack

- **React 19** + **TypeScript 5.9** (strict mode)
- **Vite 8** for builds, **Vitest** for testing
- **Tailwind CSS 4** for styling
- **Recharts 3** for data visualization
- **localStorage** for persistence (no backend)

## Project Structure

```
src/
  types/index.ts              # All TypeScript interfaces (Debt, AppState, SimulationResult, etc.)
  engine/simulate.ts          # Core optimization engine (~530 lines)
  engine/simulate.test.ts     # Engine tests (~60 tests covering edge cases)
  services/
    storage.ts                # localStorage load/save/clear
    income.ts                 # Income frequency -> monthly conversion
    defaults.ts               # Default app state
  context/AppContext.tsx       # React Context + useReducer, auto-saves to localStorage
  components/
    shared/                   # Reusable UI: Button, Input, Card, Toggle, Select, Stepper, ExpandableSection
    onboarding/               # 5-step wizard: Welcome, Budget, Debts, Strategy, Review
    dashboard/                # Plan display: SummaryStats, ActionPlan, Charts, PayoffCards, Warnings
    manage/                   # Edit screen: ManageBudget, ManageDebts, ManageScreen
    layout/TabBar.tsx         # Mobile bottom / desktop top navigation
  App.tsx                     # Root: AppProvider + tab routing + onboarding guard
```

## Architecture

**Data flow:** User input (onboarding/manage) -> AppContext (useReducer + localStorage) -> Simulation engine -> Dashboard display

The simulation engine (`src/engine/simulate.ts`) is the core of the app. It runs a month-by-month simulation that:

- Accrues interest (handling promo rates and expiration dates)
- Scores debts by priority (retroactive interest risk > promo urgency > effective rate > base strategy)
- Allocates payments (minimums first, then extras by priority score)
- Cascades freed minimums when debts are paid off
- Compares against a minimum-only baseline to calculate interest saved

The priority scoring system uses a weighted hierarchy so retroactive interest deadlines always dominate, regardless of strategy choice (avalanche/snowball).

## Key Types

```typescript
// Input
interface Debt {
  id: string; name: string; balance: number;
  apr: number; minPayment: number;
  promoApr: number | null;           // temporary promotional rate
  promoExpiration: string | null;     // ISO date when promo ends
  retroactiveInterest: boolean;       // if true, promo expiry triggers back-interest
}

// Output
interface SimulationResult {
  actionPlan: MonthDirective[];       // "Pay $X to Y because Z" per month
  schedule: MonthEntry[];             // Full amortization schedule
  debtSummaries: DebtSummary[];       // Per-debt payoff month + total interest
  totalMonths: number;
  totalInterestPaid: number;
  interestSaved: number;              // vs. minimum-only baseline
  warnings: Warning[];                // Budget shortfalls, promo deadlines, etc.
}
```

Full type definitions are in `src/types/index.ts`.

## Testing

```bash
npm test                    # run all tests
npx vitest run --reporter=verbose   # verbose output
```

Tests cover:
- Income frequency conversions
- localStorage round-tripping
- Single and multi-debt simulations
- Promotional APR expiration and retroactive interest
- Budget shortfall scenarios with proportional allocation
- Avalanche vs. snowball ordering
- Edge cases (zero-balance debts, zero-APR, immediate payoff)

## Known Limitations

- **localStorage only** — Data is stored in the browser's localStorage. Clearing browser data will erase all saved information. There is no backend or cloud sync.
- **No export** — There is currently no way to export or print the payoff plan (PDF, CSV, etc.).
- **Single strategy view** — The app displays the plan for the selected strategy only. There is no side-by-side comparison of avalanche vs. snowball.
- **No mobile chart optimization** — Charts use fixed heights and may be hard to read on very small screens with many debts.

## Specification Documents

- `DebtVision_V1_Spec.md` — Product specification (UX flows, screen layouts, features)
- `DebtVision_Algorithm_Spec.md` — Algorithm specification (priority scoring formula, simulation pseudocode, worked examples, edge cases)

## Path Aliases

`@/` maps to `src/` throughout the project (configured in `tsconfig.app.json` and `vite.config.ts`).
