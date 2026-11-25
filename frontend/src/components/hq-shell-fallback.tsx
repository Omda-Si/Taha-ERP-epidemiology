export function HqShellFallback() {
  return (
    <div className="flex h-full min-h-0 flex-col bg-[#f8fafc]">
      <div className="h-[3.75rem] shrink-0 border-b border-[#eef2f6] bg-white lg:h-[4.25rem]" />
      <div className="flex min-h-0 flex-1 animate-pulse gap-3 p-3 md:p-5">
        <div className="hidden h-full w-[220px] shrink-0 rounded-xl bg-white lg:block" />
        <div className="min-w-0 flex-1 space-y-3">
          <div className="h-8 w-48 rounded-lg bg-white" />
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 rounded-xl bg-white" />
            ))}
          </div>
          <div className="h-64 rounded-xl bg-white" />
        </div>
      </div>
    </div>
  );
}