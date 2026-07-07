// One pulsing bar — pages compose these into shapes that match their own
// content (a goal card, a task row, a habit row) instead of a generic spinner.
function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-100 dark:bg-slate-800 rounded ${className}`} />;
}

export default Skeleton;
