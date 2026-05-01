'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/src/lib/supabase'

type Property = {
  id: string; name: string; address: string; asset_type: string; status: string
  acquisition_price: number; current_value: number | null
  total_area_sqm: number | null; floors_above: number | null; floors_below: number | null
  acquisition_date: string; settlement_cycle: string; purpose: string | null
}
type Member = {
  user_id: string; role: string; ownership_ratio: number; investment_amount: number
  status: string
  profiles: { name: string; email: string | null } | null
}
type Unit = { id: string; status: string }

const TYPE_STYLE: Record<string, string> = {
  COMMERCIAL: 'bg-blue-50 text-blue-700 border border-blue-100',
  LAND:       'bg-emerald-50 text-emerald-700 border border-emerald-100',
  APARTMENT:  'bg-violet-50 text-violet-700 border border-violet-100',
  OFFICETEL:  'bg-orange-50 text-orange-700 border border-orange-100',
}
const TYPE_KO: Record<string, string> = { COMMERCIAL:'상업용', LAND:'토지', APARTMENT:'아파트', OFFICETEL:'오피스텔' }
const STATUS_STYLE: Record<string, string> = {
  ACTIVE:   'bg-emerald-50 text-emerald-700 border border-emerald-100',
  INACTIVE: 'bg-slate-100 text-slate-500',
  SOLD:     'bg-rose-50 text-rose-600 border border-rose-100',
}
const STATUS_KO: Record<string, string> = { ACTIVE:'운영 중', INACTIVE:'비활성', SOLD:'매각' }
const CYCLE_KO: Record<string, string> = { MONTHLY:'월별', QUARTERLY:'분기', SEMIANNUAL:'반기', ANNUAL:'연간' }
const ROLE_KO: Record<string, string> = { LEAD:'대표', INVESTOR:'투자자', OBSERVER:'열람자' }

function krw(n: number) {
  if (n >= 100_000_000) { const v = n / 100_000_000; return `${v % 1 === 0 ? v : v.toFixed(1)}억` }
  if (n >= 10_000) return `${Math.round(n / 10_000).toLocaleString()}만`
  return n.toLocaleString()
}

export default function PropertiesTab() {
  const [properties, setProperties] = useState<Property[]>([])
  const [membersMap, setMembersMap]  = useState<Map<string, Member[]>>(new Map())
  const [unitsMap, setUnitsMap]      = useState<Map<string, Unit[]>>(new Map())
  const [loading, setLoading]        = useState(true)
  const [expanded, setExpanded]      = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      supabase.from('properties').select('*').order('name'),
      supabase.from('property_members').select('*, profiles(name, email)').eq('status', 'ACTIVE'),
      supabase.from('rental_units').select('id, property_id, status'),
    ]).then(([{ data: props }, { data: mems }, { data: units }]) => {
      setProperties((props ?? []) as Property[])

      const mMap = new Map<string, Member[]>()
      ;(mems ?? []).forEach((m: Member & { property_id: string }) => {
        const arr = mMap.get(m.property_id) ?? []
        arr.push(m)
        mMap.set(m.property_id, arr)
      })
      setMembersMap(mMap)

      const uMap = new Map<string, Unit[]>()
      ;(units ?? []).forEach((u: Unit & { property_id: string }) => {
        const arr = uMap.get(u.property_id) ?? []
        arr.push(u)
        uMap.set(u.property_id, arr)
      })
      setUnitsMap(uMap)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center py-20 text-slate-400 text-sm gap-2">
      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
      불러오는 중...
    </div>
  )

  if (properties.length === 0) return (
    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
      <div className="text-4xl mb-3">🏢</div>
      <p className="text-slate-500 font-medium">등록된 자산이 없습니다</p>
    </div>
  )

  return (
    <div className="flex flex-col gap-3">
      <div className="text-xs text-slate-400">{properties.length}개 자산</div>

      {properties.map(prop => {
        const members  = membersMap.get(prop.id) ?? []
        const units    = unitsMap.get(prop.id) ?? []
        const occupied = units.filter(u => u.status === 'OCCUPIED').length
        const gain     = prop.current_value && prop.current_value !== prop.acquisition_price
          ? ((prop.current_value - prop.acquisition_price) / prop.acquisition_price) * 100
          : null
        const totalInv = members.reduce((s, m) => s + Number(m.investment_amount), 0)
        const isOpen   = expanded === prop.id

        return (
          <div key={prop.id} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <button
              onClick={() => setExpanded(isOpen ? null : prop.id)}
              className="w-full text-left px-5 py-4 flex items-start gap-4 hover:bg-slate-50/80 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-bold text-slate-900">{prop.name}</span>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${TYPE_STYLE[prop.asset_type] ?? 'bg-slate-100 text-slate-500'}`}>
                    {TYPE_KO[prop.asset_type] ?? prop.asset_type}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[prop.status] ?? 'bg-slate-100 text-slate-500'}`}>
                    {STATUS_KO[prop.status] ?? prop.status}
                  </span>
                </div>
                <p className="text-sm text-slate-400 truncate">{prop.address}</p>
              </div>

              <div className="shrink-0 text-right hidden sm:block">
                <div className="text-sm font-bold text-slate-800">{krw(prop.acquisition_price)}</div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {members.length}명 · {units.length > 0 ? `${occupied}/${units.length}실` : '호실 없음'}
                </div>
              </div>

              <svg
                width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                className={`text-slate-400 mt-1 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              >
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>

            {isOpen && (
              <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-4 flex flex-col gap-4">
                {/* 자산 수치 */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: '취득가', value: krw(prop.acquisition_price) },
                    { label: '현재가', value: prop.current_value ? krw(prop.current_value) : '—',
                      sub: gain !== null ? (
                        <span className={`text-xs font-medium ${gain >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                          {gain >= 0 ? '▲' : '▼'} {Math.abs(gain).toFixed(1)}%
                        </span>
                      ) : null },
                    { label: '총 투자금', value: totalInv > 0 ? krw(totalInv) : '—' },
                    { label: '정산 주기', value: CYCLE_KO[prop.settlement_cycle] ?? prop.settlement_cycle },
                  ].map(item => (
                    <div key={item.label} className="bg-white rounded-xl border border-slate-100 p-3">
                      <div className="text-xs text-slate-400 mb-0.5">{item.label}</div>
                      <div className="font-semibold text-sm text-slate-800">{item.value}</div>
                      {'sub' in item && item.sub}
                    </div>
                  ))}
                </div>

                {/* 소유자 목록 */}
                {members.length > 0 && (
                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100 text-xs font-semibold text-slate-500">
                      소유자 / 구성원 ({members.length}명)
                    </div>
                    <div className="divide-y divide-slate-50">
                      {members.map(m => (
                        <div key={m.user_id} className="px-4 py-3 flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-slate-500">
                              {(m.profiles?.name ?? '?').slice(0, 2)}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-slate-800">{m.profiles?.name ?? '(알 수 없음)'}</div>
                            <div className="text-xs text-slate-400">{m.profiles?.email}</div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-sm font-bold text-indigo-600">{Number(m.ownership_ratio).toFixed(1)}%</div>
                            <div className="text-xs text-slate-400">{ROLE_KO[m.role] ?? m.role}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 호실 요약 */}
                {units.length > 0 && (
                  <div className="flex gap-3">
                    <div className="bg-white rounded-xl border border-slate-200 p-3 flex-1 text-center">
                      <div className="text-xs text-slate-400 mb-0.5">전체 호실</div>
                      <div className="font-bold text-slate-800">{units.length}실</div>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex-1 text-center">
                      <div className="text-xs text-emerald-600 mb-0.5">임차 중</div>
                      <div className="font-bold text-emerald-700">{occupied}실</div>
                    </div>
                    <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 flex-1 text-center">
                      <div className="text-xs text-rose-500 mb-0.5">공실</div>
                      <div className="font-bold text-rose-600">{units.length - occupied}실</div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
