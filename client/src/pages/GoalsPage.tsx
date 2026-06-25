import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, CheckCircle, Trash2, Check } from 'lucide-react'
import UserMenu from '../components/layout/UserMenu'
import { goalsService } from '../services/goals.service'
import { tasksService } from '../services/tasks.service'
import type { Goal } from '../types'

type TabFilter = 'all' | 'on-track' | 'at-risk' | 'completed'

const STATUS_STYLES: Record<string, string> = {
  'on-track': 'bg-teal-50 text-teal-700',
  'at-risk': 'bg-amber-50 text-amber-700',
  'overdue': 'bg-red-50 text-red-600',
  'completed': 'bg-slate-100 text-slate-500',
}

const STATUS_LABELS: Record<string, string> = {
  'on-track': 'ON TRACK',
  'at-risk': 'AT RISK',
  'overdue': 'OVERDUE',
  'completed': 'COMPLETED',
}

const PROGRESS_COLOR: Record<string, string> = {
  'on-track': 'bg-teal-600',
  'at-risk': 'bg-amber-400',
  'overdue': 'bg-red-400',
  'completed': 'bg-slate-300',
}

function computeGoalStatus(goal: Goal): 'on-track' | 'at-risk' | 'overdue' | 'completed' {
  if (goal.status === 'completed') return 'completed'
  const daysLeft = Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / 86400000)
  if (daysLeft < 0) return 'overdue'
  if (daysLeft <= 7 && goal.progress < 80) return 'at-risk'
  if (daysLeft <= 14 && goal.progress < 50) return 'at-risk'
  return 'on-track'
}

function formatDeadline(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function daysLeftText(deadline: string): string {
  const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000)
  if (days < 0) return `${Math.abs(days)} days overdue`
  if (days === 0) return 'due today'
  return `${days} days left`
}

const TABS: { key: TabFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'on-track', label: 'On Track' },
  { key: 'at-risk', label: 'At Risk' },
  { key: 'completed', label: 'Completed' },
]

function GoalsPage() {
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<TabFilter>('all')
  const [showModal, setShowModal] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [addingTaskGoalId, setAddingTaskGoalId] = useState<string | null>(null)
  const [newTaskTitle, setNewTaskTitle] = useState('')

  // Create form
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [deadline, setDeadline] = useState('')
  const [taskDraft, setTaskDraft] = useState('')
  const [taskInputs, setTaskInputs] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  // Edit form
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editDeadline, setEditDeadline] = useState('')
  const [editSubmitting, setEditSubmitting] = useState(false)

  const { data } = useQuery({
    queryKey: ['goals'],
    queryFn: () => goalsService.getGoals(),
  })

  const toggleTask = useMutation({
    mutationFn: ({ id, done }: { id: string; done: boolean }) =>
      tasksService.updateTask(id, { done }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })

  const deleteGoal = useMutation({
    mutationFn: (id: string) => goalsService.deleteGoal(id),
    onSuccess: () => {
      setConfirmDeleteId(null)
      queryClient.invalidateQueries({ queryKey: ['goals'] })
    },
  })

  const markComplete = useMutation({
    mutationFn: (id: string) => goalsService.updateGoal(id, { status: 'completed' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] })
    },
  })

  const updateGoal = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { title: string; description?: string; deadline: string } }) =>
      goalsService.updateGoal(id, data),
    onSuccess: () => {
      setEditingGoal(null)
      queryClient.invalidateQueries({ queryKey: ['goals'] })
    },
  })

  function openEdit(goal: Goal) {
    setEditingGoal(goal)
    setEditTitle(goal.title)
    setEditDescription(goal.description ?? '')
    setEditDeadline(goal.deadline.split('T')[0])
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!editingGoal || !editTitle.trim() || !editDeadline) return
    setEditSubmitting(true)
    try {
      await updateGoal.mutateAsync({
        id: editingGoal._id,
        data: {
          title: editTitle.trim(),
          description: editDescription.trim() || undefined,
          deadline: editDeadline,
        },
      })
    } finally {
      setEditSubmitting(false)
    }
  }

  const addTask = useMutation({
    mutationFn: ({ title, goalId }: { title: string; goalId: string }) =>
      tasksService.createTask({ title, goalId }),
    onSuccess: () => {
      setAddingTaskGoalId(null)
      setNewTaskTitle('')
      queryClient.invalidateQueries({ queryKey: ['goals'] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })

  function submitNewTask(goalId: string) {
    const trimmed = newTaskTitle.trim()
    if (!trimmed) return
    addTask.mutate({ title: trimmed, goalId })
  }

  const goals = data?.goals ?? []
  const activeCount = goals.filter((g) => g.status !== 'completed').length
  const completedCount = goals.filter((g) => g.status === 'completed').length

  const filtered = goals.filter((goal) => {
    if (tab === 'all') return true
    const s = computeGoalStatus(goal)
    if (tab === 'completed') return s === 'completed'
    if (tab === 'on-track') return s === 'on-track'
    if (tab === 'at-risk') return s === 'at-risk' || s === 'overdue'
    return true
  })

  function addTaskToList() {
    const trimmed = taskDraft.trim()
    if (!trimmed) return
    setTaskInputs((prev) => [...prev, trimmed])
    setTaskDraft('')
  }

  function removeTask(i: number) {
    setTaskInputs((prev) => prev.filter((_, idx) => idx !== i))
  }

  function resetModal() {
    setTitle('')
    setDescription('')
    setDeadline('')
    setTaskDraft('')
    setTaskInputs([])
    setSubmitting(false)
    setShowModal(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !deadline) return
    setSubmitting(true)

    try {
      const { goal } = await goalsService.createGoal({
        title: title.trim(),
        description: description.trim() || undefined,
        deadline,
      })

      if (taskInputs.length > 0) {
        await Promise.all(
          taskInputs.map((t) => tasksService.createTask({ title: t, goalId: goal._id }))
        )
      }

      queryClient.invalidateQueries({ queryKey: ['goals'] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      resetModal()
    } catch {
      setSubmitting(false)
    }
  }

  return (
    <div className='p-8'>

      {/* Header */}
      <div className='flex items-center justify-between mb-6'>
        <div>
          <h1 className='text-2xl font-semibold text-slate-900'>Goals</h1>
          <p className='text-sm text-slate-500 mt-1'>
            {activeCount} active{completedCount > 0 ? ` · ${completedCount} completed` : ''}
          </p>
        </div>
        <div className='flex items-center gap-4'>
          <button
            onClick={() => setShowModal(true)}
            className='bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg cursor-pointer transition-colors'
          >
            + New Goal
          </button>
          <UserMenu />
        </div>
      </div>
      <div className='border-b border-slate-100 mb-6' />

      {/* Tabs */}
      <div className='flex gap-6 border-b border-slate-200 mb-6'>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`pb-3 text-sm font-medium cursor-pointer transition-colors border-b-2 -mb-px ${
              tab === t.key
                ? 'text-teal-600 border-teal-600'
                : 'text-slate-500 hover:text-slate-700 border-transparent'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Goal list */}
      {filtered.length === 0 ? (
        <div className='border border-dashed border-slate-200 rounded-xl p-12 text-center'>
          <p className='text-sm text-slate-400'>
            {tab === 'all' ? 'No goals yet. Add one to get started.' : 'No goals in this category.'}
          </p>
        </div>
      ) : (
        <div className='space-y-4'>
          {filtered.map((goal) => {
            const status = computeGoalStatus(goal)
            return (
              <div key={goal._id} className='border border-slate-200 rounded-xl p-5'>

                {/* Title + actions */}
                <div className='flex items-start justify-between gap-4'>
                  <div className='flex-1 min-w-0'>
                    <p className='text-base font-semibold text-slate-900'>{goal.title}</p>
                    {goal.description && (
                      <p className='text-sm text-slate-500 mt-0.5'>{goal.description}</p>
                    )}
                    <p className='text-xs text-teal-600 mt-0.5'>
                      Due {formatDeadline(goal.deadline)} · {daysLeftText(goal.deadline)}
                    </p>
                  </div>
                  <div className='flex items-center gap-1.5 flex-shrink-0'>
                    {tab === 'all' && (
                      <span className={`text-[10px] font-semibold px-2 py-1 rounded-md mr-1 ${STATUS_STYLES[status]}`}>
                        {STATUS_LABELS[status]}
                      </span>
                    )}

                    {/* Edit */}
                    <button
                      onClick={() => openEdit(goal)}
                      title='Edit goal'
                      className='w-8 h-8 flex items-center justify-center text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-md cursor-pointer transition-colors'
                    >
                      <Pencil size={15} />
                    </button>

                    {/* Mark complete */}
                    {goal.status !== 'completed' && (() => {
                      const pendingCount = goal.tasks.filter((t) => !t.done).length
                      const blocked = pendingCount > 0
                      return (
                        <button
                          onClick={() => !blocked && markComplete.mutate(goal._id)}
                          disabled={blocked}
                          title={blocked ? `${pendingCount} task${pendingCount > 1 ? 's' : ''} still pending` : 'Mark as complete'}
                          className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors ${
                            blocked
                              ? 'text-slate-200 cursor-not-allowed'
                              : 'text-slate-400 hover:text-teal-600 hover:bg-teal-50 cursor-pointer'
                          }`}
                        >
                          <CheckCircle size={15} />
                        </button>
                      )
                    })()}

                    {/* Delete */}
                    {(() => {
                      const pendingCount = goal.tasks.filter((t) => !t.done).length
                      const blocked = pendingCount > 0
                      return (
                        <button
                          onClick={() => !blocked && setConfirmDeleteId(goal._id)}
                          disabled={blocked}
                          title={blocked ? `${pendingCount} task${pendingCount > 1 ? 's' : ''} still pending` : 'Delete goal'}
                          className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors ${
                            blocked
                              ? 'text-red-200 cursor-not-allowed'
                              : 'text-red-400 hover:text-red-600 hover:bg-red-50 cursor-pointer'
                          }`}
                        >
                          <Trash2 size={15} />
                        </button>
                      )
                    })()}
                  </div>
                </div>

                {/* Delete confirmation */}
                {confirmDeleteId === goal._id && (
                  <div className='mt-3 flex items-center justify-between bg-red-50 border border-red-100 rounded-lg px-4 py-2.5'>
                    <span className='text-sm text-red-700'>Delete this goal?</span>
                    <div className='flex gap-2'>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className='text-xs font-medium text-slate-600 hover:text-slate-800 cursor-pointer px-2 py-1'
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => deleteGoal.mutate(goal._id)}
                        className='text-xs font-medium text-white bg-red-500 hover:bg-red-600 cursor-pointer px-3 py-1 rounded-md transition-colors'
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}

                {/* Progress bar */}
                <div className='mt-4'>
                  <div className='flex items-center justify-between mb-1.5'>
                    <span className='text-xs text-slate-400'>Progress</span>
                    <span className='text-xs font-medium text-slate-600'>{goal.progress}%</span>
                  </div>
                  <div className='h-1.5 bg-slate-100 rounded-full overflow-hidden'>
                    <div
                      className={`h-full rounded-full transition-all ${PROGRESS_COLOR[status]}`}
                      style={{ width: `${goal.progress}%` }}
                    />
                  </div>
                </div>

                {/* Tasks */}
                {goal.tasks.length > 0 ? (
                  <div className='mt-4 space-y-2'>
                    {goal.tasks.map((task) => (
                      <button
                        key={task._id}
                        onClick={() => toggleTask.mutate({ id: task._id, done: !task.done })}
                        className='flex items-center gap-3 w-full text-left group cursor-pointer'
                      >
                        <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                          task.done
                            ? 'bg-teal-600 border-teal-600'
                            : 'border-slate-300 group-hover:border-teal-400'
                        }`}>
                          {task.done && <Check size={10} className='text-white' strokeWidth={3} />}
                        </div>
                        <span className={`text-sm transition-colors ${task.done ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                          {task.title}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  addingTaskGoalId !== goal._id && (
                    <p className='mt-4 text-xs text-slate-400'>No tasks yet.</p>
                  )
                )}

                {/* Add task inline */}
                {goal.status !== 'completed' && addingTaskGoalId === goal._id ? (
                  <div className='mt-3 flex gap-2'>
                    <input
                      type='text'
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') submitNewTask(goal._id)
                        if (e.key === 'Escape') { setAddingTaskGoalId(null); setNewTaskTitle('') }
                      }}
                      placeholder='Task title...'
                      autoFocus
                      className='flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent'
                    />
                    <button
                      onClick={() => submitNewTask(goal._id)}
                      disabled={!newTaskTitle.trim()}
                      className='px-3 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-40 rounded-lg cursor-pointer transition-colors'
                    >
                      Add
                    </button>
                    <button
                      onClick={() => { setAddingTaskGoalId(null); setNewTaskTitle('') }}
                      className='px-3 py-2 text-sm text-slate-500 hover:text-slate-700 cursor-pointer'
                    >
                      Cancel
                    </button>
                  </div>
                ) : goal.status !== 'completed' ? (
                  <button
                    onClick={() => { setAddingTaskGoalId(goal._id); setNewTaskTitle('') }}
                    className='mt-3 text-xs text-teal-600 hover:text-teal-700 font-medium cursor-pointer'
                  >
                    + Add task
                  </button>
                ) : null}

              </div>
            )
          })}
        </div>
      )}

      {/* New Goal Modal */}
      {showModal && (
        <div
          className='fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4'
          onClick={(e) => e.target === e.currentTarget && resetModal()}
        >
          <div className='bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto'>
            <div className='p-6'>
              <h2 className='text-lg font-semibold text-slate-900 mb-5'>New Goal</h2>

              <form onSubmit={handleSubmit} className='space-y-4'>
                <div>
                  <label className='block text-xs font-medium text-slate-600 mb-1.5'>Title</label>
                  <input
                    type='text'
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder='e.g. Learn backend development'
                    className='w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent'
                    required
                    autoFocus
                  />
                </div>

                <div>
                  <label className='block text-xs font-medium text-slate-600 mb-1.5'>
                    Description <span className='text-slate-400 font-normal'>(optional)</span>
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder='What does achieving this goal mean to you?'
                    rows={2}
                    className='w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none'
                  />
                </div>

                <div>
                  <label className='block text-xs font-medium text-slate-600 mb-1.5'>Deadline</label>
                  <input
                    type='date'
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className='w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent'
                    required
                  />
                </div>

                <div>
                  <label className='block text-xs font-medium text-slate-600 mb-1.5'>
                    Tasks <span className='text-slate-400 font-normal'>(optional)</span>
                  </label>
                  <div className='flex gap-2'>
                    <input
                      type='text'
                      value={taskDraft}
                      onChange={(e) => setTaskDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addTaskToList()
                        }
                      }}
                      placeholder='Add a task and press Enter'
                      className='flex-1 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent'
                    />
                    <button
                      type='button'
                      onClick={addTaskToList}
                      className='px-3 py-2.5 text-sm font-medium text-teal-600 border border-teal-200 rounded-lg hover:bg-teal-50 cursor-pointer transition-colors'
                    >
                      Add
                    </button>
                  </div>

                  {taskInputs.length > 0 && (
                    <ul className='mt-2 space-y-1'>
                      {taskInputs.map((t, i) => (
                        <li key={i} className='flex items-center justify-between gap-2 bg-slate-50 rounded-lg px-3 py-2'>
                          <span className='flex items-center gap-2 text-sm text-slate-700'>
                            <span className='w-1.5 h-1.5 rounded-full bg-teal-500 flex-shrink-0' />
                            {t}
                          </span>
                          <button
                            type='button'
                            onClick={() => removeTask(i)}
                            className='text-slate-400 hover:text-red-400 cursor-pointer transition-colors text-xl leading-none'
                          >
                            ×
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className='flex gap-3 pt-2'>
                  <button
                    type='button'
                    onClick={resetModal}
                    className='flex-1 border border-slate-200 text-slate-600 text-sm font-medium py-2.5 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors'
                  >
                    Cancel
                  </button>
                  <button
                    type='submit'
                    disabled={submitting}
                    className='flex-1 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg cursor-pointer transition-colors'
                  >
                    {submitting ? 'Creating...' : 'Create Goal'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Goal Modal */}
      {editingGoal && (
        <div
          className='fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4'
          onClick={(e) => e.target === e.currentTarget && setEditingGoal(null)}
        >
          <div className='bg-white rounded-2xl shadow-xl w-full max-w-md'>
            <div className='p-6'>
              <h2 className='text-lg font-semibold text-slate-900 mb-5'>Edit Goal</h2>

              <form onSubmit={handleEditSubmit} className='space-y-4'>
                <div>
                  <label className='block text-xs font-medium text-slate-600 mb-1.5'>Title</label>
                  <input
                    type='text'
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className='w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent'
                    required
                    autoFocus
                  />
                </div>

                <div>
                  <label className='block text-xs font-medium text-slate-600 mb-1.5'>
                    Description <span className='text-slate-400 font-normal'>(optional)</span>
                  </label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={2}
                    className='w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none'
                  />
                </div>

                <div>
                  <label className='block text-xs font-medium text-slate-600 mb-1.5'>Deadline</label>
                  <input
                    type='date'
                    value={editDeadline}
                    onChange={(e) => setEditDeadline(e.target.value)}
                    className='w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent'
                    required
                  />
                </div>

                <div className='flex gap-3 pt-2'>
                  <button
                    type='button'
                    onClick={() => setEditingGoal(null)}
                    className='flex-1 border border-slate-200 text-slate-600 text-sm font-medium py-2.5 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors'
                  >
                    Cancel
                  </button>
                  <button
                    type='submit'
                    disabled={editSubmitting}
                    className='flex-1 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg cursor-pointer transition-colors'
                  >
                    {editSubmitting ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default GoalsPage
