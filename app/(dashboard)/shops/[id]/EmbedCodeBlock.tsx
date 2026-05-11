'use client'

import { useState } from 'react'

export default function EmbedCodeBlock({ scriptTag, chatUrl }: { scriptTag: string; chatUrl: string }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(scriptTag).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h2 className="font-semibold text-gray-900 mb-1">Embed Code</h2>
      <p className="text-sm text-gray-500 mb-4">
        Paste this code inside the &lt;body&gt; tag of your website.
      </p>
      <div className="relative group">
        <div className="bg-gray-900 rounded-xl p-4 overflow-x-auto pr-16">
          <code className="text-green-400 text-xs font-mono whitespace-nowrap">{scriptTag}</code>
        </div>
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all bg-gray-700 hover:bg-gray-600 text-gray-200"
        >
          {copied ? (
            <>
              <svg className="w-3.5 h-3.5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-green-400">Copied!</span>
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy
            </>
          )}
        </button>
      </div>
      <p className="text-xs text-gray-400 mt-3">
        Direct chat link:{' '}
        <a
          href={chatUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-green-600 hover:underline"
        >
          {chatUrl.replace(/^https?:\/\//, '')}
        </a>
      </p>
    </div>
  )
}
