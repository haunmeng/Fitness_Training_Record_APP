import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Home, Dumbbell, Play, History, Settings } from 'lucide-react'

const tabs = [
  { path: '/', label: '首页', icon: Home },
  { path: '/exercises', label: '项目', icon: Dumbbell },
  { path: '/workout', label: '训练', icon: Play },
  { path: '/history', label: '历史', icon: History },
  { path: '/settings', label: '设置', icon: Settings },
]

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <div className="h-full flex flex-col bg-bg">
      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>

      {/* Bottom Navigation */}
      <nav
        className="flex-shrink-0 bg-surface border-t border-border safe-bottom"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 8px), 8px)' }}
      >
        <div className="flex items-center justify-around h-14 px-2 max-w-lg mx-auto">
          {tabs.map(({ path, label, icon: Icon }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex flex-col items-center justify-center gap-0.5 py-1 px-3 rounded-lg transition-colors min-w-0 ${
                isActive(path)
                  ? 'text-accent'
                  : 'text-text3 hover:text-text2'
              }`}
            >
              <Icon size={22} />
              <span className="text-xs font-medium">{label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
