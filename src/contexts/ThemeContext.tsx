import { createContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { APP_THEMES, type ThemeId } from './ThemeConfig'

interface ThemeContextValue {
  themeId: ThemeId
  setTheme: (themeId: ThemeId) => void
}

const THEME_STORAGE_KEY = 'fitness-theme'
export const ThemeContext = createContext<ThemeContextValue | null>(null)

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
