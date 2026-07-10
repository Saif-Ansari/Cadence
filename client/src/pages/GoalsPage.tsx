import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, CheckCircle, Trash2, Check } from 'lucide-react'
import DeletePopover from '../components/ui/DeletePopover'
import QueryState from '../components/ui/QueryState'
import Skeleton from '../components/ui/Skeleton'
import Modal, { ModalTitle } from '../components/ui/Modal'
import UserMenu from '../components/layout/UserMenu'
import { goalsService } from '../services/goals.service'
import { stepsService } from '../services/steps.service'
import type { Goal } from '../types'
import { computeGoalStatus, STATUS_STYLES, STATUS_LABELS, PROGRESS_COLOR } from '../lib/goalStatus'

type TabFilter = 'all' | 'on-track' | 'at-risk' | 'completed'

function formatDeadline(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function daysLeftText(deadline: string): string {
  const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000)
  if (days < 0) return `${Math.abs(days)} days overdue`
  if (days === 0) return 'due today'
  return `${days} days left`
}

function GoalCardSkeleton() {
  return (
    <div className='space-y-4'>
      {[0, 1, 2].map((i) => (
        <div key={i} className='border border-slate-200 dark:border-slate-700 rounded-xl p-5'>
          <div className='flex items-start justify-between gap-4'>
            <div className='flex-1 space-y-2'>
              <Skeleton className='h-4 w-48' />
              <Skeleton className='h-3 w-32' />
            </div>
            <Skeleton className='h-6 w-16 rounded-md' />
          </div>
          <div className='mt-4 space-y-1.5'>
            <Skeleton className='h-3 w-full' />
            <Skeleton className='h-1.5 w-full rounded-full' />
          </div>
        </div>
      ))}
    </div>
  )
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
  const [confirmDeleteStepId, setConfirmDeleteStepId] = useState<string | null>(null)
  const [addingStepGoalId, setAddingStepGoalId] = useState<string | null>(null)
  const [newStepTitle, setNewStepTitle] = useState('')
  const [newStepDescription, setNewStepDescription] = useState('')

  function openAddStep(goalId: string) {
    setAddingStepGoalId(goalId)
    setNewStepTitle('')
    setNewStepDescription('')
  }

  function closeAddStep() {
    setAddingStepGoalId(null)
    setNewStepTitle('')
    setNewStepDescription('')
  }

  // Create form
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [deadline, setDeadline] = useState('')
  const [stepDraft, setStepDraft] = useState('')
  const [stepDraftDescription, setStepDraftDescription] = useState('')
  const [stepInputs, setStepInputs] = useState<{ title: string; description: string }[]>([])
  const [submitting, setSubmitting] = useState(false)

  // Edit form
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editDeadline, setEditDeadline] = useState('')
  const [editSubmitting, setEditSubmitting] = useState(false)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['goals'],
    queryFn: () => goalsService.getGoals(),
  })

  const toggleStep = useMutation({
    mutationFn: ({ id, done }: { id: string; done: boolean }) =>
      stepsService.updateStep(id, { done }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goals'] }),
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goals'] }),
  })

  const updateGoal = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { title: string; description?: string; deadline: string } }) =>
      goalsService.updateGoal(id, data),
    onSuccess: () => {
      setEditingGoal(null)
      queryClient.invalidateQueries({ queryKey: ['goals'] })
    },
  })

  const deleteStep = useMutation({
    mutationFn: (id: string) => stepsService.deleteStep(id),
    onSuccess: () => {
      setConfirmDeleteStepId(null)
      queryClient.invalidateQueries({ queryKey: ['goals'] })
    },
  })

  const addStep = useMutation({
    mutationFn: ({ title, description, goalId }: { title: string; description?: string; goalId: string }) =>
      stepsService.createStep({ title, description, goalId }),
    onSuccess: () => {
      setAddingStepGoalId(null)
      setNewStepTitle('')
      setNewStepDescription('')
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

  function submitNewStep(goalId: string) {
    const trimmed = newStepTitle.trim()
    if (!trimmed) return
    addStep.mutate({ title: trimmed, description: newStepDescription.trim() || undefined, goalId })
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

  function addStepToList() {
    const trimmed = stepDraft.trim()
    if (!trimmed) return
    setStepInputs((prev) => [...prev, { title: trimmed, description: stepDraftDescription.trim() }])
    setStepDraft('')
    setStepDraftDescription('')
  }

  function removeStepFromList(i: number) {
    setStepInputs((prev) => prev.filter((_, idx) => idx !== i))
  }

  function resetModal() {
    setTitle('')
    setDescription('')
    setDeadline('')
    setStepDraft('')
    setStepDraftDescription('')
    setStepInputs([])
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
      // Steps are best-effort — goal is already saved, so always close and refresh
      if (stepInputs.length > 0) {
        await Promise.allSettled(
          stepInputs.map((s) => stepsService.createStep({ title: s.title, description: s.description || undefined, goalId: goal._id }))
        )
      }
      queryClient.invalidateQueries({ queryKey: ['goals'] })
      resetModal()
    } catch {
      // createGoal itself failed — goal not created, just re-enable submit
      setSubmitting(false)
    }
  }

  return (
    <div className='p-4 lg:p-8'>

      {/* Header */}
      <div className='flex items-center justify-between mb-6'>
        <div>
          <h1 className='text-2xl font-semibold text-slate-900 dark:text-slate-100'>Goals</h1>
          <p className='text-sm text-slate-500 dark:text-slate-400 mt-1'>
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
      <div className='border-b border-slate-100 dark:border-slate-800 mb-6' />

      {/* Tabs */}
      <div className='flex gap-6 border-b border-slate-200 dark:border-slate-700 mb-6'>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`pb-3 text-sm font-medium cursor-pointer transition-colors border-b-2 -mb-px ${
              tab === t.key
                ? 'text-teal-600 border-teal-600'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 border-transparent'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Goal list */}
      <QueryState isLoading={isLoading} isError={isError} onRetry={refetch} skeleton={<GoalCardSkeleton />}>
      {filtered.length === 0 ? (
        <div className='border border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-12 text-center'>
          <p className='text-sm text-slate-400 dark:text-slate-500'>
            {tab === 'all' ? 'No goals yet. Add one to get started.' : 'No goals in this category.'}
          </p>
        </div>
      ) : (
        <div className='space-y-4'>
          {filtered.map((goal) => {
            const status = computeGoalStatus(goal)
            const pendingSteps = goal.steps.filter((s) => !s.done).length
            const allStepsDone = pendingSteps === 0

            return (
              <div key={goal._id} className='border border-slate-200 dark:border-slate-700 rounded-xl p-5'>

                {/* Title + actions */}
                <div className='flex items-start justify-between gap-4'>
                  <div className='flex-1 min-w-0'>
                    <p className='text-base font-semibold text-slate-900 dark:text-slate-100'>{goal.title}</p>
                    {goal.description && (
                      <p className='text-sm text-slate-500 dark:text-slate-400 mt-0.5'>{goal.description}</p>
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
                      className='w-8 h-8 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-blue-500 hover:bg-blue-50 rounded-md cursor-pointer transition-colors'
                    >
                      <Pencil size={15} />
                    </button>

                    {/* Mark complete — only when all steps are done */}
                    {goal.status !== 'completed' && (
                      <button
                        onClick={() => allStepsDone && markComplete.mutate(goal._id)}
                        disabled={!allStepsDone}
                        title={!allStepsDone ? `${pendingSteps} step${pendingSteps > 1 ? 's' : ''} still pending` : 'Mark as complete'}
                        className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors ${
                          !allStepsDone
                            ? 'text-slate-200 dark:text-slate-700 cursor-not-allowed'
                            : 'text-slate-400 dark:text-slate-500 hover:text-teal-600 hover:bg-teal-50 cursor-pointer'
                        }`}
                      >
                        <CheckCircle size={15} />
                      </button>
                    )}

                    {/* Delete — blocked while steps are pending; backend enforces this too */}
                    <div className='relative'>
                      <button
                        onClick={() => allStepsDone && setConfirmDeleteId(confirmDeleteId === goal._id ? null : goal._id)}
                        disabled={!allStepsDone}
                        title={!allStepsDone ? `Complete or remove ${pendingSteps} pending step${pendingSteps > 1 ? 's' : ''} before deleting` : 'Delete goal'}
                        className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors ${
                          !allStepsDone
                            ? 'text-slate-200 dark:text-slate-700 cursor-not-allowed'
                            : 'text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 cursor-pointer'
                        }`}
                      >
                        <Trash2 size={15} />
                      </button>
                      {confirmDeleteId === goal._id && (
                        <DeletePopover
                          title="Delete goal"
                          itemName={goal.title}
                          onConfirm={() => deleteGoal.mutate(goal._id)}
                          onCancel={() => setConfirmDeleteId(null)}
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className='mt-4'>
                  <div className='flex items-center justify-between mb-1.5'>
                    <span className='text-xs text-slate-400 dark:text-slate-500'>Progress</span>
                    <span className='text-xs font-medium text-slate-600 dark:text-slate-400'>{goal.progress}%</span>
                  </div>
                  <div className='h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden'>
                    <div
                      className={`h-full rounded-full transition-all ${PROGRESS_COLOR[status]}`}
                      style={{ width: `${goal.progress}%` }}
                    />
                  </div>
                </div>

                {/* Steps */}
                {goal.steps.length > 0 ? (
                  <div className='mt-4 space-y-2'>
                    {goal.steps.map((step) => (
                      <div key={step._id} className='flex items-center gap-2'>
                        <button
                          onClick={() => toggleStep.mutate({ id: step._id, done: !step.done })}
                          className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors cursor-pointer ${
                            step.done
                              ? 'bg-teal-600 border-teal-600'
                              : 'border-slate-300 dark:border-slate-600 hover:border-teal-400'
                          }`}
                        >
                          {step.done && <Check size={10} className='text-white' strokeWidth={3} />}
                        </button>
                        <div
                          onClick={() => toggleStep.mutate({ id: step._id, done: !step.done })}
                          className='flex-1 cursor-pointer'
                        >
                          <p className={`text-sm transition-colors ${step.done ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-700 dark:text-slate-300'}`}>
                            {step.title}
                          </p>
                          {step.description && (
                            <p className='text-xs text-slate-400 dark:text-slate-500 mt-0.5'>{step.description}</p>
                          )}
                        </div>
                        <div className='relative'>
                          <button
                            onClick={() => setConfirmDeleteStepId(confirmDeleteStepId === step._id ? null : step._id)}
                            className='p-1 text-red-400 hover:text-red-600 transition-colors cursor-pointer'
                          >
                            <Trash2 size={13} />
                          </button>
                          {confirmDeleteStepId === step._id && (
                            <DeletePopover
                              title='Delete step'
                              itemName={step.title}
                              onConfirm={() => deleteStep.mutate(step._id)}
                              onCancel={() => setConfirmDeleteStepId(null)}
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  addingStepGoalId !== goal._id && (
                    <p className='mt-4 text-xs text-slate-400 dark:text-slate-500'>No steps yet.</p>
                  )
                )}

                {goal.status !== 'completed' && (
                  <button
                    onClick={() => openAddStep(goal._id)}
                    className='mt-3 text-xs text-teal-600 hover:text-teal-700 font-medium cursor-pointer'
                  >
                    + Add step
                  </button>
                )}

              </div>
            )
          })}
        </div>
      )}
      </QueryState>

      {/* New Goal Modal */}
      <Modal open={showModal} onClose={resetModal} size='md'>
            <div className='p-6'>
              <ModalTitle className='text-lg font-semibold text-slate-900 dark:text-slate-100 mb-5'>New Goal</ModalTitle>
              <form onSubmit={handleSubmit} className='space-y-4'>
                <div>
                  <label className='block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5'>Title</label>
                  <input
                    type='text'
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder='e.g. Learn backend development'
                    className='w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500'
                    required
                    autoFocus
                  />
                </div>
                <div>
                  <label className='block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5'>
                    Description <span className='text-slate-400 dark:text-slate-500 font-normal'>(optional)</span>
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder='What does achieving this goal mean to you?'
                    rows={2}
                    className='w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none'
                  />
                </div>
                <div>
                  <label className='block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5'>Deadline</label>
                  <input
                    type='date'
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className='w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500'
                    required
                  />
                </div>
                <div>
                  <label className='block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5'>
                    Steps <span className='text-slate-400 dark:text-slate-500 font-normal'>(optional)</span>
                  </label>
                  <div className='space-y-2'>
                    <div className='flex gap-2'>
                      <input
                        type='text'
                        value={stepDraft}
                        onChange={(e) => setStepDraft(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addStepToList() } }}
                        placeholder='Step title'
                        className='flex-1 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500'
                      />
                      <button
                        type='button'
                        onClick={addStepToList}
                        className='px-3 py-2.5 text-sm font-medium text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800 rounded-lg hover:bg-teal-50 dark:hover:bg-teal-950 cursor-pointer transition-colors'
                      >
                        Add
                      </button>
                    </div>
                    <input
                      type='text'
                      value={stepDraftDescription}
                      onChange={(e) => setStepDraftDescription(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addStepToList() } }}
                      placeholder='Description (optional)'
                      className='w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500'
                    />
                  </div>
                  {stepInputs.length > 0 && (
                    <ul className='mt-2 space-y-1'>
                      {stepInputs.map((s, i) => (
                        <li key={i} className='flex items-center justify-between gap-2 bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2'>
                          <div className='flex items-start gap-2 min-w-0'>
                            <span className='w-1.5 h-1.5 rounded-full bg-teal-500 flex-shrink-0 mt-1.5' />
                            <div>
                              <p className='text-sm text-slate-700 dark:text-slate-300'>{s.title}</p>
                              {s.description && <p className='text-xs text-slate-400 dark:text-slate-500 mt-0.5'>{s.description}</p>}
                            </div>
                          </div>
                          <button
                            type='button'
                            onClick={() => removeStepFromList(i)}
                            className='text-slate-400 dark:text-slate-500 hover:text-red-400 cursor-pointer transition-colors text-xl leading-none flex-shrink-0'
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
                    className='flex-1 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm font-medium py-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors'
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
      </Modal>

      {/* Add Step Modal */}
      <Modal open={addingStepGoalId !== null} onClose={closeAddStep} size='sm'>
            <div className='p-6'>
              <ModalTitle className='text-lg font-semibold text-slate-900 dark:text-slate-100 mb-5'>Add Step</ModalTitle>
              <div className='space-y-4'>
                <div>
                  <label className='block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5'>Title</label>
                  <input
                    type='text'
                    value={newStepTitle}
                    onChange={(e) => setNewStepTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && addingStepGoalId) submitNewStep(addingStepGoalId)
                    }}
                    placeholder='e.g. Set up project structure'
                    className='w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500'
                    autoFocus
                  />
                </div>
                <div>
                  <label className='block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5'>
                    Description <span className='text-slate-400 dark:text-slate-500 font-normal'>(optional)</span>
                  </label>
                  <textarea
                    value={newStepDescription}
                    onChange={(e) => setNewStepDescription(e.target.value)}
                    placeholder='What does this step involve?'
                    rows={2}
                    className='w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none'
                  />
                </div>
                <div className='flex gap-3 pt-2'>
                  <button
                    type='button'
                    onClick={closeAddStep}
                    className='flex-1 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm font-medium py-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors'
                  >
                    Cancel
                  </button>
                  <button
                    type='button'
                    onClick={() => addingStepGoalId && submitNewStep(addingStepGoalId)}
                    disabled={!newStepTitle.trim() || addStep.isPending}
                    className='flex-1 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg cursor-pointer transition-colors'
                  >
                    {addStep.isPending ? 'Adding...' : 'Add Step'}
                  </button>
                </div>
              </div>
            </div>
      </Modal>

      {/* Edit Goal Modal */}
      <Modal open={editingGoal !== null} onClose={() => setEditingGoal(null)} size='md'>
            <div className='p-6'>
              <ModalTitle className='text-lg font-semibold text-slate-900 dark:text-slate-100 mb-5'>Edit Goal</ModalTitle>
              <form onSubmit={handleEditSubmit} className='space-y-4'>
                <div>
                  <label className='block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5'>Title</label>
                  <input
                    type='text'
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className='w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500'
                    required
                    autoFocus
                  />
                </div>
                <div>
                  <label className='block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5'>
                    Description <span className='text-slate-400 dark:text-slate-500 font-normal'>(optional)</span>
                  </label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={2}
                    className='w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none'
                  />
                </div>
                <div>
                  <label className='block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5'>Deadline</label>
                  <input
                    type='date'
                    value={editDeadline}
                    onChange={(e) => setEditDeadline(e.target.value)}
                    className='w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500'
                    required
                  />
                </div>
                <div className='flex gap-3 pt-2'>
                  <button
                    type='button'
                    onClick={() => setEditingGoal(null)}
                    className='flex-1 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm font-medium py-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors'
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
      </Modal>

    </div>
  )
}

export default GoalsPage
