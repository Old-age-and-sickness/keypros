'use client'

import { useRouter } from 'next/navigation'
import { useRegister, SettlementCycle } from './RegisterContext'
import NavButtons from './NavButtons'

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

export default function Step3() {
  const { form, setForm } = useRegister()
  const router = useRouter()

  const s = (key: keyof typeof form) => (v: string) => setForm(prev => ({ ...prev, [key]: v }))
  const isValid = form.asset_name && form.address && form.acquisition_price && form.acquisition_date

  return (
    <div className="flex flex-col gap-4">
      <Field label="자산명" value={form.asset_name} onChange={s('asset_name')}
        placeholder="예) 강남 상업용 건물" required />
      <Field label="주소" value={form.address} onChange={s('address')}
        placeholder={form.registry_address || '예) 서울시 강남구 테헤란로 123'} required />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">현재 상태</label>
          <select value={form.current_status}
            onChange={e => setForm(p => ({ ...p, current_status: e.target.value }))}
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
          <select value={form.settlement_cycle}
            onChange={e => setForm(p => ({ ...p, settlement_cycle: e.target.value as SettlementCycle }))}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:border-indigo-400 bg-white transition">
            <option value="MONTHLY">월별</option>
            <option value="QUARTERLY">분기</option>
            <option value="SEMIANNUAL">반기</option>
            <option value="ANNUAL">연간</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="취득가 (원)" type="number" value={form.acquisition_price}
          onChange={s('acquisition_price')} placeholder="예) 500000000" required />
        <Field label="취득일" type="date" value={form.acquisition_date}
          onChange={s('acquisition_date')} required />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Field label="총면적 (㎡)" type="number" value={form.total_area_sqm}
          onChange={s('total_area_sqm')} placeholder="예) 330.5" />
        <Field label="지상층수" type="number" value={form.floors_above}
          onChange={s('floors_above')} placeholder="예) 5" />
        <Field label="지하층수" type="number" value={form.floors_below}
          onChange={s('floors_below')} placeholder="예) 1" />
      </div>

      <NavButtons
        onBack={() => router.push('/register/step/2')}
        onNext={() => router.push('/register/step/4')}
        nextLabel="다음 — 소유자·지분 설정"
        nextDisabled={!isValid}
      />
    </div>
  )
}
