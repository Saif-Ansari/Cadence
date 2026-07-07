import { XCircle, CheckCircle2, X } from "lucide-react";
import { useToastStore } from "../../store/toast.store";

// Rendered once at the app root. Any mutation error anywhere in the app
// (wired via the global QueryClient mutationCache in main.tsx) ends up here,
// instead of failing silently.
function ToastStack() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 items-end">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="flex items-center gap-2 pl-3 pr-2 py-2.5 rounded-lg shadow-lg bg-slate-900 text-white text-sm max-w-sm"
        >
          {toast.variant === "error" ? (
            <XCircle size={16} className="text-red-400 flex-shrink-0" />
          ) : (
            <CheckCircle2 size={16} className="text-teal-400 flex-shrink-0" />
          )}
          <span className="flex-1">{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-slate-400 dark:text-slate-500 hover:text-white cursor-pointer flex-shrink-0"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

export default ToastStack;
