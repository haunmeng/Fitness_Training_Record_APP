/**
 * BlueXlink 同步消息协议
 * 与手表端 src/helper/xlink-sync.js 中的定义保持一致
 */

// ===================== 消息类型 =====================

export const MSG_TYPE = {
  /** 推送本端全量数据到对端 */
  SYNC_PUSH: 'sync_push',
  /** 请求对端发送最新数据 */
  SYNC_PULL: 'sync_pull',
  /** 响应 pull，返回全量快照 */
  SYNC_DATA: 'sync_data',
  /** 确认接收成功 */
  SYNC_ACK: 'sync_ack',
  /** 同步失败 */
  SYNC_ERROR: 'sync_error',
  /** 心跳检测 */
  SYNC_PING: 'sync_ping',
  /** 心跳响应 */
  SYNC_PONG: 'sync_pong',
} as const

export type SyncMessageType = (typeof MSG_TYPE)[keyof typeof MSG_TYPE]

// ===================== 数据结构 =====================

export interface Exercise {
  id?: number
  name: string
  maxWeight?: number
  maxReps?: number
  maxSets?: number
  workingWeight?: number
  workingReps?: number
  workingSets?: number
  createdAt: string
}

export interface WorkoutSession {
  id?: number
  date: string
  completed: boolean
  note?: string
}

export interface WorkoutSet {
  id?: number
  sessionId: number
  exerciseId: number
  setNumber: number
  weight: number
  reps: number
  completed: boolean
}

/** 全量快照 — 与手表端 exportAllData() 格式一致 */
export interface SyncPayload {
  version: number
  exportedAt: string
  exercises: Exercise[]
  workoutSessions: WorkoutSession[]
  workoutSets: WorkoutSet[]
}

// ===================== 消息封装 =====================

export interface SyncMessage {
  type: SyncMessageType
  version: number
  timestamp: string
  payload: SyncPayload | Record<string, unknown> | null
}

export interface SyncErrorPayload {
  error: string
  originalType?: SyncMessageType
}

export interface SyncAckPayload {
  exportedAt: string
}

// ===================== 工厂函数 =====================

const DATA_VERSION = 1

export function createMessage(
  type: SyncMessageType,
  payload: SyncPayload | SyncErrorPayload | SyncAckPayload | null = null,
): SyncMessage {
  return {
    type,
    version: DATA_VERSION,
    timestamp: new Date().toISOString(),
    payload: payload as Record<string, unknown> | null,
  }
}

/**
 * 校验消息格式
 */
export function validateMessage(msg: unknown): msg is SyncMessage {
  if (!msg || typeof msg !== 'object') return false
  const m = msg as Record<string, unknown>
  return (
    typeof m.type === 'string' &&
    Object.values(MSG_TYPE).includes(m.type as SyncMessageType) &&
    typeof m.version === 'number' &&
    typeof m.timestamp === 'string'
  )
}

/**
 * 校验同步数据载荷
 */
export function validatePayload(payload: unknown): payload is SyncPayload {
  if (!payload || typeof payload !== 'object') return false
  const p = payload as Record<string, unknown>
  return (
    typeof p.version === 'number' &&
    typeof p.exportedAt === 'string' &&
    Array.isArray(p.exercises) &&
    Array.isArray(p.workoutSessions) &&
    Array.isArray(p.workoutSets)
  )
}

// ===================== 连接状态 =====================

export const SYNC_STATUS = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  SYNCING: 'syncing',
  ERROR: 'error',
} as const

export type SyncStatus = (typeof SYNC_STATUS)[keyof typeof SYNC_STATUS]

export interface SyncStatusDetail {
  package?: string
  lastSync?: string
  direction?: 'push' | 'pull'
  error?: string
  message?: string
  code?: number
  reason?: string
}

export type StatusChangeCallback = (status: SyncStatus, detail: SyncStatusDetail) => void

// ===================== 同步结果 =====================

export interface SyncResult {
  success: boolean
  exportedAt?: string
  error?: string
  stats?: {
    exercises: number
    sessions: number
    sets: number
  }
}

export interface BidirectionalResult {
  success: boolean
  error?: string
  push?: SyncResult
  pull?: SyncResult
}
