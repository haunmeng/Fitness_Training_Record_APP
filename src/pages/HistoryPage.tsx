import { useMemo, useState } from 'react'
import { ChevronDown, ChevronUp, Dumbbell, BarChart3, Trash2 } from 'lucide-react'
import { useHistory } from '../hooks/useHistory'
import { useCustomExerciseTags } from '../hooks/useCustomExerciseTags'
import Modal from '../components/Modal'
import { EXERCISE_TAGS, EXERCISE_TAG_ALL, EXERCISE_TAG_UNCATEGORIZED } from '../types'

type ExerciseStats = {
  id: number
  name: string
  maxWeight: number
  maxReps: number
  sessionCount: number
  lastDate: Date
  tags: string[]
}

export default function HistoryPage() {
  const { sessions, deleteSession } = useHistory()
  const { customTags } = useCustomExerciseTags()
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [showStats, setShowStats] = useState(false)
  const [statsTag, setStatsTag] = useState(EXERCISE_TAG_ALL)
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)

  const formatDate = (d: Date | string) => {
    const date = new Date(d)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    const dateStr = date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      weekday: 'short',
    })

    if (days === 0) return `今天 ${dateStr}`
    if (days === 1) return `昨天 ${dateStr}`
    return dateStr
  }

  const formatTime = (d: Date | string) => {
    return new Date(d).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id)
  }

  const stats = useMemo(() => {
    const exerciseMap: Record<number, ExerciseStats> = {}

    for (const session of sessions) {
      if (!session.exerciseGroups || !session.completed) continue
      for (const [eIdStr, group] of Object.entries(session.exerciseGroups)) {
        const eId = Number(eIdStr)
        if (!exerciseMap[eId]) {
          exerciseMap[eId] = {
            id: eId,
            name: group.name,
            maxWeight: 0,
            maxReps: 0,
            sessionCount: 0,
            lastDate: new Date(0),
            tags: group.tags,
          }
        }
        exerciseMap[eId].sessionCount++
        if (new Date(session.date) > exerciseMap[eId].lastDate) {
          exerciseMap[eId].lastDate = new Date(session.date)
        }
        for (const set of group.sets) {
          if (set.weight > exerciseMap[eId].maxWeight) {
            exerciseMap[eId].maxWeight = set.weight
          }
          if (set.reps > exerciseMap[eId].maxReps) {
            exerciseMap[eId].maxReps = set.reps
          }
        }
      }
    }

    return Object.values(exerciseMap).sort((a, b) => b.sessionCount - a.sessionCount)
  }, [sessions])

  const statsTags = [...EXERCISE_TAGS, ...customTags.map(tag => tag.name)]
  const tagColors = Object.fromEntries(customTags.map(tag => [tag.name, tag.color]))
  const filteredStats = statsTag === EXERCISE_TAG_ALL
    ? stats
    : statsTag === EXERCISE_TAG_UNCATEGORIZED
      ? stats.filter(stat => stat.tags.length === 0)
      : stats.filter(stat => stat.tags.includes(statsTag))

  const openStats = () => {
    setStatsTag(EXERCISE_TAG_ALL)
    setShowStats(true)
  }

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text">训练历史</h1>
          <p className="text-text3 text-sm mt-1">{sessions.length} 次训练</p>
        </div>
        {sessions.length > 0 && (
          <button
            onClick={openStats}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface border border-border text-text2 text-sm active:bg-surface2 transition-colors"
          >
            <BarChart3 size={16} />
            统计
          </button>
        )}
      </div>

      {/* Session List */}
      {sessions.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-8 text-center">
          <Dumbbell size={40} className="text-text3 mx-auto mb-3" />
          <p className="text-text2">还没有训练记录</p>
          <p className="text-text3 text-xs mt-1">开始训练后这里会显示历史记录</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sessions.map((session) => {
            const isExpanded = expandedId === session.id
            const totalSets = Object.values(session.exerciseGroups ?? {}).reduce(
              (sum, g) => sum + g.sets.length, 0
            )
            const exerciseCount = Object.keys(session.exerciseGroups ?? {}).length

            return (
              <div
                key={session.id}
                className="bg-surface border border-border rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => toggleExpand(session.id!)}
                  className="w-full p-4 flex items-center justify-between active:bg-surface2 transition-colors"
                >
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-text text-sm">
                        {formatDate(session.date)}
                      </p>
                      <span className={`px-1.5 py-0.5 rounded text-xs ${
                        session.completed
                          ? 'bg-accent/10 text-accent'
                          : 'bg-warn/10 text-warn'
                      }`}>
                        {session.completed ? '完成' : '未完成'}
                      </span>
                    </div>
                    <p className="text-xs text-text3 mt-0.5">
                      {formatTime(session.date)} · {exerciseCount} 项目 · {totalSets} 组
                    </p>
                  </div>
                  {isExpanded ? (
                    <ChevronUp size={18} className="text-text3" />
                  ) : (
                    <ChevronDown size={18} className="text-text3" />
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setDeleteConfirm(session.id!)
                    }}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-text3 hover:text-danger hover:bg-surface2 transition-colors ml-1"
                  >
                    <Trash2 size={14} />
                  </button>
                </button>

                {/* Expanded detail */}
                {isExpanded && session.exerciseGroups && (
                  <div className="border-t border-border px-4 py-3 space-y-3">
                    {Object.entries(session.exerciseGroups).map(([eId, group]) => (
                      <div key={eId}>
                        <h4 className="text-sm font-medium text-accent mb-1.5">
                          {group.name}
                        </h4>
                        <div className="flex gap-2 flex-wrap">
                          {group.sets
                            .sort((a, b) => a.setNumber - b.setNumber)
                            .map((set) => (
                              <div
                                key={set.id}
                                className={`px-3 py-1.5 rounded-lg text-xs font-mono ${
                                  set.completed
                                    ? 'bg-surface2 text-text'
                                    : 'bg-surface2 text-text3 line-through'
                                }`}
                              >
                                <span className="text-text3">#{set.setNumber}</span>{' '}
                                {set.weight}kg × {set.reps}
                              </div>
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Stats Modal */}
      <Modal open={showStats} onClose={() => setShowStats(false)} title="训练统计">
        <div className="space-y-3">
          <div>
            <p className="text-xs text-text3 mb-2">按标签筛选项目</p>
            <div className="flex flex-wrap gap-2">
              {[EXERCISE_TAG_ALL, EXERCISE_TAG_UNCATEGORIZED, ...statsTags].map(tag => {
                const active = statsTag === tag
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setStatsTag(tag)}
                    className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                      active
                        ? 'bg-accent text-black border-accent'
                        : 'bg-surface2 text-text3 border-border hover:border-accent/50'
                    }`}
                    style={active && tagColors[tag] ? { backgroundColor: tagColors[tag], borderColor: tagColors[tag] } : undefined}
                  >
                    {tag}
                  </button>
                )
              })}
            </div>
          </div>

          {filteredStats.length === 0 ? (
            <p className="text-text3 text-sm text-center py-4">该标签下暂无统计数据</p>
          ) : (
            filteredStats.map((stat) => (
              <div
                key={stat.id}
                className="bg-surface2 border border-border rounded-lg p-3"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-text text-sm">{stat.name}</h4>
                  <span className="text-xs text-text3">{stat.sessionCount} 次训练</span>
                </div>
                {stat.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {stat.tags.slice(0, 2).map(tag => (
                      <span
                        key={tag}
                        className="px-1.5 py-0.5 rounded-full text-[10px] bg-accent/10 text-accent border border-accent/30"
                        style={tagColors[tag] ? { color: tagColors[tag], borderColor: tagColors[tag] } : undefined}
                      >
                        {tag}
                      </span>
                    ))}
                    {stat.tags.length > 2 && <span className="text-[10px] text-text3">+{stat.tags.length - 2}</span>}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-text3">最大重量: </span>
                    <span className="text-warn font-medium">{stat.maxWeight}kg</span>
                  </div>
                  <div>
                    <span className="text-text3">最多次数: </span>
                    <span className="text-accent font-medium">{stat.maxReps}次</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <Modal open={deleteConfirm !== null} onClose={() => setDeleteConfirm(null)} title="删除训练记录">
        <div className="space-y-4">
          <p className="text-text2 text-sm">
            确定要删除这条训练记录吗？相关的组数数据也会被删除。此操作不可撤销。
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setDeleteConfirm(null)}
              className="flex-1 bg-surface2 text-text border border-border py-3 rounded-lg font-medium"
            >
              取消
            </button>
            <button
              onClick={async () => {
                if (deleteConfirm !== null) {
                  await deleteSession(deleteConfirm)
                  setDeleteConfirm(null)
                  setExpandedId(null)
                }
              }}
              className="flex-1 bg-danger text-white py-3 rounded-lg font-medium"
            >
              删除
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
