'use client'

export default function NavButtons({ onBack, onNext, nextLabel = '다음', nextDisabled, loading }: {
  onBack?: () => void
  onNext: () => void
  nextLabel?: string
  nextDisabled?: boolean
  loading?: boolean
}) {
  return (
    <div className="flex gap-3 mt-6">
      {onBack && (
        <button onClick={onBack}
          className="flex-1 py-3 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">
          이전
        </button>
      )}
      <button onClick={onNext} disabled={nextDisabled || loading}
        className="flex-[2] py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all shadow-sm shadow-indigo-200 active:scale-[0.99]">
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            처리 중...
          </span>
        ) : nextLabel}
      </button>
    </div>
  )
}
