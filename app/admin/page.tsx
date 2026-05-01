'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/src/context/AuthContext'
import OverviewTab     from './_components/OverviewTab'
import RequestsTab     from './_components/RequestsTab'
import UsersTab        from './_components/UsersTab'
import PropertiesTab   from './_components/PropertiesTab'
import SettlementsTab  from './_components/SettlementsTab'
import AdminVotesTab   from './_components/AdminVotesTab'

const TABS = [
  { id: 'overview',     label: '개요',     icon: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
    </svg>
  )},
  { id: 'requests',     label: '권한 신청', icon: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
    </svg>
  )},
  { id: 'users',        label: '사용자',    icon: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  )},
  { id: 'properties',   label: '자산',      icon: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 22V10l9-7 9 7v12"/><path d="M9 22V16h6v6"/>
    </svg>
  )},
  { id: 'settlements',  label: '정산',      icon: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  )},
  { id: 'votes',        label: '의결',      icon: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
    </svg>
  )},
] as const

type TabId = typeof TABS[number]['id']

export default function AdminPage() {
  const { profile, loading, signOut } = useAuth()
  const router = useRouter()
  const [tab, setTab] = useState<TabId>('overview')
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    if (loading) return
    if (profile?.role !== 'ADMIN') { router.replace('/dashboard'); return }
  }, [loading, profile, router])

  if (loading || !profile) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          로딩 중...
        </div>
      </main>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* 관리자 헤더 */}
      <header className="bg-slate-900 shrink-0">
        <div className="max-w-7xl mx-auto px-5">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-white">
                  <path d="M3 22V10l9-7 9 7v12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 22V16h6v6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="font-bold text-white tracking-tight">keypros</span>
              <span className="text-xs font-bold bg-rose-500 text-white px-2 py-0.5 rounded-md">ADMIN</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-slate-300">{profile.name.slice(0, 2)}</span>
                </div>
                <span className="text-sm text-slate-300">{profile.name}</span>
              </div>
              <button
                onClick={signOut}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-slate-800"
              >
                로그아웃
              </button>
            </div>
          </div>

          {/* 탭 */}
          <nav className="flex gap-0 overflow-x-auto">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`relative flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-all ${
                  tab === t.id
                    ? 'border-indigo-400 text-white'
                    : 'border-transparent text-slate-500 hover:text-slate-300 hover:border-slate-600'
                }`}
              >
                <span className={tab === t.id ? 'text-indigo-400' : 'text-slate-600'}>{t.icon}</span>
                {t.label}
                {t.id === 'requests' && pendingCount > 0 && (
                  <span className="ml-0.5 bg-rose-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                    {pendingCount > 9 ? '9+' : pendingCount}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* 콘텐츠 */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-5 py-6">
          {tab === 'overview'    && <OverviewTab    onNavigate={setTab} onPendingCount={setPendingCount} />}
          {tab === 'requests'   && <RequestsTab    onPendingCount={setPendingCount} />}
          {tab === 'users'      && <UsersTab />}
          {tab === 'properties' && <PropertiesTab />}
          {tab === 'settlements'&& <SettlementsTab />}
          {tab === 'votes'      && <AdminVotesTab />}
        </div>
      </main>
    </div>
  )
}
