'use client'

import { useRouter } from 'next/navigation'
import { useRegister, Owner } from './RegisterContext'
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

const emptyOwner = (): Owner => ({
  name: '', contact: '', share_ratio: '', is_representative: false,
})

export default function Step4() {
  const { form, setForm } = useRegister()
  const router = useRouter()

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
            <Field label="소유자명" value={owner.name} onChange={v => update(i, 'name', v)}
              placeholder="예) 홍길동" required />
            <Field label="연락처" value={owner.contact} onChange={v => update(i, 'contact', v)}
              placeholder="예) 010-0000-0000" />
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-500 mb-1.5">
                지분율 (%) <span className="text-rose-400">*</span>
              </label>
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
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M12 5v14M5 12h14"/>
        </svg>
        소유자 추가
      </button>

      <NavButtons
        onBack={() => router.push('/register/step/3')}
        onNext={() => router.push('/register/step/5')}
        nextLabel="다음 — 최종 확인"
        nextDisabled={!ownersValid || !shareValid}
      />
    </div>
  )
}
