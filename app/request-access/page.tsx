'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/src/context/AuthContext'
import { supabase } from '@/src/lib/supabase'
import type { PermissionRequest } from '@/src/types/database.types'

type ClientType = 'MANAGER' | 'DELEGATOR' | 'INVESTOR'

const CLIENT_TYPES = [
  {
    id: 'MANAGER' as ClientType,
    label: '수탁관리자',
    desc: '부동산 신탁 자산을 관리하는 수탁자',
    icon: '🏦',
    color: 'indigo',
    perms: ['지분 조회', '의결내역 조회', '정산내역 조회'],
    optional: true,
  },
  {
    id: 'DELEGATOR' as ClientType,
    label: '위탁자',
    desc: '세무사, 공인중개사 등 수탁관리자에 대한 위탁자',
    icon: '📋',
    color: 'violet',
    perms: ['데이터 접근', '의결권 행사', '데이터 수정 (거래·회계·전표 증빙)'],
    optional: false,
  },
  {
    id: 'INVESTOR' as ClientType,
    label: '공동투자자',
    desc: '개인 공동투자자',
    icon: '👤',
    color: 'emerald',
    perms: ['데이터 접근', '의결권 행사'],
    optional: false,
  },
]

const COLOR_MAP: Record<string, { border: string; bg: string; badge: string; check: string }> = {
  indigo: {
    border: 'border-indigo-400',
    bg:     'bg-indigo-50',
    badge:  'bg-indigo-100 text-indigo-700',
    check:  'text-indigo-500',
  },
  violet: {
    border: 'border-violet-400',
    bg:     'bg-violet-50',
    badge:  'bg-violet-100 text-violet-700',
    check:  'text-violet-500',
  },
  emerald: {
    border: 'border-emerald-400',
    bg:     'bg-emerald-50',
    badge:  'bg-emerald-100 text-emerald-700',
    check:  'text-emerald-500',
  },
}

export default function RequestAccessPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [selected, setSelected]     = useState<ClientType | null>(null)
  const [delegateVote, setDelegateVote] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [existing, setExisting]     = useState<PermissionRequest | null | undefined>(undefined)

  useEffect(() => {
    if (loading) return
    if (!user) { router.replace('/login'); return }
    if (profile && profile.role !== 'GUEST') { router.replace('/dashboard'); return }
    supabase
      .from('permission_requests').select('*').eq('user_id', user.id)
      .order('requested_at', { ascending: false }).limit(1).maybeSingle()
      .then(({ data }) => setExisting(data as PermissionRequest | null), () => setExisting(null))
  }, [loading, user, profile, router])

  const handleSubmit = async () => {
    if (!selected || !user) return
    setSubmitting(true)
    const { data, error } = await supabase
      .from('permission_requests')
      .insert({ user_id: user.id, client_type: selected, req_delegate_vote: selected === 'MANAGER' ? delegateVote : false })
      .select().single()
    if (!error) setExisting(data as PermissionRequest)
    setSubmitting(false)
  }

  if (loading || existing === undefined) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
          불러오는 중...
        </div>
      </main>
    )
  }

  if (existing?.status === 'PENDING') {
    return (
      <main className="flex flex-1 items-center justify-center p-4">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-10 text-center flex flex-col items-center gap-4 max-w-sm w-full">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-3xl">⏳</div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">승인 대기 중</h2>
            <p className="text-slate-500 text-sm mt-1.5">관리자가 신청을 검토하고 있습니다</p>
          </div>
          <div className="bg-slate-50 rounded-xl border border-slate-100 px-5 py-3 text-sm text-slate-600">
            신청 유형: <span className="font-semibold">{CLIENT_TYPES.find(t => t.id === existing.client_type)?.label}</span>
          </div>
        </div>
      </main>
    )
  }

  if (existing?.status === 'REJECTED') {
    return (
      <main className="flex flex-1 items-center justify-center p-4">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-10 text-center flex flex-col items-center gap-4 max-w-sm w-full">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-3xl">✕</div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">신청이 거절되었습니다</h2>
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
      </main>
    )
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-7 py-12 px-4">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 mb-4 text-2xl">🔐</div>
        <h1 className="text-2xl font-bold text-slate-900">접근 권한 신청</h1>
        <p className="text-slate-500 mt-1.5 text-sm">해당하는 사용자 유형을 선택하세요</p>
      </div>

      {/* 유형 선택 */}
      <div className="flex flex-col gap-3 w-full max-w-lg">
        {CLIENT_TYPES.map((type) => {
          const c = COLOR_MAP[type.color]
          const isSelected = selected === type.id
          return (
            <button
              key={type.id}
              onClick={() => { setSelected(type.id); setDelegateVote(false) }}
              className={`text-left p-5 rounded-2xl border-2 transition-all ${
                isSelected
                  ? `${c.border} ${c.bg} shadow-sm`
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <span className={`text-2xl leading-none mt-0.5`}>{type.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-bold text-slate-900">{type.label}</span>
                    {isSelected && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className={c.check}>
                        <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mb-2.5">{type.desc}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {type.perms.map((p) => (
                      <span key={p} className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${isSelected ? c.badge : 'bg-slate-100 text-slate-500'}`}>
                        {p}
                      </span>
                    ))}
                  </div>
                  {type.optional && isSelected && (
                    <label
                      className="mt-3.5 flex items-center gap-2 cursor-pointer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={delegateVote}
                        onChange={(e) => setDelegateVote(e.target.checked)}
                        className="w-4 h-4 rounded accent-indigo-600"
                      />
                      <span className="text-sm text-slate-700 font-medium">위탁자 대신 의결권 행사</span>
                    </label>
                  )}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* 신청 버튼 */}
      <button
        onClick={handleSubmit}
        disabled={!selected || submitting}
        className="px-10 py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white rounded-2xl font-semibold text-sm transition-all shadow-sm shadow-indigo-200 hover:shadow-md hover:shadow-indigo-200 active:scale-[0.98]"
      >
        {submitting ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
            신청 중...
          </span>
        ) : '권한 신청하기'}
      </button>
    </main>
  )
}
