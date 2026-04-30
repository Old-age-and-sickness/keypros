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
    perms: ['지분 조회', '의결내역 조회', '정산내역 조회'],
    optional: true,
  },
  {
    id: 'DELEGATOR' as ClientType,
    label: '위탁자',
    desc: '세무사, 공인중개사 등 수탁관리자에 대한 위탁자',
    perms: ['데이터 접근', '의결권 행사', '데이터 수정 (거래·회계·전표 증빙)'],
    optional: false,
  },
  {
    id: 'INVESTOR' as ClientType,
    label: '공동투자자',
    desc: '개인 공동투자자',
    perms: ['데이터 접근', '의결권 행사'],
    optional: false,
  },
]

export default function RequestAccessPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [selected, setSelected] = useState<ClientType | null>(null)
  const [delegateVote, setDelegateVote] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [existing, setExisting] = useState<PermissionRequest | null | undefined>(undefined)

  useEffect(() => {
    if (loading) return
    if (!user) { router.replace('/login'); return }
    if (profile && profile.role !== 'GUEST') { router.replace('/dashboard'); return }

    supabase
      .from('permission_requests')
      .select('*')
      .eq('user_id', user.id)
      .order('requested_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => setExisting(data as PermissionRequest | null))
  }, [loading, user, profile, router])

  const handleSubmit = async () => {
    if (!selected || !user) return
    setSubmitting(true)
    const { data, error } = await supabase
      .from('permission_requests')
      .insert({
        user_id: user.id,
        client_type: selected,
        req_delegate_vote: selected === 'MANAGER' ? delegateVote : false,
      })
      .select()
      .single()
    if (!error) setExisting(data as PermissionRequest)
    setSubmitting(false)
  }

  if (loading || existing === undefined) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <p className="text-gray-400">로딩 중...</p>
      </main>
    )
  }

  if (existing?.status === 'PENDING') {
    return (
      <main className="flex flex-1 items-center justify-center">
        <div className="text-center flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center text-2xl">⏳</div>
          <h2 className="text-xl font-bold">승인 대기 중</h2>
          <p className="text-gray-500 text-sm">관리자가 신청을 검토하고 있습니다.</p>
          <p className="text-gray-400 text-xs">신청 유형: {CLIENT_TYPES.find(t => t.id === existing.client_type)?.label}</p>
        </div>
      </main>
    )
  }

  if (existing?.status === 'REJECTED') {
    return (
      <main className="flex flex-1 items-center justify-center">
        <div className="text-center flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-2xl">✕</div>
          <h2 className="text-xl font-bold">신청이 거절되었습니다</h2>
          {existing.reject_reason && (
            <p className="text-gray-500 text-sm">사유: {existing.reject_reason}</p>
          )}
          <button
            onClick={() => setExisting(null)}
            className="mt-2 px-6 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600"
          >
            다시 신청
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 py-12 px-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold">접근 권한 신청</h1>
        <p className="text-gray-500 mt-2 text-sm">해당하는 사용자 유형을 선택하세요</p>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-lg">
        {CLIENT_TYPES.map((type) => (
          <button
            key={type.id}
            onClick={() => { setSelected(type.id); setDelegateVote(false) }}
            className={`text-left p-5 rounded-xl border-2 transition-all ${
              selected === type.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="font-semibold">{type.label}</div>
            <div className="text-xs text-gray-400 mt-0.5">{type.desc}</div>
            <ul className="mt-2 space-y-0.5">
              {type.perms.map((p) => (
                <li key={p} className="text-sm text-gray-600 flex items-center gap-1.5">
                  <span className="text-green-500 text-xs">✓</span> {p}
                </li>
              ))}
            </ul>
            {type.optional && selected === type.id && (
              <label
                className="mt-3 flex items-center gap-2 cursor-pointer"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="checkbox"
                  checked={delegateVote}
                  onChange={(e) => setDelegateVote(e.target.checked)}
                  className="w-4 h-4 accent-blue-500"
                />
                <span className="text-sm text-gray-700">위탁자 대신 의결권 행사</span>
              </label>
            )}
          </button>
        ))}
      </div>

      <button
        onClick={handleSubmit}
        disabled={!selected || submitting}
        className="px-10 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
      >
        {submitting ? '신청 중...' : '권한 신청하기'}
      </button>
    </main>
  )
}
