import { NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    // Create Supabase client for route handlers
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error("Auth error:", authError)
      return NextResponse.json({ error: "Unauthorized", details: authError?.message }, { status: 401 })
    }

    const { id, currency } = await request.json()

    if (!id || !currency) {
      console.error("Missing id or currency", { id, currency })
      return NextResponse.json({ error: "Account instance ID and currency are required" }, { status: 400 })
    }

    // Validate currency format (basic check)
    if (typeof currency !== 'string' || currency.length !== 3) {
      console.error("Invalid currency format:", currency)
      return NextResponse.json({ error: "Invalid currency format" }, { status: 400 })
    }

    // Check if user has permission to update this account instance
    const { data: accountInstance, error: accountError } = await supabase
      .from("account_instances")
      .select("id, owner_user_id")
      .eq("id", id)
      .single()

    if (accountError || !accountInstance) {
      console.error("Account instance not found or error:", accountError, accountInstance)
      return NextResponse.json({ error: "Account instance not found", details: accountError?.message }, { status: 404 })
    }

    // Only account owner can update currency
    if (accountInstance.owner_user_id !== user.id) {
      console.error("User is not account owner", { userId: user.id, ownerId: accountInstance.owner_user_id })
      return NextResponse.json({ error: "Only account owner can update currency" }, { status: 403 })
    }

    // Update the currency
    const { data: updatedAccount, error: updateError } = await supabase
      .from("account_instances")
      .update({ currency })
      .eq("id", id)
      .select()
      .single()

    if (updateError) {
      console.error("Error updating currency:", updateError)
      return NextResponse.json({ error: "Failed to update currency", details: updateError?.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      account: updatedAccount
    })

  } catch (error) {
    if (error instanceof Error) {
      console.error("Error in update currency API:", error.message, error.stack)
      return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
    } else {
      console.error("Error in update currency API:", error)
      return NextResponse.json({ error: "Internal server error", details: String(error) }, { status: 500 })
    }
  }
} 