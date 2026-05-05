'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/src/context/AuthContext'
import { supabase } from '@/src/lib/supabase'

type RentalUnit = {
  unit_number: string
  floor: string
  area_sqm: string
  tenant_name: string
  business_type: string
  deposit: string
  monthly_rent: string
  mgmt_fee: string
  lease_start: string
  lease_end: string
  status: 'OCCUPIED' | 'VACANT' | 'RESERVED'
}

type RegistrationRequest = {
  id: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  name: string
  reject_reason: string | null
}

const emptyUnit = (): RentalUnit => ({
  unit_number: '', floor: '', area_sqm: '',
  tenant_name: '', business_type: '',
  deposit: '', monthly_rent: '', mgmt_fee: '',
  lease_start: '', lease_end: '',
  status: 'VACANT',
})

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
        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 transition"
      />
    </div>
  )
}

export default function RegisterAssetTab() {
  const { user } = useAuth()
  const [existing, setExisting] = useState<RegistrationRequest | null | undefined>(undefined)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    name: '', address: '', asset_type: 'COMMERCIAL',
    acquisition_price: '', acquisition_date: '',
    total_area_sqm: '', floors_above: '', floors_below: '',
    settlement_cycle: 'MONTHLY', purpose: '',
  })
  const [units, setUnits] = useState<RentalUnit[]>([])

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

  const updateUnit = (i: number, key: keyof RentalUnit, value: string) =>
    setUnits(prev => prev.map((u, idx) => idx === i ? { ...u, [key]: value } : u))

  const handleSubmit = async () => {
    if (!user) return
    setSubmitting(true)
    const { data, error } = await supabase
      .from('property_registration_requests')
      .insert({
        requested_by: user.id,
        name: form.name,
        address: form.address,
        asset_type: form.asset_type,
        acquisition_price: Number(form.acquisition_price),
        acquisition_date: form.acquisition_date,
        total_area_sqm: form.total_area_sqm ? Number(form.total_area_sqm) : null,
        floors_above: form.floors_above ? Number(form.floors_above) : null,
        floors_below: form.floors_below ? Number(form.floors_below) : null,
        settlement_cycle: form.settlement_cycle,
        purpose: form.purpose || null,
        rental_units: units.map(u => ({
          ...u,
          floor: u.floor ? Number(u.floor) : null,
          area_sqm: u.area_sqm ? Number(u.area_sqm) : null,
          deposit: u.deposit ? Number(u.deposit) : 0,
          monthly_rent: u.monthly_rent ? Number(u.monthly_rent) : 0,
          mgmt_fee: u.mgmt_fee ? Number(u.mgmt_fee) : 0,
        })),
      })
      .select('id, status, name, reject_reason')
      .single()
    if (!error && data) setExisting(data as RegistrationRequest)
    setSubmitting(false)
  }

  const isValid = form.name && form.address && form.acquisition_price && form.acquisition_date

  if (existing === undefined) return (
    <div className="flex items-center justify-center py-20 text-slate-400 text-sm gap-2">
      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
      </svg>
      불러오는 중...
    </div>
  )

  if (existing?.status === 'PENDING') return (
    <div className="flex items-center justify-center py-20">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-10 text-center flex flex-col items-center gap-4 max-w-sm w-full">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-3xl">⏳</div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">등록 요청 검토 중</h2>
          <p className="text-slate-500 text-sm mt-1.5">관리자가 자산 등록을 검토하고 있습니다</p>
        </div>
        <div className="bg-slate-50 rounded-xl border border-slate-100 px-5 py-3 text-sm text-slate-600">
          신청 자산: <span className="font-semibold">{existing.name}</span>
        </div>
      </div>
    </div>
  )

  if (existing?.status === 'REJECTED') return (
    <div className="flex items-center justify-center py-20">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-10 text-center flex flex-col items-center gap-4 max-w-sm w-full">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-3xl">✕</div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">등록이 거절되었습니다</h2>
          {existing.reject_reason && (
            <p className="text-slate-500 text-sm mt-1.5">사유: {existing.reject_reason}</p>
          )}
        </div>
        <button
          onClick={() => setExisting(null)}
          className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          다시 신청하기
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col gap-5">
      {/* 자산 기본정보 */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600">
              <path d="M3 22V10l9-7 9 7v12"/><path d="M9 22V16h6v6"/>
            </svg>
          </div>
          <h2 className="text-sm font-bold text-slate-800">자산 기본정보</h2>
          <span className="text-xs text-rose-400 font-medium ml-1">* 필수항목</span>
        </div>
        <div className="p-5 grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Field label="자산명" value={form.name} onChange={v => setForm(f => ({...f, name: v}))}
              placeholder="예) 강남 상업용 건물" required />
          </div>
          <div className="col-span-2">
            <Field label="주소" value={form.address} onChange={v => setForm(f => ({...f, address: v}))}
              placeholder="예) 서울시 강남구 테헤란로 123" required />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">자산유형 <span className="text-rose-400">*</span></label>
            <select value={form.asset_type} onChange={e => setForm(f => ({...f, asset_type: e.target.value}))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 transition bg-white">
              <option value="COMMERCIAL">상업용</option>
              <option value="LAND">토지</option>
              <option value="APARTMENT">아파트</option>
              <option value="OFFICETEL">오피스텔</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">정산주기 <span className="text-rose-400">*</span></label>
            <select value={form.settlement_cycle} onChange={e => setForm(f => ({...f, settlement_cycle: e.target.value}))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 transition bg-white">
              <option value="MONTHLY">월별</option>
              <option value="QUARTERLY">분기</option>
              <option value="SEMIANNUAL">반기</option>
              <option value="ANNUAL">연간</option>
            </select>
          </div>

          <div>
            <Field label="취득가 (원)" type="number" value={form.acquisition_price}
              onChange={v => setForm(f => ({...f, acquisition_price: v}))} placeholder="예) 500000000" required />
          </div>
          <div>
            <Field label="취득일" type="date" value={form.acquisition_date}
              onChange={v => setForm(f => ({...f, acquisition_date: v}))} required />
          </div>

          <div>
            <Field label="총면적 (㎡)" type="number" value={form.total_area_sqm}
              onChange={v => setForm(f => ({...f, total_area_sqm: v}))} placeholder="예) 330.5" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="지상층수" type="number" value={form.floors_above}
              onChange={v => setForm(f => ({...f, floors_above: v}))} placeholder="예) 5" />
            <Field label="지하층수" type="number" value={form.floors_below}
              onChange={v => setForm(f => ({...f, floors_below: v}))} placeholder="예) 1" />
          </div>

          <div className="col-span-2">
            <label className="block text-xs font-medium text-slate-500 mb-1.5">비고 / 용도</label>
            <textarea value={form.purpose} onChange={e => setForm(f => ({...f, purpose: e.target.value}))}
              placeholder="자산에 대한 추가 설명을 입력하세요" rows={2}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 transition resize-none" />
          </div>
        </div>
      </div>

      {/* 임대 호실 */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600">
                <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
              </svg>
            </div>
            <h2 className="text-sm font-bold text-slate-800">임대 호실</h2>
            <span className="text-xs text-slate-400">(선택사항)</span>
          </div>
          <button onClick={() => setUnits(u => [...u, emptyUnit()])}
            className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
            호실 추가
          </button>
        </div>

        {units.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-slate-400 text-sm">임대 호실이 없으면 생략할 수 있습니다</p>
            <p className="text-slate-300 text-xs mt-0.5">우측 상단 버튼으로 호실을 추가하세요</p>
          </div>
        ) : (
          <div className="p-5 flex flex-col gap-4">
            {units.map((unit, i) => (
              <div key={i} className="border border-slate-100 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-600">호실 {i + 1}</span>
                  <button onClick={() => setUnits(u => u.filter((_, idx) => idx !== i))}
                    className="text-slate-300 hover:text-rose-400 transition-colors">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="호실번호" value={unit.unit_number} onChange={v => updateUnit(i, 'unit_number', v)} placeholder="예) 101" />
                  <Field label="층" type="number" value={unit.floor} onChange={v => updateUnit(i, 'floor', v)} placeholder="예) 1" />
                  <Field label="면적 (㎡)" type="number" value={unit.area_sqm} onChange={v => updateUnit(i, 'area_sqm', v)} placeholder="예) 66.1" />
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">상태</label>
                    <select value={unit.status} onChange={e => updateUnit(i, 'status', e.target.value as RentalUnit['status'])}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:border-indigo-400 bg-white transition">
                      <option value="OCCUPIED">임차중</option>
                      <option value="VACANT">공실</option>
                      <option value="RESERVED">예약</option>
                    </select>
                  </div>
                  <Field label="임차인명" value={unit.tenant_name} onChange={v => updateUnit(i, 'tenant_name', v)} placeholder="예) 홍길동" />
                  <Field label="업종" value={unit.business_type} onChange={v => updateUnit(i, 'business_type', v)} placeholder="예) 카페" />
                  <Field label="보증금 (원)" type="number" value={unit.deposit} onChange={v => updateUnit(i, 'deposit', v)} placeholder="예) 50000000" />
                  <Field label="월세 (원)" type="number" value={unit.monthly_rent} onChange={v => updateUnit(i, 'monthly_rent', v)} placeholder="예) 1500000" />
                  <Field label="관리비 (원)" type="number" value={unit.mgmt_fee} onChange={v => updateUnit(i, 'mgmt_fee', v)} placeholder="예) 200000" />
                  <div />
                  <Field label="임대 시작일" type="date" value={unit.lease_start} onChange={v => updateUnit(i, 'lease_start', v)} />
                  <Field label="임대 종료일" type="date" value={unit.lease_end} onChange={v => updateUnit(i, 'lease_end', v)} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 제출 버튼 */}
      <button
        onClick={handleSubmit}
        disabled={!isValid || submitting}
        className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white rounded-2xl font-semibold text-sm transition-all shadow-sm shadow-indigo-200 hover:shadow-md hover:shadow-indigo-200 active:scale-[0.99]"
      >
        {submitting ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            신청 중...
          </span>
        ) : '관리자에게 등록 요청하기'}
      </button>
    </div>
  )
}
