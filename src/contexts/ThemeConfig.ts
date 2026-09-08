export const APP_THEMES = [
  { id: 'green', name: '活力绿', description: '清新、有力量感', accent: '#4ade80', accent2: '#22c55e' },
  { id: 'blue', name: '海洋蓝', description: '冷静、专注训练', accent: '#38bdf8', accent2: '#0ea5e9' },
  { id: 'violet', name: '暮光紫', description: '柔和、个性鲜明', accent: '#a78bfa', accent2: '#8b5cf6' },
  { id: 'orange', name: '日落橙', description: '热情、充满动感', accent: '#fb923c', accent2: '#f97316' },
] as const

export type ThemeId = typeof APP_THEMES[number]['id']
