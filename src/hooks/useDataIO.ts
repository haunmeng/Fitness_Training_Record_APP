import { useCallback } from 'react'
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { db } from '../db/database'
import { normalizeExerciseTags } from '../types'

export interface ExportData {
  version: number
  exportedAt: string
  exercises: Array<{
    id?: number
    name: string
    maxWeight?: number
    maxReps?: number
    maxSets?: number
    workingWeight?: number
    workingReps?: number
    workingSets?: number
    tags: string[]
    createdAt: string
  }>
  workoutSessions: Array<{
    id?: number
    date: string
    completed: boolean
    note?: string
  }>
  workoutSets: Array<{
    id?: number
    sessionId: number
    exerciseId: number
    setNumber: number
    weight: number
    reps: number
    completed: boolean
  }>
}

export interface ImportResult {
  exercises: number
  sessions: number
  sets: number
}

const EXPORT_FILENAME = 'fitness_data.json'

export function useDataIO() {
  const exportData = useCallback(async (): Promise<ExportData> => {
    const exercises = await db.exercises.toArray()
    const workoutSessions = await db.workoutSessions.toArray()
    const workoutSets = await db.workoutSets.toArray()

    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      exercises: exercises.map(e => ({
        ...e,
        tags: normalizeExerciseTags(e.tags),
        createdAt: e.createdAt.toISOString(),
      })),
      workoutSessions: workoutSessions.map(s => ({
        ...s,
        date: s.date.toISOString(),
      })),
      workoutSets: workoutSets.map(s => ({ ...s })),
    }
  }, [])

  /**
   * 导出数据 — 使用 Capacitor 原生文件系统写入，再调起系统分享。
   * 同时复制一份到公共下载目录，方便手表端读取。
   */
  const downloadJSON = useCallback(async () => {
    const data = await exportData()
    const json = JSON.stringify(data, null, 2)

    // 1. 写入应用私有目录（始终可写）
    const writeResult = await Filesystem.writeFile({
      path: EXPORT_FILENAME,
      data: json,
      directory: Directory.Data,
      encoding: Encoding.UTF8,
    })

    // 2. 尝试写入公共 Downloads 目录，方便手表 App 通过手机伴侣读取
    try {
      await Filesystem.writeFile({
        path: `Download/${EXPORT_FILENAME}`,
        data: json,
        directory: Directory.External,
        encoding: Encoding.UTF8,
      })
    } catch {
      // 部分 Android 版本 External 不可写，忽略
      console.warn('无法写入公共下载目录，已保存到应用私有目录')
    }

    // 3. 调起系统分享面板
    try {
      await Share.share({
        title: '导出训练数据',
        text: '健身训练记录 JSON 数据',
        url: writeResult.uri,
        dialogTitle: '分享训练数据',
      })
    } catch {
      // 用户取消分享不算错误
      console.log('分享已取消')
    }

    return writeResult.uri
  }, [exportData])

  /**
   * 导入数据 — 支持 File 对象（浏览器端）和 JSON 字符串（手表端 / 直接传入）
   */
  const importData = useCallback(async (input: File | string): Promise<ImportResult> => {
    let text: string

    if (typeof input === 'string') {
      text = input
    } else {
      text = await input.text()
    }

    const data: ExportData = JSON.parse(text)

    // 基础校验
    if (!data.exercises || !data.workoutSessions || !data.workoutSets) {
      throw new Error('无效的数据文件格式：缺少必要字段')
    }

    // 清空现有数据
    await db.workoutSets.clear()
    await db.workoutSessions.clear()
    await db.exercises.clear()

    // 导入训练项目（保留原始 ID 映射，确保 workoutSets 引用正确）
    let exerciseCount = 0
    const exerciseIdMap: Record<number, number> = {}
    for (const e of data.exercises) {
      const { id, createdAt, ...rest } = e
      const newId = await db.exercises.add({
        ...rest,
        tags: normalizeExerciseTags(rest.tags),
        createdAt: new Date(createdAt),
      })
      if (id != null) exerciseIdMap[id] = newId
      exerciseCount++
    }

    // 导入训练记录（保留原始 ID 映射）
    let sessionCount = 0
    const sessionIdMap: Record<number, number> = {}
    for (const s of data.workoutSessions) {
      const { id, date, ...rest } = s
      const newId = await db.workoutSessions.add({
        ...rest,
        date: new Date(date),
      })
      if (id != null) sessionIdMap[id] = newId
      sessionCount++
    }

    // 导入组数记录（重新映射 sessionId 和 exerciseId）
    let setCount = 0
    for (const set of data.workoutSets) {
      const { id, sessionId, exerciseId, ...rest } = set
      await db.workoutSets.add({
        ...rest,
        sessionId: sessionIdMap[sessionId] ?? sessionId,
        exerciseId: exerciseIdMap[exerciseId] ?? exerciseId,
      })
      setCount++
    }

    return { exercises: exerciseCount, sessions: sessionCount, sets: setCount }
  }, [])

  return { exportData, downloadJSON, importData }
}
