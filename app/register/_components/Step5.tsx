'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/src/context/AuthContext'
import { supabase } from '@/src/lib/supabase'
import { useRegister, AssetType, RegisterPurpose, SettlementCycle } from './RegisterContext'
import NavButtons from './NavButtons'

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

export default function Step5() {
  const { form, setForm, resetForm } = useRegister()
  const { user } = useAuth()
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!user) return
    setSubmitting(true)
    const { error } = await supabase
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
    setSubmitting(false)
    if (!error) {
      resetForm()
      router.push('/dashboard')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* 등록 구분 */}
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

      {/* 자산 기본정보 */}
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

      {/* 소유자 및 지분 */}
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

      <NavButtons
        onBack={() => router.push('/register/step/4')}
        onNext={handleSubmit}
        nextLabel="등록 요청하기"
        nextDisabled={!form.agreed}
        loading={submitting}
      />
    </div>
  )
}
