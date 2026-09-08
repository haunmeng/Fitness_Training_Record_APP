import { CheckCircle2, ChevronRight, Dumbbell, Trash2 } from 'lucide-react'
import { useRef, useState, type TouchEvent } from 'react'
import type { Exercise } from '../types'

interface ExerciseCardProps {
  exercise: Exercise
  onClick: () => void
  onDelete?: () => void
  selecting?: boolean
  selected?: boolean
  tagColors?: Record<string, string>
}

export default function ExerciseCard({ exercise, onClick, onDelete, selecting, selected, tagColors }: ExerciseCardProps) {
  const startPoint = useRef<{ x: number; y: number } | null>(null)
  const ignoreNextClick = useRef(false)
  const [swipeOffset, setSwipeOffset] = useState(0)

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    if (selecting) return
    const touch = event.touches[0]
    startPoint.current = { x: touch.clientX, y: touch.clientY }
  }

  const handleTouchMove = (event: TouchEvent<HTMLDivElement>) => {
    if (selecting || !startPoint.current) return
    const touch = event.touches[0]
    const horizontalDistance = touch.clientX - startPoint.current.x
    const verticalDistance = touch.clientY - startPoint.current.y
    if (Math.abs(horizontalDistance) <= Math.abs(verticalDistance)) return
    if (horizontalDistance < 0) setSwipeOffset(Math.max(horizontalDistance, -88))
  }

  const handleTouchEnd = () => {
    if (selecting) return
    if (swipeOffset < -12) ignoreNextClick.current = true
    setSwipeOffset(swipeOffset < -44 ? -88 : 0)
    startPoint.current = null
  }

  const handleCardClick = () => {
    if (ignoreNextClick.current) {
      ignoreNextClick.current = false
      return
    }
    onClick()
  }

  return (
    <div
      className="relative overflow-hidden rounded-xl"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onTouchMove={handleTouchMove}
    >
      {onDelete && !selecting && (
        <button
          type="button"
          onClick={onDelete}
          className="absolute inset-y-0 right-0 w-[88px] bg-danger text-white flex flex-col items-center justify-center gap-1 text-xs font-medium"
          aria-label={`删除${exercise.name}`}
        >
          <Trash2 size={18} />
          删除
        </button>
      )}
      <button
        type="button"
        onClick={handleCardClick}
        className="relative z-10 w-full bg-surface border border-border rounded-xl p-4 flex items-center gap-3 active:bg-surface2 transition-transform text-left"
        style={{ transform: `translateX(${selecting ? 0 : swipeOffset}px)` }}
      >
        {/* Icon */}
        <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
          <Dumbbell size={20} className="text-accent" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-text truncate">{exercise.name}</h4>
          {exercise.tags && exercise.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {exercise.tags.slice(0, 2).map(tag => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-full text-[10px] bg-accent/15 text-accent border border-accent/30"
                  style={tagColors?.[tag] ? { color: tagColors[tag], borderColor: tagColors[tag] } : undefined}
                >
                  {tag}
                </span>
              ))}
              {exercise.tags.length > 2 && (
                <span className="px-1 py-0.5 text-[10px] text-text3">+{exercise.tags.length - 2}</span>
              )}
            </div>
          )}
          <div className="flex gap-3 mt-1 text-xs text-text3">
            {exercise.maxWeight != null && (
              <span>最大 {exercise.maxWeight}kg {exercise.maxSets}×{exercise.maxReps}</span>
            )}
            {exercise.workingWeight != null && (
              <span>训练 {exercise.workingWeight}kg {exercise.workingSets}×{exercise.workingReps}</span>
            )}
          </div>
        </div>

        {selecting ? (
          <CheckCircle2 size={21} className={selected ? 'text-accent flex-shrink-0' : 'text-text3 flex-shrink-0'} />
        ) : (
          <ChevronRight size={18} className="text-text3 flex-shrink-0" />
        )}
      </button>
    </div>
  )
}
