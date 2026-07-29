// 预设标签（训练部位 / 动作类型）
export const EXERCISE_TAGS = [
  '胸部', '背部', '腿部', '肩部', '手臂', '核心',
  '有氧', '力量', '拉伸', 'HIIT',
] as const

export type ExerciseTag = typeof EXERCISE_TAGS[number]

export interface Exercise {
  id?: number;
  name: string;
  tags?: string[];
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
