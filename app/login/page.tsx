'use client'

import { supabase } from '@/src/lib/supabase'

export default function LoginPage() {
  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
      {/* background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 mb-5">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-indigo-300">
              <path d="M3 22V10l9-7 9 7v12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9 22V16h6v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="12" r="1.2" fill="currentColor"/>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">keypros</h1>
          <p className="text-slate-400 mt-2 text-sm">공동소유 부동산 관리 플랫폼</p>
        </div>

        {/* Card */}
        <div className="bg-white/8 backdrop-blur-md border border-white/12 rounded-3xl p-7">
          {/* Features */}
          <ul className="space-y-3 mb-7">
            {[
              { icon: '🏢', text: '자산 등록 및 현황 조회' },
              { icon: '📊', text: '수입·비용 거래 정산' },
              { icon: '⚖️', text: '공동소유자 의결권 행사' },
              { icon: '👥', text: '지분율 기반 배분 계산' },
            ].map(item => (
              <li key={item.text} className="flex items-center gap-3">
                <span className="text-base leading-none">{item.icon}</span>
                <span className="text-slate-300 text-sm">{item.text}</span>
              </li>
            ))}
          </ul>

          {/* CTA */}
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 px-5 py-3.5 bg-white hover:bg-slate-50 text-slate-800 font-semibold rounded-2xl transition-all duration-150 shadow-lg shadow-black/25 hover:shadow-xl hover:shadow-black/35 active:scale-[0.98] active:shadow-md text-sm"
          >
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.35-8.16 2.35-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Google로 시작하기
          </button>
        </div>

        <p className="text-center text-slate-500 text-xs mt-5">
          초대받은 사용자만 접근할 수 있습니다
        </p>
      </div>
    </main>
  )
}
