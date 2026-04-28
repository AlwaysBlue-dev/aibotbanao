'use client'

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <a
        href="/"
        className="inline-flex items-center gap-2 text-green-600 mb-12"
      >
        <svg
          className="h-7 w-7 shrink-0"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <rect x="3" y="3" width="26" height="26" rx="9" fill="#16A34A" />
          <path d="M16 7.2V9.1" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="16" cy="6.1" r="1.3" fill="white" />
          <rect x="8.2" y="10.2" width="15.6" height="12.8" rx="4.6" fill="white" />
          <circle cx="6.9" cy="16.6" r="1.6" fill="white" />
          <circle cx="25.1" cy="16.6" r="1.6" fill="white" />
          <circle cx="13.3" cy="15.8" r="1.65" fill="#16A34A" />
          <circle cx="18.7" cy="15.8" r="1.65" fill="#16A34A" />
          <path
            d="M12.5 19.1C13.3 20.1 14.5 20.7 16 20.7C17.5 20.7 18.7 20.1 19.5 19.1"
            stroke="#16A34A"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
        <span className="font-bold text-xl">AIBotBanao</span>
      </a>

      {/* Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 px-8 py-10 flex flex-col items-center max-w-sm w-full text-center">
        {/* WiFi off icon */}
        <div className="bg-gray-100 rounded-full p-5 mb-6">
          <svg
            className="h-10 w-10 text-gray-400"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            {/* Slash line through wifi */}
            <line
              x1="2"
              y1="2"
              x2="22"
              y2="22"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
            />
            {/* Outer arc (clipped by slash) */}
            <path
              d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M5 12.55a10.94 10.94 0 0 1 5.17-2.8"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Middle arc */}
            <path
              d="M10.71 5.05A16 16 0 0 1 22.56 9"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Inner arc */}
            <path
              d="M8.53 16.11a6 6 0 0 1 6.95 0"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Dot */}
            <circle cx="12" cy="20" r="1" fill="currentColor" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          You&apos;re offline
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          Check your internet connection and try again.
        </p>

        <button
          onClick={() => window.location.reload()}
          className="w-full bg-green-600 hover:bg-green-700 active:bg-green-800 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
