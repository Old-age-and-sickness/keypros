'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/src/lib/supabase'

type Vote = {
  id: string; property_id: string; title: string; description: string | null
  vote_type: string; result: string
  start_at: string | null; end_at: string | null; created_at: string
  properties: { name: string } | null
}
type VoteRecord = {
  id: string; vote_id: string; choice: 'AGREE' | 'DISAGREE' | 'ABSTAIN'
  ownership_ratio: number
  property_members: { user_id: string; profiles: { name: string } | null } | null
}

const RESULT_STYLE: Record<string, string> = {
  PASSED:   'bg-emerald-50 text-emerald-700 border border-emerald-100',
  REJECTED: 'bg-rose-50 text-rose-600 border border-rose-100',
  PENDING:  'bg-amber-50 text-amber-700 border border-amber-100',
}
const RESULT_KO:  Record<string, string> = { PASSED:'가결', REJECTED:'부결', PENDING:'진행 중' }
const CHOICE_STYLE: Record<string, string> = {
  AGREE:    'text-emerald-600 bg-emerald-50 border border-emerald-100',
  DISAGREE: 'text-rose-600 bg-rose-50 border border-rose-100',
  ABSTAIN:  'text-slate-500 bg-slate-100 border border-slate-200',
}
const CHOICE_KO: Record<string, string> = { AGREE:'찬성', DISAGREE:'반대', ABSTAIN:'기권' }
const TYPE_KO:   Record<string, string> = { WEIGHTED:'가중의결', SIMPLE:'단순의결', UNANIMOUS:'만장일치' }

export default function AdminVotesTab() {
  const [votes, setVotes]     = useState<Vote[]>([])
  const [records, setRecords] = useState<Map<string, VoteRecord[]>>(new Map())
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [resultFilter, setResultFilter] = useState('ALL')
  const [propFilter, setPropFilter] = useState('ALL')

  useEffect(() => {
    Promise.all([
      supabase.from('votes').select('*, properties(name)').order('end_at', { ascending: false }),
      supabase.from('vote_records').select('*, property_members(user_id, profiles(name))'),
    ]).then(([{ data: vData }, { data: rData }]) => {
      const list = (vData ?? []) as Vote[]
      setVotes(list)
      if (list.length > 0) setExpanded(list[0].id)

      const map = new Map<string, VoteRecord[]>()
      ;(rData ?? []).forEach((r: VoteRecord & { vote_id: string }) => {
        const arr = map.get(r.vote_id) ?? []
        arr.push(r)
        map.set(r.vote_id, arr)
      })
      setRecords(map)
      setLoading(false)
    })
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center py-20 text-slate-400 text-sm gap-2">
      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
      불러오는 중...
    </div>
  )

  if (votes.length === 0) return (
    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
      <div className="text-4xl mb-3">⚖️</div>
      <p className="text-slate-500 font-medium">안건이 없습니다</p>
    </div>
  )

  const propNames = ['ALL', ...Array.from(new Set(votes.map(v => v.properties?.name ?? v.property_id)))]
  const filtered  = votes
    .filter(v => resultFilter === 'ALL' || v.result === resultFilter)
    .filter(v => propFilter === 'ALL' || (v.properties?.name ?? v.property_id) === propFilter)

  const passedCount  = votes.filter(v => v.result === 'PASSED').length
  const rejectedCount= votes.filter(v => v.result === 'REJECTED').length
  const pendingCount = votes.filter(v => v.result === 'PENDING').length

  return (
    <div className="flex flex-col gap-4">
      {/* 통계 */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-center">
          <div className="text-xs text-emerald-600 mb-1">가결</div>
          <div className="text-2xl font-bold text-emerald-700">{passedCount}</div>
        </div>
        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 text-center">
          <div className="text-xs text-rose-600 mb-1">부결</div>
          <div className="text-2xl font-bold text-rose-700">{rejectedCount}</div>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-center">
          <div className="text-xs text-amber-600 mb-1">진행 중</div>
          <div className="text-2xl font-bold text-amber-700">{pendingCount}</div>
        </div>
      </div>

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
          {(['ALL', 'PENDING', 'PASSED', 'REJECTED'] as const).map(r => (
            <button
              key={r}
              onClick={() => setResultFilter(r)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                resultFilter === r
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              {r === 'ALL' ? '전체' : RESULT_KO[r]}
            </button>
          ))}
        </div>
      </div>

      <div className="text-xs text-slate-400">{filtered.length}건</div>

      {/* 안건 목록 */}
      {filtered.map(vote => {
        const recs      = records.get(vote.id) ?? []
        const isOpen    = expanded === vote.id
        const totalW    = recs.reduce((s, r) => s + Number(r.ownership_ratio), 0)
        const agreeW    = recs.filter(r => r.choice === 'AGREE').reduce((s, r) => s + Number(r.ownership_ratio), 0)
        const disagreeW = recs.filter(r => r.choice === 'DISAGREE').reduce((s, r) => s + Number(r.ownership_ratio), 0)
        const abstainW  = recs.filter(r => r.choice === 'ABSTAIN').reduce((s, r) => s + Number(r.ownership_ratio), 0)
        const base      = totalW || 1
        const turnout   = totalW > 0 ? `${totalW.toFixed(0)}% 참여` : '미투표'

        return (
          <div key={vote.id} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className={`h-0.5 w-full ${vote.result === 'PASSED' ? 'bg-emerald-400' : vote.result === 'REJECTED' ? 'bg-rose-400' : 'bg-amber-400'}`} />

            <button
              onClick={() => setExpanded(isOpen ? null : vote.id)}
              className="w-full text-left px-5 py-4 flex items-start gap-3 hover:bg-slate-50/80 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${RESULT_STYLE[vote.result] ?? 'bg-slate-100 text-slate-500'}`}>
                    {RESULT_KO[vote.result] ?? vote.result}
                  </span>
                  <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{TYPE_KO[vote.vote_type] ?? vote.vote_type}</span>
                  {vote.properties && <span className="text-xs text-slate-400">{vote.properties.name}</span>}
                  <span className="text-xs text-slate-400">{turnout}</span>
                </div>
                <div className="font-semibold text-slate-900">{vote.title}</div>
                {vote.end_at && (
                  <div className="text-xs text-slate-400 mt-1">
                    {new Date(vote.end_at) > new Date() ? '🕐 마감' : '종료'} {new Date(vote.end_at).toLocaleDateString('ko-KR')}
                  </div>
                )}
              </div>

              {/* 미니 바 */}
              {recs.length > 0 && (
                <div className="shrink-0 w-24 hidden sm:flex flex-col gap-1 mt-1">
                  {[
                    { w: agreeW,    color: 'bg-emerald-400', label: '찬' },
                    { w: disagreeW, color: 'bg-rose-400',    label: '반' },
                  ].map(bar => (
                    <div key={bar.label} className="flex items-center gap-1.5">
                      <div className="text-xs text-slate-400 w-3">{bar.label}</div>
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${bar.color}`} style={{ width: `${(bar.w / base) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <svg
                width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                className={`text-slate-400 mt-1 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              >
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>

            {isOpen && (
              <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-4 flex flex-col gap-4">
                {vote.description && (
                  <p className="text-sm text-slate-600 bg-white rounded-xl border border-slate-100 px-4 py-3 leading-relaxed">
                    {vote.description}
                  </p>
                )}

                {recs.length > 0 ? (
                  <>
                    {/* 가중치 바 */}
                    <div className="bg-white rounded-xl border border-slate-100 p-4 flex flex-col gap-2.5">
                      <div className="text-xs font-semibold text-slate-500">지분 가중 결과</div>
                      {[
                        { label:'찬성', weight:agreeW,    color:'bg-emerald-500', textColor:'text-emerald-600' },
                        { label:'반대', weight:disagreeW, color:'bg-rose-400',    textColor:'text-rose-500' },
                        { label:'기권', weight:abstainW,  color:'bg-slate-300',   textColor:'text-slate-400' },
                      ].map(bar => (
                        <div key={bar.label} className="flex items-center gap-3">
                          <span className="text-xs text-slate-500 w-8 shrink-0">{bar.label}</span>
                          <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div className={`h-full rounded-full ${bar.color} transition-all duration-700`} style={{ width: `${(bar.weight / base) * 100}%` }} />
                          </div>
                          <span className={`text-xs font-semibold w-12 text-right ${bar.textColor}`}>
                            {((bar.weight / base) * 100).toFixed(1)}%
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* 투표 내역 */}
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                      <div className="px-4 py-3 border-b border-slate-100 text-xs font-semibold text-slate-500">
                        투표 내역 ({recs.length}명)
                      </div>
                      <div className="divide-y divide-slate-50">
                        {recs.map(r => {
                          const name = r.property_members?.profiles?.name ?? '(알 수 없음)'
                          return (
                            <div key={r.id} className="px-4 py-2.5 flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0">
                                  {name.slice(0, 2)}
                                </div>
                                <span className="text-sm text-slate-700">{name}</span>
                                <span className="text-xs text-slate-400">{Number(r.ownership_ratio).toFixed(1)}%</span>
                              </div>
                              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${CHOICE_STYLE[r.choice]}`}>
                                {CHOICE_KO[r.choice]}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-slate-400 text-center py-2">투표 기록이 없습니다</p>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
