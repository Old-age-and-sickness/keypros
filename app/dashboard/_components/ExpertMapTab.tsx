'use client'

import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/src/context/AuthContext'
import { supabase } from '@/src/lib/supabase'

type Property = { id: string; name: string; address: string }
type Expert = {
  id: string; name: string; office: string
  expertType: 'LAWYER' | 'JUDICIAL_SCRIVENER' | 'AGENT'
  specialties: string[]; phone: string; email: string
  rating: number; reviewCount: number
  lat: number; lng: number
}

declare global { interface Window { kakao: any } }

const EXPERT_LABEL: Record<string, string> = { LAWYER: '변호사', JUDICIAL_SCRIVENER: '법무사', AGENT: '중개사' }
const EXPERT_DOT:   Record<string, string> = { LAWYER: 'bg-indigo-500', JUDICIAL_SCRIVENER: 'bg-emerald-500', AGENT: 'bg-amber-500' }
const EXPERT_BADGE: Record<string, string> = {
  LAWYER:             'bg-indigo-50 text-indigo-700 border-indigo-100',
  JUDICIAL_SCRIVENER: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  AGENT:              'bg-amber-50 text-amber-700 border-amber-100',
}
const EXPERT_HEX: Record<string, string> = { LAWYER: '#6366f1', JUDICIAL_SCRIVENER: '#10b981', AGENT: '#f59e0b' }

const OFFSETS = [[0.0018, 0.0025], [-0.0012, -0.0020], [0.0030, -0.0015], [-0.0022, 0.0035], [0.0010, -0.0028]]

const BASE_EXPERTS = [
  { id: '1', name: '김민준', office: '한국법무법인', expertType: 'JUDICIAL_SCRIVENER' as const, specialties: ['부동산등기', '상속', '법인설립'], phone: '02-1234-5678', email: 'kim@hankuk.kr', rating: 4.8, reviewCount: 132 },
  { id: '2', name: '이서연', office: '서연 법률사무소', expertType: 'LAWYER' as const, specialties: ['부동산', '임대차', '경매'], phone: '02-2345-6789', email: 'lee@seoyon.kr', rating: 4.9, reviewCount: 87 },
  { id: '3', name: '박지훈', office: '강남부동산중개', expertType: 'AGENT' as const, specialties: ['상업용', '오피스텔', '토지'], phone: '02-3456-7890', email: 'park@kangnamestate.kr', rating: 4.6, reviewCount: 215 },
  { id: '4', name: '최유진', office: '유진 법무사무소', expertType: 'JUDICIAL_SCRIVENER' as const, specialties: ['근저당', '전세권', '소유권이전'], phone: '02-4567-8901', email: 'choi@yujin.kr', rating: 4.7, reviewCount: 98 },
  { id: '5', name: '정성현', office: '성현 공인중개사', expertType: 'AGENT' as const, specialties: ['아파트', '상업용'], phone: '02-5678-9012', email: 'jung@sunghyun.kr', rating: 4.5, reviewCount: 163 },
]

export default function ExpertMapTab() {
  const { user } = useAuth()
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)

  const mapContainerRef = useRef<HTMLDivElement>(null)
  const kakaoMapRef = useRef<any>(null)
  const geocodedRef = useRef(false)
  const [mapReady, setMapReady] = useState(false)
  const [experts, setExperts] = useState<Expert[]>([])
  const [sortBy, setSortBy] = useState<'rating' | 'distance'>('rating')
  const [selectedExpert, setSelectedExpert] = useState<Expert | null>(null)

  useEffect(() => {
    if (!user) return
    const load = async () => {
      try {
        const { data } = await supabase.from('properties').select('id, name, address').eq('status', 'ACTIVE')
        setProperties((data ?? []) as Property[])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  // Load Kakao Maps SDK
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY?.trim()

    const initMap = () => {
      if (!mapContainerRef.current || kakaoMapRef.current) return
      const map = new window.kakao.maps.Map(mapContainerRef.current, {
        center: new window.kakao.maps.LatLng(37.5665, 126.9780),
        level: 5,
      })
      kakaoMapRef.current = map
      setMapReady(true)
    }

    if (window.kakao?.maps?.Map) { initMap(); return }
    if (window.kakao?.maps) { window.kakao.maps.load(initMap); return }

    const script = document.createElement('script')
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&libraries=services&autoload=false`
    script.async = true
    script.onload = () => window.kakao.maps.load(initMap)
    document.head.appendChild(script)
  }, [])

  // Geocode assets → place expert markers relative to first asset
  useEffect(() => {
    if (!mapReady || loading || geocodedRef.current || !kakaoMapRef.current) return
    if (properties.length === 0) return
    geocodedRef.current = true

    const geocoder = new window.kakao.maps.services.Geocoder()
    const bounds = new window.kakao.maps.LatLngBounds()
    let firstCoord: { lat: number; lng: number } | null = null

    properties.forEach(prop => {
      geocoder.addressSearch(prop.address, (result: any, status: any) => {
        if (status !== window.kakao.maps.services.Status.OK) return
        const lat = parseFloat(result[0].y)
        const lng = parseFloat(result[0].x)
        const position = new window.kakao.maps.LatLng(lat, lng)
        bounds.extend(position)

        if (!firstCoord) {
          firstCoord = { lat, lng }
          setExperts(BASE_EXPERTS.map((e, i) => ({
            ...e, lat: lat + OFFSETS[i][0], lng: lng + OFFSETS[i][1],
          })))
        }

        const el = document.createElement('div')
        el.innerHTML = `<div style="background:#4f46e5;color:#fff;border-radius:8px;padding:5px 10px;font-size:11px;font-weight:700;box-shadow:0 2px 8px rgba(0,0,0,.25);border:2px solid #fff;white-space:nowrap">🏢 ${prop.name}</div>`
        new window.kakao.maps.CustomOverlay({ map: kakaoMapRef.current, position, content: el, yAnchor: 1.3 })
        kakaoMapRef.current.setBounds(bounds)
      })
    })
  }, [mapReady, loading, properties])

  // Add expert overlays
  useEffect(() => {
    if (!mapReady || experts.length === 0 || !kakaoMapRef.current) return

    experts.forEach(expert => {
      const color = EXPERT_HEX[expert.expertType]
      const label = EXPERT_LABEL[expert.expertType][0]
      const el = document.createElement('div')
      el.innerHTML = `<div style="width:30px;height:30px;border-radius:50%;background:${color};color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3);cursor:pointer">${label}</div>`

      new window.kakao.maps.CustomOverlay({
        map: kakaoMapRef.current,
        position: new window.kakao.maps.LatLng(expert.lat, expert.lng),
        content: el,
        yAnchor: 1,
      })
      el.addEventListener('click', () => setSelectedExpert(prev => prev?.id === expert.id ? null : expert))
    })
  }, [experts, mapReady])

  // Pan to selected expert
  useEffect(() => {
    if (!mapReady || !selectedExpert || !kakaoMapRef.current) return
    kakaoMapRef.current.panTo(new window.kakao.maps.LatLng(selectedExpert.lat, selectedExpert.lng))
  }, [selectedExpert, mapReady])

  const sortedExperts = [...experts].sort((a, b) =>
    sortBy === 'rating' ? b.rating - a.rating : a.id.localeCompare(b.id)
  )

  return (
    <div className="flex gap-4" style={{ height: 'calc(100vh - 120px)' }}>
      {/* 지도 */}
      <div className="flex-[65] rounded-2xl overflow-hidden border border-slate-200 shadow-sm relative min-w-0">
        <div ref={mapContainerRef} className="w-full h-full" />
        {!mapReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              지도 불러오는 중...
            </div>
          </div>
        )}
        {mapReady && (
          <div className="absolute bottom-4 left-4 bg-white rounded-xl shadow-sm px-3 py-2 flex items-center gap-3 border border-slate-100 pointer-events-none">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-indigo-600" />
              <span className="text-xs text-slate-600">내 자산</span>
            </div>
            {[['#6366f1','변호사'],['#10b981','법무사'],['#f59e0b','중개사']].map(([c,l]) => (
              <div key={l} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ background: c }} />
                <span className="text-xs text-slate-600">{l}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 전문가 리스트 */}
      <div className="flex-[35] bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden min-w-0">
        <div className="p-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-800 text-sm">주변 전문가</h3>
            <div className="flex gap-1">
              {(['rating', 'distance'] as const).map(s => (
                <button key={s} onClick={() => setSortBy(s)}
                  className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                    sortBy === s ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}>
                  {s === 'rating' ? '평점순' : '거리순'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 divide-y divide-slate-50">
          {experts.length === 0 ? (
            <div className="flex items-center justify-center h-full text-sm text-slate-400">
              자산 위치를 확인하는 중...
            </div>
          ) : (
            sortedExperts.map(expert => {
              const isSelected = selectedExpert?.id === expert.id
              const typeLabel = EXPERT_LABEL[expert.expertType]
              return (
                <div key={expert.id}
                  onClick={() => setSelectedExpert(prev => prev?.id === expert.id ? null : expert)}
                  className={`p-4 cursor-pointer transition-colors ${isSelected ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-full ${EXPERT_DOT[expert.expertType]} flex items-center justify-center text-white text-sm font-bold shrink-0`}>
                      {typeLabel[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-sm text-slate-900 truncate">{expert.name}</span>
                        <div className="flex items-center gap-0.5 shrink-0">
                          <span className="text-amber-400 text-xs leading-none">★</span>
                          <span className="text-xs text-slate-700 font-medium">{expert.rating}</span>
                          <span className="text-[10px] text-slate-400 ml-0.5">({expert.reviewCount})</span>
                        </div>
                      </div>
                      <div className="text-xs text-slate-500 truncate mt-0.5">{expert.office}</div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-md border font-medium ${EXPERT_BADGE[expert.expertType]}`}>
                          {typeLabel}
                        </span>
                        {expert.specialties.slice(0, 2).map(s => (
                          <span key={s} className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500">{s}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="mt-3 pt-3 border-t border-indigo-100 space-y-1.5">
                      <a href={`tel:${expert.phone}`} onClick={e => e.stopPropagation()}
                        className="flex items-center gap-2 text-xs text-slate-600 hover:text-indigo-600 transition-colors">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.82 3.18a2 2 0 012-2.18h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L7.08 8.64A16 16 0 0015.36 16.92l1-1a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
                        </svg>
                        {expert.phone}
                      </a>
                      <a href={`mailto:${expert.email}`} onClick={e => e.stopPropagation()}
                        className="flex items-center gap-2 text-xs text-slate-600 hover:text-indigo-600 transition-colors">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                          <polyline points="22,6 12,13 2,6"/>
                        </svg>
                        {expert.email}
                      </a>
                      <div className="mt-2 rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 py-3 text-center text-[11px] text-slate-400 font-medium">
                        광고 배너 슬롯
                      </div>
                      <button onClick={e => e.stopPropagation()}
                        className="w-full py-2 bg-indigo-600 text-white text-xs rounded-lg font-semibold hover:bg-indigo-700 transition-colors">
                        상담 신청
                      </button>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
