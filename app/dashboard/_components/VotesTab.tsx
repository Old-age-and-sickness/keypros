'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/src/context/AuthContext'
import { supabase } from '@/src/lib/supabase'

type Vote = {
  id: string; property_id: string; title: string; description: string | null
  vote_type: string; result: string
  start_at: string | null; end_at: string | null; created_at: string
  properties: { name: string } | null
}
type VoteRecord = {
  id: string; vote_id: string; property_member_id: string
  choice: 'AGREE' | 'DISAGREE' | 'ABSTAIN'
  ownership_ratio: number; voted_at: string
  property_members: { user_id: string; profiles: { name: string } | null } | null
}

const RESULT_STYLE: Record<string, string> = {
  PASSED:   'bg-emerald-50 text-emerald-700 border border-emerald-100',
  REJECTED: 'bg-rose-50 text-rose-600 border border-rose-100',
  PENDING:  'bg-amber-50 text-amber-700 border border-amber-100',
}
const RESULT_LABEL: Record<string, string> = { PASSED: '가결', REJECTED: '부결', PENDING: '진행 중' }
const CHOICE_STYLE: Record<string, string> = {
  AGREE:    'text-emerald-600 bg-emerald-50 border border-emerald-100',
  DISAGREE: 'text-rose-600 bg-rose-50 border border-rose-100',
  ABSTAIN:  'text-slate-500 bg-slate-100 border border-slate-200',
}
const CHOICE_LABEL: Record<string, string> = { AGREE: '찬성', DISAGREE: '반대', ABSTAIN: '기권' }
const TYPE_LABEL:   Record<string, string> = { WEIGHTED: '가중의결', SIMPLE: '단순의결', UNANIMOUS: '만장일치' }

export default function VotesTab() {
  const { user } = useAuth()
  const [votes, setVotes] = useState<Vote[]>([])
  const [records, setRecords] = useState<Map<string, VoteRecord[]>>(new Map())
  const [myMemberIds, setMyMemberIds] = useState<Set<string>>(new Set())
  const [expanded, setExpanded] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    Promise.all([
      supabase.from('votes').select('*, properties(name)').order('end_at', { ascending: false }),
      supabase.from('property_members').select('id').eq('user_id', user.id).eq('status', 'ACTIVE'),
    ]).then(([{ data: vData }, { data: mData }]) => {
      const list = (vData ?? []) as Vote[]
      setVotes(list)
      if (list.length > 0) setExpanded(list[0].id)
      setMyMemberIds(new Set((mData ?? []).map((m: { id: string }) => m.id)))
      setLoading(false)

      if (list.length > 0) {
        supabase
          .from('vote_records')
          .select('*, property_members(user_id, profiles(name))')
          .in('vote_id', list.map(v => v.id))
          .then(({ data: rData }) => {
            const map = new Map<string, VoteRecord[]>()
            ;(rData ?? []).forEach((r: VoteRecord) => {
              const arr = map.get(r.vote_id) ?? []
              arr.push(r)
              map.set(r.vote_id, arr)
            })
            setRecords(map)
          })
      }
    }).catch(() => setLoading(false))
  }, [user])

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

  return (
    <div className="flex flex-col gap-3">
      {votes.map(vote => {
        const recs     = records.get(vote.id) ?? []
        const isOpen   = expanded === vote.id
        const myRecord = recs.find(r => myMemberIds.has(r.property_member_id))

        const totalWeight = recs.reduce((s, r) => s + Number(r.ownership_ratio), 0)
        const agreeW   = recs.filter(r => r.choice === 'AGREE').reduce((s, r) => s + Number(r.ownership_ratio), 0)
        const disagreeW= recs.filter(r => r.choice === 'DISAGREE').reduce((s, r) => s + Number(r.ownership_ratio), 0)
        const abstainW = recs.filter(r => r.choice === 'ABSTAIN').reduce((s, r) => s + Number(r.ownership_ratio), 0)
        const base     = totalWeight || 1
        const isPending= vote.result === 'PENDING'

        return (
          <div
            key={vote.id}
            className={`bg-white border rounded-2xl overflow-hidden shadow-sm transition-all ${
              isPending ? 'border-amber-200' : 'border-slate-200'
            }`}
          >
            {/* 상단 색 스트립 */}
            <div className={`h-0.5 w-full ${
              vote.result === 'PASSED' ? 'bg-emerald-400' :
              vote.result === 'REJECTED' ? 'bg-rose-400' : 'bg-amber-400'
            }`} />

            {/* 헤더 */}
            <button
              onClick={() => setExpanded(isOpen ? null : vote.id)}
              className="w-full text-left px-5 py-4 flex items-start justify-between gap-3 hover:bg-slate-50/80 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${RESULT_STYLE[vote.result] ?? 'bg-slate-100 text-slate-500'}`}>
                    {RESULT_LABEL[vote.result] ?? vote.result}
                  </span>
                  <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                    {TYPE_LABEL[vote.vote_type] ?? vote.vote_type}
                  </span>
                  {vote.properties && (
                    <span className="text-xs text-slate-400">{vote.properties.name}</span>
                  )}
                  {myRecord && (
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${CHOICE_STYLE[myRecord.choice]}`}>
                      내 투표: {CHOICE_LABEL[myRecord.choice]}
                    </span>
                  )}
                </div>
                <div className="font-semibold text-slate-900 leading-snug">{vote.title}</div>
                {vote.end_at && (
                  <div className="text-xs text-slate-400 mt-1">
                    {new Date(vote.end_at) > new Date() ? '🕐 마감' : '종료'} {new Date(vote.end_at).toLocaleDateString('ko-KR')}
                  </div>
                )}
              </div>
              <svg
                width="14" height="14"
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                className={`text-slate-400 mt-1 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              >
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>

            {/* 상세 내용 */}
            {isOpen && (
              <div className="border-t border-slate-100 px-5 py-4 flex flex-col gap-4 bg-slate-50/50">
                {vote.description && (
                  <p className="text-sm text-slate-600 leading-relaxed bg-white rounded-xl border border-slate-100 px-4 py-3">
                    {vote.description}
                  </p>
                )}

                {recs.length > 0 && (
                  <div className="bg-white rounded-xl border border-slate-100 p-4 flex flex-col gap-2.5">
                    <div className="text-xs font-semibold text-slate-500 mb-1">지분 가중 결과</div>
                    <WeightBar label="찬성" weight={agreeW} base={base} color="bg-emerald-500" textColor="text-emerald-600" />
                    <WeightBar label="반대" weight={disagreeW} base={base} color="bg-rose-400" textColor="text-rose-500" />
                    <WeightBar label="기권" weight={abstainW} base={base} color="bg-slate-300" textColor="text-slate-400" />
                  </div>
                )}

                {recs.length > 0 && (
                  <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100 text-xs font-semibold text-slate-500">투표 내역</div>
                    <div className="divide-y divide-slate-50">
                      {recs.map(r => {
                        const isMe = myMemberIds.has(r.property_member_id)
                        const voterName = r.property_members?.profiles?.name ?? '(알 수 없음)'
                        return (
                          <div
                            key={r.id}
                            className={`flex items-center justify-between px-4 py-2.5 ${isMe ? 'bg-indigo-50/60' : ''}`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isMe ? 'bg-indigo-200 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                                {voterName.slice(0, 2)}
                              </div>
                              <span className={`text-sm ${isMe ? 'font-semibold text-slate-800' : 'text-slate-700'}`}>
                                {voterName}
                                {isMe && <span className="ml-1.5 text-xs text-indigo-500">(나)</span>}
                              </span>
                              <span className="text-xs text-slate-400">{Number(r.ownership_ratio).toFixed(1)}%</span>
                            </div>
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${CHOICE_STYLE[r.choice]}`}>
                              {CHOICE_LABEL[r.choice]}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {recs.length === 0 && (
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

function WeightBar({ label, weight, base, color, textColor }: {
  label: string; weight: number; base: number; color: string; textColor: string
}) {
  const pct = base > 0 ? (weight / base) * 100 : 0
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-slate-500 w-8 shrink-0">{label}</span>
      <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-xs font-semibold w-12 text-right ${textColor}`}>{pct.toFixed(1)}%</span>
    </div>
  )
}
