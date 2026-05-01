'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/src/lib/supabase'

type Settlement = {
  id: string; property_id: string; settlement_month: string
  settlement_type: string; status: string
  total_income: number; total_expense: number; net_profit: number
  note: string | null; created_at: string
  properties: { name: string } | null
}

const STATUS_STYLE: Record<string, string> = {
  CONFIRMED: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
  DRAFT:     'bg-amber-50 text-amber-700 border border-amber-100',
}
const STATUS_KO: Record<string, string> = { CONFIRMED: '확정', DRAFT: '임시' }

function krw(n: number) {
  if (n >= 100_000_000) { const v = n / 100_000_000; return `${v % 1 === 0 ? v : v.toFixed(1)}억` }
  if (n >= 10_000) return `${Math.round(n / 10_000).toLocaleString()}만`
  return n.toLocaleString()
}

export default function SettlementsTab() {
  const [settlements, setSettlements] = useState<Settlement[]>([])
  const [loading, setLoading]         = useState(true)
  const [propFilter, setPropFilter]   = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')

  useEffect(() => {
    supabase.from('settlements')
      .select('*, properties(name)')
      .order('settlement_month', { ascending: false })
      .then(({ data }) => {
        setSettlements((data ?? []) as Settlement[])
        setLoading(false)
      })
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center py-20 text-slate-400 text-sm gap-2">
      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
      불러오는 중...
    </div>
  )

  if (settlements.length === 0) return (
    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
      <div className="text-4xl mb-3">📊</div>
      <p className="text-slate-500 font-medium">정산 데이터가 없습니다</p>
    </div>
  )

  const propNames = ['ALL', ...Array.from(new Set(settlements.map(s => s.properties?.name ?? s.property_id)))]
  const filtered  = settlements
    .filter(s => propFilter === 'ALL' || (s.properties?.name ?? s.property_id) === propFilter)
    .filter(s => statusFilter === 'ALL' || s.status === statusFilter)

  const totalIncome  = filtered.reduce((s, r) => s + Number(r.total_income), 0)
  const totalExpense = filtered.reduce((s, r) => s + Number(r.total_expense), 0)
  const totalNOI     = totalIncome - totalExpense

  return (
    <div className="flex flex-col gap-4">
      {/* 필터 */}
      <div className="flex flex-wrap gap-3">
        <select
          value={propFilter}
          onChange={e => setPropFilter(e.target.value)}
          className="text-sm border border-slate-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 text-slate-600"
        >
          {propNames.map(n => <option key={n} value={n}>{n === 'ALL' ? '전체 자산' : n}</option>)}
        </select>
        <div className="flex gap-1.5">
          {(['ALL', 'CONFIRMED', 'DRAFT'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                statusFilter === s
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              {s === 'ALL' ? '전체' : STATUS_KO[s]}
            </button>
          ))}
        </div>
      </div>

      {/* 합계 요약 */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
          <div className="text-xs text-emerald-600 mb-1">총 수입 합계</div>
          <div className="text-xl font-bold text-emerald-700">{krw(totalIncome)}원</div>
        </div>
        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4">
          <div className="text-xs text-rose-600 mb-1">총 비용 합계</div>
          <div className="text-xl font-bold text-rose-700">{krw(totalExpense)}원</div>
        </div>
        <div className={`rounded-2xl p-4 border ${totalNOI >= 0 ? 'bg-indigo-50 border-indigo-100' : 'bg-rose-50 border-rose-100'}`}>
          <div className={`text-xs mb-1 ${totalNOI >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>순이익 합계 (NOI)</div>
          <div className={`text-xl font-bold ${totalNOI >= 0 ? 'text-indigo-700' : 'text-rose-700'}`}>
            {totalNOI >= 0 ? '' : '−'}{krw(Math.abs(totalNOI))}원
          </div>
        </div>
      </div>

      {/* 테이블 */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-sm text-slate-900">정산 내역</h3>
          <span className="text-xs text-slate-400">{filtered.length}건</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-xs text-slate-400 uppercase tracking-wide">
                <th className="text-left px-5 py-3 font-medium">자산</th>
                <th className="text-left px-5 py-3 font-medium">정산 기간</th>
                <th className="text-right px-5 py-3 font-medium">수입</th>
                <th className="text-right px-5 py-3 font-medium">비용</th>
                <th className="text-right px-5 py-3 font-medium">순이익</th>
                <th className="text-center px-5 py-3 font-medium">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(s => {
                const noi = Number(s.total_income) - Number(s.total_expense)
                return (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-slate-800">{s.properties?.name ?? s.property_id}</td>
                    <td className="px-5 py-3.5 text-slate-600">{s.settlement_month.slice(0, 7)}</td>
                    <td className="px-5 py-3.5 text-right text-emerald-600 font-medium">{krw(Number(s.total_income))}</td>
                    <td className="px-5 py-3.5 text-right text-rose-500 font-medium">{krw(Number(s.total_expense))}</td>
                    <td className={`px-5 py-3.5 text-right font-bold ${noi >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
                      {noi >= 0 ? '' : '−'}{krw(Math.abs(noi))}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${STATUS_STYLE[s.status] ?? 'bg-slate-100 text-slate-500'}`}>
                        {STATUS_KO[s.status] ?? s.status}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
