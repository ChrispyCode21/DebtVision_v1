# DebtVision V1 — Product Specification

**Debt Strategy Orchestrator**
March 2026 · Draft · Revised October 2026

> **Status:** V1 is built (React/TypeScript, localStorage). §1–§6 are the product spec. §7 is the engine's algorithm specification, reconstructed from the code and tests in October 2026 because the original was never saved. §8 is the decision log.

---

## 1. Product Identity

### 1.1 Problem Statement

People managing multiple debts are forced to mentally juggle balances, interest rates, promotional windows, and payment strategies across multiple bank apps, spreadsheets, and tools. The cognitive overhead of this process leads to suboptimal decisions — missed promotional deadlines, inefficient payment allocation, and a general inability to see the full picture in one place.

### 1.2 What DebtVision Is

DebtVision is a debt strategy orchestrator. It is the single place that holds the full picture of a user's debt landscape — including the real-world complexity that generic calculators ignore — and produces an optimized, month-by-month action plan for paying it all off.

### 1.3 What DebtVision Is Not

- A full budgeting app (it captures just enough budget context to power the optimization engine)
- A transaction tracker or spending categorizer
- A bank account aggregator (no Plaid dependency in V1)
- Another snowball-vs-avalanche calculator

> **Core Value Proposition:** "One place that holds the full picture and tells you exactly what to pay, how much, and when — accounting for the real-world complexity that generic calculators ignore."

---

## 2. Architecture Layers

DebtVision is structured around three distinct layers. Each layer has a clear responsibility and a clean boundary with the others.

### 2.1 Layer 1 — Data Model

The data model captures debts with rich metadata that goes beyond what typical calculators collect. This is what enables the optimization engine to make smarter decisions than simple rate-based or balance-based sorting.

#### Debt Record

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique identifier (crypto.randomUUID) |
| name | string | User-defined label (e.g., "BoA Visa", "Shannon's Card") |
| balance | number | Current outstanding balance |
| limit | number \| null | Credit limit (if applicable) |
| apr | number | Standard annual percentage rate |
| minPayment | number | Required minimum monthly payment |
| zeroMonthly | boolean | Flag: this card is paid in full each month (excluded from payoff strategy, but included in budget calculation) |

#### Promotional Terms (Advanced)

| Field | Type | Description |
|-------|------|-------------|
| promoApr | number \| null | Promotional APR (e.g., 0% balance transfer rate) |
| promoExpiration | date \| null | Date the promotional rate expires |
| retroactiveInterest | boolean | **Deferred-interest promotion** (e.g. store or medical financing: "no interest if paid in full in 12 months"). If any balance remains at expiration, the interest accrued during the promo is charged retroactively. Leave **off** for a standard 0% balance transfer or purchase APR, where only the remaining balance accrues interest going forward. See §7.4. |

The promotional fields are surfaced under an **Advanced** expandable section during debt entry. Casual users skip it entirely; power users get the fields that make the engine significantly smarter.

#### Budget Context

DebtVision captures just enough budget information to derive the user's available monthly debt repayment budget. This is not a budget tracker — it is an available-funds calculator.

| Field | Type | Description |
|-------|------|-------------|
| netIncome | number | User's net income (post-tax, post-insurance) |
| incomeFrequency | enum | weekly \| biweekly \| semi-monthly \| monthly \| annually |
| fixedExpenses | FixedExpense[] | Recurring non-debt obligations (rent, utilities, subscriptions, etc.) |

**Derived value:** availableMonthlyBudget = normalizedMonthlyIncome − sum(fixedExpenses). This is the number fed into the optimization engine.

### 2.2 Layer 2 — Optimization Engine

The optimization engine is the core differentiator. It takes the full debt landscape and available budget, then produces the optimal payment sequence accounting for time-bound constraints that simpler tools ignore.

#### What Makes This Different

Standard debt calculators sort debts by rate (avalanche) or balance (snowball) and apply a static ordering. DebtVision's engine handles:

- **Promotional rate deadlines:** A 0% APR expiring in October must be prioritized even if its current rate is the lowest in the portfolio.
- **Retroactive (deferred) interest:** Deferred-interest promotions create hard deadlines — if any balance remains when the promo ends, the interest accrued during the promo is charged all at once (§7.4). Standard 0% balance transfers do not work this way and are modeled as a plain rate change.
- **Zero-monthly cards:** Cards paid in full each cycle are excluded from the payoff strategy but their minimum obligations reduce available budget.
- **Freed-minimum cascading:** When a debt is paid off, its minimum payment rolls into the available pool automatically.
- **Budget shortfall handling:** When the budget cannot cover all minimums, payments are allocated proportionally.

#### Engine Inputs

- `Debt[]` — full array of debt records with metadata
- `availableMonthlyBudget` — derived from budget context
- `strategy` — user's base preference (avalanche | snowball), used as tiebreaker when no constraint-based priority exists

#### Engine Outputs

| Output | Description |
|--------|-------------|
| actionPlan | Month-by-month payment directives: which debt, how much, in what order |
| schedule | Full simulation timeline with per-debt snapshots each month |
| debtSummaries | Per-debt payoff month and total interest paid |
| totalMonths | Months to debt-free |
| totalInterestPaid | Aggregate interest across all debts |
| interestSaved | Interest saved vs. minimum-only baseline |
| warnings | Alerts: promo deadlines at risk, budget shortfalls, 600-month cap hit |

> **Key Differentiator:** The output is not a chart the user interprets. It is explicit, month-by-month directives: "March: pay $150 to Card A, $300 to Card B, minimum on Card C. July: shift priority to Card A before the promo expires in October."

#### Algorithm Approach (V1)

The V1 engine uses a **forward simulation with constraint-aware reprioritization** rather than true global optimization. Each month is simulated sequentially, with the priority ordering re-evaluated at each step based on current balances, approaching deadlines, and freed minimums from paid-off debts.

This is not globally optimal in the mathematical sense — it does not explore all possible payment allocations across all months to find the theoretical minimum interest. But it is significantly better than static sorting, handles the real-world constraints that matter most, and is computationally simple enough to run instantly in the browser.

The detailed algorithm specification (priority scoring, deadline proximity weighting, retroactive interest handling) will be developed during implementation.

### 2.3 Layer 3 — Action Plan Output

The action plan is the primary user-facing deliverable. While charts and summaries support understanding, the core output is a prescriptive monthly payment plan.

#### Primary Output: Monthly Directives

Each month's plan includes:

- Exact dollar amount to pay toward each debt
- Explicit priority ordering with reasoning (e.g., "Prioritized: promo expires Oct 2026")
- Milestone markers (e.g., "Card B paid off — $75/mo freed")
- Warnings when a promo deadline is at risk given current budget

#### Supporting Visualizations

- Payoff timeline chart — stacked area showing total debt declining over time
- Payment allocation chart — stacked bar showing per-debt payment distribution each month
- Summary statistics — months to payoff, total interest, interest saved vs. baseline
- Per-debt payoff cards — individual payoff date and interest cost per debt

---

## 3. User Experience

### 3.1 Design Target

**Mobile-first.** The primary interaction model assumes a phone screen. The stepper onboarding flow is inherently mobile-friendly (vertical, single-column, one-thing-at-a-time). The dashboard must be fully usable on mobile. Desktop is supported but is not the primary design target.

### 3.2 Onboarding Stepper

First-time users are guided through a multi-step onboarding flow that collects all necessary data before presenting the action plan. The stepper transforms what could feel overwhelming into a series of small, manageable asks.

#### Step 1: Welcome

- **Screen:** Friendly landing page with a clear value proposition and a single CTA.
- **Headline:** "Ready to optimize your debt payoff?"
- **Subtext:** Brief explanation of what the app does — not a feature list, but a promise: "We'll build you a month-by-month plan that accounts for your rates, promo windows, and real budget."
- **CTA:** "Let's Get Started"

#### Step 2: Budget Context

- **Screen:** "Let's start with some basic budget details."
- **Net income** — single number input with a frequency selector (weekly, biweekly, semi-monthly, monthly, annually). The app normalizes to monthly internally. Users enter what they know; the app does the math.
- **Fixed expenses** — repeatable row entry (name + amount). Includes a (?) tooltip explaining what qualifies: rent/mortgage, utilities, insurance, subscriptions, childcare — recurring obligations that don't change month to month.
- **Derived output (shown to user):** "You have approximately $X available each month." This provides immediate feedback and a sanity check before proceeding.

#### Step 3: Debt Entry

**Default fields (always visible):**
- Name (user-defined label)
- Current balance
- Credit limit (optional)
- APR (with a (?) explaining where to find it)
- Minimum payment
- Zero-monthly toggle ("I pay this in full each month")

**Advanced section (expandable):**
- Promotional APR
- Promo expiration date
- Deferred interest flag (with a (?) explaining it: store or medical financing that charges the promo-period interest if not paid in full by the deadline. Not typical for bank balance transfers; leave off for those)

Users can add multiple debts. Each entry appears as a card that can be edited or removed. A running summary shows the total debt load as entries are added.

#### Step 4: Strategy Preference

Simple toggle between Avalanche (highest rate first) and Snowball (lowest balance first), with a brief, jargon-free explanation of each. This serves as the base strategy — the engine's constraint-aware logic will override it when deadline-sensitive debts require reprioritization.

> **Design Principle:** The strategy toggle is a preference, not a rigid rule. The engine treats it as a tiebreaker for debts with no time-bound constraints. Promo deadlines and retroactive interest clauses always take priority.

#### Step 5: Your Plan

The dashboard. This is the payoff — the moment the user sees something they couldn't have figured out on their own. The user lands here and immediately sees their month-by-month payment directives, supported by the timeline chart, allocation chart, and summary statistics.

### 3.3 App Structure (Post-Onboarding)

After onboarding, the app has two primary views:

#### Dashboard (Hero Screen)

The command center. This is where the user goes to see their plan. The primary content is:

1. **Action plan directives** — the month-by-month payment instructions (hero content, top of screen)
2. **Payoff timeline chart** — stacked area, total debt declining over time
3. **Payment allocation chart** — stacked bar, per-debt payment distribution each month
4. **Summary stats** — months to payoff, total interest, interest saved
5. **Per-debt payoff cards** — individual payoff date and interest cost

The dashboard is a read-only view of the engine output. No data entry happens here.

#### Manage (Edit Screen)

Where the user modifies their inputs. Debts are represented as editable cards. Budget context (income, fixed expenses) is editable here as well. Changes trigger a re-run of the optimization engine, and the user can navigate back to the dashboard to see the updated plan.

This is not a return to the stepper — it's a direct editing interface for users who already understand the data model.

### 3.4 Navigation

Two primary tabs/routes: **Dashboard** and **Manage**. Simple, clear, no hierarchy to get lost in.

---

## 4. Persistence (V1)

**localStorage.** All data (debts, budget context, strategy preference) persisted to a single versioned key. Atomic reads/writes to prevent partial-state corruption.

Cross-device sync is explicitly out of scope for V1. It requires a backend, a database, and user accounts — a fundamentally different product maturity level that is not necessary to validate the core product.

---

## 5. V2 Extension Seams

V1 is deliberately scoped, but architected so that V2 features extend rather than rewrite.

| Seam | How It Extends |
|------|---------------|
| Plaid integration | Auto-populates income, fixed expenses, and debt balances that V1 users enter manually. Plaid Liabilities can also supply each card's current minimum payment, due date and APR(s). It cannot supply future minimums (the engine still needs a minimum-payment model, §7.10) and is not expected to supply promo expiration or the deferred-interest flag, which stay user-confirmed. Needs a backend (see "Backend + accounts" below), so it ends the localStorage-only design. |
| Scenario comparison | "What if I add $200/month?" or "What if I get a new balance transfer offer?" — new constraint types fed into the existing engine. |
| Spending analysis | Transaction categorization and pattern recognition layer on top of budget context. Enables recommendations like "your DoorDash habit is adding 3 months to your debt-free date." |
| New debt types | Student loans, mortgages, auto loans — new metadata fields on the debt record, new constraint logic in the engine. |
| AI recommendations | Natural language insights layered on top of the engine output. V1 engine output provides the structured data; AI interprets and explains it. |
| Backend + accounts | Database persistence, user auth, cross-device sync. Replaces localStorage with API calls. Existing data model maps directly to DB schema. |

---

## 6. Open Questions

- **Optimization algorithm specifics:** Answered by §7 (the algorithm as built). Remaining open items are in §7.10.
- **Action plan presentation format:** How are monthly directives displayed on mobile? Scrollable timeline? Expandable month cards? A "current month" hero with future months summarized?
- **Budget context editing UX:** When a user changes income or expenses on the Manage screen, is the engine re-run immediately (live updating) or on explicit save?

---

## 7. Optimization Engine: Algorithm Specification

Implemented in `src/engine/simulate.ts`; tests in `src/engine/simulate.test.ts`. The engine is a pure function of its inputs (no clock, no randomness, no React): `runSimulation(debts, availableMonthlyBudget, strategy, startDate?)`. Money is a JavaScript number rounded to cents with `round2` after each operation (integer cents is a V2 decision, §7.10).

> **Provenance.** The original algorithm spec was not saved. This section was reconstructed in October 2026 from the code, its tests and the original design brief, and corrected where the code disagreed with the intent. Decisions that changed behavior are recorded in §8.

### 7.1 Overview

A forward, month-by-month simulation, not a global optimizer. Each month: accrue interest, score every active debt, pay all minimums, then give the rest of the budget to the highest-scoring debts in order. When a debt reaches zero its minimum stays in the pool, so the same budget is spread over fewer debts (freed-minimum cascading). The run ends when every balance is zero or at month 600. The same simulation is run a second time paying minimums only; the difference in total interest is `interestSaved`.

### 7.2 Inputs and assumptions

- `Debt[]`, `availableMonthlyBudget` (income minus fixed expenses, normalized to monthly), `strategy` (`avalanche` | `snowball`), and `startDate` (default: now). Month 1 is the month of `startDate`.
- **Zero-monthly cards** (`zeroMonthly`) are excluded from the simulation. Their `minPayment` is subtracted from the budget first: `effectiveBudget = availableMonthlyBudget - sum(zeroMonthly minPayment)`.
- The budget is constant for all months (V1 assumption). Minimum payments are **fixed dollar amounts** that do not shrink as balances fall (§7.10).
- A promo is `promoApr` plus `promoExpiration`. `promoExpiration` is converted to a month number `E` = whole months between the start month and the expiration month (never below 0). A `promoApr` with no expiration is permanent. Dates are parsed as `YYYY-MM-DD` directly to avoid timezone shifts.

### 7.3 Monthly loop

For month `m = 1, 2, ...` while any debt is active and `m <= 600`:

1. **Interest.** For each active debt, `interest = round2(balance * rate / 12 / 100)` and the balance grows by that amount. `rate` is `promoApr` through month `E` inclusive (the promo rate still applies in its expiration month) and `apr` from month `E + 1`. No promo, or a promo already expired at month 1 (`E = 0`), means `apr` throughout.
2. **Score.** Compute each active debt's priority score (§7.5), after interest and before payments. Emit `RETROACTIVE_INTEREST_AT_RISK` once per debt (§7.6).
3. **Allocate.**
   - *Shortfall* (`effectiveBudget < sum(min(minPayment, balance))`): `BUDGET_SHORTFALL` was raised up front; each debt receives `effectiveBudget * minPayment / sum(minPayment)`, capped at its balance; any rounding remainder goes to the largest balance (or is clawed back from it) so the month's total equals the budget exactly.
   - *Otherwise:* pay `min(minPayment, balance)` on every debt, then give the remaining pool to debts in descending score order, each capped at its balance, until the pool is empty. Money not needed by a debt falls to the next one in order.
4. **Deferred interest charge.** For debts with `retroactiveInterest`, at the end of month `E`, after that month's payments, charge the deferred interest if the balance is above zero (§7.4).
5. **Payoff.** A debt at or below zero becomes inactive and records its payoff month. Its minimum is no longer reserved, so it is part of the pool for every later month.
6. **Record.** Append the month's schedule entry (per-debt balance, interest, payment) and action-plan directive (§7.7).

### 7.4 Promotions and deferred interest

Two different products share the promo fields:

- **Standard 0% (or low) promotional APR**, e.g. a balance transfer. At expiry the rate changes to `apr` going forward. Nothing is charged retroactively. This is the default (`retroactiveInterest = false`).
- **Deferred interest** (`retroactiveInterest = true`), e.g. store or medical financing. Interest accrues during the promo as if there were no promo, but is only charged if a balance remains when the promo ends; then all of it is charged at once. Paying the debt off by the end of month `E` waives it entirely. Any remaining balance, however small, triggers the whole charge. See the CFPB's explanation of [deferred interest](https://www.consumerfinance.gov/ask-cfpb/i-got-a-credit-card-promising-no-interest-for-a-purchase-if-i-pay-in-full-within-12-months-how-does-this-work-en-40/).

Method for the deferred-interest charge (decision D1, §8): for each month `m = 1..E`, accumulate `deferred += startOfMonthBalance(m) * (apr - promoApr) / 12 / 100`, using the same balance the month's normal interest is computed on. Keep the accumulator unrounded and `round2` it once when it is charged. At the end of month `E`, after payments, if the balance is above zero, add `round2(deferred)` to the balance. The charge is recorded in the schedule on month `E`'s interest and raised as `RETROACTIVE_INTEREST_APPLIED` with an `amount`. If `promoApr >= apr` nothing is deferred and no warning is raised.

Issuers differ: some compute this on the declining balance (used here, and described by the CFPB as the usual way), others on the original purchase amount. The original-amount figure (`originalBalance * apr / 12 / 100 * E`) is a pessimistic upper bound and is the **previous** behavior. A per-debt switch between the two is a V2 candidate (§7.10).

**Known gap:** the simulation cannot see interest that accrued before month 1. A deferred-interest promo that is already partly elapsed is under-counted. V2: an optional "deferred interest accrued so far" field.

### 7.5 Priority score

`score = S_promo + S_retro + S_effective + S_base`, rounded to cents. Highest score gets extra money first. With `mr` = payable months left before the promo's deadline bites (see the note below the table):

| Term | Applies when | Value |
|---|---|---|
| `S_promo` | promo with an expiration still ahead | `1000 / mr` for `mr <= 12`; `1000 / 12` for `mr > 12` |
| `S_retro` | `retroactiveInterest` and promo ahead | `capacity = (max(0, budget - sum(active minimums)) + minPayment) * mr`. If `balance > capacity`: `2000`. Else with `ratio = capacity / balance`: `1500 * (1.5 - ratio) / 0.5` when `ratio < 1.5`, else `0` |
| `S_effective` | always | promo ahead: `10 * (promoApr + (apr - promoApr) / (1 + mr))`; otherwise `10 * apr` |
| `S_base` | always | avalanche: `apr`. snowball: `30 * (1 - balance / maxActiveBalance)` |

Ordering effect: a deferred-interest debt that cannot be cleared in time (`S_retro = 2000`) outranks everything; one that can only just be cleared outranks ordinary promo urgency; the user's strategy decides only when nothing time-bound separates the debts. The weights (1000, 2000, 1500, 30, the 12-month cap, the 1.5 ratio) are tuning constants. They are decisions of record: changing one changes plans for real users, so a change needs a worked example and an entry in §8.

**Counting `mr` (decision D2).** A deferred-interest charge is taken after month `E`'s payments, so for those debts month `E` is still payable and `mr = E - m + 1` while `m <= E`. A plain promo's rate change only affects the *next* month's interest, so its `mr = E - m` while `m < E`. Plain-promo scoring is deliberately unchanged from the original engine. Reconsidering it (for example whether a 0% promo should outrank a higher-rate debt at all) is a weights decision (§7.10), not part of D2.

### 7.6 Warnings

| Type | Severity | Raised when |
|---|---|---|
| `NO_OPTIMIZABLE_DEBTS` | info | every debt is zero-monthly; the run ends immediately |
| `BUDGET_SHORTFALL` | critical | effective budget is below the sum of minimums |
| `MINIMUM_EXCEEDS_BUDGET` | critical | one minimum alone exceeds the effective budget (per debt) |
| `NO_EXTRA_BUDGET` | warning | effective budget equals the sum of minimums |
| `RETROACTIVE_INTEREST_AT_RISK` | critical | once per debt, the first month its balance exceeds what it could pay off before expiry |
| `RETROACTIVE_INTEREST_APPLIED` | critical | the deferred charge is applied; carries `amount` |
| `SIMULATION_CAP_REACHED` | critical | 600 months without payoff (typically a minimum below the monthly interest) |

### 7.7 Outputs

Shapes are in `src/types/index.ts`: `SimulationResult` = `actionPlan` (`MonthDirective[]`: payments with a reasoning string, milestones, warnings), `schedule`, `debtSummaries`, `totalMonths`, `totalInterestPaid`, `interestSaved`, `warnings`. `interestSaved = max(0, baselineInterest - planInterest)`, where the baseline is the same simulation paying minimums only (freed minimums are not redirected) and applying the same deferred-interest rule. A deferred-interest charge therefore usually lands in both runs, and its size differs between them.

Each extra-payment directive's `reasoning` explains why *that debt* received that money, in this order: deferred-interest risk, then promo expiry, then the strategy (decision D3). The first debt to receive extra money reads "Prioritizing ..."; any spill-over to later debts reads "Remaining extra to ... next highest/lowest ...". A snowball reason quotes the balance the debt was ranked on (after interest, before payments), not the balance after the payment.

### 7.8 Edge cases

| Case | Behavior |
|---|---|
| Budget below minimums | proportional allocation; totals equal the budget exactly |
| One minimum above the whole budget | `MINIMUM_EXCEEDS_BUDGET` plus the shortfall path |
| Promo expires this month | promo rate for this month, `apr` from the next |
| Promo already expired | treated as standard from month 1 |
| Promo without expiration | permanent promo rate |
| Several promos in one month | independent debts, ordered by score |
| Paid off in the expiry month | no deferred charge (waived) |
| Only zero-monthly cards | `NO_OPTIMIZABLE_DEBTS`, empty plan |
| Budget equals minimums | `NO_EXTRA_BUDGET`, pure minimums |
| Balance below its minimum | pays the balance, frees the rest the same month |
| `mr` of 0 in `S_promo` | guarded: excluded, no division by zero |

### 7.9 Worked example

Debts: A $5,000 at 19.99%, min $100. B $3,000 at 24.99%, min $75, promo 0% to 2026-07-01 with deferred interest. C $1,500 at 14.99%, min $50. Budget $500, avalanche, start 2026-01. Extra pool: 500 - 225 = $275.

B cannot be cleared in time: even paying $350 a month it still owes money at the expiry. Its `S_retro` is 2000, so it takes the whole pool every month.

| Month | A | B | C | Notes |
|---|---|---|---|---|
| 1 | 4,983.29 | 2,650.00 | 1,468.74 | A pays $100, B $350, C $50. Interest A 83.29, B 0, C 18.74 |
| 2 | 4,966.30 | 2,300.00 | 1,437.09 | |
| 3 | 4,949.03 | 1,950.00 | 1,405.04 | |
| 4 | 4,931.47 | 1,600.00 | 1,372.59 | |
| 5 | 4,913.62 | 1,250.00 | 1,339.74 | |

Month 1 raises `RETROACTIVE_INTEREST_AT_RISK` for B: $3,000 cannot be cleared by the expiry (capacity `(275 + 75) * 6 = 2,100`).

Deferred charge at the end of month 6. B's balances at the start of months 1..6 are 3000, 2650, 2300, 1950, 1600, 1250 (sum 12,750); the month-6 payment of $350 leaves $900.

- Declining balance (current): `12750 * 24.99 / 1200 = 265.52`, so B continues at $1,165.52.
- Previous behavior (original balance): `3000 * 24.99 / 1200 * 6 = 374.85`.

These hand-computed values are the engine's regression tests.

### 7.10 Open items

- **Variable minimum payments.** Real minimums fall with the balance (roughly max(floor, 1% of balance + interest)). A minimum below the monthly interest never pays off. V2 needs a per-debt minimum model, with an issuer-reported current minimum (e.g. from Plaid) as calibration.
- **Integer cents** instead of `round2` on floats, before the engine grows.
- **Per-debt deferred-interest method** (declining vs original balance) and an input for interest accrued before month 1.
- **Priority weights**: calibrate against additional worked examples; keep as named constants in one place.
- **Scenario comparison** (e.g. strategy side by side, "what if I add $200") on top of this engine.

---

## 8. Decision Log

| ID | Date | Decision | Why |
|---|---|---|---|
| D1 | 2026-10-20 | Deferred interest is accrued on the declining balance and charged after month `E`'s payments only if a balance remains. The original-balance method is documented as the pessimistic variant. | The CFPB describes the declining-balance method as the usual one, and the original-balance figure overstates the charge for anyone paying the debt down, which triggers needlessly alarming warnings. |
| D2 | 2026-10-20 | For deferred-interest debts, month `E` counts as payable: `mr = E - m + 1`. Plain promos keep `mr = E - m`. | The charge is taken after month `E`'s payments, so clearing the debt in `E` avoids it. A plain rate change does not work that way, and its scoring was not asked to change. |
| D3 | 2026-10-20 | Directive reasoning is per debt, not global. | Spill-over payments were labelled with the top debt's reason. |
| D4 | 2026-10-20 | The `retroactiveInterest` flag means *deferred interest* only; standard balance transfers leave it off. | A balance transfer's remaining balance simply accrues at the regular APR after expiry. |
| D5 | 2026-10-20 | The next version adds a backend and Plaid (Liabilities). Variable minimums, integer cents and the Plaid data model are specified in a separate V2 spec before building. | Plaid needs server-held secrets; this ends the localStorage-only design. |
