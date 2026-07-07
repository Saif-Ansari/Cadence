import type { ReactNode } from "react";
import { RefreshCw } from "lucide-react";

interface QueryStateProps {
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  skeleton?: ReactNode;
  children: ReactNode;
}

// Wraps a query-backed section so loading/error/success are visually
// distinct — without this every useQuery call falls back to `data ?? []`,
// which renders the same "no items" empty state whether the data hasn't
// arrived yet or the request actually failed. Pass `skeleton` to render a
// shape matching the real content instead of a generic loading label.
function QueryState({ isLoading, isError, onRetry, skeleton, children }: QueryStateProps) {
  if (isLoading) {
    if (skeleton) return <>{skeleton}</>;
    return (
      <div className="flex items-center justify-center py-10 text-sm text-slate-400 dark:text-slate-500">
        Loading…
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
        <p className="text-sm text-slate-500 dark:text-slate-400">Couldn't load this right now.</p>
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 text-sm font-medium text-teal-600 hover:text-teal-700 cursor-pointer"
        >
          <RefreshCw size={14} />
          Retry
        </button>
      </div>
    );
  }

  return <>{children}</>;
}

export default QueryState;
