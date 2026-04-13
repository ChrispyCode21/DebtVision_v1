import Button from '@/components/shared/Button'

interface WelcomeProps {
  onNext: () => void
}

export default function Welcome({ onNext }: WelcomeProps) {
  return (
    <div className="flex flex-col items-center text-center px-6 py-10 max-w-lg mx-auto">
      <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
        <svg className="w-10 h-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
        </svg>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-3">
        Take Control of Your Debt
      </h1>

      <p className="text-base text-gray-600 mb-4">
        DebtVision creates a personalized, month-by-month payment plan that minimizes
        interest and gets you debt-free faster.
      </p>

      <ul className="text-left text-sm text-gray-600 space-y-2 mb-8 w-full">
        <li className="flex items-start gap-2">
          <svg className="w-5 h-5 text-green-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Smart prioritization across all your debts
        </li>
        <li className="flex items-start gap-2">
          <svg className="w-5 h-5 text-green-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Handles promo rates and retroactive interest traps
        </li>
        <li className="flex items-start gap-2">
          <svg className="w-5 h-5 text-green-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          See exactly how much interest you'll save
        </li>
      </ul>

      <Button onClick={onNext} className="w-full">
        Get Started
      </Button>
    </div>
  )
}
