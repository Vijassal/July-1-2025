import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    console.log('=== TEST AUTH API ROUTE ===')
    
    // Get cookie store
    const cookieStore = await cookies()
    
    // Log all cookies
    const allCookies = cookieStore.getAll()
    console.log('All cookies received:', allCookies)
    
    // Check for auth token
    const authToken = cookieStore.get('sb-oskhkfnhikxveddjgodz-auth-token')?.value
    console.log('Auth token found:', authToken ? 'YES' : 'NO')
    
    if (authToken) {
      console.log('Auth token length:', authToken.length)
      console.log('Auth token preview:', authToken.substring(0, 20) + '...')
    }
    
    // Return the cookie information
    return NextResponse.json({
      success: true,
      cookies: allCookies.map(cookie => ({
        name: cookie.name,
        value: cookie.value ? cookie.value.substring(0, 20) + '...' : null,
        hasValue: !!cookie.value
      })),
      authTokenFound: !!authToken,
      authTokenLength: authToken?.length || 0
    })
    
  } catch (error) {
    console.error('Test auth API error:', error)
    return NextResponse.json({ error: 'Test failed' }, { status: 500 })
  }
} 