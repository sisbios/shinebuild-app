export default function SuperAdminDashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-7 w-40 bg-gray-200 rounded-lg" />
        <div className="h-4 w-64 bg-gray-100 rounded mt-1.5" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="glass-card rounded-2xl p-4">
            <div className="h-9 w-9 rounded-xl bg-gray-200 mb-3" />
            <div className="h-3 w-20 bg-gray-100 rounded mb-1" />
            <div className="h-7 w-12 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
      <div className="glass-card rounded-2xl p-5">
        <div className="h-5 w-32 bg-gray-200 rounded mb-1" />
        <div className="h-3 w-48 bg-gray-100 rounded mb-5" />
        <div className="flex items-end gap-[3px]" style={{ height: '120px' }}>
          {Array.from({ length: 14 }).map((_, i) => (
            <div key={i} className="flex-1 bg-gray-100 rounded-t-sm" style={{ height: `${20 + Math.random() * 80}%` }} />
          ))}
        </div>
      </div>
    </div>
  );
}
