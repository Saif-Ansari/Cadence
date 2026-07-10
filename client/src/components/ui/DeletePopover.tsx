import { useEffect, useRef } from 'react'

interface DeletePopoverProps {
  title: string
  /** Omit for items whose name could be arbitrarily long (e.g. task titles) — falls back to a generic confirmation instead of interpolating it. */
  itemName?: string
  onConfirm: () => void
  onCancel: () => void
}

function DeletePopover({ title, itemName, onConfirm, onCancel }: DeletePopoverProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onCancel()
      }
    }
    // Defer so the click that opened the popover doesn't immediately close it
    const timerId = setTimeout(() => {
      document.addEventListener('mousedown', handleClick)
    }, 0)
    return () => {
      clearTimeout(timerId)
      document.removeEventListener('mousedown', handleClick)
    }
  }, [onCancel])

  return (
    <div
      ref={ref}
      className="absolute bottom-full right-0 mb-2 z-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg w-56"
    >
      <div className="px-4 py-3">
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</p>
      </div>
      <div className="border-t border-slate-100 dark:border-slate-800 px-4 py-3">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {itemName ? (
            <>
              Are you sure you want to delete{' '}
              <span className="font-medium text-slate-700 dark:text-slate-300">"{itemName}"</span>?
            </>
          ) : (
            'Are you sure you want to delete this?'
          )}
        </p>
      </div>
      <div className="border-t border-slate-100 dark:border-slate-800 px-4 py-2.5 flex justify-end gap-2">
        <button
          onClick={onCancel}
          className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 font-medium cursor-pointer"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded-md px-2.5 py-1 cursor-pointer transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  )
}

export default DeletePopover
