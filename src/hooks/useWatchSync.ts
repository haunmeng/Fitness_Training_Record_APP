/**
 * 手表同步 Hook
 * 通过 BlueXlink（vivo 智能终端设备 SDK）与手表端进行双向数据同步
 *
 * 与手表端 src/helper/xlink-sync.js 的同步协议保持一致。
 *
 * ⚠️ 前置依赖：
 *   手机端需集成 vivo 智能终端设备 SDK（device-rpc.aar）
 *   在 SDK 就绪前，使用 mockBridge 进行开发测试。
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { db } from '../db/database'
import {
  type SyncMessage,
  type SyncPayload,
  type SyncResult,
  type BidirectionalResult,
  type SyncStatus,
  type SyncStatusDetail,
  type StatusChangeCallback,
  MSG_TYPE,
  SYNC_STATUS,
  createMessage,
  validateMessage,
  validatePayload,
} from '../services/xlink-protocol'

// ===================== 导出数据 =====================

async function exportData(): Promise<SyncPayload> {
  const exercises = await db.exercises.toArray()
  const workoutSessions = await db.workoutSessions.toArray()
  const workoutSets = await db.workoutSets.toArray()

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    exercises: exercises.map(e => ({
      ...e,
      createdAt: e.createdAt instanceof Date ? e.createdAt.toISOString() : String(e.createdAt),
    })),
    workoutSessions: workoutSessions.map(s => ({
      ...s,
      date: s.date instanceof Date ? s.date.toISOString() : String(s.date),
    })),
    workoutSets: workoutSets.map(s => ({ ...s })),
  }
}

// ===================== 导入数据（合并而非覆盖） =====================

async function importData(payload: SyncPayload): Promise<{ exercises: number; sessions: number; sets: number }> {
  if (!validatePayload(payload)) {
    throw new Error('无效的同步数据格式')
  }

  // 获取现有数据的 ID 集合用于去重
  const existingExercises = await db.exercises.toArray()
  const existingSessions = await db.workoutSessions.toArray()
  const existingSets = await db.workoutSets.toArray()

  const existingExerciseIds = new Set(existingExercises.map(e => e.id))
  const existingSessionIds = new Set(existingSessions.map(s => s.id))

  let exerciseCount = 0
  let sessionCount = 0
  let setCount = 0

  // 合并训练项目：保留双方数据，相同 id 则用新数据覆盖
  for (const e of payload.exercises) {
    const { id, createdAt, ...rest } = e
    if (id != null && existingExerciseIds.has(id)) {
      await db.exercises.update(id, {
        ...rest,
        createdAt: new Date(createdAt),
      })
    } else {
      await db.exercises.add({
        ...rest,
        createdAt: new Date(createdAt),
      })
    }
    exerciseCount++
  }

  // 合并训练记录
  const sessionIdMap: Record<number, number> = {}
  for (const s of payload.workoutSessions) {
    const { id, date, ...rest } = s
    if (id != null && existingSessionIds.has(id)) {
      await db.workoutSessions.update(id, {
        ...rest,
        date: new Date(date),
      })
      sessionIdMap[id] = id
    } else {
      const newId = await db.workoutSessions.add({
        ...rest,
        date: new Date(date),
      })
      if (id != null) sessionIdMap[id] = newId
    }
    sessionCount++
  }

  // 合并组数记录（去重：sessionId + exerciseId + setNumber）
  const existingSetKeys = new Set(
    existingSets.map(s => `${s.sessionId}_${s.exerciseId}_${s.setNumber}`),
  )

  for (const set of payload.workoutSets) {
    const { id, sessionId, exerciseId, ...rest } = set
    const mappedSessionId = sessionIdMap[sessionId] ?? sessionId
    const setKey = `${mappedSessionId}_${exerciseId}_${rest.setNumber}`

    if (!existingSetKeys.has(setKey)) {
      await db.workoutSets.add({
        ...rest,
        sessionId: mappedSessionId,
        exerciseId,
      })
      setCount++
    }
  }

  return { exercises: exerciseCount, sessions: sessionCount, sets: setCount }
}

// ===================== Mock Bridge（SDK 就绪前使用） =====================

interface BlueXlinkBridge {
  init: (packageName: string) => Promise<void>
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  send: (message: SyncMessage) => Promise<void>
  onMessage: ((callback: (msg: SyncMessage) => void) => void) | null
  onStatusChange: ((callback: StatusChangeCallback) => void) | null
  isAvailable: boolean
}

function createMockBridge(): BlueXlinkBridge {
  let messageCallback: ((msg: SyncMessage) => void) | null = null
  let statusCallback: StatusChangeCallback | null = null
  let connected = false

  return {
    isAvailable: false, // mock 模式下不可用

    init: async (_packageName: string) => {
      console.log('[BlueXlink Mock] init:', _packageName)
    },

    connect: async () => {
      console.log('[BlueXlink Mock] connecting...')
      await new Promise(resolve => setTimeout(resolve, 800))
      connected = true
      statusCallback?.(SYNC_STATUS.CONNECTED, { package: 'com.gemn.fitness' })
    },

    disconnect: async () => {
      connected = false
      statusCallback?.(SYNC_STATUS.DISCONNECTED, { reason: 'disconnected' })
    },

    send: async (message: SyncMessage) => {
      console.log('[BlueXlink Mock] send:', message.type)
      if (!connected) throw new Error('Not connected')

      // 模拟对端响应
      await new Promise(resolve => setTimeout(resolve, 300))

      switch (message.type) {
        case MSG_TYPE.SYNC_PULL: {
          // 模拟：作为"手表"，导出数据并返回
          const payload = await exportData()
          const resp = createMessage(MSG_TYPE.SYNC_DATA, payload)
          setTimeout(() => messageCallback?.(resp), 100)
          break
        }
        case MSG_TYPE.SYNC_PUSH: {
          // 模拟：确认接收
          const ack = createMessage(MSG_TYPE.SYNC_ACK, {
            exportedAt: message.payload && typeof message.payload === 'object' && 'exportedAt' in message.payload
              ? (message.payload as SyncPayload).exportedAt
              : message.timestamp,
          })
          setTimeout(() => messageCallback?.(ack), 100)
          break
        }
      }
    },

    onMessage: (callback: (msg: SyncMessage) => void) => {
      messageCallback = callback
    },

    onStatusChange: (callback: StatusChangeCallback) => {
      statusCallback = callback
    },

    get isAvailable() {
      return false
    },
  } as BlueXlinkBridge
}

// ===================== Hook =====================

export function useWatchSync() {
  const [status, setStatus] = useState<SyncStatus>(SYNC_STATUS.DISCONNECTED)
  const [statusDetail, setStatusDetail] = useState<SyncStatusDetail>({})
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)

  const bridgeRef = useRef<BlueXlinkBridge>(createMockBridge())
  const pullResolverRef = useRef<((result: SyncResult) => void) | null>(null)
  const pushResolverRef = useRef<((result: SyncResult) => void) | null>(null)

  // 处理来自手表的同步消息
  const handleMessage = useCallback(async (msg: SyncMessage) => {
    if (!validateMessage(msg)) return

    switch (msg.type) {
      case MSG_TYPE.SYNC_PUSH: {
        // 手表推送数据过来 → 合并导入
        if (msg.payload && validatePayload(msg.payload)) {
          try {
            const stats = await importData(msg.payload)
            const ack = createMessage(MSG_TYPE.SYNC_ACK, {
              exportedAt: msg.payload.exportedAt || msg.timestamp,
            })
            await bridgeRef.current.send(ack)
            setLastSyncAt(new Date().toISOString())
            setStatusDetail({ lastSync: msg.timestamp, direction: 'pull' })
            console.log('[WatchSync] 从手表导入完成:', stats)
          } catch (e) {
            const err = createMessage(MSG_TYPE.SYNC_ERROR, {
              error: e instanceof Error ? e.message : String(e),
              originalType: MSG_TYPE.SYNC_PUSH,
            })
            await bridgeRef.current.send(err)
          }
        }
        break
      }

      case MSG_TYPE.SYNC_PULL: {
        // 手表请求数据 → 导出并发送
        try {
          const payload = await exportData()
          const resp = createMessage(MSG_TYPE.SYNC_DATA, payload)
          await bridgeRef.current.send(resp)
        } catch (e) {
          const err = createMessage(MSG_TYPE.SYNC_ERROR, {
            error: e instanceof Error ? e.message : String(e),
            originalType: MSG_TYPE.SYNC_PULL,
          })
          await bridgeRef.current.send(err)
        }
        break
      }

      case MSG_TYPE.SYNC_DATA: {
        // 响应我们的 pull 请求
        if (msg.payload && validatePayload(msg.payload)) {
          try {
            const stats = await importData(msg.payload)
            const ack = createMessage(MSG_TYPE.SYNC_ACK, {
              exportedAt: msg.payload.exportedAt || msg.timestamp,
            })
            await bridgeRef.current.send(ack)
            setLastSyncAt(new Date().toISOString())
            setStatusDetail({ lastSync: msg.timestamp, direction: 'pull' })
            pullResolverRef.current?.({
              success: true,
              exportedAt: msg.payload.exportedAt,
              stats,
            })
          } catch (e) {
            pullResolverRef.current?.({
              success: false,
              error: e instanceof Error ? e.message : String(e),
            })
          }
          pullResolverRef.current = null
        }
        break
      }

      case MSG_TYPE.SYNC_ACK: {
        setLastSyncAt(new Date().toISOString())
        setStatusDetail({ lastSync: msg.timestamp, direction: 'push' })
        pushResolverRef.current?.({ success: true, exportedAt: msg.timestamp })
        pushResolverRef.current = null
        break
      }

      case MSG_TYPE.SYNC_ERROR: {
        const errorMsg = (msg.payload && typeof msg.payload === 'object' && 'error' in msg.payload)
          ? String((msg.payload as Record<string, unknown>).error)
          : 'Unknown sync error'
        pullResolverRef.current?.({ success: false, error: errorMsg })
        pushResolverRef.current?.({ success: false, error: errorMsg })
        pullResolverRef.current = null
        pushResolverRef.current = null
        setStatusDetail({ error: errorMsg })
        break
      }

      case MSG_TYPE.SYNC_PING: {
        const pong = createMessage(MSG_TYPE.SYNC_PONG, null)
        await bridgeRef.current.send(pong)
        break
      }
    }
  }, [])

  // 初始化
  const initConnection = useCallback(async (packageName = 'com.gemn.fitness.watch') => {
    setStatus(SYNC_STATUS.CONNECTING)
    setStatusDetail({ package: packageName })

    try {
      await bridgeRef.current.init(packageName)
      bridgeRef.current.onMessage?.(handleMessage)

      bridgeRef.current.onStatusChange?.((newStatus, detail) => {
        setStatus(newStatus)
        setStatusDetail(detail)
      })

      await bridgeRef.current.connect()
    } catch (e) {
      setStatus(SYNC_STATUS.ERROR)
      setStatusDetail({ error: e instanceof Error ? e.message : String(e) })
    }
  }, [handleMessage])

  // 推送数据到手表
  const pushToWatch = useCallback(async (): Promise<SyncResult> => {
    if (status !== SYNC_STATUS.CONNECTED) {
      return { success: false, error: '未连接到手表' }
    }

    setIsSyncing(true)
    setStatus(SYNC_STATUS.SYNCING)
    setStatusDetail({ direction: 'push' })

    return new Promise<SyncResult>(async resolve => {
      const PUSH_TIMEOUT = 15000
      const timeout = setTimeout(() => {
        pushResolverRef.current = null
        resolve({ success: false, error: '推送超时 — 未收到手表确认' })
      }, PUSH_TIMEOUT)

      pushResolverRef.current = (result: SyncResult) => {
        clearTimeout(timeout)
        setIsSyncing(false)
        setStatus(SYNC_STATUS.CONNECTED)
        resolve(result)
      }

      try {
        const payload = await exportData()
        const msg = createMessage(MSG_TYPE.SYNC_PUSH, payload)
        await bridgeRef.current.send(msg)
      } catch (e) {
        clearTimeout(timeout)
        pushResolverRef.current = null
        setIsSyncing(false)
        setStatus(SYNC_STATUS.CONNECTED)
        resolve({ success: false, error: e instanceof Error ? e.message : String(e) })
      }
    })
  }, [status])

  // 从手表拉取数据
  const pullFromWatch = useCallback(async (): Promise<SyncResult> => {
    if (status !== SYNC_STATUS.CONNECTED) {
      return { success: false, error: '未连接到手表' }
    }

    setIsSyncing(true)
    setStatus(SYNC_STATUS.SYNCING)
    setStatusDetail({ direction: 'pull' })

    return new Promise<SyncResult>(async resolve => {
      const PULL_TIMEOUT = 15000
      const timeout = setTimeout(() => {
        pullResolverRef.current = null
        resolve({ success: false, error: '拉取超时 — 未收到手表响应' })
      }, PULL_TIMEOUT)

      pullResolverRef.current = (result: SyncResult) => {
        clearTimeout(timeout)
        setIsSyncing(false)
        setStatus(SYNC_STATUS.CONNECTED)
        resolve(result)
      }

      try {
        const msg = createMessage(MSG_TYPE.SYNC_PULL, null)
        await bridgeRef.current.send(msg)
      } catch (e) {
        clearTimeout(timeout)
        pullResolverRef.current = null
        setIsSyncing(false)
        setStatus(SYNC_STATUS.CONNECTED)
        resolve({ success: false, error: e instanceof Error ? e.message : String(e) })
      }
    })
  }, [status])

  // 双向同步：先推后拉
  const syncBidirectional = useCallback(async (): Promise<BidirectionalResult> => {
    try {
      const pushResult = await pushToWatch()
      if (!pushResult.success) {
        return { success: false, error: pushResult.error, push: pushResult }
      }
      const pullResult = await pullFromWatch()
      return { success: pullResult.success, push: pushResult, pull: pullResult }
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : String(e) }
    }
  }, [pushToWatch, pullFromWatch])

  // 断开连接
  const disconnect = useCallback(async () => {
    await bridgeRef.current.disconnect()
    setStatus(SYNC_STATUS.DISCONNECTED)
    setStatusDetail({})
  }, [])

  // 清理
  useEffect(() => {
    return () => {
      bridgeRef.current.disconnect()
    }
  }, [])

  return {
    status,
    statusDetail,
    lastSyncAt,
    isSyncing,
    isConnected: status === SYNC_STATUS.CONNECTED,
    isBridgeAvailable: bridgeRef.current.isAvailable,
    initConnection,
    pushToWatch,
    pullFromWatch,
    syncBidirectional,
    disconnect,
  }
}
