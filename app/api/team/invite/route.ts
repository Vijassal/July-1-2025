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
      console.error("Auth error:", authError)
      return NextResponse.json({ error: "Unauthorized", details: authError?.message }, { status: 401 })
    }

    const { email, firstName, lastName, accountInstanceId, role = "member" } = await request.json()

    console.log("Team invite request:", { email, firstName, lastName, accountInstanceId, role })

    if (!email || !firstName || !lastName || !accountInstanceId) {
      console.error("Missing required fields", { email, firstName, lastName, accountInstanceId })
      return NextResponse.json({ error: "Email, first name, last name, and account instance ID are required" }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      console.error("Invalid email format:", email)
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }

    // Check if user is already invited or a member
    const { data: existingMember, error: memberError } = await supabase
      .from("account_instance_users")
      .select("id, status")
      .eq("account_instance_id", accountInstanceId)
      .eq("invited_email", email.toLowerCase())
      .single()

    if (memberError && memberError.code !== "PGRST116") {
      console.error("Error checking existing member:", memberError)
    }

    if (existingMember) {
      if (existingMember.status === "pending") {
        console.error("User already invited (pending)", existingMember)
        return NextResponse.json({ error: "User has already been invited" }, { status: 409 })
      } else if (existingMember.status === "active") {
        console.error("User already a member", existingMember)
        return NextResponse.json({ error: "User is already a member" }, { status: 409 })
      }
    }

    // Check if the invited email belongs to the current user
    if (email.toLowerCase() === user.email?.toLowerCase()) {
      console.error("User tried to invite themselves", { email, userEmail: user.email })
      return NextResponse.json({ error: "You cannot invite yourself" }, { status: 400 })
    }

    // Create invite record (user will be created when they register)
    const { data: invite, error: inviteError } = await supabase
      .from("account_instance_users")
      .insert({
        account_instance_id: accountInstanceId,
        invited_email: email.toLowerCase(),
        user_id: null, // Will be set when user registers
        role: role,
        status: "pending"
      })
      .select()
      .single()

    if (inviteError) {
      console.error("Error creating invite:", inviteError)
      return NextResponse.json({ error: "Failed to create invite", details: inviteError?.message }, { status: 500 })
    }

    console.log("✅ Invite created successfully for:", email)

    return NextResponse.json({
      success: true,
      invite: {
        id: invite.id,
        email: invite.invited_email,
        role: invite.role,
        status: invite.status,
        invited_at: invite.created_at
      },
      isNewUser: true,
      message: "Invitation created successfully. User will appear in team list and can register normally."
    })

  } catch (error) {
    if (error instanceof Error) {
      console.error("Error in team invite API:", error.message, error.stack)
      return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
    } else {
      console.error("Error in team invite API:", error)
      return NextResponse.json({ error: "Internal server error", details: String(error) }, { status: 500 })
    }
  }
}

export async function GET(request: NextRequest) {
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
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(authToken)
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const accountInstanceId = searchParams.get("accountInstanceId")
    if (!accountInstanceId) {
      return NextResponse.json({ error: "Account instance ID is required" }, { status: 400 })
    }

    // Fetch all team members (including owner) from account_instance_users
    const { data: teamMembers, error: teamError } = await supabase
      .from("account_instance_users")
      .select("id, user_id, invited_email, role, status, is_owner, created_at")
      .eq("account_instance_id", accountInstanceId)

    if (teamError) {
      return NextResponse.json({ error: "Failed to fetch team members" }, { status: 500 })
    }

    return NextResponse.json({ teamMembers })
  } catch (error) {
    console.error("Error in team invite GET API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 