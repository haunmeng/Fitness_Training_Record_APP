import Dexie, { type Table } from 'dexie'
import type { Exercise, WorkoutSession, WorkoutSet } from '../types'

class FitnessDB extends Dexie {
  exercises!: Table<Exercise, number>;
  workoutSessions!: Table<WorkoutSession, number>;
  workoutSets!: Table<WorkoutSet, number>;

  constructor() {
    super('FitnessDB')
    this.version(1).stores({
      exercises: '++id, name, createdAt',
      workoutSessions: '++id, date, completed',
      workoutSets: '++id, sessionId, exerciseId, setNumber',
    })
  }
}

export const db = new FitnessDB()
