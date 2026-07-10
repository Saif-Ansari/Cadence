import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Flame, Pencil, Trash2 } from 'lucide-react'
import UserMenu from '../components/layout/UserMenu'
import DeletePopover from '../components/ui/DeletePopover'
import QueryState from '../components/ui/QueryState'
import Skeleton from '../components/ui/Skeleton'
import Modal, { ModalTitle } from '../components/ui/Modal'
import { habitsService } from '../services/habits.service'
import { computeWeeklyRate } from '../lib/habitStats'
import type { Habit } from '../types'

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

function cellColor(rate: number) {
  if (rate === 0) return 'bg-slate-100 dark:bg-slate-800'
  if (rate < 0.5) return 'bg-teal-200 dark:bg-teal-900'
  if (rate < 1) return 'bg-teal-400 dark:bg-teal-700'
  return 'bg-teal-600 dark:bg-teal-500'
}

function HabitRowsSkeleton() {
  return (
    <>
      <div className="grid grid-cols-[1fr_repeat(7,_2rem)_3.5rem_4.5rem] gap-x-1 mb-2 items-center px-4">
        <div />
        {DAY_LABELS.map((d, i) => (
          <div key={i} className="text-center text-xs font-semibold text-slate-300 dark:text-slate-600">{d}</div>
        ))}
        <div />
        <div />
      </div>
      <div className="space-y-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="grid grid-cols-[1fr_repeat(7,_2rem)_3.5rem_4.5rem] gap-x-1 items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3"
          >
            <Skeleton className="h-4 w-24" />
            {Array.from({ length: 7 }, (_, j) => (
              <Skeleton key={j} className="w-7 h-7 rounded-full mx-auto" />
            ))}
            <Skeleton className="h-4 w-6 mx-auto" />
            <Skeleton className="h-4 w-10 ml-auto" />
          </div>
        ))}
      </div>
    </>
  )
}

function ConsistencySkeleton() {
  return (
    <div className="space-y-2">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center gap-2">
          <Skeleton className="h-3 w-20 flex-shrink-0" />
          <div className="flex gap-1">
            {Array.from({ length: 5 }, (_, j) => (
              <Skeleton key={j} className="w-6 h-6 rounded" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function HabitsPage() {
  const queryClient = useQueryClient()
  // Computed inside the component so it reflects the correct day after midnight
  const todayIndex = (new Date().getDay() + 6) % 7

  const [showModal, setShowModal] = useState(false)
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  // Create form state
  const [name, setName] = useState('')
  const [freq, setFreq] = useState(3)
  const [description, setDescription] = useState('')

  // Edit form state
  const [editName, setEditName] = useState('')
  const [editFreq, setEditFreq] = useState(3)
  const [editDescription, setEditDescription] = useState('')
  const [editStatus, setEditStatus] = useState<'active' | 'completed'>('active')

  const {
    data: habitsData,
    isLoading: habitsLoading,
    isError: habitsError,
    refetch: refetchHabits,
  } = useQuery({
    queryKey: ['habits'],
    queryFn: () => habitsService.getHabits(),
  })

  const {
    data: consistencyData,
    isLoading: consistencyLoading,
    isError: consistencyError,
    refetch: refetchConsistency,
  } = useQuery({
    queryKey: ['habits', 'consistency'],
    queryFn: () => habitsService.getConsistency(),
  })

  const habits = habitsData?.habits ?? []
  const consistency = consistencyData?.consistency ?? []

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const weeklyRate = computeWeeklyRate(habits)

  const createHabit = useMutation({
    mutationFn: (data: { name: string; targetFrequency: number; description?: string }) =>
      habitsService.createHabit(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] })
      resetModal()
    },
  })

  const updateHabit = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Pick<Habit, 'name' | 'targetFrequency' | 'description' | 'status'>> }) =>
      habitsService.updateHabit(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] })
      setEditingHabit(null)
    },
  })

  const deleteHabit = useMutation({
    mutationFn: (id: string) => habitsService.deleteHabit(id),
    onSuccess: () => {
      setConfirmDeleteId(null)
      queryClient.invalidateQueries({ queryKey: ['habits'] })
    },
  })

  const toggleDay = useMutation({
    mutationFn: ({ id, date }: { id: string; date: string }) =>
      habitsService.toggleDay(id, date),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['habits'] }),
  })

  function resetModal() {
    setShowModal(false)
    setName('')
    setFreq(3)
    setDescription('')
  }

  function openEdit(habit: Habit) {
    setEditingHabit(habit)
    setEditName(habit.name)
    setEditFreq(habit.targetFrequency)
    setEditDescription(habit.description ?? '')
    setEditStatus(habit.status)
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    createHabit.mutate({
      name: name.trim(),
      targetFrequency: freq,
      description: description.trim() || undefined,
    })
  }

  function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    if (!editingHabit || !editName.trim()) return
    updateHabit.mutate({
      id: editingHabit._id,
      data: {
        name: editName.trim(),
        targetFrequency: editFreq,
        description: editDescription.trim() || undefined,
        status: editStatus,
      },
    })
  }

  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Habits</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {habits.length} habit{habits.length === 1 ? '' : 's'}
            {habits.length > 0 && ` · ${weeklyRate}% this week`}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2.5 text-sm font-medium bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors cursor-pointer"
          >
            + New Habit
          </button>
          <UserMenu />
        </div>
      </div>
      <div className="border-b border-slate-100 dark:border-slate-800 mb-8" />

      {/* Main layout */}
      <div className="flex flex-col xl:flex-row gap-6">
        {/* Left: habit list */}
        <div className="flex-1 min-w-0 overflow-x-auto">
          <QueryState isLoading={habitsLoading} isError={habitsError} onRetry={refetchHabits} skeleton={<HabitRowsSkeleton />}>
          {habits.length === 0 ? (
            <div className="border border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-12 text-center">
              <p className="text-sm text-slate-400 dark:text-slate-500 mb-2">No habits yet.</p>
              <button
                onClick={() => setShowModal(true)}
                className="text-sm text-teal-600 hover:text-teal-700 font-medium cursor-pointer"
              >
                Add your first habit →
              </button>
            </div>
          ) : (
            <>
              {/* Column headers */}
              <div className="grid grid-cols-[1fr_repeat(7,_2rem)_3.5rem_4.5rem] gap-x-1 mb-2 items-center px-4">
                <div />
                {DAY_LABELS.map((d, i) => (
                  <div
                    key={i}
                    className={`text-center text-xs font-semibold ${
                      i === todayIndex ? 'text-teal-600' : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {d}
                  </div>
                ))}
                <div />
                <div />
              </div>

              {/* Habit rows */}
              <div className="space-y-1.5">
                {habits.map((habit) => (
                  <div key={habit._id}>
                    <div className="grid grid-cols-[1fr_repeat(7,_2rem)_3.5rem_4.5rem] gap-x-1 items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 hover:border-slate-300 dark:hover:border-slate-500 transition-colors">
                      {/* Name + frequency + description */}
                      <div className="min-w-0 pr-2">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{habit.name}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{habit.targetFrequency}×/week</p>
                        {habit.description && (
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate">{habit.description}</p>
                        )}
                      </div>

                      {/* Day circles */}
                      {habit.weekGrid.map((day, i) => {
                        const dayDate = new Date(day.date)
                        dayDate.setHours(0, 0, 0, 0)
                        const isFuture = dayDate > today
                        const isDisabled = isFuture || day.beforeCreation
                        const isToday = i === todayIndex
                        return (
                          <button
                            key={i}
                            onClick={() =>
                              !isDisabled &&
                              toggleDay.mutate({ id: habit._id, date: day.date })
                            }
                            disabled={isDisabled}
                            title={day.beforeCreation ? "Before this habit's creation" : undefined}
                            className={`w-7 h-7 rounded-full mx-auto block transition-colors ${
                              day.done
                                ? 'bg-teal-600'
                                : isDisabled
                                  ? 'bg-slate-100 dark:bg-slate-800'
                                  : isToday
                                    ? 'bg-slate-200 dark:bg-slate-700 ring-2 ring-teal-400 ring-offset-1 hover:bg-teal-100 cursor-pointer'
                                    : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-500 cursor-pointer'
                            }`}
                          />
                        )
                      })}

                      {/* Streak */}
                      <div className="flex items-center justify-center gap-0.5">
                        <Flame size={13} className="text-orange-400 flex-shrink-0" />
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">{habit.streak}</span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-end gap-0.5">
                        <button
                          onClick={() => openEdit(habit)}
                          className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors cursor-pointer"
                        >
                          <Pencil size={13} />
                        </button>
                        <div className="relative">
                          <button
                            onClick={() =>
                              setConfirmDeleteId(confirmDeleteId === habit._id ? null : habit._id)
                            }
                            className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                          {confirmDeleteId === habit._id && (
                            <DeletePopover
                              title="Delete habit"
                              itemName={habit.name}
                              onConfirm={() => deleteHabit.mutate(habit._id)}
                              onCancel={() => setConfirmDeleteId(null)}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
          </QueryState>
        </div>

        {/* Right: stats panel */}
        <div className="w-full xl:w-[440px] xl:flex-shrink-0 space-y-4">
          {/* This week */}
          <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-5">
            <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
              This Week
            </p>
            <p className="text-4xl font-bold text-slate-900 dark:text-slate-100 leading-none">{weeklyRate}%</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">completion rate</p>
            <div className="mt-4 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-teal-600 rounded-full transition-all"
                style={{ width: `${weeklyRate}%` }}
              />
            </div>
          </div>

          {/* Consistency heatmap */}
          <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-5">
            <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">
              Consistency — Last 5 Weeks
            </p>
            <QueryState isLoading={consistencyLoading} isError={consistencyError} onRetry={refetchConsistency} skeleton={<ConsistencySkeleton />}>
            {consistency.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-500">No data yet.</p>
            ) : (
              <>
                <div className="space-y-2">
                  {consistency.map((h) => (
                    <div key={h.habitId} className="flex items-center gap-2">
                      <p className="text-xs text-slate-600 dark:text-slate-400 truncate w-20 flex-shrink-0">{h.name}</p>
                      <div className="flex gap-1">
                        {h.weeks.map((w, i) => (
                          <div
                            key={i}
                            title={`${w.label}: ${Math.round(w.rate * 100)}%`}
                            className={`w-6 h-6 rounded ${cellColor(w.rate)}`}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                {/* Week labels */}
                <div className="flex gap-1 mt-2.5 ml-[88px]">
                  {(consistency[0]?.weeks ?? []).map((w, i) => (
                    <p key={i} className="text-[10px] text-slate-400 dark:text-slate-500 w-6 text-center">
                      {w.label}
                    </p>
                  ))}
                </div>
              </>
            )}
            </QueryState>
          </div>
        </div>
      </div>

      {/* Create modal */}
      <Modal open={showModal} onClose={resetModal} size="md">
          <div className="p-6">
            <ModalTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-5">New Habit</ModalTitle>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Name</label>
                <input
                  autoFocus
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Read 10 minutes"
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                  Target frequency{' '}
                  <span className="text-slate-400 dark:text-slate-500 font-normal">days/week</span>
                </label>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setFreq(n)}
                      className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-colors cursor-pointer ${
                        freq === n
                          ? 'bg-teal-600 text-white border-teal-600'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-500'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                  Description <span className="text-slate-400 dark:text-slate-500 font-normal">(optional)</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Why does this habit matter?"
                  rows={2}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={resetModal}
                  className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!name.trim() || createHabit.isPending}
                  className="px-5 py-2 text-sm font-medium bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  {createHabit.isPending ? 'Creating…' : 'Create Habit'}
                </button>
              </div>
            </form>
          </div>
      </Modal>

      {/* Edit modal */}
      <Modal open={editingHabit !== null} onClose={() => setEditingHabit(null)} size="md">
          <div className="p-6">
            <ModalTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-5">Edit Habit</ModalTitle>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Name</label>
                <input
                  autoFocus
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                  Target frequency{' '}
                  <span className="text-slate-400 dark:text-slate-500 font-normal">days/week</span>
                </label>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setEditFreq(n)}
                      className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-colors cursor-pointer ${
                        editFreq === n
                          ? 'bg-teal-600 text-white border-teal-600'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-500'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                  Description <span className="text-slate-400 dark:text-slate-500 font-normal">(optional)</span>
                </label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={2}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as 'active' | 'completed')}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="active">Active</option>
                  <option value="completed">Completed — habit formed</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setEditingHabit(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!editName.trim() || updateHabit.isPending}
                  className="px-5 py-2 text-sm font-medium bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  {updateHabit.isPending ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
      </Modal>
    </div>
  )
}

export default HabitsPage
