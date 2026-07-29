import { Dumbbell, ChevronRight } from 'lucide-react'
import type { Exercise } from '../types'

interface ExerciseCardProps {
  exercise: Exercise
  onClick: () => void
  onLongPress?: () => void
}

export default function ExerciseCard({ exercise, onClick, onLongPress }: ExerciseCardProps) {
  let longPressTimer: ReturnType<typeof setTimeout>

  const handleTouchStart = () => {
    if (onLongPress) {
      longPressTimer = setTimeout(onLongPress, 600)
    }
  }
  const handleTouchEnd = () => clearTimeout(longPressTimer)

  return (
    <button
      onClick={onClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchEnd}
      className="w-full bg-surface border border-border rounded-xl p-4 flex items-center gap-3 active:bg-surface2 transition-colors text-left"
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
            {exercise.tags.map(tag => (
              <span key={tag} className="px-2 py-0.5 rounded-full text-[10px] bg-accent/15 text-accent border border-accent/30">
                {tag}
              </span>
            ))}
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

      <ChevronRight size={18} className="text-text3 flex-shrink-0" />
    </button>
  )
}
