'use client'

import { notFound } from 'next/navigation'
import { use } from 'react'
import { useRouter } from 'next/navigation'
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

export default function RegisterStepPage({ params }: { params: Promise<{ step: string }> }) {
  const { step: stepStr } = use(params)
  const stepNum = Number(stepStr)
  const router = useRouter()

  if (!stepNum || stepNum < 1 || stepNum > 5) notFound()

  const StepComponent = STEP_COMPONENTS[stepNum]

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-xl mx-auto px-5 h-14 flex items-center justify-between">
          <button onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors">
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
          <div className="w-16" /> {/* spacer */}
        </div>
      </header>

      <main className="max-w-xl mx-auto px-5 py-8">
        <div className="mb-5">
          <h2 className="text-base font-bold text-slate-900">{STEP_TITLES[stepNum]}</h2>
          <p className="text-xs text-slate-400 mt-0.5">단계 {stepNum} / 5</p>
        </div>

        <StepIndicator current={stepNum} />

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <StepComponent />
        </div>
      </main>
    </div>
  )
}
