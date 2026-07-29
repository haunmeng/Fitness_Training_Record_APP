import { useState, useCallback } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/database'
import type { WorkoutSet, ActiveExercise, Exercise } from '../types'

export function useWorkout() {
  const [sessionId, setSessionId] = useState<number | null>(null)
  const [activeExercises, setActiveExercises] = useState<ActiveExercise[]>([])

  // Load current active session if exists
  const currentSession = useLiveQuery(
    async () => {
      if (sessionId) return db.workoutSessions.get(sessionId)
      // Find today's incomplete session
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const session = await db.workoutSessions
        .where('date')
        .between(today, tomorrow, true, false)
        .and(s => !s.completed)
        .first()

      if (session?.id) {
        setSessionId(session.id)
        // Load existing sets
        const sets = await db.workoutSets.where('sessionId').equals(session.id).toArray()
        // Reconstruct active exercises from sets
        const exerciseIds = [...new Set(sets.map(s => s.exerciseId))]
        const exercises: ActiveExercise[] = []
        for (const eId of exerciseIds) {
          const exercise = await db.exercises.get(eId)
          if (exercise) {
            exercises.push({
              exercise,
              sets: sets
                .filter(s => s.exerciseId === eId)
                .map(s => ({
                  setNumber: s.setNumber,
                  weight: s.weight,
                  reps: s.reps,
                  completed: s.completed,
                })),
            })
          }
        }
        setActiveExercises(exercises)
      }
      return session
    },
    [sessionId]
  )

  const startSession = useCallback(async () => {
    // If there's an incomplete session today, resume it
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    let session = await db.workoutSessions
      .where('date')
      .between(today, tomorrow, true, false)
      .and(s => !s.completed)
      .first()

    if (!session) {
      const id = await db.workoutSessions.add({
        date: new Date(),
        completed: false,
      })
      session = { id, date: new Date(), completed: false }
    }

    setSessionId(session.id!)
    return session.id!
  }, [])

  const addExerciseToSession = useCallback(async (exercise: Exercise) => {
    if (!sessionId) return

    // Check if already in active list
    setActiveExercises(prev => {
      if (prev.find(ae => ae.exercise.id === exercise.id)) return prev
      return [...prev, { exercise, sets: [] }]
    })
  }, [sessionId])

  const addSet = useCallback(async (exerciseId: number, weight: number, reps: number) => {
    if (!sessionId) return

    const newSet: WorkoutSet = {
      sessionId,
      exerciseId,
      setNumber: 0, // will be calculated
      weight,
      reps,
      completed: true,
    }

    // Get current set number and save
    const existingSets = await db.workoutSets
      .where({ sessionId, exerciseId })
      .toArray()
    newSet.setNumber = existingSets.length + 1

    const setId = await db.workoutSets.add(newSet)

    // Update active state
    setActiveExercises(prev =>
      prev.map(ae => {
        if (ae.exercise.id === exerciseId) {
          return {
            ...ae,
            sets: [...ae.sets, { setNumber: newSet.setNumber, weight, reps, completed: true }],
          }
        }
        return ae
      })
    )

    return setId
  }, [sessionId])

  const finishSession = useCallback(async () => {
    if (!sessionId) return
    await db.workoutSessions.update(sessionId, { completed: true })
    setSessionId(null)
    setActiveExercises([])
  }, [sessionId])

  const discardSession = useCallback(async () => {
    if (!sessionId) return
    await db.workoutSets.where('sessionId').equals(sessionId).delete()
    await db.workoutSessions.delete(sessionId)
    setSessionId(null)
    setActiveExercises([])
  }, [sessionId])

  const removeActiveExercise = useCallback(async (exerciseId: number) => {
    if (!sessionId) return
    await db.workoutSets.where({ sessionId, exerciseId }).delete()
    setActiveExercises(prev => prev.filter(ae => ae.exercise.id !== exerciseId))
  }, [sessionId])

  return {
    sessionId,
    activeExercises,
    currentSession,
    startSession,
    addExerciseToSession,
    addSet,
    finishSession,
    discardSession,
    removeActiveExercise,
  }
}
