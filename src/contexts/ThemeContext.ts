import { createContext } from 'react'
import type { ThemeId } from './ThemeConfig'

export interface ThemeContextValue {
  themeId: ThemeId
  setTheme: (themeId: ThemeId) => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)
