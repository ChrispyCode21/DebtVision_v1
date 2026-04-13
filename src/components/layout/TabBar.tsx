type Tab = 'dashboard' | 'manage'

interface TabBarProps {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
}

interface TabConfig {
  id: Tab
  label: string
  icon: React.ReactNode
}

// Dashboard icon (bar chart)
function DashboardIcon({ active }: { active: boolean }) {
  return (
    <svg
      className={`w-6 h-6 ${active ? 'text-blue-600' : 'text-gray-500'}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      />
    </svg>
  )
}

// Manage icon (pencil)
function ManageIcon({ active }: { active: boolean }) {
  return (
    <svg
      className={`w-6 h-6 ${active ? 'text-blue-600' : 'text-gray-500'}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
      />
    </svg>
  )
}

export default function TabBar({ activeTab, onTabChange }: TabBarProps) {
  const tabs: TabConfig[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <DashboardIcon active={activeTab === 'dashboard'} />,
    },
    {
      id: 'manage',
      label: 'Manage',
      icon: <ManageIcon active={activeTab === 'manage'} />,
    },
  ]

  return (
    <>
      {/* ── Mobile: fixed bottom bar (visible below md) ─────────────── */}
      <nav
        aria-label="Main navigation"
        className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-gray-200 md:hidden"
      >
        <div className="flex">
          {tabs.map(tab => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex-1 flex flex-col items-center justify-center gap-1 min-h-[56px] py-2 transition-colors
                  ${isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {tab.icon}
                <span className={`text-xs font-medium ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                  {tab.label}
                </span>
              </button>
            )
          })}
        </div>
      </nav>

      {/* ── Desktop: horizontal tabs at top (visible from md up) ─────── */}
      <nav
        aria-label="Main navigation"
        className="hidden md:flex bg-white border-b border-gray-200 px-6"
      >
        {tabs.map(tab => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex items-center gap-2 min-h-[52px] px-5 border-b-2 transition-colors font-medium text-sm
                ${isActive
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          )
        })}
      </nav>
    </>
  )
}
