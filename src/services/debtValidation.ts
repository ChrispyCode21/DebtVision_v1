import type { Debt } from '@/types'

export function getTodayDateString(): string {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function getDebtValidationErrors(debts: Debt[], todayDate: string): Record<string, string> {
  return debts.reduce<Record<string, string>>((acc, debt) => {
    if (debt.balance < 0) {
      acc[`${debt.id}-balance`] = 'Balance cannot be negative.'
    }

    if (debt.apr < 0) {
      acc[`${debt.id}-apr`] = 'APR cannot be negative.'
    } else if (debt.apr > 100) {
      acc[`${debt.id}-apr`] = 'APR cannot exceed 100%.'
    }

    if (debt.minPayment < 0) {
      acc[`${debt.id}-minPayment`] = 'Minimum payment cannot be negative.'
    } else if (debt.balance > 0 && debt.minPayment > debt.balance) {
      acc[`${debt.id}-minPayment`] = 'Minimum payment cannot exceed the current balance.'
    }

    if (debt.promoApr !== null) {
      if (debt.promoApr < 0) {
        acc[`${debt.id}-promoApr`] = 'Promo APR cannot be negative.'
      } else if (debt.promoApr > 100) {
        acc[`${debt.id}-promoApr`] = 'Promo APR cannot exceed 100%.'
      }
    }

    if (debt.promoExpiration && debt.promoExpiration < todayDate) {
      acc[`${debt.id}-promoExpiration`] = 'Promo expiration cannot be in the past.'
    }

    return acc
  }, {})
}
