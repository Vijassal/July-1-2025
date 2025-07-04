// Test script to verify invite functionality is working
// Run this in the browser console after logging in

async function testInviteFunctionality() {
  console.log('🧪 Testing invite functionality...')
  
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
    }
    
    // Test 2: Test invite creation (with a test email)
    console.log('📧 Testing invite creation...')
    const inviteResponse = await fetch('/api/team/invite', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        email: 'test-invite@example.com',
        accountInstanceId: '471e29fe-0de4-4179-a641-4557a792e9dd',
        role: 'member'
      }),
    })
    
    console.log('Invite response status:', inviteResponse.status)
    
    if (inviteResponse.ok) {
      const inviteData = await inviteResponse.json()
      console.log('✅ Invite creation successful:', inviteData)
    } else {
      const errorData = await inviteResponse.json()
      console.log('❌ Invite creation failed:', errorData)
    }
    
    // Test 3: Test currency update
    console.log('💰 Testing currency update...')
    const currencyResponse = await fetch('/api/account-instances/update-currency', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        id: '471e29fe-0de4-4179-a641-4557a792e9dd',
        currency: 'EUR'
      }),
    })
    
    console.log('Currency update response status:', currencyResponse.status)
    
    if (currencyResponse.ok) {
      const currencyData = await currencyResponse.json()
      console.log('✅ Currency update successful:', currencyData)
    } else {
      const errorData = await currencyResponse.json()
      console.log('❌ Currency update failed:', errorData)
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error)
  }
}

// Run the test
testInviteFunctionality() 