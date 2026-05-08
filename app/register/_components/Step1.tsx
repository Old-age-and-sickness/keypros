'use client'

import { useRouter } from 'next/navigation'
import { useRegister, AssetType, RegisterPurpose } from './RegisterContext'
import NavButtons from './NavButtons'

const ASSET_TYPE_OPTIONS: { value: AssetType; label: string; desc: string }[] = [
  { value: 'COMMERCIAL', label: '상업용 건물', desc: '상가, 오피스, 근린생활시설 등' },
  { value: 'LAND',       label: '토지',        desc: '나대지, 임야, 전답 등' },
  { value: 'APARTMENT',  label: '아파트',       desc: '공동주택, 연립주택 등' },
  { value: 'OFFICETEL',  label: '오피스텔',     desc: '업무·주거 복합형' },
]

const PURPOSE_OPTIONS: { value: RegisterPurpose; label: string; desc: string }[] = [
  { value: 'CO_OWNERSHIP', label: '공동소유 관리', desc: '여러 소유자의 지분 및 의사결정 관리' },
  { value: 'SETTLEMENT',   label: '수익정산 관리', desc: '임대수익, 비용 배분 및 정산 관리' },
]

export default function Step1() {
  const { form, setForm } = useRegister()
  const router = useRouter()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="text-sm font-bold text-slate-800 mb-3">자산 유형을 선택하세요</h3>
        <div className="grid grid-cols-2 gap-3">
          {ASSET_TYPE_OPTIONS.map(opt => (
            <button key={opt.value} onClick={() => setForm(f => ({ ...f, asset_type: opt.value }))}
              className={`text-left p-4 rounded-2xl border-2 transition-all ${
                form.asset_type === opt.value
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}>
              <p className={`text-sm font-bold ${form.asset_type === opt.value ? 'text-indigo-700' : 'text-slate-700'}`}>
                {opt.label}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">{opt.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold text-slate-800 mb-3">등록 목적을 선택하세요</h3>
        <div className="flex flex-col gap-3">
          {PURPOSE_OPTIONS.map(opt => (
            <button key={opt.value} onClick={() => setForm(f => ({ ...f, purpose: opt.value }))}
              className={`text-left p-4 rounded-2xl border-2 transition-all flex items-start gap-3 ${
                form.purpose === opt.value
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}>
              <div className={`w-4 h-4 rounded-full border-2 mt-0.5 shrink-0 flex items-center justify-center ${
                form.purpose === opt.value ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'
              }`}>
                {form.purpose === opt.value && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
              <div>
                <p className={`text-sm font-bold ${form.purpose === opt.value ? 'text-indigo-700' : 'text-slate-700'}`}>
                  {opt.label}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">{opt.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <NavButtons
        onNext={() => router.push('/register/step/2')}
        nextLabel="다음 — 등기 인증"
      />
    </div>
  )
}
