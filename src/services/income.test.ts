import { describe, it, expect } from 'vitest'
import { toMonthlyIncome } from './income'

describe('toMonthlyIncome', () => {
  it('converts weekly to monthly', () => {
    expect(toMonthlyIncome(1000, 'weekly')).toBeCloseTo(4333.33, 2)
  })

  it('converts biweekly to monthly', () => {
    expect(toMonthlyIncome(2000, 'biweekly')).toBeCloseTo(4333.33, 2)
  })

  it('converts semi-monthly to monthly', () => {
    expect(toMonthlyIncome(2500, 'semi-monthly')).toBe(5000)
  })

  it('passes through monthly unchanged', () => {
    expect(toMonthlyIncome(5000, 'monthly')).toBe(5000)
  })

  it('converts annually to monthly', () => {
    expect(toMonthlyIncome(60000, 'annually')).toBe(5000)
  })

  it('handles zero income', () => {
    expect(toMonthlyIncome(0, 'weekly')).toBe(0)
  })
})
