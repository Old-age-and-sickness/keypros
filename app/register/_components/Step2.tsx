'use client'

import { useRouter } from 'next/navigation'
import { useRegister, VerifyStatus } from './RegisterContext'
import NavButtons from './NavButtons'

// 인증 상태별 UI 설정
const STATUS_CONFIG: Record<VerifyStatus, {
  label: string
  color: string
  bg: string
  border: string
  icon: React.ReactNode
}> = {
  IDLE: {
    label: '인증 대기',
    color: 'text-slate-500',
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
      </svg>
    ),
  },
  UPLOADING: {
    label: '분석 중',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    icon: (
      <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
      </svg>
    ),
  },
  VERIFIED: {
    label: '인증 완료',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/>
      </svg>
    ),
  },
  FAILED: {
    label: '정보 불일치',
    color: 'text-rose-600',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
      </svg>
    ),
  },
}

// 추가 확인 필요 상태 (FAILED와 유사하지만 별도 처리)
const REVIEW_CONFIG = {
  label: '추가 확인 필요',
  color: 'text-orange-600',
  bg: 'bg-orange-50',
  border: 'border-orange-200',
  icon: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <path d="M12 9v4M12 17h.01"/>
    </svg>
  ),
}

function RegistryField({ label, value, onChange, placeholder, required, hint }: {
  label: string; value: string; onChange: (v: string) => void
  placeholder?: string; required?: boolean; hint?: string
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 mb-1.5">
        {label} {required && <span className="text-rose-400">*</span>}
      </label>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 transition"
      />
      {hint && <p className="text-[11px] text-slate-400 mt-1">{hint}</p>}
    </div>
  )
}

export default function Step2() {
  const { form, setForm } = useRegister()
  const router = useRouter()

  const status = form.verify_status
  const config = STATUS_CONFIG[status]

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    if (!file) return

    setForm(f => ({ ...f, registry_file: file, verify_status: 'UPLOADING' }))

    // TODO: 실제 OCR/등기 API 연동 포인트
    // 현재는 mock으로 1.5초 후 VERIFIED 처리
    setTimeout(() => {
      setForm(f => ({
        ...f,
        verify_status: 'VERIFIED',
        registry_address: f.registry_address || '',
        registry_owner: f.registry_owner || '',
      }))
    }, 1500)
  }

  const resetFile = () => {
    setForm(f => ({
      ...f,
      registry_file: null,
      verify_status: 'IDLE',
      registry_address: '',
      registry_owner: '',
    }))
  }

  // 등기 정보 필드들
  const owners = form.registry_owner
    ? form.registry_owner.split(',').map(s => s.trim())
    : ['']

  const updateOwner = (i: number, value: string) => {
    const next = [...owners]
    next[i] = value
    setForm(f => ({ ...f, registry_owner: next.join(', ') }))
  }

  const addOwner = () => {
    setForm(f => ({ ...f, registry_owner: f.registry_owner ? f.registry_owner + ', ' : '' }))
  }

  const isVerified = status === 'VERIFIED'
  const canProceed = status === 'VERIFIED' || status === 'IDLE'

  return (
    <div className="flex flex-col gap-5">

      {/* 파일 업로드 */}
      <div>
        <p className="text-xs font-medium text-slate-500 mb-2">등기부등본 파일 <span className="text-rose-400">*</span></p>
        {!form.registry_file ? (
          <label className={`cursor-pointer rounded-2xl border-2 border-dashed p-7 flex flex-col items-center gap-3 transition-colors hover:border-indigo-300 hover:bg-indigo-50/30 ${config.border}`}>
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <path d="M14 2v6h6M12 18v-6M9 15l3-3 3 3"/>
              </svg>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-700">등기부등본을 업로드하세요</p>
              <p className="text-xs text-slate-400 mt-0.5">PDF, JPG, PNG 지원 · 최대 10MB</p>
            </div>
            <span className="px-5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition">
              파일 선택
            </span>
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFile} className="hidden" />
          </label>
        ) : (
          <div className={`flex items-center justify-between p-4 rounded-2xl border ${config.border} ${config.bg}`}>
            <div className="flex items-center gap-3">
              <div className={`shrink-0 ${config.color}`}>{config.icon}</div>
              <div>
                <p className="text-sm font-semibold text-slate-700">{form.registry_file.name}</p>
                <p className={`text-xs font-medium mt-0.5 ${config.color}`}>{config.label}</p>
              </div>
            </div>
            {status !== 'UPLOADING' && (
              <button onClick={resetFile} className="text-slate-300 hover:text-rose-400 transition-colors shrink-0 ml-2">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            )}
          </div>
        )}
      </div>

      {/* 분석 중 메시지 */}
      {status === 'UPLOADING' && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200">
          <svg className="animate-spin w-5 h-5 text-amber-500 shrink-0" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          <div>
            <p className="text-sm font-semibold text-amber-700">등기 정보 분석 중...</p>
            <p className="text-xs text-amber-500 mt-0.5">소유자 및 지분 정보를 확인하고 있습니다</p>
          </div>
        </div>
      )}

      {/* 불일치 경고 */}
      {status === 'FAILED' && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-rose-50 border border-rose-200">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-rose-500 mt-0.5 shrink-0">
            <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
          </svg>
          <div>
            <p className="text-sm font-semibold text-rose-700">정보 불일치 감지</p>
            <p className="text-xs text-rose-500 mt-0.5">업로드한 서류와 입력 정보가 일치하지 않습니다. 내용을 확인 후 수정해주세요.</p>
          </div>
        </div>
      )}

      {/* 추가 확인 필요 경고 — 수동 설정 버튼 */}
      {isVerified && (
        <button
          onClick={() => setForm(f => ({ ...f, verify_status: 'FAILED' }))}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-colors w-fit ${REVIEW_CONFIG.border} ${REVIEW_CONFIG.bg} ${REVIEW_CONFIG.color} hover:opacity-80`}
        >
          {REVIEW_CONFIG.icon}
          추가 확인 필요로 변경
        </button>
      )}

      {/* 등기 정보 입력 폼 — 파일 업로드 후 표시 */}
      {(status === 'VERIFIED' || status === 'FAILED') && (
        <div className="rounded-2xl border border-slate-200 overflow-hidden">
          <div className={`px-4 py-3 border-b flex items-center gap-2 ${isVerified ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
            <div className={isVerified ? 'text-emerald-600' : 'text-rose-500'}>{config.icon}</div>
            <p className={`text-xs font-bold ${isVerified ? 'text-emerald-700' : 'text-rose-700'}`}>
              등기 정보 확인 · 직접 수정 가능
            </p>
          </div>

          <div className="p-4 flex flex-col gap-4">
            <RegistryField
              label="소재지"
              value={form.registry_address}
              onChange={v => setForm(f => ({ ...f, registry_address: v }))}
              placeholder="예) 서울특별시 강남구 테헤란로 123"
              required
              hint="등기부등본상 표시 주소를 입력하세요"
            />

            <RegistryField
              label="건물명 / 호수"
              value={form.registry_building ?? ''}
              onChange={v => setForm(f => ({ ...f, registry_building: v }))}
              placeholder="예) 강남빌딩 3층 301호 (해당 시 입력)"
            />

            {/* 소유자 및 지분 */}
            <div>
              <p className="text-xs font-medium text-slate-500 mb-2">
                소유자 및 지분 <span className="text-rose-400">*</span>
              </p>
              <div className="flex flex-col gap-2">
                {form.registry_shares && form.registry_shares.length > 0 ? (
                  form.registry_shares.map((share, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        value={share.name}
                        onChange={e => {
                          const next = [...form.registry_shares!]
                          next[i] = { ...next[i], name: e.target.value }
                          setForm(f => ({ ...f, registry_shares: next }))
                        }}
                        placeholder="소유자명"
                        className="flex-[2] px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:border-indigo-400 transition"
                      />
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={share.ratio}
                        onChange={e => {
                          const next = [...form.registry_shares!]
                          next[i] = { ...next[i], ratio: e.target.value }
                          setForm(f => ({ ...f, registry_shares: next }))
                        }}
                        placeholder="지분율"
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:border-indigo-400 transition"
                      />
                      <span className="text-xs text-slate-400 font-medium">%</span>
                      {form.registry_shares!.length > 1 && (
                        <button
                          onClick={() => setForm(f => ({ ...f, registry_shares: f.registry_shares!.filter((_, idx) => idx !== i) }))}
                          className="text-slate-300 hover:text-rose-400 transition-colors shrink-0"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12"/>
                          </svg>
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      value={owners[0] ?? ''}
                      onChange={e => updateOwner(0, e.target.value)}
                      placeholder="소유자명"
                      className="flex-[2] px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:border-indigo-400 transition"
                    />
                    <input
                      type="number"
                      placeholder="지분율"
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:border-indigo-400 transition"
                    />
                    <span className="text-xs text-slate-400 font-medium">%</span>
                  </div>
                )}

                <button
                  onClick={() => setForm(f => ({
                    ...f,
                    registry_shares: [...(f.registry_shares ?? [{ name: owners[0] ?? '', ratio: '' }]), { name: '', ratio: '' }],
                  }))}
                  className="flex items-center gap-1.5 text-xs font-semibold text-indigo-500 hover:text-indigo-600 mt-1 w-fit"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 5v14M5 12h14"/>
                  </svg>
                  소유자 추가
                </button>
              </div>

              {/* 지분 합계 표시 */}
              {form.registry_shares && form.registry_shares.length > 0 && (() => {
                const total = form.registry_shares.reduce((acc, s) => acc + (parseFloat(s.ratio) || 0), 0)
                const valid = Math.abs(total - 100) < 0.01
                return (
                  <div className={`flex items-center justify-between mt-2 px-3 py-2 rounded-xl text-xs font-medium ${valid ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                    <span>지분 합계</span>
                    <span className="font-bold">{total.toFixed(2)}% {valid ? '✓' : '— 100%가 되어야 합니다'}</span>
                  </div>
                )
              })()}
            </div>

            {/* 인증 상태 수동 변경 */}
            <div>
              <p className="text-xs font-medium text-slate-500 mb-2">인증 상태</p>
              <div className="flex gap-2 flex-wrap">
                {(['VERIFIED', 'FAILED'] as VerifyStatus[]).map(s => {
                  const c = STATUS_CONFIG[s]
                  return (
                    <button key={s} onClick={() => setForm(f => ({ ...f, verify_status: s }))}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                        status === s ? `${c.border} ${c.bg} ${c.color}` : 'border-slate-200 text-slate-400 hover:border-slate-300'
                      }`}>
                      <span>{c.icon}</span>
                      {c.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 인증 없이 계속 */}
      {status === 'IDLE' && (
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
        nextDisabled={status === 'UPLOADING'}
      />
    </div>
  )
}
