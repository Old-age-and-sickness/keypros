'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/src/context/AuthContext'
import { supabase } from '@/src/lib/supabase'

// ─── Types ───────────────────────────────────────────────────────────────────

type AssetType = 'COMMERCIAL' | 'LAND' | 'APARTMENT' | 'OFFICETEL'
type RegisterPurpose = 'CO_OWNERSHIP' | 'SETTLEMENT'
type SettlementCycle = 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUAL' | 'ANNUAL'
type VerifyStatus = 'IDLE' | 'UPLOADING' | 'VERIFIED' | 'FAILED'

type Owner = {
  name: string
  contact: string
  share_ratio: string
  is_representative: boolean
}

type FormData = {
  // Step 1
  asset_type: AssetType
  purpose: RegisterPurpose
  // Step 2
  registry_file: File | null
  registry_address: string
  registry_owner: string
  verify_status: VerifyStatus
  // Step 3
  asset_name: string
  address: string
  total_area_sqm: string
  floors_above: string
  floors_below: string
  current_status: string
  settlement_cycle: SettlementCycle
  acquisition_price: string
  acquisition_date: string
  // Step 4
  owners: Owner[]
  // Step 5 (agree)
  agreed: boolean
}

type RegistrationRequest = {
  id: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  name: string
  reject_reason: string | null
}

// ─── Constants ───────────────────────────────────────────────────────────────

const STEPS = [
  { num: 1, label: '등록 시작' },
  { num: 2, label: '등기 인증' },
  { num: 3, label: '기본정보' },
  { num: 4, label: '소유자·지분' },
  { num: 5, label: '최종 확인' },
]

const ASSET_TYPE_OPTIONS: { value: AssetType; label: string; desc: string }[] = [
  { value: 'COMMERCIAL', label: '상업용 건물', desc: '상가, 오피스, 근린생활시설 등' },
  { value: 'LAND', label: '토지', desc: '나대지, 임야, 전답 등' },
  { value: 'APARTMENT', label: '아파트', desc: '공동주택, 연립주택 등' },
  { value: 'OFFICETEL', label: '오피스텔', desc: '업무·주거 복합형' },
]

const PURPOSE_OPTIONS: { value: RegisterPurpose; label: string; desc: string }[] = [
  { value: 'CO_OWNERSHIP', label: '공동소유 관리', desc: '여러 소유자의 지분 및 의사결정 관리' },
  { value: 'SETTLEMENT', label: '수익정산 관리', desc: '임대수익, 비용 배분 및 정산 관리' },
]

const emptyOwner = (): Owner => ({
  name: '', contact: '', share_ratio: '', is_representative: false,
})

const initialForm: FormData = {
  asset_type: 'COMMERCIAL',
  purpose: 'CO_OWNERSHIP',
  registry_file: null,
  registry_address: '',
  registry_owner: '',
  verify_status: 'IDLE',
  asset_name: '',
  address: '',
  total_area_sqm: '',
  floors_above: '',
  floors_below: '',
  current_status: '',
  settlement_cycle: 'MONTHLY',
  acquisition_price: '',
  acquisition_date: '',
  owners: [{ name: '', contact: '', share_ratio: '100', is_representative: true }],
  agreed: false,
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: number }) {
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

function Field({ label, value, onChange, placeholder, type = 'text', required }: {
  label: string; value: string; onChange: (v: string) => void
  placeholder?: string; type?: string; required?: boolean
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 mb-1.5">
        {label} {required && <span className="text-rose-400">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 transition"
      />
    </div>
  )
}

function NavButtons({ onBack, onNext, nextLabel = '다음', nextDisabled, loading }: {
  onBack?: () => void; onNext: () => void; nextLabel?: string; nextDisabled?: boolean; loading?: boolean
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

// ─── Step 1: 등록 시작 ────────────────────────────────────────────────────────

function Step1({ form, setForm, onNext }: {
  form: FormData; setForm: React.Dispatch<React.SetStateAction<FormData>>; onNext: () => void
}) {
  return (
    <div className="flex flex-col gap-5">
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

      <NavButtons onNext={onNext} nextLabel="다음 — 등기 인증" />
    </div>
  )
}

// ─── Step 2: 등기부등본 기반 인증 ───────────────────────────────────────────────

function Step2({ form, setForm, onBack, onNext }: {
  form: FormData; setForm: React.Dispatch<React.SetStateAction<FormData>>; onBack: () => void; onNext: () => void
}) {
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    setForm(f => ({ ...f, registry_file: file, verify_status: file ? 'UPLOADING' : 'IDLE' }))
    if (file) {
      setTimeout(() => {
        setForm(f => ({
          ...f,
          verify_status: 'VERIFIED',
          registry_address: f.registry_address || '서울시 강남구 테헤란로 123',
          registry_owner: f.registry_owner || '홍길동 외 2인',
        }))
      }, 1500)
    }
  }

  const verified = form.verify_status === 'VERIFIED'

  return (
    <div className="flex flex-col gap-5">
      {/* 파일 업로드 */}
      <div className={`rounded-2xl border-2 border-dashed p-7 flex flex-col items-center gap-3 transition-colors ${
        form.registry_file ? 'border-indigo-300 bg-indigo-50/50' : 'border-slate-200 hover:border-slate-300'
      }`}>
        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <path d="M14 2v6h6M12 18v-6M9 15l3-3 3 3"/>
          </svg>
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-700">
            {form.registry_file ? form.registry_file.name : '등기부등본을 업로드하세요'}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">PDF, JPG, PNG 지원 · 최대 10MB</p>
        </div>
        <label className="cursor-pointer px-5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition">
          파일 선택
          <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFile} className="hidden" />
        </label>
      </div>

      {/* 인증 상태 */}
      {form.verify_status === 'UPLOADING' && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200">
          <svg className="animate-spin w-5 h-5 text-amber-500 shrink-0" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          <div>
            <p className="text-sm font-semibold text-amber-700">등기 정보 확인 중...</p>
            <p className="text-xs text-amber-500 mt-0.5">소유자 및 지분 정보를 추출하고 있습니다</p>
          </div>
        </div>
      )}

      {verified && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-emerald-200">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/>
            </svg>
            <span className="text-sm font-bold text-emerald-700">등기 인증 완료</span>
          </div>
          <div className="p-4 flex flex-col gap-2.5">
            <div>
              <p className="text-[10px] font-medium text-emerald-600 uppercase tracking-wide mb-0.5">소재지</p>
              <input value={form.registry_address} onChange={e => setForm(f => ({ ...f, registry_address: e.target.value }))}
                className="w-full text-sm text-slate-800 bg-white border border-emerald-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-400 transition" />
            </div>
            <div>
              <p className="text-[10px] font-medium text-emerald-600 uppercase tracking-wide mb-0.5">소유자</p>
              <input value={form.registry_owner} onChange={e => setForm(f => ({ ...f, registry_owner: e.target.value }))}
                className="w-full text-sm text-slate-800 bg-white border border-emerald-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-400 transition" />
            </div>
          </div>
        </div>
      )}

      {/* 건너뛰기 안내 */}
      {!verified && (
        <p className="text-center text-xs text-slate-400">
          등기부등본이 없으신가요?{' '}
          <button onClick={onNext} className="text-indigo-500 underline underline-offset-2 font-medium">
            인증 없이 계속하기
          </button>
        </p>
      )}

      <NavButtons onBack={onBack} onNext={onNext} nextLabel="다음 — 기본정보 입력"
        nextDisabled={form.verify_status === 'UPLOADING'} />
    </div>
  )
}

// ─── Step 3: 자산 기본정보 입력 ──────────────────────────────────────────────────

function Step3({ form, setForm, onBack, onNext }: {
  form: FormData; setForm: React.Dispatch<React.SetStateAction<FormData>>; onBack: () => void; onNext: () => void
}) {
  const f = form
  const s = (key: keyof FormData) => (v: string) => setForm(prev => ({ ...prev, [key]: v }))
  const isValid = f.asset_name && f.address && f.acquisition_price && f.acquisition_date

  return (
    <div className="flex flex-col gap-4">
      <Field label="자산명" value={f.asset_name} onChange={s('asset_name')} placeholder="예) 강남 상업용 건물" required />
      <Field label="주소" value={f.address} onChange={s('address')}
        placeholder={form.registry_address || '예) 서울시 강남구 테헤란로 123'} required />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">현재 상태</label>
          <select value={f.current_status} onChange={e => setForm(p => ({ ...p, current_status: e.target.value }))}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:border-indigo-400 bg-white transition">
            <option value="">선택</option>
            <option value="OPERATING">운영중</option>
            <option value="VACANT">공실</option>
            <option value="UNDER_RENOVATION">공사중</option>
            <option value="FOR_SALE">매각예정</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">정산 주기</label>
          <select value={f.settlement_cycle} onChange={e => setForm(p => ({ ...p, settlement_cycle: e.target.value as SettlementCycle }))}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:border-indigo-400 bg-white transition">
            <option value="MONTHLY">월별</option>
            <option value="QUARTERLY">분기</option>
            <option value="SEMIANNUAL">반기</option>
            <option value="ANNUAL">연간</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="취득가 (원)" type="number" value={f.acquisition_price} onChange={s('acquisition_price')} placeholder="예) 500000000" required />
        <Field label="취득일" type="date" value={f.acquisition_date} onChange={s('acquisition_date')} required />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Field label="총면적 (㎡)" type="number" value={f.total_area_sqm} onChange={s('total_area_sqm')} placeholder="예) 330.5" />
        <Field label="지상층수" type="number" value={f.floors_above} onChange={s('floors_above')} placeholder="예) 5" />
        <Field label="지하층수" type="number" value={f.floors_below} onChange={s('floors_below')} placeholder="예) 1" />
      </div>

      <NavButtons onBack={onBack} onNext={onNext} nextLabel="다음 — 소유자·지분 설정" nextDisabled={!isValid} />
    </div>
  )
}

// ─── Step 4: 소유자 및 지분 설정 ─────────────────────────────────────────────────

function Step4({ form, setForm, onBack, onNext }: {
  form: FormData; setForm: React.Dispatch<React.SetStateAction<FormData>>; onBack: () => void; onNext: () => void
}) {
  const totalShare = form.owners.reduce((acc, o) => acc + (parseFloat(o.share_ratio) || 0), 0)
  const shareValid = Math.abs(totalShare - 100) < 0.01
  const ownersValid = form.owners.every(o => o.name && o.share_ratio)

  const update = (i: number, key: keyof Owner, value: string | boolean) =>
    setForm(f => ({
      ...f,
      owners: f.owners.map((o, idx) => idx === i ? { ...o, [key]: value } : o),
    }))

  const setRepresentative = (i: number) =>
    setForm(f => ({
      ...f,
      owners: f.owners.map((o, idx) => ({ ...o, is_representative: idx === i })),
    }))

  return (
    <div className="flex flex-col gap-4">
      {/* 지분 합계 배지 */}
      <div className={`flex items-center justify-between px-4 py-3 rounded-2xl border transition-colors ${
        shareValid ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'
      }`}>
        <span className={`text-xs font-medium ${shareValid ? 'text-emerald-600' : 'text-amber-600'}`}>
          지분 합계
        </span>
        <span className={`text-sm font-bold ${shareValid ? 'text-emerald-700' : 'text-amber-700'}`}>
          {totalShare.toFixed(2)}% {shareValid ? '✓' : '— 100%가 되어야 합니다'}
        </span>
      </div>

      {/* 소유자 목록 */}
      {form.owners.map((owner, i) => (
        <div key={i} className={`rounded-2xl border p-4 transition-colors ${
          owner.is_representative ? 'border-indigo-200 bg-indigo-50/40' : 'border-slate-200'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-600">소유자 {i + 1}</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setRepresentative(i)}
                className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg transition-colors ${
                  owner.is_representative
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}>
                {owner.is_representative ? '대표자 ✓' : '대표자 지정'}
              </button>
              {form.owners.length > 1 && (
                <button onClick={() => setForm(f => ({ ...f, owners: f.owners.filter((_, idx) => idx !== i) }))}
                  className="text-slate-300 hover:text-rose-400 transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="소유자명" value={owner.name} onChange={v => update(i, 'name', v)} placeholder="예) 홍길동" required />
            <Field label="연락처" value={owner.contact} onChange={v => update(i, 'contact', v)} placeholder="예) 010-0000-0000" />
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-500 mb-1.5">지분율 (%) <span className="text-rose-400">*</span></label>
              <div className="flex items-center gap-2">
                <input type="number" min="0" max="100" step="0.01" value={owner.share_ratio}
                  onChange={e => update(i, 'share_ratio', e.target.value)}
                  placeholder="예) 33.33"
                  className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:border-indigo-400 transition" />
                <span className="text-sm text-slate-500 font-medium">%</span>
              </div>
            </div>
          </div>
        </div>
      ))}

      <button onClick={() => setForm(f => ({ ...f, owners: [...f.owners, emptyOwner()] }))}
        className="flex items-center justify-center gap-1.5 w-full py-3 rounded-2xl border-2 border-dashed border-slate-200 text-xs font-semibold text-slate-500 hover:border-indigo-300 hover:text-indigo-500 hover:bg-indigo-50/50 transition-all">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
        소유자 추가
      </button>

      <NavButtons onBack={onBack} onNext={onNext} nextLabel="다음 — 최종 확인" nextDisabled={!ownersValid || !shareValid} />
    </div>
  )
}

// ─── Step 5: 최종 확인 및 제출 ────────────────────────────────────────────────────

function Step5({ form, setForm, onBack, onSubmit, submitting }: {
  form: FormData; setForm: React.Dispatch<React.SetStateAction<FormData>>
  onBack: () => void; onSubmit: () => void; submitting: boolean
}) {
  const ASSET_LABEL: Record<AssetType, string> = {
    COMMERCIAL: '상업용 건물', LAND: '토지', APARTMENT: '아파트', OFFICETEL: '오피스텔',
  }
  const PURPOSE_LABEL: Record<RegisterPurpose, string> = {
    CO_OWNERSHIP: '공동소유 관리', SETTLEMENT: '수익정산 관리',
  }
  const CYCLE_LABEL: Record<SettlementCycle, string> = {
    MONTHLY: '월별', QUARTERLY: '분기', SEMIANNUAL: '반기', ANNUAL: '연간',
  }

  function SummaryRow({ label, value }: { label: string; value: string }) {
    return (
      <div className="flex items-start justify-between py-2 border-b border-slate-100 last:border-0">
        <span className="text-xs text-slate-400 shrink-0 w-24">{label}</span>
        <span className="text-xs font-semibold text-slate-700 text-right">{value || '—'}</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* 자산 유형 & 목적 */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">등록 구분</p>
        </div>
        <div className="px-4 py-2">
          <SummaryRow label="자산 유형" value={ASSET_LABEL[form.asset_type]} />
          <SummaryRow label="등록 목적" value={PURPOSE_LABEL[form.purpose]} />
          <SummaryRow label="등기 인증" value={form.verify_status === 'VERIFIED' ? '인증 완료' : '인증 없음'} />
        </div>
      </div>

      {/* 기본정보 */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">자산 기본정보</p>
        </div>
        <div className="px-4 py-2">
          <SummaryRow label="자산명" value={form.asset_name} />
          <SummaryRow label="주소" value={form.address} />
          <SummaryRow label="취득가" value={form.acquisition_price ? `${Number(form.acquisition_price).toLocaleString()}원` : ''} />
          <SummaryRow label="취득일" value={form.acquisition_date} />
          <SummaryRow label="총면적" value={form.total_area_sqm ? `${form.total_area_sqm}㎡` : ''} />
          <SummaryRow label="정산 주기" value={CYCLE_LABEL[form.settlement_cycle]} />
        </div>
      </div>

      {/* 소유자 */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">소유자 및 지분</p>
        </div>
        <div className="px-4 py-2">
          {form.owners.map((o, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-700">{o.name || '—'}</span>
                {o.is_representative && (
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md">대표</span>
                )}
              </div>
              <span className="text-xs font-semibold text-slate-600">{o.share_ratio || 0}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* 동의 */}
      <button onClick={() => setForm(f => ({ ...f, agreed: !f.agreed }))}
        className={`flex items-start gap-3 p-4 rounded-2xl border-2 text-left transition-all ${
          form.agreed ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'
        }`}>
        <div className={`w-5 h-5 rounded-md border-2 shrink-0 flex items-center justify-center mt-0.5 transition-colors ${
          form.agreed ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'
        }`}>
          {form.agreed && (
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
          )}
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          입력한 정보가 정확함을 확인하며, 관리자 검토 후 등록이 완료됨에 동의합니다. 허위 정보 입력 시 등록이 거절될 수 있습니다.
        </p>
      </button>

      <NavButtons onBack={onBack} onNext={onSubmit} nextLabel="등록 요청하기"
        nextDisabled={!form.agreed} loading={submitting} />
    </div>
  )
}

// ─── Status screens ────────────────────────────────────────────────────────────

function StatusScreen({ existing, onRetry }: { existing: RegistrationRequest; onRetry: () => void }) {
  const isPending = existing.status === 'PENDING'
  return (
    <div className="flex items-center justify-center py-20">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-10 text-center flex flex-col items-center gap-4 max-w-sm w-full">
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl ${
          isPending ? 'bg-amber-50 border border-amber-100' : 'bg-rose-50 border border-rose-100'
        }`}>
          {isPending ? '⏳' : '✕'}
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            {isPending ? '등록 요청 검토 중' : '등록이 거절되었습니다'}
          </h2>
          <p className="text-slate-500 text-sm mt-1.5">
            {isPending
              ? '관리자가 자산 등록을 검토하고 있습니다'
              : existing.reject_reason && `사유: ${existing.reject_reason}`}
          </p>
        </div>
        {isPending ? (
          <div className="bg-slate-50 rounded-xl border border-slate-100 px-5 py-3 text-sm text-slate-600">
            신청 자산: <span className="font-semibold">{existing.name}</span>
          </div>
        ) : (
          <button onClick={onRetry}
            className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors">
            다시 신청하기
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Root ────────────────────────────────────────────────────────────────────

export default function RegisterAssetTab() {
  const { user } = useAuth()
  const [existing, setExisting] = useState<RegistrationRequest | null | undefined>(undefined)
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormData>(initialForm)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!user) return
    supabase
      .from('property_registration_requests')
      .select('id, status, name, reject_reason')
      .eq('requested_by', user.id)
      .order('requested_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => setExisting(data as RegistrationRequest | null), () => setExisting(null))
  }, [user])

  const handleSubmit = async () => {
    if (!user) return
    setSubmitting(true)
    const { data, error } = await supabase
      .from('property_registration_requests')
      .insert({
        requested_by: user.id,
        name: form.asset_name,
        address: form.address,
        asset_type: form.asset_type,
        acquisition_price: Number(form.acquisition_price),
        acquisition_date: form.acquisition_date,
        total_area_sqm: form.total_area_sqm ? Number(form.total_area_sqm) : null,
        floors_above: form.floors_above ? Number(form.floors_above) : null,
        floors_below: form.floors_below ? Number(form.floors_below) : null,
        settlement_cycle: form.settlement_cycle,
        purpose: form.purpose,
        owners: form.owners,
        rental_units: [],
      })
      .select('id, status, name, reject_reason')
      .single()
    if (!error && data) setExisting(data as RegistrationRequest)
    setSubmitting(false)
  }

  const STEP_TITLES: Record<number, string> = {
    1: '자산 등록 시작',
    2: '등기부등본 기반 인증',
    3: '자산 기본정보 입력',
    4: '소유자 및 지분 설정',
    5: '등록 정보 최종 확인',
  }

  if (existing === undefined) return (
    <div className="flex items-center justify-center py-20 text-slate-400 text-sm gap-2">
      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
      </svg>
      불러오는 중...
    </div>
  )

  if (existing?.status === 'PENDING' || existing?.status === 'REJECTED') return (
    <StatusScreen existing={existing} onRetry={() => setExisting(null)} />
  )

  return (
    <div className="max-w-xl mx-auto">
      {/* 카드 헤더 */}
      <div className="mb-5">
        <h2 className="text-base font-bold text-slate-900">{STEP_TITLES[step]}</h2>
        <p className="text-xs text-slate-400 mt-0.5">단계 {step} / {STEPS.length}</p>
      </div>

      <StepIndicator current={step} />

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        {step === 1 && <Step1 form={form} setForm={setForm} onNext={() => setStep(2)} />}
        {step === 2 && <Step2 form={form} setForm={setForm} onBack={() => setStep(1)} onNext={() => setStep(3)} />}
        {step === 3 && <Step3 form={form} setForm={setForm} onBack={() => setStep(2)} onNext={() => setStep(4)} />}
        {step === 4 && <Step4 form={form} setForm={setForm} onBack={() => setStep(3)} onNext={() => setStep(5)} />}
        {step === 5 && <Step5 form={form} setForm={setForm} onBack={() => setStep(4)} onSubmit={handleSubmit} submitting={submitting} />}
      </div>
    </div>
  )
}
