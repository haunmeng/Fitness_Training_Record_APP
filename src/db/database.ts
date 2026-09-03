import Dexie, { type Table } from 'dexie'
import type { CustomExerciseTag, Exercise, WorkoutSession, WorkoutSet } from '../types'

class FitnessDB extends Dexie {
  exercises!: Table<Exercise, number>;
  customExerciseTags!: Table<CustomExerciseTag, number>;
  workoutSessions!: Table<WorkoutSession, number>;
  workoutSets!: Table<WorkoutSet, number>;

  constructor() {
    super('FitnessDB')
    this.version(1).stores({
      exercises: '++id, name, createdAt',
      workoutSessions: '++id, date, completed',
      workoutSets: '++id, sessionId, exerciseId, setNumber',
    })
    this.version(2).stores({
      exercises: '++id, name, createdAt',
      customExerciseTags: '++id, name, createdAt',
      workoutSessions: '++id, date, completed',
      workoutSets: '++id, sessionId, exerciseId, setNumber',
    })
  }
}

export const db = new FitnessDB()
