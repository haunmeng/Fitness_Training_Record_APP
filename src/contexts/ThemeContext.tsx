import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export const APP_THEMES = [
  { id: 'green', name: '活力绿', description: '清新、有力量感', accent: '#4ade80', accent2: '#22c55e' },
  { id: 'blue', name: '海洋蓝', description: '冷静、专注训练', accent: '#38bdf8', accent2: '#0ea5e9' },
  { id: 'violet', name: '暮光紫', description: '柔和、个性鲜明', accent: '#a78bfa', accent2: '#8b5cf6' },
  { id: 'orange', name: '日落橙', description: '热情、充满动感', accent: '#fb923c', accent2: '#f97316' },
] as const

export type ThemeId = typeof APP_THEMES[number]['id']

interface ThemeContextValue {
  themeId: ThemeId
  setTheme: (themeId: ThemeId) => void
}

const THEME_STORAGE_KEY = 'fitness-theme'
const ThemeContext = createContext<ThemeContextValue | null>(null)

function isThemeId(value: string | null): value is ThemeId {
  return APP_THEMES.some(theme => theme.id === value)
}

function applyTheme(themeId: ThemeId) {
  const theme = APP_THEMES.find(item => item.id === themeId) ?? APP_THEMES[0]
  document.documentElement.style.setProperty('--color-accent', theme.accent)
  document.documentElement.style.setProperty('--color-accent2', theme.accent2)
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeId] = useState<ThemeId>(() => {
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY)
    return isThemeId(storedTheme) ? storedTheme : 'green'
  })

  useEffect(() => {
    applyTheme(themeId)
    localStorage.setItem(THEME_STORAGE_KEY, themeId)
  }, [themeId])

  const value = useMemo(() => ({ themeId, setTheme: setThemeId }), [themeId])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme 必须在 ThemeProvider 内使用')
  return context
}
