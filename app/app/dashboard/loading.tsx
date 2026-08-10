function SkeletonBlock({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={`fs-shimmer rounded-xl ${className}`} style={style} aria-hidden="true" />
}

export default function DashboardLoading() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8" aria-busy="true" aria-label="Loading your financial briefing">
      <span className="sr-only" role="status">Loading your financial briefing…</span>

      <div className="mb-8">
        <SkeletonBlock className="h-4 w-36" />
        <SkeletonBlock className="mt-3 h-9 w-64 max-w-[80%]" />
        <SkeletonBlock className="mt-3 h-4 w-80 max-w-full" />
      </div>

      <section className="mb-5 rounded-3xl border border-border bg-card p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl flex-1">
            <SkeletonBlock className="h-6 w-24 rounded-full" />
            <SkeletonBlock className="mt-5 h-8 w-[28rem] max-w-full" />
            <SkeletonBlock className="mt-3 h-4 w-full" />
            <SkeletonBlock className="mt-2 h-4 w-4/5" />
          </div>
          <SkeletonBlock className="h-10 w-36" />
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[["w-28", "w-32"], ["w-24", "w-28"], ["w-40", "w-28"], ["w-36", "w-44"]].map(([labelWidth, valueWidth], index) => (
          <div key={index} className="min-h-36 rounded-2xl border border-border bg-card p-5">
            <SkeletonBlock className={`h-3 ${labelWidth}`} />
            <SkeletonBlock className={`mt-6 h-8 ${valueWidth}`} />
            <SkeletonBlock className="mt-4 h-3 w-24" />
          </div>
        ))}
      </section>

      <section className="mt-5 rounded-3xl border border-border bg-card p-5 sm:p-7">
        <div className="flex items-center justify-between gap-4">
          <div>
            <SkeletonBlock className="h-5 w-40" />
            <SkeletonBlock className="mt-2 h-3 w-52" />
          </div>
          <SkeletonBlock className="h-7 w-20 rounded-full" />
        </div>
        <div className="mt-8 flex h-52 items-end gap-2 border-b border-l border-border px-3 pb-3">
          {[44, 49, 43, 54, 61, 58, 68, 51, 47, 56, 64, 60, 72, 67, 76, 70].map((height, index) => (
            <SkeletonBlock key={index} className="flex-1 rounded-t-md" style={{ height: `${height}%` }} />
          ))}
        </div>
        <div className="mt-5 flex items-center justify-between">
          <SkeletonBlock className="h-3 w-52" />
          <SkeletonBlock className="h-4 w-28" />
        </div>
      </section>
    </main>
  )
}
