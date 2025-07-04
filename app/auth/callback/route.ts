import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    // Exchange the code for a session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('Auth callback error:', error)
      return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=auth_callback_failed`)
    }

    if (data.user) {
      // Check if user has a pending invite
      const { data: pendingInvite, error: inviteError } = await supabase
        .from("account_instance_users")
        .select("id, account_instance_id, role")
        .eq("invited_email", data.user.email?.toLowerCase())
        .eq("status", "pending")
        .single()

      if (pendingInvite && !inviteError) {
        // User has a pending invite, redirect to complete registration
        return NextResponse.redirect(`${requestUrl.origin}/auth/complete-registration`)
      } else {
        // Regular user, redirect to dashboard
        return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
      }
    }
  }

  // If no code or error, redirect to login
  return NextResponse.redirect(`${requestUrl.origin}/auth/login`)
} 