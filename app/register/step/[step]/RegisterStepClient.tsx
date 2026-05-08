'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/src/context/AuthContext'
import StepIndicator from '../../_components/StepIndicator'
import Step1 from '../../_components/Step1'
import Step2 from '../../_components/Step2'
import Step3 from '../../_components/Step3'
import Step4 from '../../_components/Step4'
import Step5 from '../../_components/Step5'

const STEP_TITLES: Record<number, string> = {
  1: '자산 등록 시작',
  2: '등기부등본 기반 인증',
  3: '자산 기본정보 입력',
  4: '소유자 및 지분 설정',
  5: '등록 정보 최종 확인',
}

const STEP_COMPONENTS: Record<number, React.ComponentType> = {
  1: Step1,
  2: Step2,
  3: Step3,
  4: Step4,
  5: Step5,
}

export default function RegisterStepClient({ step }: { step: number }) {
  const router = useRouter()
  const { user, loading } = useAuth()
  const StepComponent = STEP_COMPONENTS[step]

  useEffect(() => {
    if (!loading && !user) router.replace('/login')
  }, [loading, user, router])

  if (loading || !user) return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <div className="flex items-center gap-2 text-slate-400 text-sm">
        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
        불러오는 중...
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-xl mx-auto px-5 h-14 flex items-center justify-between">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            <span className="text-sm font-medium">대시보드</span>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-white">
                <path d="M3 22V10l9-7 9 7v12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 22V16h6v6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="font-bold text-slate-900 tracking-tight text-sm">자산 등록</span>
          </div>
          <div className="w-16" />
        </div>
      </header>

      <main className="max-w-xl mx-auto px-5 py-8">
        <div className="mb-5">
          <h2 className="text-base font-bold text-slate-900">{STEP_TITLES[step]}</h2>
          <p className="text-xs text-slate-400 mt-0.5">단계 {step} / 5</p>
        </div>

        <StepIndicator current={step} />

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <StepComponent />
        </div>
      </main>
    </div>
  )
}
