import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, Minus, X, Flag, ChevronRight,
  Timer, Dumbbell
} from 'lucide-react'
import { useExercises } from '../hooks/useExercises'
import { useWorkout } from '../hooks/useWorkout'
import WorkoutSetTracker from '../components/WorkoutSetTracker'
import Modal from '../components/Modal'

export default function WorkoutPage() {
  const navigate = useNavigate()
  const { exercises, addExercise } = useExercises()
  const {
    sessionId,
    activeExercises,
    startSession,
    addExerciseToSession,
    addSet,
    finishSession,
    discardSession,
    removeActiveExercise,
  } = useWorkout()

  // Exercise picker state
  const [showPicker, setShowPicker] = useState(false)
  const [quickAddName, setQuickAddName] = useState('')

  // Current input state
  const [selectedExerciseId, setSelectedExerciseId] = useState<number | null>(null)
  const [weight, setWeight] = useState('')
  const [reps, setReps] = useState('')
  const repsInputRef = useRef<HTMLInputElement | null>(null)

  // Timer state
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [timerRunning, setTimerRunning] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Finish confirmation
  const [showFinish, setShowFinish] = useState(false)

  // Auto-start session
  useEffect(() => {
    if (!sessionId) {
      startSession()
    }
  }, [sessionId, startSession])

  // Timer
  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => {
        setTimerSeconds(s => s + 1)
      }, 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [timerRunning])

  const formatTimer = (s: number) => {
    const min = Math.floor(s / 60)
    const sec = s % 60
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
  }

  const handleSelectExercise = async (exerciseId: number) => {
    const exercise = exercises.find(e => e.id === exerciseId)
    if (!exercise) return
    await addExerciseToSession(exercise)
    setSelectedExerciseId(exerciseId)
    setShowPicker(false)
    // Pre-fill weight from working weight record
    if (exercise.workingWeight) setWeight(exercise.workingWeight.toString())
    else setWeight('')
    if (exercise.workingReps) setReps(exercise.workingReps.toString())
    else setReps('')
    setTimeout(() => repsInputRef.current?.focus(), 100)
  }

  const handleQuickAdd = async () => {
    const name = quickAddName.trim()
    if (!name) return
    const exerciseId = await addExercise(name)
    setQuickAddName('')
    await handleSelectExercise(exerciseId as number)
  }

  const handleAddSet = async () => {
    if (!selectedExerciseId || !weight || !reps) return
    await addSet(selectedExerciseId, Number(weight), Number(reps))
    // Keep reps (same reps for each set is common), start rest timer
    setTimerSeconds(0)
    setTimerRunning(true)
    // Auto-focus reps for next set
    setTimeout(() => repsInputRef.current?.focus(), 100)
  }

  const handleFinish = async () => {
    await finishSession()
    setShowFinish(false)
    navigate('/')
  }

  const handleDiscard = async () => {
    await discardSession()
    navigate('/')
  }

  // No session yet
  if (!sessionId) {
    return (
      <div className="px-4 pt-6 max-w-lg mx-auto">
        <div className="bg-surface border border-border rounded-xl p-8 text-center mt-20">
          <Dumbbell size={40} className="text-text3 mx-auto mb-3" />
          <p className="text-text2">准备中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col max-w-lg mx-auto">
      {/* Top Bar */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <h1 className="text-xl font-bold text-text">训练</h1>
        <div className="flex items-center gap-3">
          {/* Timer */}
          <button
            onClick={() => setTimerRunning(!timerRunning)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-mono ${
              timerRunning ? 'bg-accent/10 text-accent' : 'bg-surface2 text-text2'
            }`}
          >
            <Timer size={15} />
            {formatTimer(timerSeconds)}
          </button>
          <button
            onClick={() => setShowFinish(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent text-black text-sm font-medium"
          >
            <Flag size={15} />
            结束
          </button>
        </div>
      </div>

      {/* Active Exercises List & Current Exercise */}
      <div className="flex-1 overflow-y-auto px-4">
        {/* Exercise Selection Button */}
        <button
          onClick={() => setShowPicker(true)}
          className="w-full bg-surface border-2 border-dashed border-border rounded-xl p-4 flex items-center justify-between mb-4 active:bg-surface2 transition-colors"
        >
          <span className="text-text2">
            {activeExercises.length === 0 ? '添加训练项目' : '+ 添加更多项目'}
          </span>
          <Plus size={18} className="text-text2" />
        </button>

        {/* Active Exercises */}
        {activeExercises.map((ae) => {
          const isSelected = ae.exercise.id === selectedExerciseId
          return (
            <button
              key={ae.exercise.id}
              onClick={() => {
                if (ae.exercise.id !== selectedExerciseId) {
                  setSelectedExerciseId(ae.exercise.id ?? null)
                  setWeight('')
                  setReps('')
                  setTimeout(() => repsInputRef.current?.focus(), 100)
                }
              }}
              className={`w-full text-left rounded-xl border p-3 mb-3 transition-all ${
                isSelected
                  ? 'border-accent bg-surface'
                  : 'border-border bg-surface'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-text">{ae.exercise.name}</h3>
                  <p className="text-xs text-text3 mt-0.5">
                    已完成 {ae.sets.filter(s => s.completed).length} 组
                    {ae.sets.length > 0 && ` · ${ae.sets[ae.sets.length - 1].weight}kg × ${ae.sets[ae.sets.length - 1].reps}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <WorkoutSetTracker sets={ae.sets} onToggle={() => {}} />
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      removeActiveExercise(ae.exercise.id!)
                      if (isSelected) setSelectedExerciseId(null)
                    }}
                    className="w-6 h-6 rounded-full flex items-center justify-center text-text3 hover:text-danger transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* Input area for selected exercise */}
              {isSelected && (
                <div className="mt-3 pt-3 border-t border-border">
                  {/* Reference records */}
                  {(ae.exercise.maxWeight || ae.exercise.workingWeight) && (
                    <div className="flex gap-4 mb-3 text-xs">
                      {ae.exercise.maxWeight && (
                        <span className="text-warn">
                          最大: {ae.exercise.maxWeight}kg {ae.exercise.maxSets}×{ae.exercise.maxReps}
                        </span>
                      )}
                      {ae.exercise.workingWeight && (
                        <span className="text-accent">
                          训练: {ae.exercise.workingWeight}kg {ae.exercise.workingSets}×{ae.exercise.workingReps}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <label className="block text-xs text-text3 mb-1">重量 (kg)</label>
                      <div className="flex items-center">
                        <button
                          onClick={() => setWeight(w => Math.max(0, Number(w) - 2.5).toString())}
                          className="w-8 h-10 bg-surface2 border border-border rounded-l-lg flex items-center justify-center active:bg-border transition-colors"
                        >
                          <Minus size={14} className="text-text2" />
                        </button>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={weight}
                          onChange={e => {
                            const v = e.target.value
                            if (v === '' || /^\d*\.?\d*$/.test(v)) setWeight(v)
                          }}
                          placeholder="0"
                          className="w-full h-10 bg-surface2 border-y border-border text-center text-text font-medium focus:outline-none"
                        />
                        <button
                          onClick={() => setWeight(w => (Number(w) + 2.5).toString())}
                          className="w-8 h-10 bg-surface2 border border-border rounded-r-lg flex items-center justify-center active:bg-border transition-colors"
                        >
                          <Plus size={14} className="text-text2" />
                        </button>
                      </div>
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs text-text3 mb-1">次数</label>
                      <div className="flex items-center">
                        <button
                          onClick={() => setReps(r => Math.max(0, Number(r) - 1).toString())}
                          className="w-8 h-10 bg-surface2 border border-border rounded-l-lg flex items-center justify-center active:bg-border transition-colors"
                        >
                          <Minus size={14} className="text-text2" />
                        </button>
                        <input
                          type="text"
                          inputMode="numeric"
                          ref={repsInputRef}
                          value={reps}
                          onChange={e => {
                            const v = e.target.value
                            if (v === '' || /^\d+$/.test(v)) setReps(v)
                          }}
                          placeholder="0"
                          className="w-full h-10 bg-surface2 border-y border-border text-center text-text font-medium focus:outline-none"
                        />
                        <button
                          onClick={() => setReps(r => (Number(r) + 1).toString())}
                          className="w-8 h-10 bg-surface2 border border-border rounded-r-lg flex items-center justify-center active:bg-border transition-colors"
                        >
                          <Plus size={14} className="text-text2" />
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={handleAddSet}
                      disabled={!weight || !reps}
                      className="h-10 px-4 bg-accent text-black font-semibold rounded-lg disabled:opacity-30 transition-opacity active:scale-95"
                    >
                      完成
                    </button>
                  </div>
                </div>
              )}
            </button>
          )
        })}

        {activeExercises.length === 0 && (
          <div className="text-center py-12">
            <Dumbbell size={48} className="text-text3 mx-auto mb-3" />
            <p className="text-text2">选择训练项目开始</p>
          </div>
        )}
      </div>

      {/* Exercise Picker Modal */}
      <Modal open={showPicker} onClose={() => { setShowPicker(false); setQuickAddName('') }} title="选择训练项目">
        {/* Quick Add */}
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={quickAddName}
            onChange={e => setQuickAddName(e.target.value)}
            placeholder="快速创建新项目..."
            className="flex-1 bg-surface2 border border-border rounded-lg px-3 py-2.5 text-text text-sm placeholder-text3 focus:outline-none focus:border-accent transition-colors"
            onKeyDown={e => e.key === 'Enter' && handleQuickAdd()}
          />
          <button
            onClick={handleQuickAdd}
            disabled={!quickAddName.trim()}
            className="px-4 py-2.5 bg-accent text-black text-sm font-semibold rounded-lg disabled:opacity-30 transition-opacity"
          >
            <Plus size={16} />
          </button>
        </div>

        <div className="space-y-1 max-h-[50vh] overflow-y-auto">
          {exercises.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-text3 text-sm">还没有训练项目</p>
              <button
                onClick={() => { setShowPicker(false); navigate('/exercises') }}
                className="text-accent text-sm mt-2"
              >
                去添加项目
              </button>
            </div>
          ) : (
            exercises.map((exercise) => {
              const alreadyAdded = activeExercises.some(ae => ae.exercise.id === exercise.id)
              return (
                <button
                  key={exercise.id}
                  onClick={() => !alreadyAdded && handleSelectExercise(exercise.id!)}
                  disabled={alreadyAdded}
                  className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                    alreadyAdded
                      ? 'bg-surface2 opacity-50'
                      : 'hover:bg-surface2 active:bg-border'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                      <Dumbbell size={16} className="text-accent" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-text">{exercise.name}</p>
                      {exercise.workingWeight && (
                        <p className="text-xs text-text3">
                          {exercise.workingWeight}kg {exercise.workingSets}×{exercise.workingReps}
                        </p>
                      )}
                    </div>
                  </div>
                  {alreadyAdded && (
                    <span className="text-xs text-text3">已添加</span>
                  )}
                  {!alreadyAdded && (
                    <ChevronRight size={16} className="text-text3" />
                  )}
                </button>
              )
            })
          )}
        </div>
      </Modal>

      {/* Finish Confirmation */}
      <Modal open={showFinish} onClose={() => setShowFinish(false)} title="结束训练">
        <div className="space-y-4">
          <p className="text-text2 text-sm">
            {activeExercises.length > 0
              ? `已完成 ${activeExercises.reduce((sum, ae) => sum + ae.sets.filter(s => s.completed).length, 0)} 组训练，确定要结束吗？`
              : '还没有完成任何组，确定要结束吗？'}
          </p>
          <button
            onClick={handleFinish}
            className="w-full bg-accent text-black font-semibold py-3 rounded-lg"
          >
            保存并结束
          </button>
          <button
            onClick={handleDiscard}
            className="w-full bg-surface2 text-danger border border-border py-3 rounded-lg font-medium"
          >
            丢弃本次训练
          </button>
        </div>
      </Modal>
    </div>
  )
}
