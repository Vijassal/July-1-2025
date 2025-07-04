// Test script to debug cookie issue
// Run this in the browser console after logging in

async function testCookieDebug() {
  console.log('🔍 Testing cookie debug...')
  
  try {
    // Step 1: Check browser cookies
    console.log('\n1. Browser cookies:')
    console.log(document.cookie)
    
    // Step 2: Check for auth cookie specifically
    const authCookie = document.cookie
      .split(';')
      .find(cookie => cookie.trim().startsWith('sb-oskhkfnhikxveddjgodz-auth-token='))
    
    if (authCookie) {
      console.log('✅ Auth cookie found in browser')
      console.log('Auth cookie:', authCookie)
    } else {
      console.log('❌ Auth cookie NOT found in browser')
    }
    
    // Step 3: Test the debug endpoint
    console.log('\n2. Testing debug endpoint...')
    const debugResponse = await fetch('/api/debug-cookies', {
      credentials: 'include'
    })
    
    console.log('Debug response status:', debugResponse.status)
    const debugData = await debugResponse.json()
    console.log('Debug response:', debugData)
    
    // Step 4: Test the team invite endpoint
    console.log('\n3. Testing team invite endpoint...')
    const inviteResponse = await fetch('/api/team/invite?accountInstanceId=471e29fe-0de4-4179-a641-4557a792e9dd', {
      credentials: 'include'
    })
    
    console.log('Team invite response status:', inviteResponse.status)
    const inviteData = await inviteResponse.json()
    console.log('Team invite response:', inviteData)
    
  } catch (error) {
    console.error('❌ Test failed with error:', error)
  }
}

// Run the test
testCookieDebug() 