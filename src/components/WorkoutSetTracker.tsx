import { Check } from 'lucide-react'
import type { ActiveSet } from '../types'

interface WorkoutSetTrackerProps {
  sets: ActiveSet[]
  onToggle: (setNumber: number) => void
}

export default function WorkoutSetTracker({ sets, onToggle }: WorkoutSetTrackerProps) {
  return (
    <div className="flex gap-2 flex-wrap">
      {sets.map((set) => (
        <button
          key={set.setNumber}
          onClick={() => onToggle(set.setNumber)}
          className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
            set.completed
              ? 'bg-accent text-black shadow-lg shadow-accent/20'
              : 'bg-surface2 text-text2 border border-border'
          }`}
        >
          {set.completed ? <Check size={16} /> : set.setNumber}
        </button>
      ))}
      {/* Next empty set indicator */}
      {sets.length > 0 && (
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm text-text3 border border-dashed border-border">
          {sets.length + 1}
        </div>
      )}
    </div>
  )
}
