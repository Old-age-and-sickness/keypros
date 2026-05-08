'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/src/context/AuthContext'
import AssetOverviewTab from './_components/AssetOverviewTab'
import BuildingDetailTab from './_components/BuildingDetailTab'
import SettlementTab from './_components/SettlementTab'
import VotesTab from './_components/VotesTab'

const TABS = [
  { id: 'overview',    label: '자산현황',  icon: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
    </svg>
  )},
  { id: 'building',   label: '건물상세',  icon: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 22V10l9-7 9 7v12"/><path d="M9 22V16h6v6"/>
    </svg>
  )},
  { id: 'settlement', label: '정산결과',  icon: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  )},
  { id: 'votes',      label: '안건의결',  icon: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
    </svg>
  )},
] as const

type TabId = typeof TABS[number]['id']

export default function DashboardPage() {
  const [tab, setTab] = useState<TabId>('overview')
  const { user, profile, loading, signOut } = useAuth()
  const router = useRouter()
  const initials = profile?.name ? profile.name.slice(0, 2) : '?'

  useEffect(() => {
    if (!loading && !user) router.replace('/login')
  }, [loading, user, router])

  if (loading || !user) return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <div className="flex items-center gap-2 text-slate-400 text-sm">
        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
        불러오는 중...
      </div>
    </div>
  )

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 shrink-0">
        <div className="max-w-5xl mx-auto px-5">
          {/* Top bar */}
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-white">
                  <path d="M3 22V10l9-7 9 7v12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 22V16h6v6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="font-bold text-slate-900 tracking-tight text-base">keypros</span>
            </div>

            <div className="flex items-center gap-2">
              {profile?.name && (
                <>
                  <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-indigo-700">{initials}</span>
                  </div>
                  <span className="text-sm text-slate-600 hidden sm:block">{profile.name}</span>
                </>
              )}
              <button
                onClick={signOut}
                className="ml-1 text-xs text-slate-400 hover:text-slate-600 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-slate-100"
              >
                로그아웃
              </button>
            </div>
          </div>

          {/* Tab nav */}
          <nav className="flex gap-0">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-all ${
                  tab === t.id
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                <span className={tab === t.id ? 'text-indigo-600' : 'text-slate-400'}>{t.icon}</span>
                {t.label}
              </button>
            ))}
            <Link
              href="/register/step/1"
              className="flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 transition-all"
            >
              <span className="text-slate-400">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
              </span>
              자산등록
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-5 py-6">
          {tab === 'overview'    && <AssetOverviewTab />}
          {tab === 'building'   && <BuildingDetailTab />}
          {tab === 'settlement' && <SettlementTab />}
          {tab === 'votes'      && <VotesTab />}
        </div>
      </main>
    </div>
  )
}
