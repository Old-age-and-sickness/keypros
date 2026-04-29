'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/src/context/AuthContext'
import { supabase } from '@/src/lib/supabase'

type Vote = {
  id: string
  property_id: string
  title: string
  description: string | null
  vote_type: string
  result: string
  start_at: string | null
  end_at: string | null
  created_at: string
  properties: { name: string } | null
}

type VoteRecord = {
  id: string
  vote_id: string
  property_member_id: string
  choice: 'AGREE' | 'DISAGREE' | 'ABSTAIN'
  ownership_ratio: number
  voted_at: string
  property_members: {
    user_id: string
    profiles: { name: string } | null
  } | null
}

const RESULT_COLOR: Record<string, string> = {
  PASSED:  'bg-green-100 text-green-700',
  REJECTED:'bg-red-100 text-red-600',
  PENDING: 'bg-yellow-100 text-yellow-700',
}
const RESULT_LABEL: Record<string, string> = {
  PASSED: '가결', REJECTED: '부결', PENDING: '진행 중',
}
const CHOICE_LABEL: Record<string, string> = {
  AGREE: '찬성', DISAGREE: '반대', ABSTAIN: '기권',
}
const CHOICE_COLOR: Record<string, string> = {
  AGREE: 'text-green-600', DISAGREE: 'text-red-500', ABSTAIN: 'text-gray-400',
}
const TYPE_LABEL: Record<string, string> = {
  WEIGHTED: '가중의결', SIMPLE: '단순의결', UNANIMOUS: '만장일치',
}

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

      const myIds = new Set((mData ?? []).map((m: { id: string }) => m.id))
      setMyMemberIds(myIds)
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
    })
  }, [user])

  if (loading) return <p className="text-gray-400 text-sm text-center py-12">로딩 중...</p>
  if (votes.length === 0) return <p className="text-gray-400 text-sm text-center py-12">안건이 없습니다.</p>

  return (
    <div className="flex flex-col gap-3">
      {votes.map(vote => {
        const recs = records.get(vote.id) ?? []
        const isOpen = expanded === vote.id
        const myRecord = recs.find(r => myMemberIds.has(r.property_member_id))

        const totalWeight = recs.reduce((s, r) => s + Number(r.ownership_ratio), 0)
        const agreeW = recs.filter(r => r.choice === 'AGREE').reduce((s, r) => s + Number(r.ownership_ratio), 0)
        const disagreeW = recs.filter(r => r.choice === 'DISAGREE').reduce((s, r) => s + Number(r.ownership_ratio), 0)
        const abstainW = recs.filter(r => r.choice === 'ABSTAIN').reduce((s, r) => s + Number(r.ownership_ratio), 0)
        const base = totalWeight || 1

        return (
          <div key={vote.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <button
              onClick={() => setExpanded(isOpen ? null : vote.id)}
              className="w-full text-left px-5 py-4 flex items-start justify-between gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${RESULT_COLOR[vote.result] ?? 'bg-gray-100 text-gray-500'}`}>
                    {RESULT_LABEL[vote.result] ?? vote.result}
                  </span>
                  <span className="text-xs text-gray-400">{TYPE_LABEL[vote.vote_type] ?? vote.vote_type}</span>
                  {vote.properties && (
                    <span className="text-xs text-gray-400">{vote.properties.name}</span>
                  )}
                  {myRecord && (
                    <span className={`text-xs font-semibold ${CHOICE_COLOR[myRecord.choice]}`}>
                      내 투표: {CHOICE_LABEL[myRecord.choice]}
                    </span>
                  )}
                </div>
                <div className="font-semibold text-sm leading-snug">{vote.title}</div>
                {vote.end_at && (
                  <div className="text-xs text-gray-400 mt-0.5">
                    {new Date(vote.end_at) > new Date() ? '마감' : '종료'} {new Date(vote.end_at).toLocaleDateString('ko-KR')}
                  </div>
                )}
              </div>
              <span className="text-gray-400 text-xs mt-1">{isOpen ? '▲' : '▼'}</span>
            </button>

            {isOpen && (
              <div className="border-t border-gray-100 px-5 py-4 flex flex-col gap-4">
                {vote.description && (
                  <p className="text-sm text-gray-600 leading-relaxed">{vote.description}</p>
                )}

                {recs.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <div className="text-xs text-gray-400 font-medium">지분 가중 결과</div>
                    <WeightBar label="찬성" weight={agreeW} base={base} color="bg-green-500" />
                    <WeightBar label="반대" weight={disagreeW} base={base} color="bg-red-400" />
                    <WeightBar label="기권" weight={abstainW} base={base} color="bg-gray-300" />
                  </div>
                )}

                {recs.length > 0 && (
                  <div className="flex flex-col gap-1">
                    <div className="text-xs text-gray-400 font-medium mb-1">투표 내역</div>
                    {recs.map(r => {
                      const isMe = myMemberIds.has(r.property_member_id)
                      const voterName = r.property_members?.profiles?.name ?? '(알수없음)'
                      return (
                        <div key={r.id} className={`flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0 ${isMe ? 'font-medium' : ''}`}>
                          <div className="flex items-center gap-2">
                            <span className="text-sm">
                              {voterName}
                              {isMe && <span className="ml-1 text-xs text-blue-400 font-normal">(나)</span>}
                            </span>
                            <span className="text-xs text-gray-400">{Number(r.ownership_ratio).toFixed(1)}%</span>
                          </div>
                          <span className={`text-sm font-semibold ${CHOICE_COLOR[r.choice]}`}>
                            {CHOICE_LABEL[r.choice]}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}

                {recs.length === 0 && (
                  <p className="text-sm text-gray-400">투표 기록이 없습니다.</p>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function WeightBar({ label, weight, base, color }: {
  label: string; weight: number; base: number; color: string
}) {
  const pct = base > 0 ? (weight / base) * 100 : 0
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500 w-8 shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-600 w-12 text-right">{pct.toFixed(1)}%</span>
    </div>
  )
}
