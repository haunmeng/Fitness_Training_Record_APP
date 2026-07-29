export interface Exercise {
  id?: number;
  name: string;
  maxWeight?: number;
  maxReps?: number;
  maxSets?: number;
  workingWeight?: number;
  workingReps?: number;
  workingSets?: number;
  createdAt: Date;
}

export interface WorkoutSession {
  id?: number;
  date: Date;
  completed: boolean;
  note?: string;
}

export interface WorkoutSet {
  id?: number;
  sessionId: number;
  exerciseId: number;
  setNumber: number;
  weight: number;
  reps: number;
  completed: boolean;
}

// For display during active workout
export interface ActiveExercise {
  exercise: Exercise;
  sets: ActiveSet[];
}

export interface ActiveSet {
  setNumber: number;
  weight: number;
  reps: number;
  completed: boolean;
}
