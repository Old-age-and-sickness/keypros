'use client'

import { useRouter } from 'next/navigation'
import { useRegister } from './RegisterContext'
import NavButtons from './NavButtons'

export default function Step2() {
  const { form, setForm } = useRegister()
  const router = useRouter()

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
              <input value={form.registry_address}
                onChange={e => setForm(f => ({ ...f, registry_address: e.target.value }))}
                className="w-full text-sm text-slate-800 bg-white border border-emerald-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-400 transition" />
            </div>
            <div>
              <p className="text-[10px] font-medium text-emerald-600 uppercase tracking-wide mb-0.5">소유자</p>
              <input value={form.registry_owner}
                onChange={e => setForm(f => ({ ...f, registry_owner: e.target.value }))}
                className="w-full text-sm text-slate-800 bg-white border border-emerald-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-400 transition" />
            </div>
          </div>
        </div>
      )}

      {!verified && (
        <p className="text-center text-xs text-slate-400">
          등기부등본이 없으신가요?{' '}
          <button onClick={() => router.push('/register/step/3')}
            className="text-indigo-500 underline underline-offset-2 font-medium">
            인증 없이 계속하기
          </button>
        </p>
      )}

      <NavButtons
        onBack={() => router.push('/register/step/1')}
        onNext={() => router.push('/register/step/3')}
        nextLabel="다음 — 기본정보 입력"
        nextDisabled={form.verify_status === 'UPLOADING'}
      />
    </div>
  )
}
