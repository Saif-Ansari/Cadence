import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { X, ChevronRight, ChevronLeft, Trash2 } from 'lucide-react'
import UserMenu from '../components/layout/UserMenu'
import QueryState from '../components/ui/QueryState'
import Skeleton from '../components/ui/Skeleton'
import Modal, { ModalTitle } from '../components/ui/Modal'
import DeletePopover from '../components/ui/DeletePopover'
import { reflectionsService } from '../services/reflections.service'
import { todayLocalDateString } from '../lib/date'
import type { Reflection } from '../types'

const FOCUS_LABELS: Record<number, string> = {
  1: 'Scattered', 2: 'Scattered', 3: 'Scattered',
  4: 'Getting there', 5: 'Getting there', 6: 'Getting there',
  7: 'Focused', 8: 'Focused',
  9: 'Deep focus', 10: 'Deep focus',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}

function formatYear(iso: string) {
  return new Date(iso).getFullYear().toString()
}

function ReflectionsListSkeleton() {
  return (
    <div className='space-y-4'>
      {[0, 1, 2].map((i) => (
        <div key={i} className='px-3 space-y-1.5'>
          <div className='flex items-baseline justify-between gap-2'>
            <Skeleton className='h-3.5 w-20' />
            <Skeleton className='h-3 w-10' />
          </div>
          <Skeleton className='h-3 w-full' />
        </div>
      ))}
    </div>
  )
}

function scoreColor(score?: number) {
  if (!score) return 'text-slate-400 dark:text-slate-500'
  if (score >= 7) return 'text-teal-600'
  if (score >= 5) return 'text-amber-500'
  return 'text-red-400'
}

function todayLabel() {
  return new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function ReflectionsPage() {
  const queryClient = useQueryClient()

  // Form state
  const [win, setWin] = useState('')
  const [wastedTime, setWastedTime] = useState('')
  const [saved, setSaved] = useState(false)

  // Modal state
  const [showHistory, setShowHistory] = useState(false)
  const [detailReflection, setDetailReflection] = useState<Reflection | null>(null)
  const [confirmDeleteReflection, setConfirmDeleteReflection] = useState(false)

  // Including today's date in the key means a day boundary crossed while the
  // tab is open creates a genuinely new query (not just a stale one), so the
  // pre-fill effect below reliably sees a fresh (usually null) result instead
  // of continuing to serve yesterday's cached reflection.
  const { data: todayData } = useQuery({
    queryKey: ['reflections', 'today', todayLocalDateString()],
    queryFn: () => reflectionsService.getToday(),
  })

  const {
    data: allData,
    isLoading: allLoading,
    isError: allError,
    refetch: refetchAll,
  } = useQuery({
    queryKey: ['reflections'],
    queryFn: () => reflectionsService.getAll(),
  })

  // Reset any pending delete confirmation whenever the viewed entry changes
  // (opened a different one, or the modal closed) so it doesn't reappear
  // already-open next time.
  useEffect(() => {
    setConfirmDeleteReflection(false)
  }, [detailReflection])

  // Sync form to today's reflection — including clearing it back to blank
  // when there isn't one yet. A previous version only ever populated fields
  // (`if (r) { ...set... }`) and never reset them, so a form filled in on one
  // day kept showing that text on the next day, since a fresh day usually
  // starts with `r` being null and the effect did nothing at all.
  useEffect(() => {
    const r = todayData?.reflection
    setWin(r?.win ?? '')
    setWastedTime(r?.wastedTime ?? '')
  }, [todayData?.reflection])

  const upsert = useMutation({
    mutationFn: () =>
      reflectionsService.upsertToday({
        win: win.trim(),
        wastedTime: wastedTime.trim(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reflections'] })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    },
  })

  const deleteReflection = useMutation({
    mutationFn: (id: string) => reflectionsService.deleteReflection(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reflections'] })
      setConfirmDeleteReflection(false)
      setDetailReflection(null)
    },
  })

  const reflections = allData?.reflections ?? []
  const recent = reflections.slice(0, 5)

  const canSave = win.trim() && wastedTime.trim()

  return (
    <div className='flex flex-col h-full'>

      {/* Full-width header */}
      <div className='px-4 pt-4 lg:px-8 lg:pt-8 pb-0 flex-shrink-0'>
        <div className='flex items-center justify-between mb-6'>
          <div>
            <h1 className='text-2xl font-semibold text-slate-900 dark:text-slate-100'>Reflections</h1>
            <p className='text-sm text-slate-500 dark:text-slate-400 mt-1'>{todayLabel()}</p>
          </div>
          <UserMenu />
        </div>
        <div className='border-b border-slate-100 dark:border-slate-800' />
      </div>

      {/* Two-column body */}
      <div className='flex flex-1 overflow-hidden'>

      {/* Main form */}
      <div className='flex-1 overflow-y-auto p-4 pt-4 lg:p-8 lg:pt-6'>

        {/* Form fields */}
        <div className='max-w-2xl space-y-6'>

          <div>
            <label className='block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2'>Win of the day</label>
            <input
              type='text'
              value={win}
              onChange={(e) => setWin(e.target.value)}
              placeholder='What was your biggest win today?'
              className='w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500'
            />
          </div>

          <div>
            <label className='block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2'>What did you waste time on?</label>
            <textarea
              value={wastedTime}
              onChange={(e) => setWastedTime(e.target.value)}
              placeholder='Be honest — where did time slip away?'
              rows={2}
              className='w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none'
            />
          </div>

          {/* Save button */}
          <div className='pt-2 flex items-center gap-4 flex-wrap'>
            <button
              onClick={() => upsert.mutate()}
              disabled={!canSave || upsert.isPending}
              className='bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white text-sm font-medium px-6 py-2.5 rounded-xl cursor-pointer transition-colors'
            >
              {upsert.isPending ? 'Saving...' : saved ? 'Saved!' : 'Save Reflection'}
            </button>
            {/* Mobile: show history link */}
            {reflections.length > 0 && (
              <button
                onClick={() => setShowHistory(true)}
                className='lg:hidden flex items-center gap-1 text-sm font-medium text-teal-600 hover:text-teal-700 cursor-pointer transition-colors'
              >
                View history
                <ChevronRight size={14} />
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Right panel — recent history (hidden on mobile) */}
      <div className='hidden lg:flex w-[300px] flex-shrink-0 border-l border-slate-100 dark:border-slate-800 flex-col'>
        <div className='p-6 flex-1 overflow-y-auto'>
          <p className='text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4'>Recent Reflections</p>

          <QueryState isLoading={allLoading} isError={allError} onRetry={refetchAll} skeleton={<ReflectionsListSkeleton />}>
          {recent.length === 0 ? (
            <p className='text-xs text-slate-400 dark:text-slate-500'>No reflections yet.</p>
          ) : (
            <div className='space-y-px'>
              {recent.map((r) => (
                <button
                  key={r._id}
                  onClick={() => setDetailReflection(r)}
                  className='w-full text-left px-3 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer group'
                >
                  <div className='flex items-baseline justify-between gap-2 mb-1'>
                    <span className='text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-teal-700 transition-colors'>
                      {formatShortDate(r.date)}
                    </span>
                    {r.focusScore && (
                      <span className={`text-xs font-semibold ${scoreColor(r.focusScore)}`}>
                        {r.focusScore} / 10
                      </span>
                    )}
                  </div>
                  {r.overallDay && (
                    <p className='text-xs text-slate-500 dark:text-slate-400 line-clamp-2'>{r.overallDay}</p>
                  )}
                </button>
              ))}
            </div>
          )}
          </QueryState>
        </div>

        {/* View all footer */}
        {reflections.length > 0 && (
          <div className='border-t border-slate-100 dark:border-slate-800 px-6 py-4'>
            <button
              onClick={() => setShowHistory(true)}
              className='flex items-center gap-1.5 text-sm font-medium text-teal-600 hover:text-teal-700 cursor-pointer transition-colors'
            >
              View all reflections
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

      </div>{/* end two-column body */}

      {/* History modal */}
      <Modal open={showHistory} onClose={() => setShowHistory(false)} size='lg'>
          <div className='max-h-[80vh] flex flex-col'>

            {/* Header */}
            <div className='flex items-start justify-between p-6 pb-4 border-b border-slate-100 dark:border-slate-800'>
              <div>
                <ModalTitle className='text-base font-semibold text-slate-900 dark:text-slate-100'>All Reflections</ModalTitle>
                <p className='text-sm text-slate-400 dark:text-slate-500 mt-0.5'>{reflections.length} {reflections.length === 1 ? 'entry' : 'entries'}</p>
              </div>
              <button
                onClick={() => setShowHistory(false)}
                className='w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-400 cursor-pointer transition-colors'
              >
                <X size={14} />
              </button>
            </div>

            {/* List */}
            <div className='overflow-y-auto flex-1'>
              {reflections.map((r, i) => (
                <div key={r._id}>
                  <button
                    onClick={() => { setDetailReflection(r); setShowHistory(false) }}
                    className='w-full flex items-center gap-4 px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer text-left'
                  >
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-baseline gap-2 mb-1'>
                        <span className='text-sm font-semibold text-slate-900 dark:text-slate-100'>{formatShortDate(r.date)}</span>
                        <span className='text-xs text-slate-400 dark:text-slate-500'>{formatYear(r.date)}</span>
                      </div>
                      {r.overallDay && (
                        <p className='text-xs text-slate-500 dark:text-slate-400 truncate'>{r.overallDay}</p>
                      )}
                    </div>
                    <div className='flex items-center gap-2.5 flex-shrink-0'>
                      {r.focusScore && (
                        <span className={`text-sm font-semibold ${scoreColor(r.focusScore)}`}>
                          {r.focusScore} / 10
                        </span>
                      )}
                      <ChevronRight size={14} className='text-slate-300 dark:text-slate-600' />
                    </div>
                  </button>
                  {i < reflections.length - 1 && <div className='h-px bg-slate-50 dark:bg-slate-800 mx-6' />}
                </div>
              ))}
            </div>

          </div>
      </Modal>

      {/* Entry detail modal */}
      <Modal open={detailReflection !== null} onClose={() => setDetailReflection(null)} size='xl'>
        {detailReflection && (
          <div className='min-h-[320px] max-h-[85vh] flex flex-col'>

            {/* Header */}
            <div className='flex items-start justify-between p-6 pb-5 border-b border-slate-100 dark:border-slate-800'>
              <div>
                <ModalTitle className='text-base font-semibold text-slate-900 dark:text-slate-100'>{formatDate(detailReflection.date)}</ModalTitle>
                {detailReflection.focusScore && (
                  <div className='flex items-center gap-2 mt-1.5'>
                    <span className='text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide'>Focus score</span>
                    <span className={`text-sm font-bold ${scoreColor(detailReflection.focusScore)}`}>
                      {detailReflection.focusScore} / 10
                    </span>
                    <span className='text-xs text-slate-400 dark:text-slate-500'>· {FOCUS_LABELS[detailReflection.focusScore]}</span>
                  </div>
                )}
              </div>
              <div className='flex items-center gap-2'>
                <div className='relative'>
                  <button
                    onClick={() => setConfirmDeleteReflection(true)}
                    title='Delete reflection'
                    className='w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950 text-red-400 hover:text-red-600 cursor-pointer transition-colors'
                  >
                    <Trash2 size={14} />
                  </button>
                  {confirmDeleteReflection && (
                    <DeletePopover
                      title='Delete reflection'
                      itemName={formatDate(detailReflection.date)}
                      onConfirm={() => deleteReflection.mutate(detailReflection._id)}
                      onCancel={() => setConfirmDeleteReflection(false)}
                      placement='bottom'
                    />
                  )}
                </div>
                <button
                  onClick={() => { setDetailReflection(null); setShowHistory(true) }}
                  title='Back to list'
                  className='w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-400 cursor-pointer transition-colors'
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  onClick={() => setDetailReflection(null)}
                  className='w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-400 cursor-pointer transition-colors'
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Fields */}
            <div className='overflow-y-auto flex-1 p-6 space-y-5'>
              {[
                { label: 'Overall, how was your day?', value: detailReflection.overallDay },
                { label: 'What did you accomplish?', value: detailReflection.accomplished },
                { label: 'Win of the day', value: detailReflection.win },
                { label: 'What did you waste time on?', value: detailReflection.wastedTime },
                { label: 'What can be improved?', value: detailReflection.improvement },
              ]
                .filter((f) => f.value)
                .map((f, i, arr) => (
                  <div key={f.label}>
                    <p className='text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1.5'>{f.label}</p>
                    <p className='text-sm text-slate-700 dark:text-slate-300 leading-relaxed'>{f.value}</p>
                    {i < arr.length - 1 && <div className='h-px bg-slate-100 dark:bg-slate-800 mt-5' />}
                  </div>
                ))}
            </div>

          </div>
        )}
      </Modal>

    </div>
  )
}

export default ReflectionsPage
