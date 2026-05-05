'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/src/types/database.types'
import { supabase } from '@/src/lib/supabase'
import { useRouter } from 'next/navigation'

type AuthContextType = {
  user: User | null
  profile: Profile | null
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
})

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  return data as Profile | null
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const loadProfile = async (userId: string) => {
    const p = await fetchProfile(userId)
    setProfile(p)
  }

  useEffect(() => {
    let mounted = true

    // 안전망: INITIAL_SESSION이 3초 내에 안 오면 강제 해제
    const timeout = setTimeout(() => {
      if (mounted) setLoading(false)
    }, 3000)

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        if (event === 'INITIAL_SESSION') {
          clearTimeout(timeout)
          console.log('[Auth] INITIAL_SESSION', { hasUser: !!session?.user, expiresAt: session?.expires_at, now: Math.floor(Date.now()/1000) })

          if (!session?.user) {
            setUser(null)
            setProfile(null)
            setLoading(false)
            return
          }

          const isExpired = session.expires_at
            ? session.expires_at * 1000 < Date.now()
            : false

          console.log('[Auth] isExpired:', isExpired)

          if (isExpired) {
            setUser(null)
            setProfile(null)
            setLoading(false)
            supabase.auth.signOut().catch(() => {})
            return
          }

          setUser(session.user)
          setLoading(false)
          console.log('[Auth] setLoading(false) 완료, 프로필 로드 시작')
          try { await loadProfile(session.user.id) } catch {}
          console.log('[Auth] 프로필 로드 완료')
          return
        }

        if (event === 'TOKEN_REFRESHED') {
          if (!session?.user) return
          setUser(session.user)
          try { await loadProfile(session.user.id) } catch {}
          return
        }

        if (event === 'SIGNED_OUT') {
          setUser(null)
          setProfile(null)
          return
        }

        if (!session?.user) return
        setUser(session.user)
        try { await loadProfile(session.user.id) } catch {}
      }
    )

    return () => {
      mounted = false
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [])

  const refreshProfile = async () => {
    if (user) await loadProfile(user.id)
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
