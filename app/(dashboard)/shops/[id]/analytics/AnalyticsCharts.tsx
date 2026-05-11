'use client'

type Bucket = { chats: number; orders: number }
type LangEntry = { lang: string; count: number }

const LANG_COLORS: Record<string, string> = {
  roman_urdu: '#16a34a',
  urdu: '#2563eb',
  english: '#7c3aed',
  unknown: '#9ca3af',
}

function BarChart({
  data,
  label,
  color,
}: {
  data: { date: string; value: number }[]
  label: string
  color: string
}) {
  const max = Math.max(...data.map((d) => d.value), 1)
  const showEvery = data.length > 14 ? Math.ceil(data.length / 7) : 1

  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{label}</p>
      <div className="flex items-end gap-1 h-28">
        {data.map((d, i) => (
          <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group relative">
            <div
              className="w-full rounded-t-sm transition-all"
              style={{
                height: `${Math.max((d.value / max) * 100, d.value > 0 ? 4 : 0)}%`,
                backgroundColor: color,
                opacity: d.value > 0 ? 1 : 0.15,
              }}
            />
            {i % showEvery === 0 && (
              <span className="text-[9px] text-gray-300 rotate-45 origin-left whitespace-nowrap">
                {d.date.slice(5)}
              </span>
            )}
            {/* Tooltip */}
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-1.5 py-0.5 rounded hidden group-hover:block whitespace-nowrap z-10">
              {d.date}: {d.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AnalyticsCharts({
  buckets,
  langBreakdown,
  days,
}: {
  buckets: Record<string, Bucket>
  langBreakdown: LangEntry[]
  days: number
}) {
  const dates = Object.keys(buckets).sort()
  const chatData = dates.map((date) => ({ date, value: buckets[date].chats }))
  const orderData = dates.map((date) => ({ date, value: buckets[date].orders }))

  const totalLang = langBreakdown.reduce((s, l) => s + l.count, 0)

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <BarChart data={chatData} label={`Chats — last ${days} days`} color="#16a34a" />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <BarChart data={orderData} label={`Orders — last ${days} days`} color="#2563eb" />
      </div>

      {langBreakdown.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Language Breakdown</p>
          <div className="space-y-3">
            {langBreakdown.sort((a, b) => b.count - a.count).map((l) => (
              <div key={l.lang} className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-24 capitalize flex-shrink-0">
                  {l.lang.replace('_', ' ')}
                </span>
                <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-2 rounded-full"
                    style={{
                      width: `${(l.count / totalLang) * 100}%`,
                      backgroundColor: LANG_COLORS[l.lang] ?? '#9ca3af',
                    }}
                  />
                </div>
                <span className="text-sm font-semibold text-gray-900 w-8 text-right flex-shrink-0">
                  {l.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
