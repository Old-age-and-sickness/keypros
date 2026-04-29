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

const TYPE_LABEL: Record<string, string> = { COMMERCIAL:'상업용', LAND:'토지', APARTMENT:'아파트', OFFICETEL:'오피스텔' }
const TYPE_COLOR: Record<string, string> = { COMMERCIAL:'bg-blue-100 text-blue-700', LAND:'bg-green-100 text-green-700', APARTMENT:'bg-purple-100 text-purple-700', OFFICETEL:'bg-orange-100 text-orange-700' }
const CYCLE_LABEL: Record<string, string> = { MONTHLY:'월별 정산', QUARTERLY:'분기 정산', SEMIANNUAL:'반기 정산', ANNUAL:'연간 정산' }
const ROLE_LABEL: Record<string, string> = { LEAD:'대표', INVESTOR:'투자자', OBSERVER:'열람자' }

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
    if (!user) return
    Promise.all([
      supabase.from('properties').select('*').eq('status', 'ACTIVE').order('name'),
      supabase.from('property_members')
        .select('property_id, role, ownership_ratio, investment_amount')
        .eq('user_id', user.id).eq('status', 'ACTIVE'),
    ]).then(([{ data: props }, { data: mems }]) => {
      setProperties((props ?? []) as Property[])
      const map = new Map<string, Membership>()
      ;(mems ?? []).forEach((m: Membership) => map.set(m.property_id, m))
      setMemberships(map)
      setLoading(false)
    })
  }, [user])

  if (loading) return <p className="text-gray-400 text-sm text-center py-12">로딩 중...</p>

  const myProps = properties.filter(p => memberships.has(p.id))
  const totalInvestment = Array.from(memberships.values()).reduce((s, m) => s + Number(m.investment_amount), 0)

  return (
    <div className="flex flex-col gap-4">
      {myProps.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="text-xs text-gray-400 mb-1">보유 자산</div>
            <div className="text-2xl font-bold">{myProps.length}건</div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="text-xs text-gray-400 mb-1">총 투자금</div>
            <div className="text-2xl font-bold">{krw(totalInvestment)}</div>
          </div>
        </div>
      )}

      {properties.length === 0 ? (
        <p className="text-center text-gray-400 text-sm py-12">조회 가능한 자산이 없습니다.</p>
      ) : (
        properties.map(prop => {
          const mem = memberships.get(prop.id)
          const gain = prop.current_value && prop.current_value !== prop.acquisition_price
            ? ((prop.current_value - prop.acquisition_price) / prop.acquisition_price) * 100
            : null

          return (
            <div key={prop.id} className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-semibold">{prop.name}</h2>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLOR[prop.asset_type] ?? 'bg-gray-100 text-gray-500'}`}>
                      {TYPE_LABEL[prop.asset_type] ?? prop.asset_type}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mt-0.5 truncate">{prop.address}</p>
                </div>
                {mem && (
                  <div className="text-right shrink-0">
                    <div className="text-2xl font-bold text-blue-600">{Number(mem.ownership_ratio).toFixed(1)}%</div>
                    <div className="text-xs text-gray-400">{ROLE_LABEL[mem.role] ?? mem.role}</div>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-100">
                <div>
                  <div className="text-xs text-gray-400 mb-0.5">취득가</div>
                  <div className="font-semibold text-sm">{krw(prop.acquisition_price)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-0.5">현재가</div>
                  <div className="font-semibold text-sm">{prop.current_value ? krw(prop.current_value) : '-'}</div>
                  {gain !== null && (
                    <div className={`text-xs mt-0.5 ${gain >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {gain >= 0 ? '+' : ''}{gain.toFixed(1)}%
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-0.5">면적</div>
                  <div className="font-semibold text-sm">
                    {prop.total_area_sqm ? `${Number(prop.total_area_sqm).toLocaleString()}㎡` : '-'}
                  </div>
                  {prop.floors_above && <div className="text-xs text-gray-400 mt-0.5">지상 {prop.floors_above}층</div>}
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>취득일 {prop.acquisition_date}</span>
                <span>{CYCLE_LABEL[prop.settlement_cycle]}</span>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
