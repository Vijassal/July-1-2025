import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie')
    const authHeader = request.headers.get('authorization')
    
    console.log('=== DEBUG COOKIES ===')
    console.log('Cookie header:', cookieHeader)
    console.log('Auth header:', authHeader)
    
    let authToken = null
    if (cookieHeader) {
      const cookies = cookieHeader.split(';').map(cookie => cookie.trim())
      console.log('Parsed cookies:', cookies)
      
      const authCookie = cookies.find(cookie => 
        cookie.startsWith('sb-oskhkfnhikxveddjgodz-auth-token=')
      )
      
      if (authCookie) {
        authToken = authCookie.split('=')[1]
        console.log('Found auth token:', authToken ? authToken.substring(0, 20) + '...' : 'null')
      } else {
        console.log('No auth cookie found')
      }
    }
    
    return NextResponse.json({
      success: true,
      cookieHeader: cookieHeader || 'No cookie header',
      authHeader: authHeader || 'No auth header',
      authTokenFound: !!authToken,
      authTokenLength: authToken?.length || 0,
      allCookies: cookieHeader ? cookieHeader.split(';').map(c => c.trim()) : []
    })
    
  } catch (error) {
    console.error('Debug cookies error:', error)
    return NextResponse.json({ error: 'Debug failed' }, { status: 500 })
  }
} 