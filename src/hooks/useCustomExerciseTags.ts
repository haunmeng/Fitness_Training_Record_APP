import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/database'
import { normalizeExerciseTags, type CustomExerciseTag } from '../types'

export function useCustomExerciseTags() {
  const customTags = useLiveQuery(() =>
    db.customExerciseTags.orderBy('createdAt').toArray()
  ) ?? []

  const addCustomTag = async (name: string, color: string) => {
    return db.customExerciseTags.add({ name: name.trim(), color, createdAt: new Date() })
  }

  const updateCustomTag = async (tag: CustomExerciseTag, name: string, color: string) => {
    if (!tag.id) return
    const nextName = name.trim()

    await db.transaction('rw', db.customExerciseTags, db.exercises, async () => {
      await db.customExerciseTags.update(tag.id!, { name: nextName, color })
      if (nextName === tag.name) return

      const affectedExercises = await db.exercises
        .filter(exercise => exercise.tags?.includes(tag.name) ?? false)
        .toArray()
      await Promise.all(affectedExercises.map(exercise =>
        db.exercises.update(exercise.id!, {
          tags: normalizeExerciseTags(exercise.tags?.map(item => item === tag.name ? nextName : item)),
        })
      ))
    })
  }

  const deleteCustomTag = async (tag: CustomExerciseTag) => {
    if (!tag.id) return

    await db.transaction('rw', db.customExerciseTags, db.exercises, async () => {
      const affectedExercises = await db.exercises
        .filter(exercise => exercise.tags?.includes(tag.name) ?? false)
        .toArray()
      await Promise.all(affectedExercises.map(exercise =>
        db.exercises.update(exercise.id!, {
          tags: exercise.tags?.filter(item => item !== tag.name),
        })
      ))
      await db.customExerciseTags.delete(tag.id!)
    })
  }

  return { customTags, addCustomTag, updateCustomTag, deleteCustomTag }
}
