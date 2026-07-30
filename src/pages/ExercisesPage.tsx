import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useExercises } from '../hooks/useExercises'
import ExerciseCard from '../components/ExerciseCard'
import Modal from '../components/Modal'
import type { Exercise } from '../types'
import { EXERCISE_TAGS } from '../types'

export default function ExercisesPage() {
  const { exercises, addExercise, updateExercise, deleteExercise } = useExercises()

  // Modal states
  const [showAdd, setShowAdd] = useState(false)
  const [editExercise, setEditExercise] = useState<Exercise | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<Exercise | null>(null)
  const [activeTag, setActiveTag] = useState('全部')

  // Form state
  const [formName, setFormName] = useState('')
  const [formTags, setFormTags] = useState<string[]>([])
  const [maxWeight, setMaxWeight] = useState('')
  const [maxReps, setMaxReps] = useState('')
  const [maxSets, setMaxSets] = useState('')
  const [workingWeight, setWorkingWeight] = useState('')
  const [workingReps, setWorkingReps] = useState('')
  const [workingSets, setWorkingSets] = useState('')

  const filteredExercises = activeTag === '全部'
    ? exercises
    : exercises.filter(exercise => exercise.tags?.includes(activeTag))

  const toggleTag = (tag: string) => {
    setFormTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const openEdit = (exercise: Exercise) => {
    setEditExercise(exercise)
    setFormName(exercise.name)
    setFormTags(exercise.tags ?? [])
    setMaxWeight(exercise.maxWeight?.toString() ?? '')
    setMaxReps(exercise.maxReps?.toString() ?? '')
    setMaxSets(exercise.maxSets?.toString() ?? '')
    setWorkingWeight(exercise.workingWeight?.toString() ?? '')
    setWorkingReps(exercise.workingReps?.toString() ?? '')
    setWorkingSets(exercise.workingSets?.toString() ?? '')
  }

  const handleAdd = async () => {
    if (!formName.trim()) return
    await addExercise(formName.trim(), { tags: formTags })
    setFormName('')
    setFormTags([])
    setShowAdd(false)
  }

  const handleUpdate = async () => {
    if (!editExercise?.id || !formName.trim()) return
    await updateExercise(editExercise.id, {
      name: formName.trim(),
      tags: formTags,
      maxWeight: maxWeight ? Number(maxWeight) : undefined,
      maxReps: maxReps ? Number(maxReps) : undefined,
      maxSets: maxSets ? Number(maxSets) : undefined,
      workingWeight: workingWeight ? Number(workingWeight) : undefined,
      workingReps: workingReps ? Number(workingReps) : undefined,
      workingSets: workingSets ? Number(workingSets) : undefined,
    })
    setEditExercise(null)
  }

  const handleDelete = async () => {
    if (!deleteConfirm?.id) return
    await deleteExercise(deleteConfirm.id)
    setDeleteConfirm(null)
  }

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text">训练项目</h1>
          <p className="text-text3 text-sm mt-1">{exercises.length} 个项目</p>
        </div>
        <button
          onClick={() => { setFormName(''); setFormTags([]); setShowAdd(true) }}
          className="w-10 h-10 rounded-full bg-accent text-black flex items-center justify-center active:scale-95 transition-transform shadow-lg shadow-accent/20"
        >
          <Plus size={22} />
        </button>
      </div>

      {/* Tag filter */}
      <div className="flex flex-wrap gap-2 mb-5">
        {['全部', ...EXERCISE_TAGS].map(tag => (
          <button
            key={tag}
            type="button"
            onClick={() => setActiveTag(tag)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              activeTag === tag
                ? 'bg-accent text-black border-accent'
                : 'bg-surface2 text-text3 border-border hover:border-accent/50'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Exercise List */}
      {exercises.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-8 text-center">
          <p className="text-text3">还没有训练项目</p>
          <p className="text-text3 text-xs mt-1">点击右上角 + 添加</p>
        </div>
      ) : filteredExercises.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-8 text-center">
          <p className="text-text3">没有匹配的训练项目</p>
          <button
            type="button"
            onClick={() => setActiveTag('全部')}
            className="text-accent text-sm mt-2"
          >
            显示全部项目
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredExercises.map((exercise) => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              onClick={() => openEdit(exercise)}
              onLongPress={() => setDeleteConfirm(exercise)}
            />
          ))}
        </div>
      )}

      {/* Add Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="新增训练项目">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-text2 mb-1">项目名称</label>
            <input
              type="text"
              value={formName}
              onChange={e => setFormName(e.target.value)}
              placeholder="例如：卧推、深蹲、引体向上"
              className="w-full bg-surface2 border border-border rounded-lg px-4 py-3 text-text placeholder-text3 focus:outline-none focus:border-accent transition-colors"
              autoFocus
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
            />
          </div>
          <div>
            <label className="block text-sm text-text2 mb-2">训练部位 / 标签</label>
            <div className="flex flex-wrap gap-2">
              {EXERCISE_TAGS.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all active:scale-95 ${
                    formTags.includes(tag)
                      ? 'bg-accent text-black border-accent'
                      : 'bg-surface2 text-text3 border-border hover:border-accent/50'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={handleAdd}
            disabled={!formName.trim()}
            className="w-full bg-accent text-black font-semibold py-3 rounded-lg disabled:opacity-30 transition-opacity"
          >
            添加
          </button>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editExercise} onClose={() => setEditExercise(null)} title="编辑训练项目">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-text2 mb-1">项目名称</label>
            <input
              type="text"
              value={formName}
              onChange={e => setFormName(e.target.value)}
              className="w-full bg-surface2 border border-border rounded-lg px-4 py-3 text-text placeholder-text3 focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm text-text2 mb-2">训练部位 / 标签</label>
            <div className="flex flex-wrap gap-2">
              {EXERCISE_TAGS.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all active:scale-95 ${
                    formTags.includes(tag)
                      ? 'bg-accent text-black border-accent'
                      : 'bg-surface2 text-text3 border-border hover:border-accent/50'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Max Weight Record */}
          <div>
            <label className="block text-sm font-medium text-warn mb-2">最大重量记录</label>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs text-text3 mb-1">重量 (kg)</label>
                <input
                  type="number"
                  value={maxWeight}
                  onChange={e => setMaxWeight(e.target.value)}
                  placeholder="kg"
                  className="w-full bg-surface2 border border-border rounded-lg px-3 py-2.5 text-text text-sm placeholder-text3 focus:outline-none focus:border-accent transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs text-text3 mb-1">组数</label>
                <input
                  type="number"
                  value={maxSets}
                  onChange={e => setMaxSets(e.target.value)}
                  placeholder="组"
                  className="w-full bg-surface2 border border-border rounded-lg px-3 py-2.5 text-text text-sm placeholder-text3 focus:outline-none focus:border-accent transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs text-text3 mb-1">次数</label>
                <input
                  type="number"
                  value={maxReps}
                  onChange={e => setMaxReps(e.target.value)}
                  placeholder="次"
                  className="w-full bg-surface2 border border-border rounded-lg px-3 py-2.5 text-text text-sm placeholder-text3 focus:outline-none focus:border-accent transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Working Weight */}
          <div>
            <label className="block text-sm font-medium text-accent mb-2">适当训练重量</label>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs text-text3 mb-1">重量 (kg)</label>
                <input
                  type="number"
                  value={workingWeight}
                  onChange={e => setWorkingWeight(e.target.value)}
                  placeholder="kg"
                  className="w-full bg-surface2 border border-border rounded-lg px-3 py-2.5 text-text text-sm placeholder-text3 focus:outline-none focus:border-accent transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs text-text3 mb-1">组数</label>
                <input
                  type="number"
                  value={workingSets}
                  onChange={e => setWorkingSets(e.target.value)}
                  placeholder="组"
                  className="w-full bg-surface2 border border-border rounded-lg px-3 py-2.5 text-text text-sm placeholder-text3 focus:outline-none focus:border-accent transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs text-text3 mb-1">次数</label>
                <input
                  type="number"
                  value={workingReps}
                  onChange={e => setWorkingReps(e.target.value)}
                  placeholder="次"
                  className="w-full bg-surface2 border border-border rounded-lg px-3 py-2.5 text-text text-sm placeholder-text3 focus:outline-none focus:border-accent transition-colors"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleUpdate}
            disabled={!formName.trim()}
            className="w-full bg-accent text-black font-semibold py-3 rounded-lg disabled:opacity-30 transition-opacity"
          >
            保存
          </button>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="删除训练项目">
        <div className="space-y-4">
          <p className="text-text2 text-sm">
            确定要删除「{deleteConfirm?.name}」吗？相关的训练记录也会被删除。此操作不可撤销。
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setDeleteConfirm(null)}
              className="flex-1 bg-surface2 text-text border border-border py-3 rounded-lg font-medium"
            >
              取消
            </button>
            <button
              onClick={handleDelete}
              className="flex-1 bg-danger text-white py-3 rounded-lg font-medium"
            >
              删除
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
