// Final test script to verify team invite functionality is working after the authentication fix
// Run this in the browser console after logging in

async function testFinalFix() {
  console.log('🧪 Testing team invite functionality after authentication fix...')
  
  try {
    // Test 1: Check if we can fetch team members
    console.log('📋 Testing team members fetch...')
    const teamResponse = await fetch('/api/team/invite?accountInstanceId=471e29fe-0de4-4179-a641-4557a792e9dd', {
      credentials: 'include'
    })
    
    console.log('Team members response status:', teamResponse.status)
    
    if (teamResponse.ok) {
      const teamData = await teamResponse.json()
      console.log('✅ Team members fetch successful:', teamData)
    } else {
      const errorData = await teamResponse.json()
      console.log('❌ Team members fetch failed:', errorData)
      return
    }
    
    // Test 2: Test invite creation (with a test email)
    console.log('📧 Testing invite creation...')
    const testEmail = `test-invite-${Date.now()}@example.com`
    
    const inviteResponse = await fetch('/api/team/invite', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        email: testEmail,
        accountInstanceId: '471e29fe-0de4-4179-a641-4557a792e9dd',
        role: 'member'
      }),
    })
    
    console.log('Invite response status:', inviteResponse.status)
    
    if (inviteResponse.ok) {
      const inviteData = await inviteResponse.json()
      console.log('✅ Invite creation successful:', inviteData)
      
      // Test 3: Verify by checking team members again
      console.log('🔄 Verifying invite by checking team members...')
      const verifyResponse = await fetch('/api/team/invite?accountInstanceId=471e29fe-0de4-4179-a641-4557a792e9dd', {
        credentials: 'include'
      })
      
      const verifyData = await verifyResponse.json()
      console.log('Updated team members:', verifyData.teamMembers)
      
      const invitedUser = verifyData.teamMembers?.find(member => 
        member.invited_email === testEmail
      )
      
      if (invitedUser) {
        console.log('✅ Invited user found in team members list!')
        console.log('User details:', invitedUser)
        console.log('🎉 SUCCESS: Team invite functionality is working correctly!')
      } else {
        console.log('⚠️ Invited user not found in team members list')
      }
      
    } else {
      const errorData = await inviteResponse.json()
      console.log('❌ Invite creation failed:', errorData)
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error)
  }
}

// Run the test
testFinalFix() 