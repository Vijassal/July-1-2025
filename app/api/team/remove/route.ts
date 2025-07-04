import { NextRequest, NextResponse } from 'next/server'
import { createClientSupabase } from '@/lib/supabase'

export async function DELETE(request: NextRequest) {
  try {
    const { memberId, accountInstanceId } = await request.json()

    if (!memberId || !accountInstanceId) {
      return NextResponse.json(
        { error: 'Member ID and Account Instance ID are required' },
        { status: 400 }
      )
    }

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

    // Check if the current user is the owner of the account instance
    const { data: currentUserRole, error: roleError } = await supabase
      .from('account_instance_users')
      .select('is_owner, role')
      .eq('account_instance_id', accountInstanceId)
      .eq('user_id', user.id)
      .single()

    console.log('Current user role check:', { currentUserRole, roleError, userId: user.id });

    if (roleError || !currentUserRole) {
      return NextResponse.json(
        { error: 'Access denied: User not found in account instance' },
        { status: 403 }
      )
    }

    // Only owners can remove team members
    if (!currentUserRole.is_owner) {
      return NextResponse.json(
        { error: 'Access denied: Only account owners can remove team members' },
        { status: 403 }
      )
    }

    // Check if user is actually the account owner
    const { data: accountOwner, error: ownerError } = await supabase
      .from('account_instances')
      .select('owner_user_id')
      .eq('id', accountInstanceId)
      .single()

    console.log('Account owner check:', { accountOwner, ownerError, currentUserId: user.id });

    if (accountOwner && accountOwner.owner_user_id !== user.id) {
      return NextResponse.json(
        { error: 'Access denied: Only account owner can remove team members' },
        { status: 403 }
      )
    }

    // Get the member to be removed to check if they're the owner
    const { data: memberToRemove, error: memberError } = await supabase
      .from('account_instance_users')
      .select('is_owner, user_id')
      .eq('id', memberId)
      .eq('account_instance_id', accountInstanceId)
      .single()

    console.log('Member to remove lookup:', { memberToRemove, memberError, memberId, accountInstanceId });

    if (memberError || !memberToRemove) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      )
    }

    // Prevent removing the owner
    if (memberToRemove.is_owner) {
      return NextResponse.json(
        { error: 'Cannot remove the account owner' },
        { status: 400 }
      )
    }

    // Prevent removing yourself
    if (memberToRemove.user_id === user.id) {
      return NextResponse.json(
        { error: 'Cannot remove yourself from the team' },
        { status: 400 }
      )
    }

    // Check what records exist before delete
    const { data: existingRecords, error: existingError } = await supabase
      .from('account_instance_users')
      .select('id, user_id, invited_email, role, status')
      .eq('id', memberId)
      .eq('account_instance_id', accountInstanceId)

    console.log('Existing records before delete:', { existingRecords, existingError });

    // Delete the team member
    console.log('Attempting to delete member:', { memberId, accountInstanceId });
    const { error: deleteError } = await supabase
      .from('account_instance_users')
      .delete()
      .eq('id', memberId)

    console.log('Delete operation result:', { deleteError });

    if (deleteError) {
      console.error('Error removing team member:', deleteError)
      return NextResponse.json(
        { error: 'Failed to remove team member', details: deleteError.message },
        { status: 500 }
      )
    }

    console.log('Successfully deleted member');
    return NextResponse.json(
      { message: 'Team member removed successfully' },
      { status: 200 }
    )

  } catch (error) {
    console.error('Error in remove team member API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 