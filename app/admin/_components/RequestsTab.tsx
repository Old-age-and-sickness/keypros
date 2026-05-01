'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/src/lib/supabase'
import type { PermissionRequest } from '@/src/types/database.types'

type RequestWithProfile = PermissionRequest & {
  profiles: { name: string; email: string | null } | null
}

const TYPE_LABEL: Record<string, string> = {
  MANAGER: '수탁관리자', DELEGATOR: '위탁자', INVESTOR: '공동투자자',
}
const TYPE_STYLE: Record<string, string> = {
  MANAGER:   'bg-indigo-50 text-indigo-700 border border-indigo-100',
  DELEGATOR: 'bg-violet-50 text-violet-700 border border-violet-100',
  INVESTOR:  'bg-emerald-50 text-emerald-700 border border-emerald-100',
}
const PERMS_BY_TYPE: Record<string, { perm_data_access: boolean; perm_vote: boolean; perm_data_edit: boolean }> = {
  MANAGER:   { perm_data_access: true,  perm_vote: false, perm_data_edit: false },
  DELEGATOR: { perm_data_access: true,  perm_vote: true,  perm_data_edit: true  },
  INVESTOR:  { perm_data_access: true,  perm_vote: true,  perm_data_edit: false },
}

export default function RequestsTab({ onPendingCount }: { onPendingCount: (n: number) => void }) {
  const [requests, setRequests] = useState<RequestWithProfile[]>([])
  const [fetching, setFetching] = useState(true)
  const [rejectTarget, setRejectTarget] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [processing, setProcessing] = useState<string | null>(null)
  const [filter, setFilter] = useState<'PENDING' | 'ALL'>('PENDING')

  const fetchRequests = async () => {
    const { data } = await supabase
      .from('permission_requests')
      .select('*, profiles!permission_requests_user_id_fkey(name, email)')
      .order('requested_at', { ascending: false })
    const list = (data ?? []) as RequestWithProfile[]
    setRequests(list)
    onPendingCount(list.filter(r => r.status === 'PENDING').length)
    setFetching(false)
  }

  useEffect(() => { fetchRequests() }, [])

  const approve = async (req: RequestWithProfile) => {
    setProcessing(req.id)
    const perms = PERMS_BY_TYPE[req.client_type]
    const { error } = await supabase.from('profiles').update({
      role: req.client_type, client_type: req.client_type, ...perms,
      perm_delegate_vote: req.client_type === 'MANAGER' ? req.req_delegate_vote : false,
    }).eq('id', req.user_id)
    if (!error) {
      await supabase.from('permission_requests')
        .update({ status: 'APPROVED', reviewed_at: new Date().toISOString() })
        .eq('id', req.id)
      await fetchRequests()
    }
    setProcessing(null)
  }

  const reject = async () => {
    if (!rejectTarget) return
    setProcessing(rejectTarget)
    await supabase.from('permission_requests').update({
      status: 'REJECTED',
      reject_reason: rejectReason || null,
      reviewed_at: new Date().toISOString(),
    }).eq('id', rejectTarget)
    setRejectTarget(null); setRejectReason('')
    await fetchRequests()
    setProcessing(null)
  }

  if (fetching) return (
    <div className="flex items-center justify-center py-20 text-slate-400 text-sm gap-2">
      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
      불러오는 중...
    </div>
  )

  const pending  = requests.filter(r => r.status === 'PENDING')
  const reviewed = requests.filter(r => r.status !== 'PENDING')
  const shown    = filter === 'PENDING' ? pending : requests

  return (
    <div className="flex flex-col gap-5">
      {/* 필터 + 통계 */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2">
          {([['PENDING', `대기 중 (${pending.length})`], ['ALL', `전체 (${requests.length})`]] as const).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilter(val)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filter === val
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {pending.length > 0 && (
          <div className="text-sm text-rose-600 font-medium bg-rose-50 border border-rose-100 px-3 py-1.5 rounded-xl">
            🔔 미처리 {pending.length}건
          </div>
        )}
      </div>

      {shown.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <p className="text-slate-400 text-sm">
            {filter === 'PENDING' ? '대기 중인 신청이 없습니다' : '신청 내역이 없습니다'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {shown.map(req => {
            const isPending = req.status === 'PENDING'
            return (
              <div
                key={req.id}
                className={`bg-white border rounded-2xl p-5 shadow-sm transition-all ${
                  isPending ? 'border-amber-200 hover:shadow-md' : 'border-slate-200 opacity-75'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* 아바타 */}
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 font-bold text-slate-500">
                    {(req.profiles?.name ?? '?').slice(0, 2)}
                  </div>

                  {/* 정보 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-900">{req.profiles?.name ?? '(이름 없음)'}</span>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${TYPE_STYLE[req.client_type] ?? 'bg-slate-100 text-slate-500'}`}>
                        {TYPE_LABEL[req.client_type]}
                      </span>
                      {req.client_type === 'MANAGER' && req.req_delegate_vote && (
                        <span className="text-xs bg-violet-50 text-violet-600 border border-violet-100 px-2 py-0.5 rounded-full">
                          의결권 대리행사
                        </span>
                      )}
                      {!isPending && (
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                          req.status === 'APPROVED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                            : 'bg-rose-50 text-rose-600 border border-rose-100'
                        }`}>
                          {req.status === 'APPROVED' ? '✓ 승인됨' : '✕ 거절됨'}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-slate-400 mt-0.5">{req.profiles?.email}</div>
                    <div className="text-xs text-slate-400 mt-1">
                      신청일: {new Date(req.requested_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                      {req.reviewed_at && (
                        <span className="ml-2">
                          처리일: {new Date(req.reviewed_at).toLocaleDateString('ko-KR')}
                        </span>
                      )}
                    </div>
                    {req.reject_reason && (
                      <div className="mt-1.5 text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-1.5">
                        거절 사유: {req.reject_reason}
                      </div>
                    )}

                    {/* 부여될 권한 미리보기 */}
                    {isPending && (
                      <div className="mt-3 flex gap-1.5 flex-wrap">
                        {Object.entries(PERMS_BY_TYPE[req.client_type] ?? {}).map(([key, val]) => {
                          const label: Record<string, string> = { perm_data_access: '데이터 접근', perm_vote: '의결권', perm_data_edit: '데이터 수정' }
                          return (
                            <span
                              key={key}
                              className={`text-xs px-2 py-0.5 rounded-full ${val ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-100 text-slate-400 line-through'}`}
                            >
                              {label[key]}
                            </span>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {/* 버튼 */}
                  {isPending && (
                    <div className="flex gap-2 shrink-0 mt-0.5">
                      <button
                        onClick={() => approve(req)}
                        disabled={processing === req.id}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white text-sm font-semibold rounded-xl transition-all active:scale-[0.97]"
                      >
                        {processing === req.id ? '처리 중…' : '승인'}
                      </button>
                      <button
                        onClick={() => setRejectTarget(req.id)}
                        disabled={processing === req.id}
                        className="px-4 py-2 bg-white hover:bg-rose-50 disabled:bg-slate-100 border border-slate-200 hover:border-rose-300 text-slate-600 hover:text-rose-600 text-sm font-semibold rounded-xl transition-all"
                      >
                        거절
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 거절 사유 모달 */}
      {rejectTarget && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl flex flex-col gap-4">
            <div>
              <h3 className="font-bold text-slate-900">신청 거절</h3>
              <p className="text-sm text-slate-400 mt-0.5">거절 사유를 입력하세요 (선택)</p>
            </div>
            <textarea
              className="border border-slate-200 rounded-xl p-3.5 text-sm resize-none h-24 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-transparent placeholder-slate-300"
              placeholder="예: 초대되지 않은 사용자입니다"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <div className="flex gap-2.5">
              <button
                onClick={() => { setRejectTarget(null); setRejectReason('') }}
                className="flex-1 py-2.5 text-sm text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors border border-slate-200"
              >
                취소
              </button>
              <button
                onClick={reject}
                className="flex-1 py-2.5 text-sm bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold transition-colors"
              >
                거절 확정
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
