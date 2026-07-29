import { useCallback } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/database'

export function useHistory() {
  const sessions = useLiveQuery(async () => {
    const all = await db.workoutSessions
      .orderBy('date')
      .reverse()
      .toArray()

    // Enrich with sets and exercise names
    const enriched = await Promise.all(
      all.map(async (session) => {
        const sets = await db.workoutSets
          .where('sessionId')
          .equals(session.id!)
          .toArray()

        // Group sets by exercise
        const exerciseGroups: Record<number, { name: string; sets: typeof sets }> = {}
        for (const set of sets) {
          if (!exerciseGroups[set.exerciseId]) {
            const exercise = await db.exercises.get(set.exerciseId)
            exerciseGroups[set.exerciseId] = {
              name: exercise?.name ?? '已删除',
              sets: [],
            }
          }
          exerciseGroups[set.exerciseId].sets.push(set)
        }

        return { ...session, exerciseGroups }
      })
    )

    return enriched
  }) ?? []

  const deleteSession = useCallback(async (id: number) => {
    await db.workoutSets.where('sessionId').equals(id).delete()
    await db.workoutSessions.delete(id)
  }, [])

  return { sessions, deleteSession }
}

export function useSessionDetail(sessionId: number) {
  return useLiveQuery(async () => {
    const session = await db.workoutSessions.get(sessionId)
    if (!session) return null

    const sets = await db.workoutSets
      .where('sessionId')
      .equals(sessionId)
      .toArray()

    // Group by exercise
    const exerciseGroups: Record<number, { name: string; sets: typeof sets }> = {}
    for (const set of sets) {
      if (!exerciseGroups[set.exerciseId]) {
        const exercise = await db.exercises.get(set.exerciseId)
        exerciseGroups[set.exerciseId] = {
          name: exercise?.name ?? '已删除',
          sets: [],
        }
      }
      exerciseGroups[set.exerciseId].sets.push(set)
    }

    return { ...session, exerciseGroups }
  }, [sessionId])
}
