import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/database'
import { normalizeExerciseTags, type Exercise } from '../types'

export function useExercises() {
  const exercises = useLiveQuery(() =>
    db.exercises.orderBy('createdAt').reverse().toArray()
  ) ?? []

  const addExercise = async (name: string, data: Partial<Exercise> = {}) => {
    const exercise: Exercise = {
      name: name.trim(),
      createdAt: new Date(),
      ...data,
      tags: normalizeExerciseTags(data.tags),
    }
    return db.exercises.add(exercise)
  }

  const updateExercise = async (id: number, data: Partial<Exercise>) => {
    return db.exercises.update(id, {
      ...data,
      ...(data.tags !== undefined ? { tags: normalizeExerciseTags(data.tags) } : {}),
    })
  }

  const deleteExercise = async (id: number) => {
    // Delete related workout sets too
    await db.workoutSets.where('exerciseId').equals(id).delete()
    return db.exercises.delete(id)
  }

  return { exercises, addExercise, updateExercise, deleteExercise }
}

export function useExercise(id: number) {
  return useLiveQuery(() => db.exercises.get(id), [id])
}
