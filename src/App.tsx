import { useState } from 'react'
import { AppProvider } from '@/context/AppContext'
import { useAppContext } from '@/context/app-context'
import { loadState } from '@/services/storage'
import OnboardingFlow from '@/components/onboarding/OnboardingFlow'
import Dashboard from '@/components/dashboard/Dashboard'
import ManageScreen from '@/components/manage/ManageScreen'
import TabBar from '@/components/layout/TabBar'

type ActiveTab = 'dashboard' | 'manage'

function AppContent() {
  const { state, dispatch, derivedBudget } = useAppContext()
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard')

  if (!state.onboardingComplete) {
    return (
      <OnboardingFlow
        onComplete={() => {
          // OnboardingFlow already saved to localStorage — reload into context
          dispatch({ type: 'LOAD_STATE', payload: loadState() })
        }}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop top tabs */}
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main content */}
      <main className="pb-20 md:pb-0">
        {activeTab === 'dashboard' ? (
          <Dashboard
            debts={state.debts}
            monthlyBudget={derivedBudget}
            strategy={state.strategy}
          />
        ) : (
          <ManageScreen />
        )}
      </main>

      {/* Mobile bottom tabs (rendered by TabBar's mobile nav) */}
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}
