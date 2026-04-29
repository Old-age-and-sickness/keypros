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

const STATUS_COLOR: Record<string, string> = {
  OCCUPIED: 'bg-green-100 text-green-700',
  VACANT:   'bg-red-100 text-red-600',
  RESERVED: 'bg-yellow-100 text-yellow-700',
}
const STATUS_LABEL: Record<string, string> = { OCCUPIED:'임차 중', VACANT:'공실', RESERVED:'예약' }

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

  if (loading) return <p className="text-gray-400 text-sm text-center py-12">로딩 중...</p>
  if (properties.length === 0) return <p className="text-gray-400 text-sm text-center py-12">조회 가능한 자산이 없습니다.</p>

  const prop = properties.find(p => p.id === selectedId)!
  const occupied = units.filter(u => u.status === 'OCCUPIED')
  const totalRent = occupied.reduce((s, u) => s + u.monthly_rent, 0)
  const totalMgmt = occupied.reduce((s, u) => s + u.mgmt_fee, 0)
  const occupancyRate = units.length > 0 ? (occupied.length / units.length) * 100 : 0

  return (
    <div className="flex flex-col gap-5">
      {/* 자산 선택 */}
      {properties.length > 1 && (
        <div className="flex gap-2">
          {properties.map(p => (
            <button key={p.id} onClick={() => setSelectedId(p.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedId === p.id ? 'bg-blue-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}>
              {p.name}
            </button>
          ))}
        </div>
      )}

      {/* 건물 요약 */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-4">
        <div>
          <h2 className="font-bold text-lg">{prop.name}</h2>
          <p className="text-sm text-gray-400">{prop.address}</p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: '총 면적', value: prop.total_area_sqm ? `${Number(prop.total_area_sqm).toLocaleString()}㎡` : '-' },
            { label: '층수', value: prop.floors_above ? `지상 ${prop.floors_above}층 ${prop.floors_below ? `/ 지하 ${prop.floors_below}층` : ''}` : '-' },
            { label: '취득가', value: krw(prop.acquisition_price) },
            { label: '현재가', value: prop.current_value ? krw(prop.current_value) : '-' },
          ].map(item => (
            <div key={item.label} className="bg-gray-50 rounded-xl p-3">
              <div className="text-xs text-gray-400 mb-1">{item.label}</div>
              <div className="font-semibold text-sm">{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 임대 현황 요약 */}
      {units.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: '전체 호실', value: `${units.length}실` },
            { label: '임차 중', value: `${occupied.length}실`, highlight: true },
            { label: '월 임대료 합계', value: krw(totalRent) },
            { label: '공실률', value: `${(100 - occupancyRate).toFixed(0)}%` },
          ].map(item => (
            <div key={item.label} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="text-xs text-gray-400 mb-1">{item.label}</div>
              <div className={`text-xl font-bold ${item.highlight ? 'text-blue-600' : ''}`}>{item.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* 호실 목록 */}
      {units.length > 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-sm">호실 현황</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-400">
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
              <tbody className="divide-y divide-gray-100">
                {units.map(unit => (
                  <tr key={unit.id} className={unit.status === 'VACANT' ? 'bg-red-50/30' : ''}>
                    <td className="px-4 py-3 font-medium">{unit.floor}층 {unit.unit_number}호</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLOR[unit.status]}`}>
                        {STATUS_LABEL[unit.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{unit.tenant_name ?? '-'}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{Number(unit.area_sqm).toFixed(0)}㎡</td>
                    <td className="px-4 py-3 text-right">{unit.deposit > 0 ? krw(unit.deposit) : '-'}</td>
                    <td className="px-4 py-3 text-right font-medium">{unit.monthly_rent > 0 ? krw(unit.monthly_rent) : '-'}</td>
                    <td className="px-4 py-3 text-right text-gray-500">{unit.mgmt_fee > 0 ? krw(unit.mgmt_fee) : '-'}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {unit.lease_start && unit.lease_end
                        ? `${unit.lease_start} ~ ${unit.lease_end}`
                        : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 font-semibold text-sm border-t border-gray-200">
                  <td className="px-4 py-3" colSpan={5}>합계 ({occupied.length}실 임차 중)</td>
                  <td className="px-4 py-3 text-right text-blue-600">{krw(totalRent)}</td>
                  <td className="px-4 py-3 text-right text-gray-500">{krw(totalMgmt)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
          <p className="text-gray-400 text-sm">임대 호실 정보가 없습니다.</p>
          <p className="text-gray-300 text-xs mt-1">(토지 등 비건물 자산)</p>
        </div>
      )}
    </div>
  )
}
