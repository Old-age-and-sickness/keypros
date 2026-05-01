'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/src/lib/supabase'
import type { Profile } from '@/src/types/database.types'

const ROLE_STYLE: Record<string, string> = {
  ADMIN:     'bg-rose-50 text-rose-700 border border-rose-100',
  MANAGER:   'bg-indigo-50 text-indigo-700 border border-indigo-100',
  DELEGATOR: 'bg-violet-50 text-violet-700 border border-violet-100',
  INVESTOR:  'bg-emerald-50 text-emerald-700 border border-emerald-100',
  GUEST:     'bg-slate-100 text-slate-500',
}
const ROLE_KO: Record<string, string> = {
  ADMIN:'관리자', MANAGER:'수탁관리자', DELEGATOR:'위탁자', INVESTOR:'공동투자자', GUEST:'게스트'
}

const PERM_LABELS = [
  { key: 'perm_data_access', label: '데이터 접근' },
  { key: 'perm_vote',        label: '의결권' },
  { key: 'perm_data_edit',   label: '데이터 수정' },
  { key: 'perm_delegate_vote', label: '대리 의결' },
] as const

type SortKey = 'name' | 'role' | 'joined_at'

export default function UsersTab() {
  const [users, setUsers]   = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('ALL')
  const [sort, setSort] = useState<SortKey>('joined_at')
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    supabase.from('profiles').select('*').order('joined_at', { ascending: false })
      .then(({ data }) => {
        setUsers((data ?? []) as Profile[])
        setLoading(false)
      })
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center py-20 text-slate-400 text-sm gap-2">
      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
      불러오는 중...
    </div>
  )

  const roles = ['ALL', ...Array.from(new Set(users.map(u => u.role)))]

  let filtered = users
    .filter(u => roleFilter === 'ALL' || u.role === roleFilter)
    .filter(u =>
      !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      (u.email ?? '').toLowerCase().includes(search.toLowerCase())
    )
  if (sort === 'name')      filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name, 'ko'))
  if (sort === 'role')      filtered = [...filtered].sort((a, b) => a.role.localeCompare(b.role))
  if (sort === 'joined_at') filtered = [...filtered].sort((a, b) => b.joined_at.localeCompare(a.joined_at))

  return (
    <div className="flex flex-col gap-4">
      {/* 검색 + 필터 */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input
            type="text"
            placeholder="이름 또는 이메일 검색..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {roles.map(r => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                roleFilter === r
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              {r === 'ALL' ? `전체 (${users.length})` : (ROLE_KO[r] ?? r)}
            </button>
          ))}
        </div>
        <select
          value={sort}
          onChange={e => setSort(e.target.value as SortKey)}
          className="text-sm border border-slate-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 text-slate-600"
        >
          <option value="joined_at">최근 가입순</option>
          <option value="name">이름순</option>
          <option value="role">역할순</option>
        </select>
      </div>

      {/* 결과 카운트 */}
      <div className="text-xs text-slate-400">{filtered.length}명 표시 중</div>

      {/* 사용자 목록 */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <p className="text-slate-400 text-sm">검색 결과가 없습니다</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100">
            {filtered.map(u => {
              const isOpen = expanded === u.id
              const permCount = PERM_LABELS.filter(p => u[p.key]).length
              return (
                <div key={u.id}>
                  <button
                    onClick={() => setExpanded(isOpen ? null : u.id)}
                    className="w-full text-left px-5 py-4 flex items-center gap-4 hover:bg-slate-50/80 transition-colors"
                  >
                    {/* 아바타 */}
                    <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-slate-500">{u.name.slice(0, 2)}</span>
                    </div>

                    {/* 정보 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-900 text-sm">{u.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${ROLE_STYLE[u.role] ?? 'bg-slate-100 text-slate-500'}`}>
                          {ROLE_KO[u.role] ?? u.role}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5 truncate">{u.email}</div>
                    </div>

                    {/* 권한 수 + 가입일 */}
                    <div className="shrink-0 text-right hidden sm:block">
                      <div className="text-xs text-slate-500">권한 {permCount}개</div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {new Date(u.joined_at).toLocaleDateString('ko-KR')}
                      </div>
                    </div>

                    <svg
                      width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                      className={`text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    >
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </button>

                  {/* 상세 권한 */}
                  {isOpen && (
                    <div className="bg-slate-50 border-t border-slate-100 px-5 py-4 flex flex-col gap-3">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {PERM_LABELS.map(p => (
                          <div
                            key={p.key}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border ${
                              u[p.key]
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                : 'bg-white text-slate-400 border-slate-200'
                            }`}
                          >
                            <span className={u[p.key] ? 'text-emerald-500' : 'text-slate-300'}>
                              {u[p.key] ? '✓' : '✕'}
                            </span>
                            {p.label}
                          </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
                        {u.phone && <div>전화: <span className="text-slate-700 font-medium">{u.phone}</span></div>}
                        <div>가입일: <span className="text-slate-700 font-medium">{new Date(u.joined_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}</span></div>
                        {u.client_type && <div>유형: <span className="text-slate-700 font-medium">{ROLE_KO[u.client_type] ?? u.client_type}</span></div>}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
