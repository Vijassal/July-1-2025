import { NextRequest, NextResponse } from "next/server"
import { createClientSupabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const supabase = createClientSupabase()
    
    // Extract auth token from headers or cookies
    const authHeader = request.headers.get('authorization')
    const cookieHeader = request.headers.get('cookie')
    
    let authToken = null
    
    // Try to get token from Authorization header first
    if (authHeader && authHeader.startsWith('Bearer ')) {
      authToken = authHeader.substring(7)
    }
    
    // If no auth header, try to get from cookie
    if (!authToken && cookieHeader) {
      const cookies = cookieHeader.split(';').map(cookie => cookie.trim())
      const authCookie = cookies.find(cookie => 
        cookie.startsWith('sb-oskhkfnhikxveddjgodz-auth-token=')
      )
      if (authCookie) {
        authToken = authCookie.split('=')[1]
      }
    }

    if (!authToken) {
      return NextResponse.json({ error: "No auth token found" }, { status: 401 })
    }
    
    // Get current user using the token
    const { data: { user }, error: authError } = await supabase.auth.getUser(authToken)
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { inviteId } = await request.json()

    if (!inviteId) {
      return NextResponse.json({ error: "Invite ID is required" }, { status: 400 })
    }

    // Get the invite
    const { data: invite, error: inviteError } = await supabase
      .from("account_instance_users")
      .select("*")
      .eq("id", inviteId)
      .eq("invited_email", user.email)
      .eq("status", "pending")
      .single()

    if (inviteError || !invite) {
      return NextResponse.json({ error: "Invalid or expired invite" }, { status: 404 })
    }

    // Update the invite to active and link it to the user
    const { data: updatedInvite, error: updateError } = await supabase
      .from("account_instance_users")
      .update({
        user_id: user.id,
        status: "active",
        created_at: new Date().toISOString()
      })
      .eq("id", inviteId)
      .select()
      .single()

    if (updateError) {
      console.error("Error updating invite:", updateError)
      return NextResponse.json({ error: "Failed to accept invite" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Invite accepted successfully"
    })

  } catch (error) {
    console.error("Error in accept invite API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 