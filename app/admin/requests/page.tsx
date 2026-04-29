'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/src/context/AuthContext'
import { supabase } from '@/src/lib/supabase'
import type { PermissionRequest } from '@/src/types/database.types'

type RequestWithProfile = PermissionRequest & {
  profiles: { name: string; email: string | null } | null
}

const TYPE_LABEL: Record<string, string> = {
  MANAGER: '수탁관리자',
  DELEGATOR: '위탁자',
  INVESTOR: '공동투자자',
}

const PERMS_BY_TYPE: Record<string, {
  perm_data_access: boolean
  perm_vote: boolean
  perm_data_edit: boolean
}> = {
  MANAGER:  { perm_data_access: true,  perm_vote: false, perm_data_edit: false },
  DELEGATOR:{ perm_data_access: true,  perm_vote: true,  perm_data_edit: true  },
  INVESTOR: { perm_data_access: true,  perm_vote: true,  perm_data_edit: false },
}

export default function AdminRequestsPage() {
  const { profile, loading } = useAuth()
  const router = useRouter()
  const [requests, setRequests] = useState<RequestWithProfile[]>([])
  const [fetching, setFetching] = useState(true)
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => {
    if (loading) return
    if (profile?.role !== 'ADMIN') { router.replace('/dashboard'); return }
    fetchRequests()
  }, [loading, profile, router])

  const fetchRequests = async () => {
    const { data } = await supabase
      .from('permission_requests')
      .select('*, profiles!permission_requests_user_id_fkey(name, email)')
      .order('requested_at', { ascending: false })
    setRequests((data ?? []) as RequestWithProfile[])
    setFetching(false)
  }

  const approve = async (req: RequestWithProfile) => {
    setProcessing(req.id)
    const perms = PERMS_BY_TYPE[req.client_type]
    const { error } = await supabase
      .from('profiles')
      .update({
        role: req.client_type,
        client_type: req.client_type,
        ...perms,
        perm_delegate_vote: req.client_type === 'MANAGER' ? req.req_delegate_vote : false,
      })
      .eq('id', req.user_id)

    if (!error) {
      await supabase
        .from('permission_requests')
        .update({ status: 'APPROVED', reviewed_at: new Date().toISOString() })
        .eq('id', req.id)
      await fetchRequests()
    }
    setProcessing(null)
  }

  const reject = async () => {
    if (!rejectId) return
    setProcessing(rejectId)
    await supabase
      .from('permission_requests')
      .update({
        status: 'REJECTED',
        reject_reason: rejectReason || null,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', rejectId)
    setRejectId(null)
    setRejectReason('')
    await fetchRequests()
    setProcessing(null)
  }

  if (loading || fetching) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <p className="text-gray-400">로딩 중...</p>
      </main>
    )
  }

  const pending = requests.filter((r) => r.status === 'PENDING')
  const reviewed = requests.filter((r) => r.status !== 'PENDING')

  return (
    <main className="flex flex-1 flex-col gap-8 p-8 max-w-3xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">권한 신청 관리</h1>
        <span className="text-sm text-gray-400">ADMIN</span>
      </div>

      <section>
        <h2 className="font-semibold text-gray-700 mb-3">
          대기 중 <span className="text-blue-500">({pending.length})</span>
        </h2>
        {pending.length === 0 ? (
          <p className="text-gray-400 text-sm">대기 중인 신청이 없습니다.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {pending.map((req) => (
              <div key={req.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{req.profiles?.name || '(이름 없음)'}</div>
                  <div className="text-xs text-gray-400">{req.profiles?.email}</div>
                  <div className="mt-1 flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-blue-600 font-medium">{TYPE_LABEL[req.client_type]}</span>
                    {req.client_type === 'MANAGER' && req.req_delegate_vote && (
                      <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">
                        의결권 대리행사 포함
                      </span>
                    )}
                    <span className="text-xs text-gray-400">
                      {new Date(req.requested_at).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => approve(req)}
                    disabled={processing === req.id}
                    className="px-4 py-1.5 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white text-sm rounded-lg transition-colors"
                  >
                    승인
                  </button>
                  <button
                    onClick={() => setRejectId(req.id)}
                    disabled={processing === req.id}
                    className="px-4 py-1.5 bg-white hover:bg-gray-50 disabled:bg-gray-100 border border-gray-300 text-gray-600 text-sm rounded-lg transition-colors"
                  >
                    거절
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {reviewed.length > 0 && (
        <section>
          <h2 className="font-semibold text-gray-700 mb-3">처리 완료 ({reviewed.length})</h2>
          <div className="flex flex-col gap-2">
            {reviewed.map((req) => (
              <div key={req.id} className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex items-center gap-4 opacity-70">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{req.profiles?.name || '(이름 없음)'}</div>
                  <div className="text-xs text-gray-400">{req.profiles?.email}</div>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-sm text-gray-600">{TYPE_LABEL[req.client_type]}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      req.status === 'APPROVED'
                        ? 'bg-green-100 text-green-600'
                        : 'bg-red-100 text-red-500'
                    }`}>
                      {req.status === 'APPROVED' ? '승인됨' : '거절됨'}
                    </span>
                  </div>
                  {req.reject_reason && (
                    <div className="text-xs text-gray-400 mt-0.5">사유: {req.reject_reason}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 거절 사유 모달 */}
      {rejectId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm mx-4 flex flex-col gap-4">
            <h3 className="font-semibold">거절 사유 입력</h3>
            <textarea
              className="border border-gray-200 rounded-lg p-3 text-sm resize-none h-24 focus:outline-none focus:ring-2 focus:ring-blue-300"
              placeholder="사유 입력 (선택사항)"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setRejectId(null); setRejectReason('') }}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                취소
              </button>
              <button
                onClick={reject}
                className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                거절 확정
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
