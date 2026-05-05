'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/src/context/AuthContext'
import { supabase } from '@/src/lib/supabase'

type Property = {
  id: string; name: string; address: string; asset_type: string
  acquisition_price: number; current_value: number | null
  total_area_sqm: number | null; floors_above: number | null
  settlement_cycle: string; acquisition_date: string
}
type Membership = { property_id: string; role: string; ownership_ratio: number; investment_amount: number }

const TYPE_LABEL: Record<string, string> = { COMMERCIAL: '상업용', LAND: '토지', APARTMENT: '아파트', OFFICETEL: '오피스텔' }
const TYPE_COLOR: Record<string, string> = {
  COMMERCIAL: 'bg-blue-50 text-blue-700 border border-blue-100',
  LAND:       'bg-emerald-50 text-emerald-700 border border-emerald-100',
  APARTMENT:  'bg-violet-50 text-violet-700 border border-violet-100',
  OFFICETEL:  'bg-orange-50 text-orange-700 border border-orange-100',
}
const TYPE_ACCENT: Record<string, string> = {
  COMMERCIAL: 'bg-blue-500',
  LAND:       'bg-emerald-500',
  APARTMENT:  'bg-violet-500',
  OFFICETEL:  'bg-orange-500',
}
const CYCLE_LABEL: Record<string, string> = { MONTHLY: '월별', QUARTERLY: '분기', SEMIANNUAL: '반기', ANNUAL: '연간' }
const ROLE_LABEL:  Record<string, string> = { LEAD: '대표', INVESTOR: '투자자', OBSERVER: '열람자' }

function krw(n: number) {
  if (n >= 100_000_000) { const v = n / 100_000_000; return `${v % 1 === 0 ? v : v.toFixed(1)}억` }
  if (n >= 10_000) return `${Math.round(n / 10_000).toLocaleString()}만`
  return n.toLocaleString()
}

export default function AssetOverviewTab() {
  const { user } = useAuth()
  const [properties, setProperties] = useState<Property[]>([])
  const [memberships, setMemberships] = useState<Map<string, Membership>>(new Map())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { console.log('[AssetTab] user 없음, 스킵'); return }
    console.log('[AssetTab] DB 쿼리 시작, user.id:', user.id)
    Promise.all([
      supabase.from('properties').select('*').eq('status', 'ACTIVE').order('name'),
      supabase.from('property_members')
        .select('property_id, role, ownership_ratio, investment_amount')
        .eq('user_id', user.id).eq('status', 'ACTIVE'),
    ]).then(([{ data: props, error: e1 }, { data: mems, error: e2 }]) => {
      console.log('[AssetTab] 쿼리 완료', { props: props?.length, mems: mems?.length, e1, e2 })
      setProperties((props ?? []) as Property[])
      const map = new Map<string, Membership>()
      ;(mems ?? []).forEach((m: Membership) => map.set(m.property_id, m))
      setMemberships(map)
      setLoading(false)
    }).catch((err) => { console.log('[AssetTab] 쿼리 에러:', err); setLoading(false) })
  }, [user])

  if (loading) return (
    <div className="flex items-center justify-center py-20 text-slate-400 text-sm gap-2">
      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
      불러오는 중...
    </div>
  )

  const myProps = properties.filter(p => memberships.has(p.id))
  const totalInvestment = Array.from(memberships.values()).reduce((s, m) => s + Number(m.investment_amount), 0)
  const totalCurrentValue = myProps.reduce((s, p) => {
    const mem = memberships.get(p.id)
    if (!mem || !p.current_value) return s
    return s + p.current_value * (Number(mem.ownership_ratio) / 100)
  }, 0)

  return (
    <div className="flex flex-col gap-5">
      {/* 요약 카드 */}
      {myProps.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              label: '보유 자산',
              value: `${myProps.length}건`,
              icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-500">
                  <path d="M3 22V10l9-7 9 7v12"/><path d="M9 22V16h6v6"/>
                </svg>
              ),
              accent: 'bg-indigo-50',
            },
            {
              label: '총 투자금',
              value: krw(totalInvestment),
              icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
                </svg>
              ),
              accent: 'bg-emerald-50',
            },
            {
              label: '내 지분 평가액',
              value: totalCurrentValue > 0 ? krw(totalCurrentValue) : '-',
              icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-violet-500">
                  <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
                </svg>
              ),
              accent: 'bg-violet-50',
            },
          ].map(card => (
            <div key={card.label} className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col gap-2 shadow-sm">
              <div className={`w-8 h-8 rounded-xl ${card.accent} flex items-center justify-center`}>{card.icon}</div>
              <div>
                <div className="text-xs text-slate-500">{card.label}</div>
                <div className="text-xl font-bold text-slate-900 mt-0.5">{card.value}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 자산 목록 */}
      {properties.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <div className="text-4xl mb-3">🏢</div>
          <p className="text-slate-500 font-medium">조회 가능한 자산이 없습니다</p>
          <p className="text-slate-400 text-sm mt-1">관리자에게 자산 접근 권한을 요청하세요</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {properties.map(prop => {
            const mem = memberships.get(prop.id)
            const gain = prop.current_value && prop.current_value !== prop.acquisition_price
              ? ((prop.current_value - prop.acquisition_price) / prop.acquisition_price) * 100
              : null
            const accent = TYPE_ACCENT[prop.asset_type] ?? 'bg-slate-400'

            return (
              <div key={prop.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                {/* 색상 스트립 */}
                <div className={`h-1 w-full ${accent}`} />

                <div className="p-5">
                  {/* 상단: 이름 + 지분율 */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="font-bold text-slate-900">{prop.name}</h2>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLOR[prop.asset_type] ?? 'bg-slate-100 text-slate-500'}`}>
                          {TYPE_LABEL[prop.asset_type] ?? prop.asset_type}
                        </span>
                      </div>
                      <p className="text-sm text-slate-400 mt-0.5 truncate">{prop.address}</p>
                    </div>

                    {mem && (
                      <div className="text-right shrink-0">
                        <div className="text-2xl font-bold text-indigo-600">{Number(mem.ownership_ratio).toFixed(1)}%</div>
                        <div className="text-xs text-slate-400">{ROLE_LABEL[mem.role] ?? mem.role}</div>
                      </div>
                    )}
                  </div>

                  {/* 지분율 바 */}
                  {mem && (
                    <div className="mb-4">
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${accent} opacity-70`}
                          style={{ width: `${Number(mem.ownership_ratio)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* 수치 그리드 */}
                  <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-100">
                    <div>
                      <div className="text-xs text-slate-400 mb-0.5">취득가</div>
                      <div className="font-semibold text-sm text-slate-800">{krw(prop.acquisition_price)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400 mb-0.5">현재가</div>
                      <div className="font-semibold text-sm text-slate-800">{prop.current_value ? krw(prop.current_value) : '—'}</div>
                      {gain !== null && (
                        <div className={`text-xs mt-0.5 font-medium ${gain >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                          {gain >= 0 ? '▲' : '▼'} {Math.abs(gain).toFixed(1)}%
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="text-xs text-slate-400 mb-0.5">면적</div>
                      <div className="font-semibold text-sm text-slate-800">
                        {prop.total_area_sqm ? `${Number(prop.total_area_sqm).toLocaleString()}㎡` : '—'}
                      </div>
                      {prop.floors_above && (
                        <div className="text-xs text-slate-400 mt-0.5">지상 {prop.floors_above}층</div>
                      )}
                    </div>
                  </div>

                  {/* 하단 메타 */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                    <span className="text-xs text-slate-400">취득일 {prop.acquisition_date}</span>
                    <span className="text-xs bg-slate-100 text-slate-500 px-2.5 py-0.5 rounded-full font-medium">
                      {CYCLE_LABEL[prop.settlement_cycle]} 정산
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
