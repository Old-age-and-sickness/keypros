'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/src/context/AuthContext'
import { supabase } from '@/src/lib/supabase'

const ALPHA = 0.05

type Property = { id: string; name: string }

type Settlement = {
  id: string
  property_id: string
  settlement_month: string
  settlement_type: string
  status: string
  total_income: number
  total_expense: number
  net_profit: number
  note: string | null
}

type Member = {
  user_id: string
  ownership_ratio: number
  profiles: { name: string } | null
}

function krw(n: number) {
  if (n >= 100_000_000) { const v = n / 100_000_000; return `${v % 1 === 0 ? v : v.toFixed(1)}억` }
  if (n >= 10_000) return `${Math.round(n / 10_000).toLocaleString()}만`
  return n.toLocaleString()
}

export default function SettlementTab() {
  const { user } = useAuth()
  const [properties, setProperties] = useState<Property[]>([])
  const [selectedPropId, setSelectedPropId] = useState('')
  const [settlements, setSettlements] = useState<Settlement[]>([])
  const [selected, setSelected] = useState<Settlement | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('properties').select('id, name').eq('status', 'ACTIVE').order('name')
      .then(({ data }) => {
        const props = (data ?? []) as Property[]
        setProperties(props)
        if (props.length > 0) setSelectedPropId(props[0].id)
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    if (!selectedPropId) return
    Promise.all([
      supabase.from('settlements').select('*')
        .eq('property_id', selectedPropId).order('settlement_month', { ascending: false }),
      supabase.from('property_members')
        .select('user_id, ownership_ratio, profiles(name)')
        .eq('property_id', selectedPropId).eq('status', 'ACTIVE')
        .order('ownership_ratio', { ascending: false }),
    ]).then(([{ data: sData }, { data: mData }]) => {
      const setts = (sData ?? []) as Settlement[]
      setSettlements(setts)
      setSelected(setts[0] ?? null)
      setMembers((mData ?? []) as Member[])
    })
  }, [selectedPropId])

  if (loading) return <p className="text-gray-400 text-sm text-center py-12">로딩 중...</p>
  if (properties.length === 0) return <p className="text-gray-400 text-sm text-center py-12">조회 가능한 자산이 없습니다.</p>
  if (!selected) return <p className="text-gray-400 text-sm text-center py-12">정산 데이터가 없습니다.</p>

  const NOI = selected.total_income - selected.total_expense
  const reserve = NOI * ALPHA
  const NOI_div = NOI * (1 - ALPHA)

  return (
    <div className="flex flex-col gap-5">
      {/* 자산 선택 */}
      {properties.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {properties.map(p => (
            <button key={p.id} onClick={() => setSelectedPropId(p.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedPropId === p.id ? 'bg-blue-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}>
              {p.name}
            </button>
          ))}
        </div>
      )}

      {/* 정산 기간 탭 */}
      {settlements.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {settlements.map(s => (
            <button key={s.id} onClick={() => setSelected(s)}
              className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors ${
                selected.id === s.id
                  ? 'bg-gray-800 text-white'
                  : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}>
              {s.settlement_month.slice(0, 7)}
            </button>
          ))}
        </div>
      )}

      {/* 정산 헤더 */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-400 mb-0.5">정산 기간</div>
            <div className="font-bold text-xl">
              {selected.settlement_month.slice(0, 7)}
              <span className="text-sm font-normal text-gray-400 ml-2">{selected.settlement_type}</span>
            </div>
          </div>
          <span className={`text-xs px-3 py-1 rounded-full font-medium ${
            selected.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-600'
          }`}>
            {selected.status === 'CONFIRMED' ? '확정' : '임시'}
          </span>
        </div>

        {/* IFRS 단계별 계산 */}
        <div className="flex flex-col">
          <Row label="Step 1  총수입 (R_gross)" value={selected.total_income} />
          <Row label="Step 2  비용 공제 (E_total)" value={-selected.total_expense} neg />
          <div className="border-t border-gray-200 my-1" />
          <Row label="Step 3  순이익 (NOI = R_gross − E_total)" value={NOI} bold />
          <Row label={`Step 3b  운영준비금 (α = ${ALPHA * 100}%)`} value={-reserve} neg />
          <div className="border-t border-gray-200 my-1" />
          <Row label="Step 3c  배분가능이익 (NOI_div)" value={NOI_div} bold highlight />
        </div>
      </div>

      {/* 지분율 기반 배분 */}
      {members.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-sm">Step 4  지분율 기반 배분 (P_i = NOI_div × S_i)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-400">
                  <th className="text-left px-4 py-3 font-medium">투자자</th>
                  <th className="text-right px-4 py-3 font-medium">지분율 (S_i)</th>
                  <th className="text-right px-4 py-3 font-medium">배분금액 (P_i)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {members.map(m => {
                  const payout = NOI_div * (Number(m.ownership_ratio) / 100)
                  const isMe = m.user_id === user?.id
                  return (
                    <tr key={m.user_id} className={isMe ? 'bg-blue-50/50' : ''}>
                      <td className="px-4 py-3 font-medium">
                        {m.profiles?.name ?? '(알수없음)'}
                        {isMe && <span className="ml-2 text-xs text-blue-500 font-normal">(나)</span>}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">
                        {Number(m.ownership_ratio).toFixed(1)}%
                      </td>
                      <td className={`px-4 py-3 text-right font-bold ${isMe ? 'text-blue-600' : 'text-gray-700'}`}>
                        {krw(payout)}원
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 border-t border-gray-200 font-semibold text-sm">
                  <td className="px-4 py-3">합계</td>
                  <td className="px-4 py-3 text-right">100%</td>
                  <td className="px-4 py-3 text-right text-blue-600">{krw(NOI_div)}원</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {selected.note && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-sm text-yellow-700">
          {selected.note}
        </div>
      )}
    </div>
  )
}

function Row({
  label, value, neg, bold, highlight,
}: {
  label: string; value: number; neg?: boolean; bold?: boolean; highlight?: boolean
}) {
  const display = neg
    ? `− ${krw(Math.abs(value))}원`
    : `${krw(value)}원`

  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-sm text-gray-500">{label}</span>
      <span className={`text-sm ${bold ? 'font-bold' : 'font-medium'} ${
        highlight ? 'text-blue-600 text-base' : neg ? 'text-red-500' : 'text-gray-800'
      }`}>
        {display}
      </span>
    </div>
  )
}
