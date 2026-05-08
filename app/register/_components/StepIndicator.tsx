'use client'

const STEPS = [
  { num: 1, label: '등록 시작' },
  { num: 2, label: '등기 인증' },
  { num: 3, label: '기본정보' },
  { num: 4, label: '소유자·지분' },
  { num: 5, label: '최종 확인' },
]

export default function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-between mb-7">
      {STEPS.map((s, i) => (
        <div key={s.num} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center gap-1 shrink-0">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
              s.num < current
                ? 'bg-indigo-600 text-white'
                : s.num === current
                ? 'bg-indigo-600 text-white ring-4 ring-indigo-100'
                : 'bg-slate-100 text-slate-400'
            }`}>
              {s.num < current ? (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
              ) : s.num}
            </div>
            <span className={`text-[10px] font-medium whitespace-nowrap ${
              s.num <= current ? 'text-indigo-600' : 'text-slate-400'
            }`}>{s.label}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`flex-1 h-0.5 mx-1 mt-[-14px] transition-colors ${
              s.num < current ? 'bg-indigo-400' : 'bg-slate-200'
            }`} />
          )}
        </div>
      ))}
    </div>
  )
}
