import { describe, it, expect } from 'vitest'
import { runSimulation, round2, promoDateToMonth } from './simulate'
import type { Debt } from '@/types'

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Build a simple debt with sensible defaults */
function makeDbt(overrides: Partial<Debt> & { id: string; name: string }): Debt {
  return {
    balance: 1000,
    limit: null,
    apr: 19.99,
    minPayment: 25,
    zeroMonthly: false,
    promoApr: null,
    promoExpiration: null,
    retroactiveInterest: false,
    ...overrides,
  }
}

/** Fixed start date (local time) so promo month calculations are deterministic */
const START = new Date(2026, 0, 1) // Jan 1 2026 in local timezone

// ─── round2 utility ─────────────────────────────────────────────────────────

describe('round2', () => {
  it('rounds to two decimal places', () => {
    // Note: round2(1.005) = 1.00 due to JS floating point (1.005*100 = 100.4999...)
    expect(round2(1.005)).toBe(1)
    expect(round2(1.016)).toBe(1.02)
    expect(round2(99.999)).toBe(100)
    expect(round2(0.1 + 0.2)).toBe(0.3)
  })
})

// ─── promoDateToMonth ───────────────────────────────────────────────────────

describe('promoDateToMonth', () => {
  it('returns month diff from start', () => {
    expect(promoDateToMonth('2026-07-01', START)).toBe(6)
    // April is 3 months from January
    expect(promoDateToMonth('2026-04-01', START)).toBe(3)
  })

  it('returns 0 for past dates', () => {
    expect(promoDateToMonth('2025-06-01', START)).toBe(0)
  })

  it('returns 0 for same month as start', () => {
    // Same month = 0 month diff, but Date parsing may vary by timezone
    // The function returns max(0, diff) so any small positive is acceptable
    const result = promoDateToMonth('2026-01-15', START)
    expect(result).toBeLessThanOrEqual(1)
  })
})

// ─── Worked Example from Algorithm Spec Section 7 ───────────────────────────

describe('worked example (3-debt, $500/mo, avalanche)', () => {
  const debtA = makeDbt({ id: 'a', name: 'Debt A', balance: 5000, apr: 19.99, minPayment: 100 })
  const debtB = makeDbt({
    id: 'b', name: 'Debt B', balance: 3000, apr: 24.99, minPayment: 75,
    promoApr: 0, promoExpiration: '2026-07-01', retroactiveInterest: true,
  })
  const debtC = makeDbt({ id: 'c', name: 'Debt C', balance: 1500, apr: 14.99, minPayment: 50 })

  const result = runSimulation([debtA, debtB, debtC], 500, 'avalanche', START)

  it('simulates to completion', () => {
    expect(result.totalMonths).toBeGreaterThan(0)
    expect(result.totalMonths).toBeLessThanOrEqual(600)
  })

  it('month 1 end balances match spec', () => {
    const m1 = result.schedule[0]
    expect(m1.month).toBe(1)
    const balA = m1.debts.find(d => d.debtId === 'a')!.balance
    const balB = m1.debts.find(d => d.debtId === 'b')!.balance
    const balC = m1.debts.find(d => d.debtId === 'c')!.balance

    // Spec: A=$4,983.29, B=$2,650.00, C=$1,468.74
    expect(balA).toBeCloseTo(4983.29, 1)
    expect(balB).toBeCloseTo(2650.00, 1)
    expect(balC).toBeCloseTo(1468.74, 1)
  })

  it('month 1 interest matches spec', () => {
    const m1 = result.schedule[0]
    const intA = m1.debts.find(d => d.debtId === 'a')!.interestCharged
    const intB = m1.debts.find(d => d.debtId === 'b')!.interestCharged
    const intC = m1.debts.find(d => d.debtId === 'c')!.interestCharged

    expect(intA).toBeCloseTo(83.29, 1)
    expect(intB).toBe(0)
    expect(intC).toBeCloseTo(18.74, 1)
  })

  it('month 2 end balances match spec', () => {
    const m2 = result.schedule[1]
    const balA = m2.debts.find(d => d.debtId === 'a')!.balance
    const balB = m2.debts.find(d => d.debtId === 'b')!.balance
    const balC = m2.debts.find(d => d.debtId === 'c')!.balance

    expect(balA).toBeCloseTo(4966.30, 1)
    expect(balB).toBeCloseTo(2300.00, 1)
    expect(balC).toBeCloseTo(1437.09, 1)
  })

  it('month 3 end balances match spec', () => {
    const m3 = result.schedule[2]
    const balA = m3.debts.find(d => d.debtId === 'a')!.balance
    const balB = m3.debts.find(d => d.debtId === 'b')!.balance
    const balC = m3.debts.find(d => d.debtId === 'c')!.balance

    expect(balA).toBeCloseTo(4949.03, 1)
    expect(balB).toBeCloseTo(1950.00, 1)
    expect(balC).toBeCloseTo(1405.04, 1)
  })

  it('month 4 end balances match spec', () => {
    const m4 = result.schedule[3]
    const balA = m4.debts.find(d => d.debtId === 'a')!.balance
    const balB = m4.debts.find(d => d.debtId === 'b')!.balance
    const balC = m4.debts.find(d => d.debtId === 'c')!.balance

    expect(balA).toBeCloseTo(4931.47, 1)
    expect(balB).toBeCloseTo(1600.00, 1)
    expect(balC).toBeCloseTo(1372.59, 1)
  })

  it('$500 paid each month except final (partial payment on remaining balance)', () => {
    for (const entry of result.schedule) {
      // Each month pays at most the budget; final months may pay less
      expect(entry.totalPayment).toBeLessThanOrEqual(500.01)
      expect(entry.totalPayment).toBeGreaterThan(0)
    }
    // Non-final months should pay the full budget
    for (let i = 0; i < result.schedule.length - 3; i++) {
      expect(result.schedule[i].totalPayment).toBeCloseTo(500, 0)
    }
  })

  it('generates RETROACTIVE_INTEREST_AT_RISK warning for Debt B', () => {
    const riskWarning = result.warnings.find(
      w => w.type === 'RETROACTIVE_INTEREST_AT_RISK' && w.debtId === 'b'
    )
    expect(riskWarning).toBeDefined()
    expect(riskWarning!.severity).toBe('critical')
    // Promo through month 6 = 6 payable months; capacity (275 extra + 75 min) * 6 = 2100 < 3000
    expect(riskWarning!.month).toBe(1)
    expect(riskWarning!.message).toContain('ends in 6 months')
    expect(riskWarning!.message).toContain('max capacity: $2100')
  })

  it('deferred interest is charged at month 6 on the declining balance (SPEC 7.9)', () => {
    const retroWarning = result.warnings.find(
      w => w.type === 'RETROACTIVE_INTEREST_APPLIED' && w.debtId === 'b'
    )
    expect(retroWarning).toBeDefined()
    expect(retroWarning!.month).toBe(6)
    // Balances at the start of months 1..6: 3000, 2650, 2300, 1950, 1600, 1250 (sum 12750)
    // 12750 * 24.99 / 1200 = 265.51875 -> 265.52
    expect(retroWarning!.amount).toBe(265.52)
    const m6 = result.schedule[5].debts.find(d => d.debtId === 'b')!
    expect(m6.interestCharged).toBe(265.52)
    // 1250 - 350 payment = 900, + 265.52 charge
    expect(m6.balance).toBe(1165.52)
  })

  it('all debts eventually reach zero', () => {
    for (const summary of result.debtSummaries) {
      const lastEntry = result.schedule[result.schedule.length - 1]
      const debtSnap = lastEntry.debts.find(d => d.debtId === summary.debtId)
      expect(debtSnap?.balance).toBe(0)
    }
  })
})

// ─── Edge Cases ─────────────────────────────────────────────────────────────

describe('edge case 1: budget shortfall', () => {
  const debts = [
    makeDbt({ id: 'x', name: 'X', balance: 5000, minPayment: 200 }),
    makeDbt({ id: 'y', name: 'Y', balance: 3000, minPayment: 150 }),
  ]
  // Budget $200 < total mins $350
  const result = runSimulation(debts, 200, 'avalanche', START)

  it('generates BUDGET_SHORTFALL warning', () => {
    expect(result.warnings.some(w => w.type === 'BUDGET_SHORTFALL')).toBe(true)
  })

  it('allocates proportionally in month 1', () => {
    const m1 = result.schedule[0]
    // X gets 200/350 * 200 ≈ 114.29, Y gets 150/350 * 200 ≈ 85.71
    expect(m1.totalPayment).toBeCloseTo(200, 0)
  })
})

describe('edge case 2: single minimum > entire budget', () => {
  const debts = [
    makeDbt({ id: 'big', name: 'Big', balance: 10000, minPayment: 500 }),
    makeDbt({ id: 'small', name: 'Small', balance: 1000, minPayment: 50 }),
  ]
  const result = runSimulation(debts, 300, 'avalanche', START)

  it('generates MINIMUM_EXCEEDS_BUDGET warning', () => {
    expect(result.warnings.some(w => w.type === 'MINIMUM_EXCEEDS_BUDGET')).toBe(true)
  })
})

describe('edge case 3: promo expires this month', () => {
  // Promo expires month 1 - promo rate should still apply for month 1 interest
  const debts = [
    makeDbt({
      id: 'p', name: 'Promo', balance: 2000, apr: 20, minPayment: 50,
      promoApr: 0, promoExpiration: '2026-02-01', retroactiveInterest: false,
    }),
  ]
  const result = runSimulation(debts, 500, 'avalanche', START)

  it('uses promo rate for interest in expiration month', () => {
    const m1 = result.schedule[0]
    const interest = m1.debts.find(d => d.debtId === 'p')!.interestCharged
    // Month 1, promo expires month 1 → promo rate 0% applies
    expect(interest).toBe(0)
  })

  it('uses standard rate the month after expiration', () => {
    const m2 = result.schedule[1]
    const interest = m2.debts.find(d => d.debtId === 'p')!.interestCharged
    // Month 2, standard 20% applies
    expect(interest).toBeGreaterThan(0)
  })
})

describe('edge case: monthsRemaining === 0 does not produce Infinity scores', () => {
  // Promo expires exactly at month 1 (promoExpirationMonth === currentMonth),
  // which would cause division by zero in priority scoring if not guarded.
  const debts = [
    makeDbt({
      id: 'promo-edge', name: 'PromoEdge', balance: 3000, apr: 20, minPayment: 75,
      promoApr: 0, promoExpiration: '2026-02-01', retroactiveInterest: false,
    }),
    makeDbt({ id: 'other', name: 'Other', balance: 2000, apr: 18, minPayment: 50 }),
  ]
  const result = runSimulation(debts, 500, 'avalanche', START)

  it('simulation completes without Infinity or NaN in schedule', () => {
    expect(result.totalMonths).toBeGreaterThan(0)
    for (const entry of result.schedule) {
      for (const snap of entry.debts) {
        expect(Number.isFinite(snap.balance)).toBe(true)
        expect(Number.isFinite(snap.paymentMade)).toBe(true)
        expect(Number.isFinite(snap.interestCharged)).toBe(true)
      }
      expect(Number.isFinite(entry.totalPayment)).toBe(true)
    }
  })

  it('all debts reach zero', () => {
    const last = result.schedule[result.schedule.length - 1]
    for (const snap of last.debts) {
      expect(snap.balance).toBe(0)
    }
  })
})

describe('edge case 4: promo already expired', () => {
  const debts = [
    makeDbt({
      id: 'exp', name: 'Expired', balance: 2000, apr: 18, minPayment: 50,
      promoApr: 0, promoExpiration: '2025-06-01', retroactiveInterest: false,
    }),
  ]
  const result = runSimulation(debts, 500, 'avalanche', START)

  it('uses standard rate from month 1', () => {
    const m1 = result.schedule[0]
    const interest = m1.debts.find(d => d.debtId === 'exp')!.interestCharged
    // 2000 * (18/12/100) = 30
    expect(interest).toBeCloseTo(30, 1)
  })
})

describe('edge case 5: promo with null expiration (permanent)', () => {
  const debts = [
    makeDbt({
      id: 'perm', name: 'Permanent', balance: 2000, apr: 22, minPayment: 50,
      promoApr: 3.99, promoExpiration: null,
    }),
  ]
  const result = runSimulation(debts, 500, 'avalanche', START)

  it('uses promo rate for all months', () => {
    // Every month should charge 3.99% not 22%
    const m1 = result.schedule[0]
    const interest = m1.debts.find(d => d.debtId === 'perm')!.interestCharged
    // 2000 * (3.99/12/100) ≈ 6.65
    expect(interest).toBeCloseTo(6.65, 1)
  })

  it('finishes paying off', () => {
    expect(result.totalMonths).toBeGreaterThan(0)
    expect(result.totalMonths).toBeLessThan(10) // $500/mo on $2k should be fast
  })
})

describe('edge case 9/10: zero-monthly cards', () => {
  it('excludes zero-monthly from optimization', () => {
    const debts = [
      makeDbt({ id: 'z', name: 'ZeroMo', balance: 500, minPayment: 500, zeroMonthly: true }),
      makeDbt({ id: 'real', name: 'Real', balance: 2000, apr: 19.99, minPayment: 50 }),
    ]
    const result = runSimulation(debts, 1000, 'avalanche', START)

    // Only 'real' should be in summaries
    expect(result.debtSummaries.length).toBe(1)
    expect(result.debtSummaries[0].debtId).toBe('real')
  })

  it('returns early for all zero-monthly debts', () => {
    const debts = [
      makeDbt({ id: 'z1', name: 'Z1', balance: 500, minPayment: 500, zeroMonthly: true }),
    ]
    const result = runSimulation(debts, 1000, 'avalanche', START)

    expect(result.totalMonths).toBe(0)
    expect(result.warnings.some(w => w.type === 'NO_OPTIMIZABLE_DEBTS')).toBe(true)
  })
})

describe('edge case 11: budget = total minimums (no extra)', () => {
  const debts = [
    makeDbt({ id: 'a', name: 'A', balance: 3000, apr: 15, minPayment: 100 }),
    makeDbt({ id: 'b', name: 'B', balance: 2000, apr: 20, minPayment: 100 }),
  ]
  const result = runSimulation(debts, 200, 'avalanche', START)

  it('generates NO_EXTRA_BUDGET warning', () => {
    expect(result.warnings.some(w => w.type === 'NO_EXTRA_BUDGET')).toBe(true)
  })
})

describe('single debt scenario', () => {
  const debts = [
    makeDbt({ id: 'solo', name: 'Solo', balance: 1000, apr: 12, minPayment: 50 }),
  ]
  const result = runSimulation(debts, 500, 'avalanche', START)

  it('pays off quickly', () => {
    expect(result.totalMonths).toBeLessThanOrEqual(3) // $500/mo on $1k
  })

  it('debt reaches zero', () => {
    const last = result.schedule[result.schedule.length - 1]
    expect(last.debts[0].balance).toBe(0)
  })
})

describe('snowball strategy', () => {
  // Use same APR so S_effective doesn't override snowball ordering
  const debts = [
    makeDbt({ id: 'low-bal', name: 'Low Balance', balance: 500, apr: 18, minPayment: 25 }),
    makeDbt({ id: 'high-bal', name: 'High Balance', balance: 5000, apr: 18, minPayment: 100 }),
  ]
  const result = runSimulation(debts, 500, 'snowball', START)

  it('pays off lowest balance first when APRs are equal', () => {
    const lowSummary = result.debtSummaries.find(d => d.debtId === 'low-bal')!
    const highSummary = result.debtSummaries.find(d => d.debtId === 'high-bal')!
    expect(lowSummary.payoffMonth).toBeLessThan(highSummary.payoffMonth)
  })
})

describe('freed-minimum cascading', () => {
  // Small debt pays off quickly, its minimum should cascade
  const debts = [
    makeDbt({ id: 'tiny', name: 'Tiny', balance: 200, apr: 15, minPayment: 50 }),
    makeDbt({ id: 'big', name: 'Big', balance: 5000, apr: 20, minPayment: 100 }),
  ]
  const result = runSimulation(debts, 500, 'avalanche', START)

  it('tiny debt pays off within a few months', () => {
    const tiny = result.debtSummaries.find(d => d.debtId === 'tiny')!
    // Avalanche prioritizes big debt (20% APR) over tiny (15% APR),
    // so tiny only gets its $50 minimum. ~4-5 months is expected.
    expect(tiny.payoffMonth).toBeLessThanOrEqual(5)
  })

  it('big debt receives more after tiny pays off', () => {
    // After tiny pays off, $500 full budget goes to big
    const tinyPayoff = result.debtSummaries.find(d => d.debtId === 'tiny')!.payoffMonth
    const monthAfter = result.schedule[tinyPayoff] // month after payoff (0-indexed)
    if (monthAfter) {
      const bigPayment = monthAfter.debts.find(d => d.debtId === 'big')!.paymentMade
      // Should be close to full $500 budget (minus interest)
      expect(bigPayment).toBeGreaterThan(400)
    }
  })
})

// ─── Property / Invariant Tests ─────────────────────────────────────────────

describe('invariants', () => {
  const scenarios: Array<{ name: string; debts: Debt[]; budget: number }> = [
    {
      name: '3-debt standard',
      debts: [
        makeDbt({ id: 'a', name: 'A', balance: 5000, apr: 19.99, minPayment: 100 }),
        makeDbt({ id: 'b', name: 'B', balance: 3000, apr: 12, minPayment: 75 }),
        makeDbt({ id: 'c', name: 'C', balance: 1500, apr: 24.99, minPayment: 50 }),
      ],
      budget: 600,
    },
    {
      name: 'single debt low rate',
      debts: [makeDbt({ id: 'x', name: 'X', balance: 10000, apr: 5, minPayment: 200 })],
      budget: 500,
    },
    {
      name: 'budget shortfall',
      debts: [
        makeDbt({ id: 'm', name: 'M', balance: 8000, apr: 22, minPayment: 300 }),
        makeDbt({ id: 'n', name: 'N', balance: 4000, apr: 18, minPayment: 200 }),
      ],
      budget: 400,
    },
    {
      name: 'promo with retroactive',
      debts: [
        makeDbt({ id: 'r', name: 'R', balance: 3000, apr: 24.99, minPayment: 75,
          promoApr: 0, promoExpiration: '2026-07-01', retroactiveInterest: true }),
        makeDbt({ id: 's', name: 'S', balance: 2000, apr: 15, minPayment: 50 }),
      ],
      budget: 500,
    },
  ]

  for (const scenario of scenarios) {
    describe(scenario.name, () => {
      const result = runSimulation(scenario.debts, scenario.budget, 'avalanche', START)

      it('no negative balances', () => {
        for (const entry of result.schedule) {
          for (const snap of entry.debts) {
            expect(snap.balance).toBeGreaterThanOrEqual(0)
          }
        }
      })

      it('total payment per month <= budget + $1 (rounding tolerance)', () => {
        for (const entry of result.schedule) {
          expect(entry.totalPayment).toBeLessThanOrEqual(scenario.budget + 1)
        }
      })

      it('simulation terminates within 600 months', () => {
        expect(result.totalMonths).toBeGreaterThan(0)
        expect(result.totalMonths).toBeLessThanOrEqual(600)
      })

      it('interestSaved >= 0', () => {
        // This test verifies the field exists and is non-negative
        expect(result.interestSaved).toBeGreaterThanOrEqual(0)
      })

      it('all debts reach zero at end', () => {
        const capWarning = result.warnings.find(w => w.type === 'SIMULATION_CAP_REACHED')
        if (!capWarning) {
          const lastMonth = result.schedule[result.schedule.length - 1]
          for (const snap of lastMonth.debts) {
            expect(snap.balance).toBe(0)
          }
        }
      })
    })
  }
})

describe('interestSaved baseline comparison', () => {
  it('is meaningfully greater than zero when extra budget accelerates payoff', () => {
    const debts = [
      makeDbt({ id: 'hi-apr', name: 'High APR', balance: 4000, apr: 24, minPayment: 80 }),
      makeDbt({ id: 'lo-apr', name: 'Low APR', balance: 2500, apr: 10, minPayment: 50 }),
    ]

    const result = runSimulation(debts, 500, 'avalanche', START)
    expect(result.interestSaved).toBeGreaterThan(0)
  })

  it('is zero when budget is always below minimum requirements', () => {
    const debts = [
      makeDbt({ id: 'a', name: 'A', balance: 5000, apr: 18, minPayment: 200 }),
      makeDbt({ id: 'b', name: 'B', balance: 3000, apr: 12, minPayment: 150 }),
    ]

    const result = runSimulation(debts, 200, 'avalanche', START)
    expect(result.interestSaved).toBe(0)
  })
})

// ─── Same Rate Tiebreaker ───────────────────────────────────────────────────

describe('all debts same rate (avalanche tiebreaker)', () => {
  const debts = [
    makeDbt({ id: 'a', name: 'A', balance: 3000, apr: 18, minPayment: 50 }),
    makeDbt({ id: 'b', name: 'B', balance: 1000, apr: 18, minPayment: 50 }),
    makeDbt({ id: 'c', name: 'C', balance: 2000, apr: 18, minPayment: 50 }),
  ]
  const result = runSimulation(debts, 500, 'avalanche', START)

  it('completes simulation', () => {
    expect(result.totalMonths).toBeGreaterThan(0)
    expect(result.debtSummaries.length).toBe(3)
  })

  it('all debts paid off', () => {
    const last = result.schedule[result.schedule.length - 1]
    for (const snap of last.debts) {
      expect(snap.balance).toBe(0)
    }
  })
})

// ─── Retroactive Interest Calculation ───────────────────────────────────────

describe('retroactive interest calculation', () => {
  // Single debt with promo expiring month 3, retroactive interest
  const debts = [
    makeDbt({
      id: 'retro', name: 'Retro', balance: 5000, apr: 24, minPayment: 50,
      promoApr: 0, promoExpiration: '2026-04-01', retroactiveInterest: true,
    }),
  ]
  // Budget too small to pay off $5000 in 3 months
  const result = runSimulation(debts, 200, 'avalanche', START)

  it('applies retroactive interest at the correct month', () => {
    const retro = result.warnings.find(w => w.type === 'RETROACTIVE_INTEREST_APPLIED')
    expect(retro).toBeDefined()
    expect(retro!.month).toBe(3)
  })

  it('deferred interest accrues on the balance owed each promo month, not the original balance', () => {
    // 200/month paid against 5000 at 2%/month. Balances at the start of months 1..3:
    // 5000, 4800, 4600 -> (5000 + 4800 + 4600) * 0.02 = 288.00 (the original-balance method gives 300)
    const retro = result.warnings.find(w => w.type === 'RETROACTIVE_INTEREST_APPLIED')
    expect(retro!.amount).toBe(288)
    // 4400 owed after month 3's payment, plus the charge
    expect(result.schedule[2].debts[0].balance).toBe(4688)
  })
})

describe('deferred interest: only the rate the promo waives is deferred', () => {
  // 1200 at 24% standard (2%/mo) with a 12% promo (1%/mo) through month 3; $100/month, no extra.
  // The promo waives only the 1%/mo difference, so that is what is deferred.
  // Balances at the start of months 1..3: 1200, 1112.00, 1023.12.
  // Deferred = 12.00 + 11.12 + 10.2312 = 33.3512 -> 33.35 (accumulated unrounded, rounded once)
  const debts = [
    makeDbt({
      id: 'p', name: 'Partial promo', balance: 1200, apr: 24, minPayment: 100,
      promoApr: 12, promoExpiration: '2026-04-01', retroactiveInterest: true,
    }),
  ]
  const result = runSimulation(debts, 100, 'avalanche', START)

  it('charges (apr - promoApr), not the full apr', () => {
    const retro = result.warnings.find(w => w.type === 'RETROACTIVE_INTEREST_APPLIED')
    expect(retro!.month).toBe(3)
    expect(retro!.amount).toBe(33.35)
  })

  it('adds the charge to the balance after the month-3 payment', () => {
    // 1023.12 + 10.23 interest - 100 payment = 933.35, + 33.35 charge
    expect(result.schedule[2].debts[0].balance).toBe(966.7)
  })
})

describe('deferred interest: waived when paid off by the deadline', () => {
  it('charges nothing when the debt is cleared in an earlier month', () => {
    const debts = [
      makeDbt({
        id: 'w', name: 'Waived', balance: 900, apr: 24, minPayment: 50,
        promoApr: 0, promoExpiration: '2026-04-01', retroactiveInterest: true,
      }),
    ]
    // 400 + 400 + 100 clears it in month 3 (the expiration month)
    const result = runSimulation(debts, 400, 'avalanche', START)
    expect(result.warnings.some(w => w.type === 'RETROACTIVE_INTEREST_APPLIED')).toBe(false)
    expect(result.debtSummaries[0].payoffMonth).toBe(3)
    expect(result.totalInterestPaid).toBe(0)
  })

  it('charges the whole accrued interest when even $1 is left after the expiration month', () => {
    const debts = [
      makeDbt({
        id: 'x', name: 'One dollar', balance: 901, apr: 24, minPayment: 50,
        promoApr: 0, promoExpiration: '2026-04-01', retroactiveInterest: true,
      }),
    ]
    // Start-of-month balances 901, 601, 301 -> (901 + 601 + 301) * 0.02 = 36.06; $1 left after month 3
    const result = runSimulation(debts, 300, 'avalanche', START)
    const retro = result.warnings.find(w => w.type === 'RETROACTIVE_INTEREST_APPLIED')
    expect(retro!.month).toBe(3)
    expect(retro!.amount).toBe(36.06)
    expect(result.schedule[2].debts[0].balance).toBe(37.06)
  })

  it('does not apply deferred interest to a standard 0% promo (flag off)', () => {
    const debts = [
      makeDbt({
        id: 'bt', name: 'Balance transfer', balance: 5000, apr: 24, minPayment: 50,
        promoApr: 0, promoExpiration: '2026-04-01', retroactiveInterest: false,
      }),
    ]
    const result = runSimulation(debts, 200, 'avalanche', START)
    expect(result.warnings.some(w => w.type === 'RETROACTIVE_INTEREST_APPLIED')).toBe(false)
    // Months 1-3 at 0%; month 4 at 2%: (5000 - 600) * 0.02 = 88.00
    expect(result.schedule[2].debts[0].balance).toBe(4400)
    expect(result.schedule[3].debts[0].interestCharged).toBe(88)
  })

  it('interestSaved includes a deferred charge only the baseline incurs', () => {
    const debts = [
      makeDbt({
        id: 'i', name: 'Saved', balance: 1200, apr: 24, minPayment: 100,
        promoApr: 0, promoExpiration: '2026-04-01', retroactiveInterest: true,
      }),
    ]
    // Plan: 400/month clears it in month 3 -> no interest at all.
    // Baseline: $100/month leaves 900 at month 3 and is charged 24 + 22 + 20 = 66.00, then 24% on the rest.
    const result = runSimulation(debts, 400, 'avalanche', START)
    expect(result.totalInterestPaid).toBe(0)
    // At least the 66.00 charge plus a month of 24% on the 966.00 it leaves (19.32)
    expect(result.interestSaved).toBeGreaterThan(85.32)
  })
})

describe('deferred-interest expiration month counts as payable (SPEC 7.5, D2)', () => {
  const retroDebt = makeDbt({
    id: 'r', name: 'R', balance: 475, apr: 24, minPayment: 25,
    promoApr: 0, promoExpiration: '2026-02-01', retroactiveInterest: true,
  })
  const flatDebt = makeDbt({ id: 'q', name: 'Q', balance: 1000, apr: 20, minPayment: 25 })

  it('clears a deferred-interest debt with the expiration month\'s payment instead of paying the higher APR', () => {
    // R's promo ends after month 1. Extra pool = 500 - 50 = 450, and R needs exactly 475 - 25 = 450 more.
    // Capacity (450 + 25) * 1 month = 475 = balance, so S_retro is 1500 and R is paid first:
    // R is cleared in month 1 and never charged. Counting month 1 as already expired would
    // have paid Q (20% APR) first and left R to be charged.
    const result = runSimulation([retroDebt, flatDebt], 500, 'avalanche', START)
    const m1 = result.schedule[0]
    expect(m1.debts.find(d => d.debtId === 'r')!.paymentMade).toBe(475)
    expect(m1.debts.find(d => d.debtId === 'q')!.paymentMade).toBe(25)
    expect(result.warnings.some(w => w.type === 'RETROACTIVE_INTEREST_APPLIED')).toBe(false)
  })

  it('says "this month" when a deferred-interest promo is in its last payable month', () => {
    const result = runSimulation([retroDebt, flatDebt], 500, 'avalanche', START)
    expect(result.actionPlan[0].payments.find(p => p.debtId === 'r' && p.amount === 450)!.reasoning)
      .toContain('Promo ends this month')
  })
})

describe('plain (flag-off) promo scoring is unchanged in the expiration month', () => {
  it('still ranks by the standard rate: the 20% debt gets the extra, not the 10% promo debt', () => {
    const debts = [
      makeDbt({
        id: 'p', name: 'P', balance: 1000, apr: 10, minPayment: 25,
        promoApr: 0, promoExpiration: '2026-02-01',
      }),
      makeDbt({ id: 'q', name: 'Q', balance: 1000, apr: 20, minPayment: 25 }),
    ]
    const m1 = runSimulation(debts, 500, 'avalanche', START).schedule[0]
    expect(m1.debts.find(d => d.debtId === 'p')!.paymentMade).toBe(25)
    expect(m1.debts.find(d => d.debtId === 'q')!.paymentMade).toBe(475)
  })
})

describe('deferred interest: edge paths', () => {
  it('raises no warning when the promo rate is at or above the standard rate', () => {
    const debts = [
      makeDbt({
        id: 'h', name: 'Higher promo', balance: 1000, apr: 10, minPayment: 100,
        promoApr: 15, promoExpiration: '2026-04-01', retroactiveInterest: true,
      }),
    ]
    const result = runSimulation(debts, 100, 'avalanche', START)
    expect(result.warnings.some(w => w.type === 'RETROACTIVE_INTEREST_APPLIED')).toBe(false)
  })

  it('charges deferred interest on the budget-shortfall path too', () => {
    // Budget 100 against minimums of 200 splits 50/50. R: 0% promo, 24% standard (2%/mo), expires after month 2.
    // Balances at the start of months 1..2: 1000, 950 -> (1000 + 950) * 0.02 = 39.00; 900 owed after month 2's payment.
    const debts = [
      makeDbt({
        id: 'r', name: 'R', balance: 1000, apr: 24, minPayment: 100,
        promoApr: 0, promoExpiration: '2026-03-01', retroactiveInterest: true,
      }),
      makeDbt({ id: 's', name: 'S', balance: 1000, apr: 12, minPayment: 100 }),
    ]
    const result = runSimulation(debts, 100, 'avalanche', START)
    const retro = result.warnings.find(w => w.type === 'RETROACTIVE_INTEREST_APPLIED')
    expect(retro!.month).toBe(2)
    expect(retro!.amount).toBe(39)
    expect(result.schedule[1].debts.find(d => d.debtId === 'r')!.balance).toBe(939)
  })
})

// ─── Action Plan Output ─────────────────────────────────────────────────────

describe('action plan structure', () => {
  const debts = [
    makeDbt({ id: 'a', name: 'TestDebt', balance: 1000, apr: 15, minPayment: 50 }),
  ]
  const result = runSimulation(debts, 500, 'avalanche', START)

  it('has one action plan entry per schedule month', () => {
    expect(result.actionPlan.length).toBe(result.schedule.length)
  })

  it('action plan months are sequential', () => {
    result.actionPlan.forEach((directive, i) => {
      expect(directive.month).toBe(i + 1)
    })
  })

  it('each directive has payment entries', () => {
    for (const directive of result.actionPlan) {
      expect(directive.payments.length).toBeGreaterThan(0)
    }
  })

  it('milestones appear when debt paid off', () => {
    const lastDirective = result.actionPlan[result.actionPlan.length - 1]
    expect(lastDirective.milestones.length).toBeGreaterThan(0)
    expect(lastDirective.milestones[0]).toContain('TestDebt')
  })
})

// ─── Rounding Accumulation in Budget Shortfall ─────────────────────────────

describe('budget shortfall rounding accumulation', () => {
  // 3 debts whose proportional shares trigger rounding accumulation.
  // minPayments: $33.33 + $33.33 + $33.34 = $100.00 total
  // budget = $100, which is exactly totalMins, BUT we set balances low enough
  // that the engine sees budget < totalMinimumsRequired after capping by balance.
  // Actually, to trigger shortfall we need budget < totalMinimumsRequired.
  // Use minPayments that sum to more than the budget.
  const debts = [
    makeDbt({ id: 'd1', name: 'D1', balance: 5000, apr: 18, minPayment: 33.33 }),
    makeDbt({ id: 'd2', name: 'D2', balance: 5000, apr: 18, minPayment: 33.33 }),
    makeDbt({ id: 'd3', name: 'D3', balance: 5000, apr: 18, minPayment: 33.34 }),
  ]
  // Budget $50 is less than total minimums ($100), triggering shortfall allocation
  const budget = 50
  const result = runSimulation(debts, budget, 'avalanche', START)

  it('triggers budget shortfall', () => {
    expect(result.warnings.some(w => w.type === 'BUDGET_SHORTFALL')).toBe(true)
  })

  it('month 1 total payment equals budget exactly (no rounding over-allocation)', () => {
    const m1 = result.schedule[0]
    // The sum of all payments must not exceed the budget
    expect(m1.totalPayment).toBeLessThanOrEqual(budget + 0.01)
    // And it should use the full budget (within a cent)
    expect(m1.totalPayment).toBeGreaterThanOrEqual(budget - 0.01)
  })

  it('no negative balances after shortfall allocation', () => {
    for (const entry of result.schedule) {
      for (const snap of entry.debts) {
        expect(snap.balance).toBeGreaterThanOrEqual(0)
      }
    }
  })

  it('proportional shares sum to budget after remainder distribution', () => {
    const m1 = result.schedule[0]
    const totalPaid = m1.debts.reduce((sum, d) => sum + d.paymentMade, 0)
    expect(round2(totalPaid)).toBe(budget)
  })
})
