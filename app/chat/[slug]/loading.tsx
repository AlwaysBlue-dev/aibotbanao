export default function ChatLoading() {
  return (
    <div className="fixed inset-0 flex flex-col bg-gray-50">
      {/* Header skeleton */}
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 shrink-0 shadow-sm">
        <div className="w-16 h-4 bg-gray-200 rounded-full animate-pulse" />
        <div className="w-px h-4 bg-gray-200 shrink-0" />
        <div className="flex-1 flex items-center gap-2">
          <div className="w-36 h-4 bg-gray-200 rounded-full animate-pulse" />
          <div className="hidden sm:block w-20 h-4 bg-gray-100 rounded-full animate-pulse" />
        </div>
        <div className="w-14 h-4 bg-gray-100 rounded-full animate-pulse" />
      </header>

      {/* Message skeletons */}
      <main className="flex-1 overflow-hidden px-3 sm:px-4 py-4 space-y-3">
        {/* Bot bubble */}
        <div className="flex items-end gap-2">
          <div className="w-7 h-7 bg-gray-200 rounded-full animate-pulse shrink-0" />
          <div className="bg-white rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">
            <div className="space-y-2">
              <div className="w-44 h-3.5 bg-gray-200 rounded-full animate-pulse" />
              <div className="w-32 h-3.5 bg-gray-200 rounded-full animate-pulse" />
              <div className="w-40 h-3.5 bg-gray-200 rounded-full animate-pulse" />
            </div>
          </div>
        </div>
      </main>

      {/* Input bar skeleton */}
      <div className="bg-white border-t border-gray-100 px-3 sm:px-4 py-3 shrink-0">
        <div className="flex items-center gap-2 max-w-2xl mx-auto">
          <div className="flex-1 h-10 bg-gray-100 rounded-full animate-pulse" />
          <div className="w-10 h-10 bg-green-100 rounded-full animate-pulse shrink-0" />
        </div>
        <div className="w-36 h-3 bg-gray-100 rounded-full animate-pulse mx-auto mt-2" />
      </div>
    </div>
  )
}
