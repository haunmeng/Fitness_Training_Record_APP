import { useState } from 'react'
import { Edit3, Plus, Tag, Trash2, X } from 'lucide-react'
import { useExercises } from '../hooks/useExercises'
import { useCustomExerciseTags } from '../hooks/useCustomExerciseTags'
import ExerciseCard from '../components/ExerciseCard'
import Modal from '../components/Modal'
import type { CustomExerciseTag, Exercise } from '../types'
import { EXERCISE_TAGS, EXERCISE_TAG_ALL, EXERCISE_TAG_UNCATEGORIZED, normalizeExerciseTags } from '../types'

const TAG_COLORS = ['#4ade80', '#38bdf8', '#a78bfa', '#fb7185', '#f59e0b', '#2dd4bf']

interface TagPickerProps {
  tags: string[]
  selectedTags: string[]
  onToggle: (tag: string) => void
  onManageTags: () => void
  tagColors: Record<string, string>
}

function TagPicker({ tags, selectedTags, onToggle, onManageTags, tagColors }: TagPickerProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map(tag => {
        const selected = selectedTags.includes(tag)
        const color = tagColors[tag]
        return (
          <button
            key={tag}
            type="button"
            onClick={() => onToggle(tag)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all active:scale-95 ${
              selected ? 'text-black border-accent bg-accent' : 'bg-surface2 text-text3 border-border hover:border-accent/50'
            }`}
            style={selected && color ? { backgroundColor: color, borderColor: color } : undefined}
          >
            {tag}
          </button>
        )
      })}
      <button
        type="button"
        onClick={onManageTags}
        className="px-3 py-1.5 rounded-full text-xs font-medium border border-dashed border-accent/60 text-accent hover:bg-accent/10 transition-colors"
      >
        + 标签
      </button>
    </div>
  )
}

export default function ExercisesPage() {
  const { exercises, addExercise, updateExercise, deleteExercise } = useExercises()
  const { customTags, addCustomTag, updateCustomTag, deleteCustomTag } = useCustomExerciseTags()

  const [showAdd, setShowAdd] = useState(false)
  const [editExercise, setEditExercise] = useState<Exercise | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<Exercise[]>([])
  const [activeTag, setActiveTag] = useState(EXERCISE_TAG_ALL)
  const [isManaging, setIsManaging] = useState(false)
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<Set<number>>(new Set())

  const [showTagManager, setShowTagManager] = useState(false)
  const [editingTag, setEditingTag] = useState<CustomExerciseTag | null>(null)
  const [tagToDelete, setTagToDelete] = useState<CustomExerciseTag | null>(null)
  const [tagName, setTagName] = useState('')
  const [tagColor, setTagColor] = useState(TAG_COLORS[0])
  const [tagError, setTagError] = useState('')

  const [formName, setFormName] = useState('')
  const [formTags, setFormTags] = useState<string[]>([])
  const [maxWeight, setMaxWeight] = useState('')
  const [maxReps, setMaxReps] = useState('')
  const [maxSets, setMaxSets] = useState('')
  const [workingWeight, setWorkingWeight] = useState('')
  const [workingReps, setWorkingReps] = useState('')
  const [workingSets, setWorkingSets] = useState('')

  const exerciseTags = [...EXERCISE_TAGS, ...customTags.map(tag => tag.name)]
  const tagColors = Object.fromEntries(customTags.map(tag => [tag.name, tag.color]))
  const filteredExercises = activeTag === EXERCISE_TAG_ALL
    ? exercises
    : activeTag === EXERCISE_TAG_UNCATEGORIZED
      ? exercises.filter(exercise => !exercise.tags?.length)
      : exercises.filter(exercise => exercise.tags?.includes(activeTag))

  const toggleTag = (tag: string) => {
    setFormTags(previous => previous.includes(tag)
      ? previous.filter(item => item !== tag)
      : [...previous, tag])
  }

  const resetForm = () => {
    setFormName('')
    setFormTags([])
    setMaxWeight('')
    setMaxReps('')
    setMaxSets('')
    setWorkingWeight('')
    setWorkingReps('')
    setWorkingSets('')
  }

  const openAdd = () => {
    resetForm()
    setShowAdd(true)
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
    setShowAdd(false)
    resetForm()
  }

  const handleUpdate = async () => {
    if (!editExercise?.id || !formName.trim()) return
    await updateExercise(editExercise.id, {
      name: formName.trim(), tags: formTags,
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
    await Promise.all(deleteConfirm.flatMap(exercise => exercise.id ? [deleteExercise(exercise.id)] : []))
    setDeleteConfirm([])
    setSelectedExerciseIds(new Set())
    setIsManaging(false)
  }

  const toggleExerciseSelection = (id?: number) => {
    if (!id) return
    setSelectedExerciseIds(previous => {
      const next = new Set(previous)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const exitManageMode = () => {
    setIsManaging(false)
    setSelectedExerciseIds(new Set())
  }

  const openTagManager = () => {
    setEditingTag(null)
    setTagToDelete(null)
    setTagName('')
    setTagColor(TAG_COLORS[0])
    setTagError('')
    setShowTagManager(true)
  }

  const startTagEdit = (tag: CustomExerciseTag) => {
    setEditingTag(tag)
    setTagToDelete(null)
    setTagName(tag.name)
    setTagColor(tag.color)
    setTagError('')
  }

  const resetTagForm = () => {
    setEditingTag(null)
    setTagName('')
    setTagColor(TAG_COLORS[0])
    setTagError('')
  }

  const handleSaveTag = async () => {
    const normalizedName = tagName.trim()
    if (!normalizedName) return setTagError('请输入标签名称')
    if (normalizedName.length > 12) return setTagError('标签名称不能超过 12 个字')
    if ([EXERCISE_TAG_ALL, EXERCISE_TAG_UNCATEGORIZED, ...EXERCISE_TAGS].includes(normalizedName)) {
      return setTagError('该名称已被系统标签使用')
    }
    if (customTags.some(tag => tag.id !== editingTag?.id && tag.name === normalizedName)) {
      return setTagError('已有同名的自定义标签')
    }

    if (editingTag) {
      await updateCustomTag(editingTag, normalizedName, tagColor)
      setFormTags(previous => normalizeExerciseTags(previous.map(tag => tag === editingTag.name ? normalizedName : tag)))
      if (activeTag === editingTag.name) setActiveTag(normalizedName)
    } else {
      await addCustomTag(normalizedName, tagColor)
      setFormTags(previous => normalizeExerciseTags([...previous, normalizedName]))
    }
    resetTagForm()
  }

  const handleDeleteTag = async () => {
    if (!tagToDelete) return
    await deleteCustomTag(tagToDelete)
    setFormTags(previous => previous.filter(tag => tag !== tagToDelete.name))
    if (activeTag === tagToDelete.name) setActiveTag(EXERCISE_TAG_ALL)
    setTagToDelete(null)
    if (editingTag?.id === tagToDelete.id) resetTagForm()
  }

  const selectedExercises = exercises.filter(exercise => exercise.id && selectedExerciseIds.has(exercise.id))

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-text">训练项目</h1><p className="text-text3 text-sm mt-1">{exercises.length} 个项目</p></div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => isManaging ? exitManageMode() : setIsManaging(true)} className="text-sm font-medium text-text2 hover:text-accent transition-colors">{isManaging ? '完成' : '管理'}</button>
          <button type="button" onClick={openAdd} aria-label="新增训练项目" className="w-10 h-10 rounded-full bg-accent text-black flex items-center justify-center active:scale-95 transition-transform shadow-lg shadow-accent/20"><Plus size={22} /></button>
        </div>
      </div>

      <section className="mb-5" aria-label="筛选训练项目">
        <p className="text-xs text-text3 mb-2">筛选训练项目</p>
        <div className="flex flex-wrap gap-2">
          {[EXERCISE_TAG_ALL, EXERCISE_TAG_UNCATEGORIZED, ...exerciseTags].map(tag => (
            <button key={tag} type="button" onClick={() => setActiveTag(tag)} className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${activeTag === tag ? 'bg-accent text-black border-accent' : 'bg-surface2 text-text3 border-border hover:border-accent/50'}`} style={activeTag === tag && tagColors[tag] ? { backgroundColor: tagColors[tag], borderColor: tagColors[tag] } : undefined}>{tag}</button>
          ))}
          <button type="button" onClick={openTagManager} className="px-3 py-1.5 rounded-full text-xs font-medium border border-dashed border-accent/60 text-accent hover:bg-accent/10 transition-colors">+ 标签</button>
        </div>
      </section>

      {!isManaging && exercises.length > 0 && <p className="text-xs text-text3 mb-3">左滑项目可删除；点“管理”可批量删除</p>}

      {exercises.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-8 text-center"><p className="text-text3">还没有训练项目</p><p className="text-text3 text-xs mt-1">点击右上角 + 添加</p></div>
      ) : filteredExercises.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-8 text-center"><p className="text-text3">没有匹配的训练项目</p><button type="button" onClick={() => setActiveTag(EXERCISE_TAG_ALL)} className="text-accent text-sm mt-2">显示全部项目</button></div>
      ) : (
        <div className="space-y-2">
          {filteredExercises.map(exercise => <ExerciseCard key={exercise.id} exercise={exercise} onClick={() => isManaging ? toggleExerciseSelection(exercise.id) : openEdit(exercise)} onDelete={() => setDeleteConfirm([exercise])} selecting={isManaging} selected={exercise.id !== undefined && selectedExerciseIds.has(exercise.id)} tagColors={tagColors} />)}
        </div>
      )}

      {isManaging && <div className="sticky bottom-3 mt-4 rounded-xl bg-surface2 border border-border p-3 flex items-center justify-between gap-3 shadow-xl"><span className="text-sm text-text2">已选择 <strong className="text-text">{selectedExercises.length}</strong> 个项目</span><button type="button" disabled={selectedExercises.length === 0} onClick={() => setDeleteConfirm(selectedExercises)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-danger text-white text-sm font-medium disabled:opacity-30"><Trash2 size={16} />删除</button></div>}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="新增训练项目">
        <ExerciseForm formName={formName} formTags={formTags} exerciseTags={exerciseTags} tagColors={tagColors} setFormName={setFormName} toggleTag={toggleTag} onManageTags={openTagManager} onSubmit={handleAdd} submitLabel="添加" />
      </Modal>

      <Modal open={!!editExercise} onClose={() => setEditExercise(null)} title="编辑训练项目">
        <div className="space-y-4">
          <ExerciseForm formName={formName} formTags={formTags} exerciseTags={exerciseTags} tagColors={tagColors} setFormName={setFormName} toggleTag={toggleTag} onManageTags={openTagManager} onSubmit={handleUpdate} submitLabel="保存" hideSubmit />
          <RecordFields maxWeight={maxWeight} maxReps={maxReps} maxSets={maxSets} workingWeight={workingWeight} workingReps={workingReps} workingSets={workingSets} setMaxWeight={setMaxWeight} setMaxReps={setMaxReps} setMaxSets={setMaxSets} setWorkingWeight={setWorkingWeight} setWorkingReps={setWorkingReps} setWorkingSets={setWorkingSets} />
          <button type="button" onClick={handleUpdate} disabled={!formName.trim()} className="w-full bg-accent text-black font-semibold py-3 rounded-lg disabled:opacity-30">保存</button>
        </div>
      </Modal>

      <Modal open={showTagManager} onClose={() => setShowTagManager(false)} title="自定义标签">
        <div className="space-y-5">
          <div className="rounded-xl bg-surface2 border border-border p-4 space-y-3">
            <div className="flex items-center justify-between"><p className="text-sm font-medium text-text">{editingTag ? '编辑标签' : '新建标签'}</p>{editingTag && <button type="button" onClick={resetTagForm} className="text-xs text-text3">取消编辑</button>}</div>
            <input type="text" value={tagName} maxLength={12} onChange={event => { setTagName(event.target.value); setTagError('') }} placeholder="例如：居家、康复、器械" className="w-full bg-surface border border-border rounded-lg px-3 py-2.5 text-text text-sm placeholder-text3 focus:outline-none focus:border-accent" />
            <div className="flex items-center gap-2"><span className="text-xs text-text3 mr-1">颜色</span>{TAG_COLORS.map(color => <button key={color} type="button" onClick={() => setTagColor(color)} aria-label={`选择颜色 ${color}`} className={`w-7 h-7 rounded-full border-2 ${tagColor === color ? 'border-white scale-110' : 'border-transparent'}`} style={{ backgroundColor: color }} />)}</div>
            {tagError && <p className="text-danger text-xs">{tagError}</p>}
            <button type="button" onClick={handleSaveTag} className="w-full py-2.5 rounded-lg bg-accent text-black text-sm font-semibold">{editingTag ? '保存标签' : '添加标签'}</button>
          </div>

          {tagToDelete && <div className="rounded-xl border border-danger/50 bg-danger/10 p-3"><p className="text-sm text-text">删除「{tagToDelete.name}」？</p><p className="text-xs text-text3 mt-1">项目会保留，但会移除此标签。</p><div className="flex justify-end gap-3 mt-3 text-sm"><button type="button" onClick={() => setTagToDelete(null)} className="text-text2">取消</button><button type="button" onClick={handleDeleteTag} className="text-danger font-medium">确认删除</button></div></div>}

          <div>
            <p className="text-sm text-text2 mb-2">我的标签</p>
            {customTags.length === 0 ? <p className="text-sm text-text3 py-3">还没有自定义标签</p> : <div className="space-y-2">{customTags.map(tag => <div key={tag.id} className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2.5"><span className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.color }} /><span className="flex-1 text-sm text-text">{tag.name}</span><button type="button" onClick={() => startTagEdit(tag)} aria-label={`编辑${tag.name}`} className="p-1 text-text3 hover:text-accent"><Edit3 size={16} /></button><button type="button" onClick={() => setTagToDelete(tag)} aria-label={`删除${tag.name}`} className="p-1 text-text3 hover:text-danger"><X size={17} /></button></div>)}</div>}
          </div>
        </div>
      </Modal>

      <Modal open={deleteConfirm.length > 0} onClose={() => setDeleteConfirm([])} title="删除训练项目">
        <div className="space-y-4"><p className="text-text2 text-sm">{deleteConfirm.length > 1 ? `确定要删除选中的 ${deleteConfirm.length} 个训练项目吗？` : `确定要删除「${deleteConfirm[0]?.name}」吗？`}<br />相关训练记录也会被删除，此操作不可撤销。</p><div className="flex gap-3"><button type="button" onClick={() => setDeleteConfirm([])} className="flex-1 bg-surface2 text-text border border-border py-3 rounded-lg font-medium">取消</button><button type="button" onClick={handleDelete} className="flex-1 bg-danger text-white py-3 rounded-lg font-medium">删除</button></div></div>
      </Modal>
    </div>
  )
}

interface ExerciseFormProps {
  formName: string; formTags: string[]; exerciseTags: string[]; tagColors: Record<string, string>
  setFormName: (name: string) => void; toggleTag: (tag: string) => void; onManageTags: () => void; onSubmit: () => void
  submitLabel: string; hideSubmit?: boolean
}

function ExerciseForm({ formName, formTags, exerciseTags, tagColors, setFormName, toggleTag, onManageTags, onSubmit, submitLabel, hideSubmit }: ExerciseFormProps) {
  return <div className="space-y-4"><div><label className="block text-sm text-text2 mb-1">项目名称</label><input type="text" value={formName} onChange={event => setFormName(event.target.value)} placeholder="例如：卧推、深蹲、引体向上" className="w-full bg-surface2 border border-border rounded-lg px-4 py-3 text-text placeholder-text3 focus:outline-none focus:border-accent" autoFocus onKeyDown={event => event.key === 'Enter' && onSubmit()} /></div><div><div className="flex items-center justify-between mb-2"><label className="block text-sm text-text2">为项目添加标签（可选）</label><button type="button" onClick={onManageTags} className="inline-flex items-center gap-1 text-xs text-accent"><Tag size={13} />管理标签</button></div><TagPicker tags={exerciseTags} selectedTags={formTags} onToggle={toggleTag} onManageTags={onManageTags} tagColors={tagColors} /></div>{!hideSubmit && <button type="button" onClick={onSubmit} disabled={!formName.trim()} className="w-full bg-accent text-black font-semibold py-3 rounded-lg disabled:opacity-30">{submitLabel}</button>}</div>
}

interface RecordFieldsProps {
  maxWeight: string; maxReps: string; maxSets: string; workingWeight: string; workingReps: string; workingSets: string
  setMaxWeight: (value: string) => void; setMaxReps: (value: string) => void; setMaxSets: (value: string) => void
  setWorkingWeight: (value: string) => void; setWorkingReps: (value: string) => void; setWorkingSets: (value: string) => void
}

function RecordFields(props: RecordFieldsProps) {
  const fields = [
    { title: '最大重量记录', color: 'text-warn', values: [props.maxWeight, props.maxSets, props.maxReps], setters: [props.setMaxWeight, props.setMaxSets, props.setMaxReps] },
    { title: '适当训练重量', color: 'text-accent', values: [props.workingWeight, props.workingSets, props.workingReps], setters: [props.setWorkingWeight, props.setWorkingSets, props.setWorkingReps] },
  ]
  const labels = ['重量 (kg)', '组数', '次数']
  const placeholders = ['kg', '组', '次']
  return <>{fields.map(section => <div key={section.title}><label className={`block text-sm font-medium mb-2 ${section.color}`}>{section.title}</label><div className="grid grid-cols-3 gap-2">{section.values.map((value, index) => <div key={labels[index]}><label className="block text-xs text-text3 mb-1">{labels[index]}</label><input type="number" value={value} onChange={event => section.setters[index](event.target.value)} placeholder={placeholders[index]} className="w-full bg-surface2 border border-border rounded-lg px-3 py-2.5 text-text text-sm placeholder-text3 focus:outline-none focus:border-accent" /></div>)}</div></div>)}</>
}
