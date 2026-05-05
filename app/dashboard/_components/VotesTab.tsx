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
type Property = { id: string; name: string }

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

const emptyForm = () => ({
  property_id: '',
  title: '',
  description: '',
  vote_type: 'WEIGHTED' as 'WEIGHTED' | 'SIMPLE' | 'UNANIMOUS',
  start_at: '',
  end_at: '',
})

export default function VotesTab() {
  const { user } = useAuth()
  const [votes, setVotes] = useState<Vote[]>([])
  const [records, setRecords] = useState<Map<string, VoteRecord[]>>(new Map())
  const [myMemberIds, setMyMemberIds] = useState<Set<string>>(new Set())
  const [expanded, setExpanded] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const [showModal, setShowModal] = useState(false)
  const [properties, setProperties] = useState<Property[]>([])
  const [form, setForm] = useState(emptyForm())
  const [submitting, setSubmitting] = useState(false)

  const fetchVotes = async () => {
    if (!user) return
    const [{ data: vData }, { data: mData }] = await Promise.all([
      supabase.from('votes').select('*, properties(name)').order('end_at', { ascending: false }),
      supabase.from('property_members').select('id').eq('user_id', user.id).eq('status', 'ACTIVE'),
    ])
    const list = (vData ?? []) as Vote[]
    setVotes(list)
    if (list.length > 0) setExpanded(prev => prev ?? list[0].id)
    setMyMemberIds(new Set((mData ?? []).map((m: { id: string }) => m.id)))
    setLoading(false)

    if (list.length > 0) {
      const { data: rData } = await supabase
        .from('vote_records')
        .select('*, property_members(user_id, profiles(name))')
        .in('vote_id', list.map(v => v.id))
      const map = new Map<string, VoteRecord[]>()
      ;(rData ?? []).forEach((r: VoteRecord) => {
        const arr = map.get(r.vote_id) ?? []
        arr.push(r)
        map.set(r.vote_id, arr)
      })
      setRecords(map)
    }
  }

  useEffect(() => {
    fetchVotes().catch(() => setLoading(false))
  }, [user])

  const openModal = async () => {
    const { data } = await supabase
      .from('properties').select('id, name').eq('status', 'ACTIVE').order('name')
    setProperties((data ?? []) as Property[])
    setForm(emptyForm())
    setShowModal(true)
  }

  const handleSubmit = async () => {
    if (!form.property_id || !form.title) return
    setSubmitting(true)
    await supabase.from('votes').insert({
      property_id: form.property_id,
      title: form.title,
      description: form.description || null,
      vote_type: form.vote_type,
      result: 'PENDING',
      start_at: form.start_at || null,
      end_at: form.end_at || null,
    })
    setSubmitting(false)
    setShowModal(false)
    setLoading(true)
    await fetchVotes()
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20 text-slate-400 text-sm gap-2">
      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
      불러오는 중...
    </div>
  )

  return (
    <>
      <div className="flex flex-col gap-3">
        {/* 상단 버튼 */}
        <div className="flex justify-end">
          <button
            onClick={openModal}
            className="flex items-center gap-1.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-xl transition-colors shadow-sm shadow-indigo-200"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
            안건 추가
          </button>
        </div>

        {votes.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
            <div className="text-4xl mb-3">⚖️</div>
            <p className="text-slate-500 font-medium">안건이 없습니다</p>
            <p className="text-slate-400 text-sm mt-1">상단 버튼으로 안건을 추가하세요</p>
          </div>
        ) : (
          votes.map(vote => {
            const recs     = records.get(vote.id) ?? []
            const isOpen   = expanded === vote.id
            const myRecord = recs.find(r => myMemberIds.has(r.property_member_id))

            const totalWeight = recs.reduce((s, r) => s + Number(r.ownership_ratio), 0)
            const agreeW    = recs.filter(r => r.choice === 'AGREE').reduce((s, r) => s + Number(r.ownership_ratio), 0)
            const disagreeW = recs.filter(r => r.choice === 'DISAGREE').reduce((s, r) => s + Number(r.ownership_ratio), 0)
            const abstainW  = recs.filter(r => r.choice === 'ABSTAIN').reduce((s, r) => s + Number(r.ownership_ratio), 0)
            const base      = totalWeight || 1
            const isPending = vote.result === 'PENDING'

            return (
              <div
                key={vote.id}
                className={`bg-white border rounded-2xl overflow-hidden shadow-sm transition-all ${
                  isPending ? 'border-amber-200' : 'border-slate-200'
                }`}
              >
                <div className={`h-0.5 w-full ${
                  vote.result === 'PASSED' ? 'bg-emerald-400' :
                  vote.result === 'REJECTED' ? 'bg-rose-400' : 'bg-amber-400'
                }`} />

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

                    {recs.length > 0 ? (
                      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
                        <div className="px-4 py-3 border-b border-slate-100 text-xs font-semibold text-slate-500">투표 내역</div>
                        <div className="divide-y divide-slate-50">
                          {recs.map(r => {
                            const isMe = myMemberIds.has(r.property_member_id)
                            const voterName = r.property_members?.profiles?.name ?? '(알 수 없음)'
                            return (
                              <div key={r.id} className={`flex items-center justify-between px-4 py-2.5 ${isMe ? 'bg-indigo-50/60' : ''}`}>
                                <div className="flex items-center gap-2.5">
                                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isMe ? 'bg-indigo-200 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                                    {voterName.slice(0, 2)}
                                  </div>
                                  <span className={`text-sm ${isMe ? 'font-semibold text-slate-800' : 'text-slate-700'}`}>
                                    {voterName}{isMe && <span className="ml-1.5 text-xs text-indigo-500">(나)</span>}
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
                    ) : (
                      <p className="text-sm text-slate-400 text-center py-2">투표 기록이 없습니다</p>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* 안건 추가 모달 */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden">
            {/* 모달 헤더 */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600">
                    <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
                  </svg>
                </div>
                <h2 className="text-base font-bold text-slate-900">안건 추가</h2>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>

            {/* 모달 폼 */}
            <div className="px-6 py-5 flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
              {/* 자산 선택 */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">자산 <span className="text-rose-400">*</span></label>
                <select
                  value={form.property_id}
                  onChange={e => setForm(f => ({...f, property_id: e.target.value}))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 transition bg-white"
                >
                  <option value="">자산을 선택하세요</option>
                  {properties.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {/* 안건 제목 */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">안건 제목 <span className="text-rose-400">*</span></label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm(f => ({...f, title: e.target.value}))}
                  placeholder="예) 1층 임차인 월세 인상 건"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 transition"
                />
              </div>

              {/* 안건 설명 */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">안건 설명</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({...f, description: e.target.value}))}
                  placeholder="안건에 대한 상세 내용을 입력하세요"
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 transition resize-none"
                />
              </div>

              {/* 의결 방식 */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-2">의결 방식 <span className="text-rose-400">*</span></label>
                <div className="grid grid-cols-3 gap-2">
                  {(['WEIGHTED', 'SIMPLE', 'UNANIMOUS'] as const).map(type => (
                    <button
                      key={type}
                      onClick={() => setForm(f => ({...f, vote_type: type}))}
                      className={`py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                        form.vote_type === type
                          ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
                          : 'border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      {TYPE_LABEL[type]}
                    </button>
                  ))}
                </div>
              </div>

              {/* 기간 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">시작일</label>
                  <input
                    type="date"
                    value={form.start_at}
                    onChange={e => setForm(f => ({...f, start_at: e.target.value}))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">마감일</label>
                  <input
                    type="date"
                    value={form.end_at}
                    onChange={e => setForm(f => ({...f, end_at: e.target.value}))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 transition"
                  />
                </div>
              </div>
            </div>

            {/* 모달 하단 버튼 */}
            <div className="px-6 py-4 border-t border-slate-100 flex gap-2.5">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-500 hover:bg-slate-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSubmit}
                disabled={!form.property_id || !form.title || submitting}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                    등록 중...
                  </span>
                ) : '안건 등록'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
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
        <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-xs font-semibold w-12 text-right ${textColor}`}>{pct.toFixed(1)}%</span>
    </div>
  )
}
