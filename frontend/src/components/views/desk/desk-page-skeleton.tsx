export function DeskPageSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 rounded-xl bg-[#e8edf3]" />
        ))}
      </div>
      <div className="h-64 rounded-xl bg-[#e8edf3]" />
    </div>
  );
}