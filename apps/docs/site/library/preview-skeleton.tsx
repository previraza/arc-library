/** What a preview shows while its frame is still loading: a few quiet blocks, so the stage never looks empty or broken. */
export function PreviewSkeleton({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 grid place-items-center ${className}`}>
      <div className="grid w-full max-w-xs gap-3 px-6">
        <span className="h-9 w-2/3 animate-pulse rounded-[var(--radius-pill)] bg-fd-muted" />
        <span className="h-9 w-full animate-pulse rounded-[var(--radius-control)] bg-fd-muted [animation-delay:120ms]" />
        <span className="h-3 w-1/2 animate-pulse rounded-full bg-fd-muted [animation-delay:240ms]" />
      </div>
    </div>
  );
}
