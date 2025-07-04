// Test script to debug authentication
// Run this in the browser console at http://localhost:3000/settings

const testAuthDebug = async () => {
  console.log('=== AUTH DEBUG TEST ===');
  
  try {
    // Step 1: Check browser cookies
    console.log('\n1. Browser cookies:');
    console.log(document.cookie);
    
    // Step 2: Check for auth cookie specifically
    const authCookie = document.cookie
      .split(';')
      .find(cookie => cookie.trim().startsWith('sb-oskhkfnhikxveddjgodz-auth-token='));
    
    if (authCookie) {
      console.log('✅ Auth cookie found in browser');
      console.log('Auth cookie preview:', authCookie.substring(0, 50) + '...');
    } else {
      console.log('❌ Auth cookie NOT found in browser');
    }
    
    // Step 3: Test the new auth test endpoint
    console.log('\n2. Testing /api/test-auth endpoint...');
    const testResponse = await fetch('/api/test-auth', {
      credentials: 'include'
    });
    
    console.log('Test endpoint status:', testResponse.status);
    const testData = await testResponse.json();
    console.log('Test endpoint response:', testData);
    
    if (testData.authTokenFound) {
      console.log('✅ Auth token found by API route');
    } else {
      console.log('❌ Auth token NOT found by API route');
    }
    
    // Step 4: Test the actual team invite endpoint
    console.log('\n3. Testing /api/team/invite endpoint...');
    const inviteResponse = await fetch('/api/team/invite?accountInstanceId=471e29fe-0de4-4179-a641-4557a792e9dd', {
      credentials: 'include'
    });
    
    console.log('Team invite endpoint status:', inviteResponse.status);
    const inviteData = await inviteResponse.json();
    console.log('Team invite endpoint response:', inviteData);
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
};

// Run the test
testAuthDebug(); 