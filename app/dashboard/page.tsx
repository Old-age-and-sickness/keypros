'use client'

import { useState } from 'react'
import { useAuth } from '@/src/context/AuthContext'
import AssetOverviewTab from './_components/AssetOverviewTab'
import BuildingDetailTab from './_components/BuildingDetailTab'
import SettlementTab from './_components/SettlementTab'
import VotesTab from './_components/VotesTab'

const TABS = [
  { id: 'overview',    label: '자산현황' },
  { id: 'building',   label: '건물상세정보' },
  { id: 'settlement', label: '정산결과' },
  { id: 'votes',      label: '안건의결' },
] as const

type TabId = typeof TABS[number]['id']

export default function DashboardPage() {
  const [tab, setTab] = useState<TabId>('overview')
  const { profile, signOut } = useAuth()

  return (
    <div className="flex flex-col h-screen">
      {/* 상단 헤더 + 탭 */}
      <header className="bg-white border-b border-gray-200 shrink-0">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center justify-between py-4">
            <div>
              <span className="font-bold text-lg tracking-tight">keypros</span>
              <span className="ml-2 text-sm text-gray-400">{profile?.name}</span>
            </div>
            <button
              onClick={signOut}
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              로그아웃
            </button>
          </div>
          <nav className="flex gap-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  tab === t.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* 탭 콘텐츠 */}
      <main className="flex-1 overflow-auto bg-gray-50">
        <div className="max-w-4xl mx-auto px-6 py-6">
          {tab === 'overview'    && <AssetOverviewTab />}
          {tab === 'building'   && <BuildingDetailTab />}
          {tab === 'settlement' && <SettlementTab />}
          {tab === 'votes'      && <VotesTab />}
        </div>
      </main>
    </div>
  )
}
