export function SkeletonEventDetails() {
  return (
    <div className="min-h-screen bg-background text-on-background relative overflow-x-hidden animate-pulse">
      <div className="w-full md:max-w-[420px] mx-auto relative min-h-screen md:min-h-[884px] flex flex-col bg-surface overflow-x-hidden md:border-x md:border-outline-variant/30">
        <div className="relative w-full h-[400px] md:h-[530px] shrink-0 bg-surface-container-highest" />
        <div className="relative -mt-10 w-full bg-surface rounded-t-[32px] flex flex-col flex-1 z-40 px-container-margin pt-12">
          <div className="space-y-4">
            <div className="h-8 bg-surface-container-highest rounded-lg w-3/4" />
            <div className="h-4 bg-surface-container-highest rounded w-1/2" />
            <div className="h-4 bg-surface-container-highest rounded w-2/3" />
            <div className="h-4 bg-surface-container-highest rounded w-1/3" />
          </div>
          <div className="mt-8 space-y-4">
            <div className="h-6 bg-surface-container-highest rounded w-1/4" />
            <div className="h-4 bg-surface-container-highest rounded w-full" />
            <div className="h-4 bg-surface-container-highest rounded w-full" />
            <div className="h-4 bg-surface-container-highest rounded w-3/4" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonExploreEvents() {
  return (
    <div className="animate-pulse px-container-margin space-y-4 mt-4">
      <div className="h-12 bg-surface-container-highest rounded-xl w-full" />
      <div className="flex gap-2">
        <div className="h-8 bg-surface-container-highest rounded-full w-20" />
        <div className="h-8 bg-surface-container-highest rounded-full w-24" />
        <div className="h-8 bg-surface-container-highest rounded-full w-28" />
        <div className="h-8 bg-surface-container-highest rounded-full w-22" />
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-surface-container rounded-xl border border-outline-variant/20 flex flex-row min-h-[130px]">
          <div className="w-[120px] h-full flex-shrink-0 bg-surface-container-highest flex items-center justify-center">
            <div className="space-y-2">
              <div className="h-3 bg-surface-container-lowest rounded w-8 mx-auto" />
              <div className="h-5 bg-surface-container-lowest rounded w-6 mx-auto" />
            </div>
          </div>
          <div className="p-3 flex flex-col justify-between flex-grow">
            <div className="space-y-2">
              <div className="h-4 bg-surface-container-highest rounded w-3/4" />
              <div className="h-3 bg-surface-container-highest rounded w-1/2" />
            </div>
            <div className="flex items-center justify-between mt-2">
              <div className="h-4 bg-surface-container-highest rounded w-16" />
              <div className="h-6 bg-surface-container-highest rounded-full w-14" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonMyTickets() {
  return (
    <div className="animate-pulse px-container-margin pt-20 space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-surface-container rounded-2xl border border-outline-variant/20 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-surface-container-highest rounded w-3/4" />
              <div className="h-3 bg-surface-container-highest rounded w-1/3" />
              <div className="h-3 bg-surface-container-highest rounded w-1/2" />
            </div>
            <div className="h-6 bg-surface-container-highest rounded-full w-14" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonTicketDetail() {
  return (
    <div className="min-h-screen bg-surface text-on-surface antialiased flex flex-col animate-pulse">
      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/30 flex items-center px-container-margin py-stack-sm h-16">
        <div className="w-10 h-10 rounded-full bg-surface-container-highest" />
        <div className="h-5 bg-surface-container-highest rounded w-16 ml-3" />
      </header>
      <main className="flex-grow flex flex-col w-full max-w-md mx-auto px-container-margin pt-20 pb-32">
        <div className="bg-surface-container rounded-2xl border border-outline-variant/20 overflow-hidden">
          <div className="h-24 bg-surface-container-highest" />
          <div className="px-5 py-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-5 bg-surface-container-highest rounded w-2/3" />
              <div className="h-6 bg-surface-container-highest rounded-full w-14" />
            </div>
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded bg-surface-container-highest" />
                  <div className="space-y-1 flex-1">
                    <div className="h-2 bg-surface-container-highest rounded w-12" />
                    <div className="h-3 bg-surface-container-highest rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export function SkeletonReminders() {
  return (
    <div className="animate-pulse px-container-margin pt-20 space-y-3">
      <div className="h-5 bg-surface-container-highest rounded w-24 mb-6" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-surface-container rounded-2xl border border-outline-variant/20 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-surface-container-highest rounded w-2/3" />
              <div className="h-3 bg-surface-container-highest rounded w-1/2" />
            </div>
            <div className="w-9 h-9 rounded-lg bg-surface-container-highest" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonProfile() {
  return (
    <div className="animate-pulse px-container-margin pt-20 space-y-6">
      <div className="bg-surface-container rounded-2xl border border-outline-variant/20 p-5">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-full bg-surface-container-highest" />
          <div className="space-y-2">
            <div className="h-4 bg-surface-container-highest rounded w-28" />
            <div className="h-3 bg-surface-container-highest rounded w-40" />
          </div>
        </div>
        <div className="space-y-4">
          <div className="space-y-1">
            <div className="h-3 bg-surface-container-highest rounded w-10" />
            <div className="h-11 bg-surface-container-highest rounded-xl" />
          </div>
          <div className="space-y-1">
            <div className="h-3 bg-surface-container-highest rounded w-8" />
            <div className="h-11 bg-surface-container-highest rounded-xl" />
          </div>
          <div className="h-11 bg-surface-container-highest rounded-xl" />
        </div>
      </div>
      <div className="bg-surface-container rounded-2xl border border-outline-variant/20 p-5">
        <div className="h-5 bg-surface-container-highest rounded w-36 mb-4" />
        <div className="space-y-4">
          <div className="space-y-1">
            <div className="h-3 bg-surface-container-highest rounded w-20" />
            <div className="h-11 bg-surface-container-highest rounded-xl" />
          </div>
          <div className="space-y-1">
            <div className="h-3 bg-surface-container-highest rounded w-14" />
            <div className="h-11 bg-surface-container-highest rounded-xl" />
          </div>
          <div className="h-11 bg-surface-container-highest rounded-xl" />
        </div>
      </div>
    </div>
  );
}
