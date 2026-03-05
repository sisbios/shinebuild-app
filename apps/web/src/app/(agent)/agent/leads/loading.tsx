export default function Loading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-48 rounded-xl bg-white/60" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-white/60" />
        ))}
      </div>
      <div className="h-64 rounded-2xl bg-white/60" />
    </div>
  );
}
