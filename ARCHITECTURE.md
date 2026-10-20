# Architecture

How DebtVision is built. SPEC.md says what it does; this file covers only what exists in the code.

## Folder map

| Path | What it holds |
|---|---|
| `src/main.tsx`, `src/App.tsx` | Entry point. `App` wraps everything in `AppProvider`, shows onboarding until it is complete, then switches between the Dashboard and Manage tabs. |
| `src/types/index.ts` | Every shared type: `Debt`, `BudgetContext`, `AppState`, the engine's output types and `WarningType`. |
| `src/engine/` | The simulation engine, pure TypeScript. See "Engine". |
| `src/services/` | `storage.ts` (localStorage load, save, clear, migrate), `income.ts` (any pay frequency to monthly), `debtValidation.ts` (shared validators), `defaults.ts` (default state and select options). |
| `src/context/` | `AppContext.tsx`: React context with a reducer; every change is saved through `storage.ts`. `app-context.ts` holds the context object and types. |
| `src/components/onboarding/` | The five-step flow: Welcome, Budget, Debts, Strategy, Review. |
| `src/components/dashboard/` | The plan screen: action plan, summary stats, timeline and allocation charts, per-debt cards, warnings. `useSimulation.ts` runs the engine for the current state. Charts sit in `ChartErrorBoundary`. |
| `src/components/manage/` | The edit screen for budget and debts. |
| `src/components/shared/` | Reusable UI: Button, Input, Select, Toggle, Card, Stepper, ExpandableSection, ConfirmDialog, `DebtFormFields` (used by both onboarding and Manage). |
| `src/components/layout/TabBar.tsx` | Bottom tabs on phones, top tabs on desktop. |
| `.github/` | CI, security and merge-gate workflows, the `main` ruleset, Dependabot, the PR template. |
| `.claude/` | nightshift's config for this repo. |

## Data flow

User input (onboarding or Manage) -> `AppContext` reducer -> `storage.saveState` (localStorage key `debtvision_v1`) -> `useSimulation` -> `runSimulation` -> Dashboard components. The Dashboard only reads; all editing happens in onboarding and Manage.

`loadState` reads the saved object, and `migrateState` fills any missing field with its default, so older saves keep loading. `AppState.schemaVersion` marks the shape.

## Engine

`src/engine/simulate.ts` exports `runSimulation(debts, availableMonthlyBudget, strategy, startDate?)`, `round2` and `promoDateToMonth`. It runs the plan scenario and a minimums-only baseline through one internal `simulateScenario`. The algorithm, scoring weights, edge cases and worked example are in SPEC.md §7.
