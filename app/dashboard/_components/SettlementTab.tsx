'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/src/context/AuthContext'
import { supabase } from '@/src/lib/supabase'

const ALPHA = 0.05

type Property   = { id: string; name: string }
type Settlement = {
  id: string; property_id: string; settlement_month: string
  settlement_type: string; status: string
  total_income: number; total_expense: number; net_profit: number
  note: string | null
}
type Member = {
  user_id: string; ownership_ratio: number
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
      }).catch(() => setLoading(false))
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
      setMembers((mData ?? []) as unknown as Member[])
    })
  }, [selectedPropId])

  if (loading) return (
    <div className="flex items-center justify-center py-20 text-slate-400 text-sm gap-2">
      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
      불러오는 중...
    </div>
  )
  if (properties.length === 0) return (
    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
      <p className="text-slate-500 font-medium">조회 가능한 자산이 없습니다</p>
    </div>
  )
  if (!selected) return (
    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
      <p className="text-slate-500 font-medium">정산 데이터가 없습니다</p>
    </div>
  )

  const NOI     = selected.total_income - selected.total_expense
  const reserve = NOI * ALPHA
  const NOI_div = NOI * (1 - ALPHA)

  return (
    <div className="flex flex-col gap-5">
      {/* 자산 선택 */}
      {properties.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {properties.map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedPropId(p.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                selectedPropId === p.id
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}

      {/* 정산 기간 선택 */}
      {settlements.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {settlements.map(s => (
            <button
              key={s.id}
              onClick={() => setSelected(s)}
              className={`px-3.5 py-1.5 rounded-lg text-sm whitespace-nowrap font-medium transition-all ${
                selected.id === s.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700'
              }`}
            >
              {s.settlement_month.slice(0, 7)}
            </button>
          ))}
        </div>
      )}

      {/* 정산 요약 카드 */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-indigo-500 to-violet-500" />
        <div className="p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="text-xs text-slate-400 mb-0.5">정산 기간</div>
              <div className="font-bold text-xl text-slate-900">
                {selected.settlement_month.slice(0, 7)}
                <span className="text-sm font-normal text-slate-400 ml-2">{selected.settlement_type}</span>
              </div>
            </div>
            <span className={`text-xs px-3 py-1.5 rounded-full font-semibold ${
              selected.status === 'CONFIRMED'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                : 'bg-amber-50 text-amber-700 border border-amber-100'
            }`}>
              {selected.status === 'CONFIRMED' ? '✓ 확정' : '○ 임시'}
            </span>
          </div>

          {/* 수입·비용 요약 */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3.5">
              <div className="text-xs text-emerald-600 mb-1">총 수입</div>
              <div className="font-bold text-emerald-700">{krw(selected.total_income)}원</div>
            </div>
            <div className="bg-rose-50 border border-rose-100 rounded-xl p-3.5">
              <div className="text-xs text-rose-600 mb-1">총 비용</div>
              <div className="font-bold text-rose-700">{krw(selected.total_expense)}원</div>
            </div>
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3.5">
              <div className="text-xs text-indigo-600 mb-1">순이익 (NOI)</div>
              <div className={`font-bold ${NOI >= 0 ? 'text-indigo-700' : 'text-rose-700'}`}>
                {NOI >= 0 ? '' : '−'}{krw(Math.abs(NOI))}원
              </div>
            </div>
          </div>

          {/* IFRS 단계 */}
          <div className="bg-slate-50 rounded-xl border border-slate-100 divide-y divide-slate-100">
            <StepRow step="1" label="총수입 (R_gross)" value={selected.total_income} />
            <StepRow step="2" label="비용 공제 (E_total)" value={-selected.total_expense} neg />
            <div className="px-4 py-2.5 flex items-center justify-between bg-white">
              <span className="text-xs font-bold text-slate-700">Step 3 &nbsp; 순이익 (NOI)</span>
              <span className={`text-sm font-bold ${NOI >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
                {NOI >= 0 ? '' : '−'}{krw(Math.abs(NOI))}원
              </span>
            </div>
            <StepRow step="3b" label={`운영준비금 (α = ${ALPHA * 100}%)`} value={-reserve} neg />
            <div className="px-4 py-3 flex items-center justify-between bg-indigo-50 rounded-b-xl">
              <span className="text-sm font-bold text-indigo-700">배분가능이익 (NOI_div)</span>
              <span className="text-lg font-bold text-indigo-700">{krw(NOI_div)}원</span>
            </div>
          </div>
        </div>
      </div>

      {/* 지분율 배분 테이블 */}
      {members.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-sm text-slate-900">지분율 기반 배분</h3>
            <span className="text-xs text-slate-400">P_i = NOI_div × S_i</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-xs text-slate-400 uppercase tracking-wide">
                  <th className="text-left px-5 py-3 font-medium">투자자</th>
                  <th className="text-right px-5 py-3 font-medium">지분율</th>
                  <th className="text-right px-5 py-3 font-medium">배분금액</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {members.map(m => {
                  const payout = NOI_div * (Number(m.ownership_ratio) / 100)
                  const isMe   = m.user_id === user?.id
                  return (
                    <tr key={m.user_id} className={`transition-colors ${isMe ? 'bg-indigo-50/60' : 'hover:bg-slate-50'}`}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isMe ? 'bg-indigo-200 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                            {(m.profiles?.name ?? '?').slice(0, 2)}
                          </div>
                          <span className="font-medium text-slate-800">
                            {m.profiles?.name ?? '(알 수 없음)'}
                          </span>
                          {isMe && <span className="text-xs text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded-md">나</span>}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right text-slate-500 font-medium">
                        {Number(m.ownership_ratio).toFixed(1)}%
                      </td>
                      <td className={`px-5 py-3.5 text-right font-bold ${isMe ? 'text-indigo-600' : 'text-slate-800'}`}>
                        {krw(payout)}원
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 border-t-2 border-slate-200 font-semibold">
                  <td className="px-5 py-3 text-slate-700">합계</td>
                  <td className="px-5 py-3 text-right text-slate-500">100%</td>
                  <td className="px-5 py-3 text-right text-indigo-600 font-bold">{krw(NOI_div)}원</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {selected.note && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3.5 text-sm text-amber-800 flex gap-2">
          <span className="shrink-0">📌</span>
          <span>{selected.note}</span>
        </div>
      )}
    </div>
  )
}

function StepRow({ step, label, value, neg }: {
  step: string; label: string; value: number; neg?: boolean
}) {
  const display = neg
    ? `− ${krw(Math.abs(value))}원`
    : `${krw(value)}원`

  return (
    <div className="px-4 py-2.5 flex items-center justify-between">
      <span className="text-xs text-slate-500">
        <span className="text-slate-400 mr-2">Step {step}</span>
        {label}
      </span>
      <span className={`text-sm font-medium ${neg ? 'text-rose-500' : 'text-slate-700'}`}>
        {display}
      </span>
    </div>
  )
}
