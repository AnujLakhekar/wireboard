export default function DesignerLoading() {
  return (
    <div className="min-h-screen w-screen overflow-hidden bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.12),transparent_30%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] px-4 py-6 md:px-8">
      <div className="mx-auto flex max-w-400 flex-col gap-4">
        <div className="h-14 rounded-2xl border border-border/60 bg-white/70 backdrop-blur-md" />

        <div className="flex min-h-[calc(100vh-7rem)] gap-4">
          <div className="hidden w-16 shrink-0 rounded-3xl border border-border/60 bg-white/75 p-2 shadow-sm md:block">
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-10 rounded-2xl bg-muted/70 animate-pulse" />
              ))}
            </div>
          </div>

          <div className="hidden w-80 shrink-0 rounded-3xl border border-border/60 bg-white/75 p-4 shadow-sm lg:block">
            <div className="h-8 w-40 rounded-full bg-muted/70 animate-pulse" />
            <div className="mt-4 h-11 rounded-2xl bg-muted/70 animate-pulse" />
            <div className="mt-4 flex gap-2 overflow-hidden">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="h-8 w-20 rounded-full bg-muted/70 animate-pulse" />
              ))}
            </div>
            <div className="mt-5 space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="rounded-3xl border border-border/50 bg-background p-3">
                  <div className="aspect-4/3 rounded-2xl bg-muted/70 animate-pulse" />
                  <div className="mt-3 h-4 w-3/5 rounded-full bg-muted/70 animate-pulse" />
                  <div className="mt-2 h-3 w-4/5 rounded-full bg-muted/60 animate-pulse" />
                  <div className="mt-4 h-9 w-20 rounded-full bg-muted/70 animate-pulse" />
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 rounded-3xl border border-border/60 bg-white/70 p-4 shadow-sm backdrop-blur-md">
            <div className="flex h-full flex-col gap-4">
              <div className="rounded-3xl border border-border/50 bg-muted/20 p-4">
                <div className="h-6 w-48 rounded-full bg-muted/70 animate-pulse" />
                <div className="mt-3 h-4 w-72 max-w-full rounded-full bg-muted/60 animate-pulse" />
              </div>

              <div className="grid flex-1 grid-cols-1 gap-4 xl:grid-cols-2 2xl:grid-cols-3">
                {Array.from({ length: 9 }).map((_, index) => (
                  <div key={index} className="rounded-[2rem] border border-border/60 bg-card p-3 shadow-sm">
                    <div className="aspect-4/5 rounded-[1.5rem] bg-linear-to-br from-slate-200 via-slate-100 to-slate-300 animate-pulse" />
                    <div className="mt-3 h-4 w-3/4 rounded-full bg-muted/70 animate-pulse" />
                    <div className="mt-2 h-3 w-full rounded-full bg-muted/60 animate-pulse" />
                    <div className="mt-2 h-3 w-5/6 rounded-full bg-muted/60 animate-pulse" />
                    <div className="mt-4 h-9 w-24 rounded-full bg-muted/70 animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
