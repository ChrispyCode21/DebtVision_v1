import { WarningType } from '@/types'
import type { Debt, Strategy, SimulationResult, MonthDirective, MonthEntry, DebtSummary, Warning, PaymentDirective, DebtMonthSnapshot } from '@/types'

// ─── Utility ───────────────────────────────────────────────────────────────

export function round2(n: number): number {
  return Math.round(n * 100) / 100
}

// ─── Internal working debt type ────────────────────────────────────────────

interface WorkingDebt {
  id: string
  name: string
  balance: number
  originalBalance: number
  apr: number
  minPayment: number
  promoApr: number | null
  promoExpirationMonth: number | null  // null = permanent promo or no promo
  retroactiveInterest: boolean
  active: boolean
  totalInterestPaid: number
  payoffMonth: number | null
  retroactiveInterestTriggered: boolean
  retroactiveInterestAmount: number
  totalAmountPaid: number
}

// ─── Date-to-month conversion ──────────────────────────────────────────────

/**
 * Convert an ISO date string to a simulation month number.
 * Month 1 is the first simulation month. If the promo expiration is in the
 * past (or this month), return 0.
 */
export function promoDateToMonth(isoDate: string, startDate: Date): number {
  // Parse YYYY-MM-DD directly to avoid timezone issues with Date constructor
  // (new Date('2026-07-01') is UTC midnight, which shifts to previous day in negative UTC offsets)
  const parts = isoDate.split('-')
  const expYear = parseInt(parts[0], 10)
  const expMonth = parseInt(parts[1], 10) - 1 // 0-indexed to match Date.getMonth()
  const startYear = startDate.getFullYear()
  const startMonth = startDate.getMonth() // 0-indexed

  const diff = (expYear - startYear) * 12 + (expMonth - startMonth)
  return Math.max(0, diff)
}

// ─── Effective rate ────────────────────────────────────────────────────────

function getEffectiveRate(debt: WorkingDebt, currentMonth: number): number {
  if (debt.promoApr === null) {
    return debt.apr
  }
  if (debt.promoExpirationMonth === null) {
    // permanent promo
    return debt.promoApr
  }
  if (debt.promoExpirationMonth === currentMonth) {
    // promo expires this month; promo rate still applies
    return debt.promoApr
  }
  if (debt.promoExpirationMonth < currentMonth) {
    // promo already expired
    return debt.apr
  }
  // promo still active
  return debt.promoApr
}

// ─── Priority scoring ──────────────────────────────────────────────────────

function computePriorityScore(
  debt: WorkingDebt,
  currentMonth: number,
  effectiveBudget: number,
  allActiveDebts: WorkingDebt[],
  strategy: Strategy,
): number {
  // --- S_promo ---
  let sPromo = 0
  if (
    debt.promoApr !== null &&
    debt.promoExpirationMonth !== null &&
    debt.promoExpirationMonth > currentMonth
  ) {
    const monthsRemaining = debt.promoExpirationMonth - currentMonth
    if (monthsRemaining > 0 && monthsRemaining <= 12) {
      sPromo = 1000 * (1 / monthsRemaining)
    } else if (monthsRemaining > 12) {
      sPromo = 1000 / 12
    }
  }

  // --- S_retro ---
  let sRetro = 0
  if (
    debt.retroactiveInterest &&
    debt.promoApr !== null &&
    debt.promoExpirationMonth !== null &&
    debt.promoExpirationMonth > currentMonth
  ) {
    const monthsRemaining = debt.promoExpirationMonth - currentMonth
    const totalMins = allActiveDebts
      .filter(d => d.active)
      .reduce((sum, d) => sum + d.minPayment, 0)
    const estimatedExtra = Math.max(0, effectiveBudget - totalMins)
    const maxPayoffCapacity = (estimatedExtra + debt.minPayment) * monthsRemaining

    if (debt.balance > maxPayoffCapacity) {
      sRetro = 2000
    } else {
      const ratio = maxPayoffCapacity / debt.balance
      if (ratio < 1.5) {
        sRetro = 1500 * (1.5 - ratio) / 0.5
      }
    }
  }

  // --- S_effective ---
  let sEffective: number
  if (
    debt.promoApr !== null &&
    debt.promoExpirationMonth !== null &&
    debt.promoExpirationMonth > currentMonth
  ) {
    const monthsRemaining = debt.promoExpirationMonth - currentMonth
    const timeWeight = 1 / (1 + monthsRemaining)
    const effectiveRate = debt.promoApr + (debt.apr - debt.promoApr) * timeWeight
    sEffective = effectiveRate * 10
  } else {
    sEffective = debt.apr * 10
  }

  // --- S_base ---
  let sBase: number
  if (strategy === 'avalanche') {
    sBase = debt.apr
  } else {
    // snowball
    const maxBalance = Math.max(...allActiveDebts.filter(d => d.active).map(d => d.balance))
    if (maxBalance === 0) {
      sBase = 0
    } else {
      sBase = 30 * (1 - debt.balance / maxBalance)
    }
  }

  return round2(sPromo + sRetro + sEffective + sBase)
}

function simulateScenario(
  debts: Debt[],
  availableMonthlyBudget: number,
  strategy: Strategy,
  simStart: Date,
  allocateExtraPayments: boolean,
): SimulationResult {
  const zeroMonthlyCards = debts.filter(d => d.zeroMonthly)
  const optimizableDebts = debts.filter(d => !d.zeroMonthly)

  const zeroMonthlyTotal = zeroMonthlyCards.reduce((s, c) => s + c.minPayment, 0)
  const effectiveBudget = availableMonthlyBudget - zeroMonthlyTotal

  const warnings: Warning[] = []

  // Edge case 10: no optimizable debts
  if (optimizableDebts.length === 0) {
    warnings.push({
      type: WarningType.NO_OPTIMIZABLE_DEBTS,
      severity: 'info',
      debtId: null,
      month: null,
      message: 'All debts are marked as paid-in-full monthly. No payoff optimization is needed.',
    })
    return {
      actionPlan: [],
      schedule: [],
      debtSummaries: [],
      totalMonths: 0,
      totalInterestPaid: 0,
      interestSaved: 0,
      warnings,
    }
  }

  // Initialize working debts
  const activeDebts: WorkingDebt[] = optimizableDebts.map(d => ({
    id: d.id,
    name: d.name,
    balance: d.balance,
    originalBalance: d.balance,
    apr: d.apr,
    minPayment: d.minPayment,
    promoApr: d.promoApr,
    promoExpirationMonth:
      d.promoApr !== null && d.promoExpiration !== null
        ? promoDateToMonth(d.promoExpiration, simStart)
        : null,
    retroactiveInterest: d.retroactiveInterest,
    active: true,
    totalInterestPaid: 0,
    payoffMonth: null,
    retroactiveInterestTriggered: false,
    retroactiveInterestAmount: 0,
    totalAmountPaid: 0,
  }))

  // Edge case warnings
  const totalMins = activeDebts.reduce((s, d) => s + d.minPayment, 0)
  if (effectiveBudget < totalMins) {
    warnings.push({
      type: WarningType.BUDGET_SHORTFALL,
      severity: 'critical',
      debtId: null,
      month: null,
      message: `Monthly budget ($${effectiveBudget}) is less than the sum of minimum payments ($${totalMins}). Payments are allocated proportionally. Consider increasing your budget or contacting creditors.`,
    })
    // Check for individual debts exceeding budget
    for (const d of activeDebts) {
      if (d.minPayment > effectiveBudget) {
        warnings.push({
          type: WarningType.MINIMUM_EXCEEDS_BUDGET,
          severity: 'critical',
          debtId: d.id,
          month: null,
          message: `${d.name} has a minimum payment of $${d.minPayment} which alone exceeds your available budget of $${effectiveBudget}.`,
        })
      }
    }
  } else if (effectiveBudget === totalMins) {
    warnings.push({
      type: WarningType.NO_EXTRA_BUDGET,
      severity: 'warning',
      debtId: null,
      month: null,
      message: 'Your available budget exactly covers minimum payments. There is no extra to accelerate payoff. Consider increasing your monthly budget.',
    })
  }

  let month = 0
  const schedule: MonthEntry[] = []
  const actionPlan: MonthDirective[] = []
  let totalInterestPaid = 0
  const retroWarned = new Set<string>() // deduplication for RETROACTIVE_INTEREST_AT_RISK

  while (activeDebts.some(d => d.active) && month < 600) {
    month += 1

    const monthPayments: Array<{ debtId: string; amount: number; type: 'minimum' | 'extra' | 'minimum_partial' }> = []
    const interestCharged: Record<string, number> = {}
    let retroactiveInterest: Record<string, number> | null = null
    const priorityScores: Record<string, number> = {}

    // ── Step 1: Interest Accrual ──
    for (const debt of activeDebts) {
      if (!debt.active) continue

      const rate = getEffectiveRate(debt, month)
      const monthlyInterest = round2(debt.balance * (rate / 12 / 100))

      debt.balance = round2(debt.balance + monthlyInterest)
      debt.totalInterestPaid = round2(debt.totalInterestPaid + monthlyInterest)
      totalInterestPaid = round2(totalInterestPaid + monthlyInterest)
      interestCharged[debt.id] = monthlyInterest

      // Retroactive interest check
      if (
        debt.retroactiveInterest &&
        debt.promoExpirationMonth !== null &&
        debt.promoExpirationMonth === month
      ) {
        const promoMonthCount = debt.promoExpirationMonth // months from start
        const deferredInterest = round2(
          debt.originalBalance * (debt.apr / 12 / 100) * promoMonthCount
        )
        debt.balance = round2(debt.balance + deferredInterest)
        debt.totalInterestPaid = round2(debt.totalInterestPaid + deferredInterest)
        totalInterestPaid = round2(totalInterestPaid + deferredInterest)
        debt.retroactiveInterestTriggered = true
        debt.retroactiveInterestAmount = deferredInterest

        if (!retroactiveInterest) retroactiveInterest = {}
        retroactiveInterest[debt.id] = deferredInterest

        warnings.push({
          type: WarningType.RETROACTIVE_INTEREST_APPLIED,
          severity: 'critical',
          debtId: debt.id,
          month,
          message: `Retroactive interest of $${deferredInterest} applied to ${debt.name}. Deferred interest accrued on original balance of $${debt.originalBalance} at ${debt.apr}% APR over ${promoMonthCount} promo months.`,
          amount: deferredInterest,
        } as Warning)
      }
    }

    // ── Step 2: Priority Scoring ──
    const scoredDebts: Array<{ debt: WorkingDebt; score: number }> = []
    for (const debt of activeDebts) {
      if (!debt.active) continue
      const score = computePriorityScore(debt, month, effectiveBudget, activeDebts, strategy)
      priorityScores[debt.id] = score
      scoredDebts.push({ debt, score })

      // RETROACTIVE_INTEREST_AT_RISK warning (deduplicated)
      if (
        debt.retroactiveInterest &&
        debt.promoApr !== null &&
        debt.promoExpirationMonth !== null &&
        debt.promoExpirationMonth > month &&
        !retroWarned.has(debt.id)
      ) {
        const monthsRemaining = debt.promoExpirationMonth - month
        const totalMinsNow = activeDebts.filter(d => d.active).reduce((s, d) => s + d.minPayment, 0)
        const estimatedExtra = Math.max(0, effectiveBudget - totalMinsNow)
        const maxPayoffCapacity = (estimatedExtra + debt.minPayment) * monthsRemaining
        if (debt.balance > maxPayoffCapacity) {
          retroWarned.add(debt.id)
          warnings.push({
            type: WarningType.RETROACTIVE_INTEREST_AT_RISK,
            severity: 'critical',
            debtId: debt.id,
            month,
            message: `${debt.name} has retroactive interest risk. Balance of $${round2(debt.balance)} cannot be paid off before promo expires in ${monthsRemaining} months (max capacity: $${round2(maxPayoffCapacity)}).`,
          })
        }
      }
    }
    scoredDebts.sort((a, b) => b.score - a.score)

    // ── Step 3: Payment Allocation ──
    const totalMinimumsRequired = activeDebts
      .filter(d => d.active)
      .reduce((s, d) => s + Math.min(d.minPayment, d.balance), 0)

    let budgetShortfall = false
    if (effectiveBudget < totalMinimumsRequired) {
      budgetShortfall = true
      // Proportional allocation
      const totalMinsForProportion = activeDebts
        .filter(d => d.active)
        .reduce((s, d) => s + d.minPayment, 0)

      if (totalMinsForProportion > 0) {
        let totalAllocated = 0
        for (const debt of activeDebts) {
          if (!debt.active) continue
          const share = round2((debt.minPayment / totalMinsForProportion) * effectiveBudget)
          const payment = Math.min(share, debt.balance)
          debt.balance = round2(debt.balance - payment)
          debt.totalAmountPaid = round2(debt.totalAmountPaid + payment)
          totalAllocated += payment
          monthPayments.push({ debtId: debt.id, amount: round2(payment), type: 'minimum_partial' })
        }
        // Distribute rounding remainder (positive = under-allocated, negative = over-allocated)
        const remainder = round2(effectiveBudget - totalAllocated)
        if (remainder > 0.005) {
          // Under-allocated: give leftover cents to highest-balance debt
          const highestBalanceDebt = activeDebts
            .filter(d => d.active && d.balance > 0)
            .sort((a, b) => b.balance - a.balance)[0]
          if (highestBalanceDebt) {
            const adj = Math.min(remainder, highestBalanceDebt.balance)
            highestBalanceDebt.balance = round2(highestBalanceDebt.balance - adj)
            highestBalanceDebt.totalAmountPaid = round2(highestBalanceDebt.totalAmountPaid + adj)
            const existingPayment = monthPayments.find(p => p.debtId === highestBalanceDebt.id)
            if (existingPayment) {
              existingPayment.amount = round2(existingPayment.amount + adj)
            }
          }
        } else if (remainder < -0.005) {
          // Over-allocated: claw back excess from highest-balance debt
          const highestBalanceDebt = activeDebts
            .filter(d => d.active)
            .sort((a, b) => b.balance - a.balance)[0]
          if (highestBalanceDebt) {
            const excess = round2(-remainder)
            const existingPayment = monthPayments.find(p => p.debtId === highestBalanceDebt.id)
            if (existingPayment && existingPayment.amount >= excess) {
              highestBalanceDebt.balance = round2(highestBalanceDebt.balance + excess)
              highestBalanceDebt.totalAmountPaid = round2(highestBalanceDebt.totalAmountPaid - excess)
              existingPayment.amount = round2(existingPayment.amount - excess)
            }
          }
        }
      }
    } else {
      // Pay minimums
      let extraPool = effectiveBudget
      for (const debt of activeDebts) {
        if (!debt.active) continue
        const minPay = Math.min(debt.minPayment, debt.balance)
        debt.balance = round2(debt.balance - minPay)
        debt.totalAmountPaid = round2(debt.totalAmountPaid + minPay)
        extraPool -= minPay
        monthPayments.push({ debtId: debt.id, amount: round2(minPay), type: 'minimum' })
      }

      // Allocate extra pool by priority
      if (allocateExtraPayments) {
        extraPool = round2(extraPool)
        for (const { debt } of scoredDebts) {
          if (extraPool <= 0) break
          if (debt.balance <= 0) continue

          const payment = Math.min(extraPool, debt.balance)
          debt.balance = round2(debt.balance - payment)
          debt.totalAmountPaid = round2(debt.totalAmountPaid + payment)
          extraPool = round2(extraPool - payment)
          monthPayments.push({ debtId: debt.id, amount: round2(payment), type: 'extra' })
        }
      }
    }

    // ── Step 4: Payoff Detection ──
    const payoffs: Array<{ debtId: string; debtName: string; freedMinimum: number }> = []
    for (const debt of activeDebts) {
      if (debt.active && debt.balance <= 0) {
        debt.balance = 0
        debt.active = false
        debt.payoffMonth = month
        payoffs.push({
          debtId: debt.id,
          debtName: debt.name,
          freedMinimum: debt.minPayment,
        })
      }
    }

    // ── Step 5: Record Month ──
    const balances: Record<string, number> = {}
    let totalBalance = 0
    let totalInterestThisMonth = 0
    const debtSnapshots: DebtMonthSnapshot[] = []

    for (const debt of activeDebts) {
      balances[debt.id] = debt.balance
      totalBalance = round2(totalBalance + debt.balance)

      const interest = interestCharged[debt.id] ?? 0
      const retroInterest = retroactiveInterest?.[debt.id] ?? 0
      totalInterestThisMonth = round2(totalInterestThisMonth + interest + retroInterest)

      const paymentForDebt = monthPayments
        .filter(p => p.debtId === debt.id)
        .reduce((s, p) => s + p.amount, 0)

      debtSnapshots.push({
        debtId: debt.id,
        balance: debt.balance,
        interestCharged: round2(interest + retroInterest),
        paymentMade: round2(paymentForDebt),
      })
    }

    const totalPaid = round2(monthPayments.reduce((s, p) => s + p.amount, 0))

    schedule.push({
      month,
      totalBalance,
      totalPayment: totalPaid,
      totalInterest: totalInterestThisMonth,
      debts: debtSnapshots,
    })

    // Build action plan directive
    const topDebt = scoredDebts[0]
    let reasoning = ''
    if (budgetShortfall) {
      reasoning = 'Budget shortfall -- payments allocated proportionally to minimums.'
    } else if (topDebt) {
      const d = topDebt.debt
      // Determine dominant component for reasoning
      if (
        d.retroactiveInterest &&
        d.promoApr !== null &&
        d.promoExpirationMonth !== null &&
        d.promoExpirationMonth > month
      ) {
        const mr = d.promoExpirationMonth - month
        reasoning = `Prioritizing ${d.name} -- retroactive interest risk. Promo expires in ${mr} months.`
      } else if (
        d.promoApr !== null &&
        d.promoExpirationMonth !== null &&
        d.promoExpirationMonth > month
      ) {
        const mr = d.promoExpirationMonth - month
        reasoning = `Prioritizing ${d.name} -- promotional rate expires in ${mr} months.`
      } else if (strategy === 'avalanche') {
        reasoning = `Prioritizing ${d.name} -- highest effective interest rate (${d.apr}% APR).`
      } else {
        reasoning = `Prioritizing ${d.name} -- lowest remaining balance ($${round2(d.balance)}).`
      }
    }

    const paymentDirectives: PaymentDirective[] = monthPayments.map(p => {
      const debtObj = activeDebts.find(dd => dd.id === p.debtId)!
      return {
        debtId: p.debtId,
        debtName: debtObj.name,
        amount: p.amount,
        reasoning: p.type === 'extra' ? reasoning : (p.type === 'minimum_partial' ? 'Proportional allocation due to budget shortfall' : 'Minimum payment'),
      }
    })

    actionPlan.push({
      month,
      payments: paymentDirectives,
      milestones: payoffs.map(po => `${po.debtName} paid off! $${po.freedMinimum}/month freed.`),
      warnings: warnings.filter(w => w.month === month).map(w => w.message),
    })
  }

  // Check simulation cap
  if (month >= 600 && activeDebts.some(d => d.active)) {
    warnings.push({
      type: WarningType.SIMULATION_CAP_REACHED,
      severity: 'critical',
      debtId: null,
      month: 600,
      message: 'Simulation reached the 600-month cap. Some debts may not be fully paid off.',
    })
  }

  // Build debt summaries
  const debtSummaries: DebtSummary[] = activeDebts.map(d => ({
    debtId: d.id,
    debtName: d.name,
    originalBalance: d.originalBalance,
    totalInterestPaid: round2(d.totalInterestPaid),
    payoffMonth: d.payoffMonth ?? month,
  }))

  return {
    actionPlan,
    schedule,
    debtSummaries,
    totalMonths: month,
    totalInterestPaid: round2(totalInterestPaid),
    interestSaved: 0,
    warnings,
  }
}

// ─── Main simulation ───────────────────────────────────────────────────────

export function runSimulation(
  debts: Debt[],
  availableMonthlyBudget: number,
  strategy: Strategy,
  startDate?: Date,
): SimulationResult {
  const simStart = startDate ?? new Date()
  const primary = simulateScenario(debts, availableMonthlyBudget, strategy, simStart, true)
  const baseline = simulateScenario(debts, availableMonthlyBudget, strategy, simStart, false)
  const interestSaved = round2(Math.max(0, baseline.totalInterestPaid - primary.totalInterestPaid))

  return {
    ...primary,
    interestSaved,
  }
}
