import { NextRequest, NextResponse } from 'next/server'

const protectedRoutes = ['/dashboard', '/request-access', '/admin']

export function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname
  const session = req.cookies.get('keypros_session')

  if (protectedRoutes.some((r) => path.startsWith(r)) && !session) {
    return NextResponse.redirect(new URL('/login', req.nextUrl))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
}
