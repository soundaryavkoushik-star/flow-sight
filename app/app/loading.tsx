function LoadingBlock({ className = "" }: { className?: string }) {
  return <div className={`fs-shimmer rounded-xl ${className}`} aria-hidden="true" />
}

export default function AppLoading() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8" aria-busy="true" aria-label="Loading Cusp">
      <span className="sr-only" role="status">Loading your information…</span>
      <LoadingBlock className="h-4 w-28" />
      <LoadingBlock className="mt-3 h-9 w-64 max-w-[75%]" />
      <LoadingBlock className="mt-3 h-4 w-96 max-w-full" />
      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((item) => <div key={item} className="rounded-2xl border border-border bg-card p-5"><LoadingBlock className="h-4 w-28" /><LoadingBlock className="mt-6 h-8 w-36" /><LoadingBlock className="mt-4 h-3 w-full" /><LoadingBlock className="mt-2 h-3 w-4/5" /></div>)}
      </section>
      <section className="mt-5 rounded-3xl border border-border bg-card p-5 sm:p-7">
        <LoadingBlock className="h-5 w-44" />
        <LoadingBlock className="mt-3 h-3 w-72 max-w-full" />
        <LoadingBlock className="mt-8 h-52 w-full" />
      </section>
    </main>
  )
}
