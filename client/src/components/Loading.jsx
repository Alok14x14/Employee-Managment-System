const Loading = () => {
  return (
    <div className="min-h-screen bg-[var(--bg-app)] p-6 lg:p-8" role="status" aria-label="Loading">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <div className="flex items-center gap-3 border-b border-[var(--border-color)] pb-6">
          <div className="size-9 rounded-lg skeleton" />
          <div className="space-y-2"><div className="h-4 w-32 rounded skeleton" /><div className="h-3 w-56 max-w-[70vw] rounded skeleton" /></div>
        </div>
        <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
          <div className="hidden space-y-3 lg:block">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-10 rounded-md skeleton" />)}</div>
          <div className="space-y-5">
            <div className="space-y-2"><div className="h-6 w-44 rounded skeleton" /><div className="h-3 w-72 max-w-[80vw] rounded skeleton" /></div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="card h-28 skeleton" />)}</div>
            <div className="card space-y-4 p-5">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-8 rounded skeleton" />)}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Loading
