'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/src/lib/supabase'

type TabId = 'overview' | 'requests' | 'users' | 'properties' | 'settlements' | 'votes'

type Stats = {
  totalUsers: number
  totalProperties: number
  pendingRequests: number
  totalSettlements: number
  totalVotes: number
  activeUnits: number
}

type RecentUser = {
  id: string; name: string; email: string | null
  role: string; joined_at: string
}

type RecentRequest = {
  id: string; client_type: string; requested_at: string
  profiles: { name: string; email: string | null } | null
}

const ROLE_STYLE: Record<string, string> = {
  ADMIN:    'bg-rose-50 text-rose-700 border border-rose-100',
  MANAGER:  'bg-indigo-50 text-indigo-700 border border-indigo-100',
  DELEGATOR:'bg-violet-50 text-violet-700 border border-violet-100',
  INVESTOR: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
  GUEST:    'bg-slate-100 text-slate-500',
}
const ROLE_KO: Record<string, string> = {
  ADMIN:'관리자', MANAGER:'수탁관리자', DELEGATOR:'위탁자', INVESTOR:'공동투자자', GUEST:'게스트'
}
const TYPE_KO: Record<string, string> = { MANAGER:'수탁관리자', DELEGATOR:'위탁자', INVESTOR:'공동투자자' }

export default function OverviewTab({
  onNavigate,
  onPendingCount,
}: {
  onNavigate: (tab: TabId) => void
  onPendingCount: (n: number) => void
}) {
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([])
  const [pendingReqs, setPendingReqs] = useState<RecentRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      supabase.from('profiles').select('id, name, email, role, joined_at', { count: 'exact' }).order('joined_at', { ascending: false }).limit(5),
      supabase.from('properties').select('id', { count: 'exact' }),
      supabase.from('permission_requests').select('id, client_type, requested_at, profiles!permission_requests_user_id_fkey(name, email)', { count: 'exact' }).eq('status', 'PENDING').order('requested_at', { ascending: false }).limit(5),
      supabase.from('settlements').select('id', { count: 'exact' }),
      supabase.from('votes').select('id', { count: 'exact' }),
      supabase.from('rental_units').select('id', { count: 'exact' }).eq('status', 'OCCUPIED'),
    ]).then(([users, props, pending, setts, votes, units]) => {
      setStats({
        totalUsers:       users.count ?? 0,
        totalProperties:  props.count ?? 0,
        pendingRequests:  pending.count ?? 0,
        totalSettlements: setts.count ?? 0,
        totalVotes:       votes.count ?? 0,
        activeUnits:      units.count ?? 0,
      })
      setRecentUsers((users.data ?? []) as RecentUser[])
      const pendingList = (pending.data ?? []) as unknown as RecentRequest[]
      setPendingReqs(pendingList)
      onPendingCount(pending.count ?? 0)
      setLoading(false)
    })
  }, [onPendingCount])

  if (loading) return (
    <div className="flex items-center justify-center py-20 text-slate-400 text-sm gap-2">
      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
      불러오는 중...
    </div>
  )

  const statCards = [
    {
      label: '전체 사용자',
      value: stats!.totalUsers,
      icon: '👥',
      bg: 'bg-indigo-50',
      text: 'text-indigo-600',
      tab: 'users' as TabId,
    },
    {
      label: '대기 신청',
      value: stats!.pendingRequests,
      icon: '⏳',
      bg: stats!.pendingRequests > 0 ? 'bg-rose-50' : 'bg-slate-50',
      text: stats!.pendingRequests > 0 ? 'text-rose-600' : 'text-slate-600',
      tab: 'requests' as TabId,
    },
    {
      label: '등록 자산',
      value: stats!.totalProperties,
      icon: '🏢',
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      tab: 'properties' as TabId,
    },
    {
      label: '임차 중 호실',
      value: stats!.activeUnits,
      icon: '🔑',
      bg: 'bg-violet-50',
      text: 'text-violet-600',
      tab: 'properties' as TabId,
    },
    {
      label: '정산 건수',
      value: stats!.totalSettlements,
      icon: '📊',
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      tab: 'settlements' as TabId,
    },
    {
      label: '전체 안건',
      value: stats!.totalVotes,
      icon: '⚖️',
      bg: 'bg-slate-50',
      text: 'text-slate-600',
      tab: 'votes' as TabId,
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      {/* 통계 카드 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map(card => (
          <button
            key={card.label}
            onClick={() => onNavigate(card.tab)}
            className={`${card.bg} rounded-2xl p-4 text-left flex flex-col gap-2 hover:shadow-md transition-all group border border-white/60`}
          >
            <div className="text-xl">{card.icon}</div>
            <div>
              <div className="text-xs text-slate-500 group-hover:text-slate-700 transition-colors">{card.label}</div>
              <div className={`text-2xl font-bold ${card.text} mt-0.5`}>{card.value}</div>
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* 대기 중 신청 */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
              대기 중인 권한 신청
              {stats!.pendingRequests > 0 && (
                <span className="bg-rose-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold">
                  {stats!.pendingRequests}
                </span>
              )}
            </h3>
            <button
              onClick={() => onNavigate('requests')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
            >
              전체 보기 →
            </button>
          </div>
          {pendingReqs.length === 0 ? (
            <div className="px-5 py-8 text-center text-slate-400 text-sm">대기 중인 신청이 없습니다</div>
          ) : (
            <div className="divide-y divide-slate-50">
              {pendingReqs.map(req => (
                <div key={req.id} className="px-5 py-3.5 flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium text-sm text-slate-800">{req.profiles?.name ?? '(이름 없음)'}</div>
                    <div className="text-xs text-slate-400">{req.profiles?.email}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-semibold text-indigo-600">{TYPE_KO[req.client_type]}</div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {new Date(req.requested_at).toLocaleDateString('ko-KR')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 최근 가입 사용자 */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 text-sm">최근 가입 사용자</h3>
            <button
              onClick={() => onNavigate('users')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
            >
              전체 보기 →
            </button>
          </div>
          {recentUsers.length === 0 ? (
            <div className="px-5 py-8 text-center text-slate-400 text-sm">사용자가 없습니다</div>
          ) : (
            <div className="divide-y divide-slate-50">
              {recentUsers.map(u => (
                <div key={u.id} className="px-5 py-3.5 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-slate-500">{u.name.slice(0, 2)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-slate-800">{u.name}</div>
                    <div className="text-xs text-slate-400 truncate">{u.email}</div>
                  </div>
                  <div className="shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_STYLE[u.role] ?? 'bg-slate-100 text-slate-500'}`}>
                      {ROLE_KO[u.role] ?? u.role}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
