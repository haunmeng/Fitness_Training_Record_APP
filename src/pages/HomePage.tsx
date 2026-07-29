import { useNavigate } from 'react-router-dom'
import { Play, TrendingUp, Calendar } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/database'

export default function HomePage() {
  const navigate = useNavigate()

  const todaySessions = useLiveQuery(async () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    return db.workoutSessions
      .where('date')
      .between(today, tomorrow, true, false)
      .toArray()
  }) ?? []

  const recentSessions = useLiveQuery(async () => {
    const sessions = await db.workoutSessions
      .orderBy('date')
      .reverse()
      .limit(5)
      .toArray()

    // Enrich with exercise count
    return Promise.all(
      sessions.map(async (s) => {
        const sets = await db.workoutSets.where('sessionId').equals(s.id!).toArray()
        const exerciseCount = new Set(sets.map(set => set.exerciseId)).size
        return { ...s, exerciseCount, totalSets: sets.length }
      })
    )
  }) ?? []

  const exerciseCount = useLiveQuery(() => db.exercises.count()) ?? 0

  const todayCompleted = todaySessions.filter(s => s.completed).length
  const todayInProgress = todaySessions.find(s => !s.completed)

  const formatDate = (d: Date) => {
    const now = new Date()
    const date = new Date(d)
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) return '今天'
    if (days === 1) return '昨天'
    if (days < 7) return `${days}天前`
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text">健身训练</h1>
        <p className="text-text3 text-sm mt-1">
          {todayCompleted > 0
            ? `今日已完成 ${todayCompleted} 次训练`
            : '今天还没有开始训练'}
        </p>
      </div>

      {/* Quick Start Button */}
      <button
        onClick={() => navigate('/workout')}
        className="w-full bg-accent hover:bg-accent2 text-black font-semibold py-4 px-6 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-lg shadow-accent/20 mb-6"
      >
        <Play size={22} fill="currentColor" />
        <span className="text-lg">
          {todayInProgress ? '继续训练' : '开始训练'}
        </span>
      </button>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-text3 text-xs mb-1">
            <TrendingUp size={14} />
            <span>训练项目</span>
          </div>
          <p className="text-2xl font-bold text-text">{exerciseCount}</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-text3 text-xs mb-1">
            <Calendar size={14} />
            <span>今日训练</span>
          </div>
          <p className="text-2xl font-bold text-text">{todayCompleted}</p>
        </div>
      </div>

      {/* Recent Sessions */}
      <div>
        <h2 className="text-sm font-medium text-text2 uppercase tracking-wider mb-3">
          最近训练
        </h2>
        {recentSessions.length === 0 ? (
          <div className="bg-surface border border-border rounded-xl p-6 text-center">
            <p className="text-text3 text-sm">还没有训练记录</p>
            <p className="text-text3 text-xs mt-1">点击上方按钮开始第一次训练</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentSessions.map((session) => (
              <button
                key={session.id}
                onClick={() => navigate(`/history`)}
                className="w-full bg-surface border border-border rounded-xl p-4 flex items-center justify-between active:bg-surface2 transition-colors"
              >
                <div className="text-left">
                  <p className="text-sm font-medium text-text">
                    {formatDate(session.date)}
                  </p>
                  <p className="text-xs text-text3 mt-0.5">
                    {session.exerciseCount} 个项目 · {session.totalSets} 组
                  </p>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs ${
                  session.completed
                    ? 'bg-accent/10 text-accent'
                    : 'bg-warn/10 text-warn'
                }`}>
                  {session.completed ? '已完成' : '进行中'}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
