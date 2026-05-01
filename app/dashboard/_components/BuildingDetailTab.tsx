'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/src/lib/supabase'

type Property = {
  id: string; name: string; address: string; asset_type: string
  total_area_sqm: number | null; floors_above: number | null; floors_below: number | null
  acquisition_price: number; current_value: number | null
  acquisition_date: string; settlement_cycle: string; purpose: string | null; status: string
}
type Unit = {
  id: string; unit_number: string; floor: number; area_sqm: number
  tenant_name: string | null; business_type: string | null
  deposit: number; monthly_rent: number; mgmt_fee: number
  lease_start: string | null; lease_end: string | null; status: string
}

const STATUS_STYLE: Record<string, string> = {
  OCCUPIED: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
  VACANT:   'bg-rose-50 text-rose-600 border border-rose-100',
  RESERVED: 'bg-amber-50 text-amber-700 border border-amber-100',
}
const STATUS_LABEL: Record<string, string> = { OCCUPIED: '임차 중', VACANT: '공실', RESERVED: '예약' }

function krw(n: number) {
  if (n >= 100_000_000) { const v = n / 100_000_000; return `${v % 1 === 0 ? v : v.toFixed(1)}억` }
  if (n >= 10_000) return `${Math.round(n / 10_000).toLocaleString()}만`
  return n.toLocaleString()
}

export default function BuildingDetailTab() {
  const [properties, setProperties] = useState<Property[]>([])
  const [selectedId, setSelectedId] = useState<string>('')
  const [units, setUnits] = useState<Unit[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('properties').select('*').eq('status', 'ACTIVE').order('name')
      .then(({ data }) => {
        const props = (data ?? []) as Property[]
        setProperties(props)
        if (props.length > 0) setSelectedId(props[0].id)
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    if (!selectedId) return
    supabase.from('rental_units').select('*')
      .eq('property_id', selectedId).order('floor').order('unit_number')
      .then(({ data }) => setUnits((data ?? []) as Unit[]))
  }, [selectedId])

  if (loading) return (
    <div className="flex items-center justify-center py-20 text-slate-400 text-sm gap-2">
      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
      불러오는 중...
    </div>
  )
  if (properties.length === 0) return (
    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
      <div className="text-4xl mb-3">🏢</div>
      <p className="text-slate-500 font-medium">조회 가능한 자산이 없습니다</p>
    </div>
  )

  const prop = properties.find(p => p.id === selectedId)!
  const occupied = units.filter(u => u.status === 'OCCUPIED')
  const totalRent = occupied.reduce((s, u) => s + u.monthly_rent, 0)
  const totalMgmt = occupied.reduce((s, u) => s + u.mgmt_fee, 0)
  const occupancyRate = units.length > 0 ? (occupied.length / units.length) * 100 : 0

  return (
    <div className="flex flex-col gap-5">
      {/* 자산 선택 */}
      {properties.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {properties.map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedId(p.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                selectedId === p.id
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}

      {/* 건물 정보 카드 */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500" />
        <div className="p-5 flex flex-col gap-4">
          <div>
            <h2 className="font-bold text-lg text-slate-900">{prop.name}</h2>
            <p className="text-sm text-slate-400">{prop.address}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: '총 면적', value: prop.total_area_sqm ? `${Number(prop.total_area_sqm).toLocaleString()}㎡` : '—' },
              { label: '층수', value: prop.floors_above ? `지상 ${prop.floors_above}층${prop.floors_below ? ` / 지하 ${prop.floors_below}층` : ''}` : '—' },
              { label: '취득가', value: krw(prop.acquisition_price) },
              { label: '현재가', value: prop.current_value ? krw(prop.current_value) : '—' },
            ].map(item => (
              <div key={item.label} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <div className="text-xs text-slate-400 mb-1">{item.label}</div>
                <div className="font-semibold text-sm text-slate-800">{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 임대 현황 */}
      {units.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: '전체 호실', value: `${units.length}실`, color: 'text-slate-900', bg: '' },
            { label: '임차 중', value: `${occupied.length}실`, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
            { label: '월 임대료', value: krw(totalRent), color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-100' },
            { label: '공실률', value: `${(100 - occupancyRate).toFixed(0)}%`, color: occupancyRate < 80 ? 'text-rose-600' : 'text-slate-700', bg: occupancyRate < 80 ? 'bg-rose-50 border-rose-100' : '' },
          ].map(item => (
            <div key={item.label} className={`bg-white rounded-xl border ${item.bg || 'border-slate-200'} p-4 shadow-sm`}>
              <div className="text-xs text-slate-400 mb-1">{item.label}</div>
              <div className={`text-xl font-bold ${item.color}`}>{item.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* 점유율 바 */}
      {units.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-slate-700">점유율</span>
            <span className="text-sm font-bold text-emerald-600">{occupancyRate.toFixed(0)}%</span>
          </div>
          <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-700"
              style={{ width: `${occupancyRate}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-400 mt-1.5">
            <span>{occupied.length}실 임차 중</span>
            <span>{units.length - occupied.length}실 공실</span>
          </div>
        </div>
      )}

      {/* 호실 테이블 */}
      {units.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-sm text-slate-900">호실 현황</h3>
            <span className="text-xs text-slate-400">{units.length}개 호실</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-xs text-slate-400 uppercase tracking-wide">
                  <th className="text-left px-4 py-3 font-medium">호실</th>
                  <th className="text-left px-4 py-3 font-medium">상태</th>
                  <th className="text-left px-4 py-3 font-medium">임차인</th>
                  <th className="text-right px-4 py-3 font-medium">면적</th>
                  <th className="text-right px-4 py-3 font-medium">보증금</th>
                  <th className="text-right px-4 py-3 font-medium">월 임대료</th>
                  <th className="text-right px-4 py-3 font-medium">관리비</th>
                  <th className="text-left px-4 py-3 font-medium">임대 기간</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {units.map(unit => (
                  <tr
                    key={unit.id}
                    className={`transition-colors hover:bg-slate-50/80 ${unit.status === 'VACANT' ? 'bg-rose-50/20' : ''}`}
                  >
                    <td className="px-4 py-3.5 font-medium text-slate-800">{unit.floor}층 {unit.unit_number}호</td>
                    <td className="px-4 py-3.5">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${STATUS_STYLE[unit.status]}`}>
                        {STATUS_LABEL[unit.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">{unit.tenant_name ?? '—'}</td>
                    <td className="px-4 py-3.5 text-right text-slate-500">{Number(unit.area_sqm).toFixed(0)}㎡</td>
                    <td className="px-4 py-3.5 text-right text-slate-700">{unit.deposit > 0 ? krw(unit.deposit) : '—'}</td>
                    <td className="px-4 py-3.5 text-right font-semibold text-slate-800">{unit.monthly_rent > 0 ? krw(unit.monthly_rent) : '—'}</td>
                    <td className="px-4 py-3.5 text-right text-slate-500">{unit.mgmt_fee > 0 ? krw(unit.mgmt_fee) : '—'}</td>
                    <td className="px-4 py-3.5 text-xs text-slate-400">
                      {unit.lease_start && unit.lease_end ? `${unit.lease_start} ~ ${unit.lease_end}` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 border-t-2 border-slate-200 font-semibold text-sm">
                  <td className="px-4 py-3 text-slate-700" colSpan={5}>합계 ({occupied.length}실 임차 중)</td>
                  <td className="px-4 py-3 text-right text-emerald-600">{krw(totalRent)}</td>
                  <td className="px-4 py-3 text-right text-slate-500">{krw(totalMgmt)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center shadow-sm">
          <p className="text-slate-400 text-sm">임대 호실 정보가 없습니다</p>
          <p className="text-slate-300 text-xs mt-1">토지 등 비건물 자산</p>
        </div>
      )}
    </div>
  )
}
