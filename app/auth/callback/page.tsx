'use client'

import { Suspense, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/src/lib/supabase'

function CallbackHandler() {
  const router = useRouter()
  const done = useRef(false)

  useEffect(() => {
    const finish = async (userId: string) => {
      if (done.current) return
      done.current = true

      const { data: profileData } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single()

      await fetch('/api/auth/confirm', { method: 'POST' })

      const role = profileData?.role ?? 'GUEST'
      if (role === 'ADMIN') {
        router.replace('/admin/requests')
      } else if (role === 'GUEST') {
        router.replace('/request-access')
      } else {
        router.replace('/dashboard')
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (_event === 'SIGNED_IN' && session) finish(session.user.id)
      }
    )

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) finish(session.user.id)
    })

    return () => subscription.unsubscribe()
  }, [router])

  return <p className="text-gray-500">로그인 처리 중...</p>
}

export default function AuthCallbackPage() {
  return (
    <main className="flex flex-1 items-center justify-center">
      <Suspense fallback={<p className="text-gray-500">로딩 중...</p>}>
        <CallbackHandler />
      </Suspense>
    </main>
  )
}
