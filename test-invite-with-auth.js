// Comprehensive test script for invite functionality with auth check
const testInviteWithAuth = async () => {
  const testEmail = 'vishaljassal.4+july3testuser@gmail.com';
  
  console.log('Testing invite functionality with auth check...');
  console.log('Test email:', testEmail);
  
  try {
    // First, check if we can access the settings page (this will show us the auth state)
    console.log('\n1. Checking auth state by accessing settings page...');
    
    const settingsResponse = await fetch('http://localhost:3000/settings', {
      method: 'GET',
      credentials: 'include',
    });
    
    console.log('Settings page response status:', settingsResponse.status);
    
    if (settingsResponse.status === 200) {
      console.log('✅ Settings page accessible - user is authenticated');
    } else if (settingsResponse.status === 302) {
      console.log('⚠️ Settings page redirecting - user might not be authenticated');
    } else {
      console.log('❌ Settings page not accessible:', settingsResponse.status);
    }
    
    // Check what cookies are available
    console.log('\n2. Checking available cookies...');
    const cookies = document.cookie;
    console.log('Browser cookies:', cookies);
    
    // Test the GET endpoint to see if we can fetch team members
    console.log('\n3. Testing GET /api/team/invite (fetch team members)...');
    
    const getResponse = await fetch('http://localhost:3000/api/team/invite?accountInstanceId=471e29fe-0de4-4179-a641-4557a792e9dd', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    console.log('GET Response status:', getResponse.status);
    const getData = await getResponse.json();
    console.log('GET Response data:', getData);
    
    if (!getResponse.ok) {
      console.error('GET request failed:', getData);
      console.log('\n🔍 Debugging auth issue...');
      console.log('This suggests the auth cookie is not being set properly.');
      console.log('Please check:');
      console.log('1. Are you logged in to the app?');
      console.log('2. Is the development server running?');
      console.log('3. Are there any console errors in the browser?');
      return;
    }
    
    // Now test the POST endpoint to invite the user
    console.log('\n4. Testing POST /api/team/invite (invite user)...');
    
    const postResponse = await fetch('http://localhost:3000/api/team/invite', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testEmail,
        accountInstanceId: '471e29fe-0de4-4179-a641-4557a792e9dd',
        role: 'member'
      })
    });
    
    console.log('POST Response status:', postResponse.status);
    const postData = await postResponse.json();
    console.log('POST Response data:', postData);
    
    if (postResponse.ok) {
      console.log('✅ Invite successful!');
      
      // Test GET again to see the new team member
      console.log('\n5. Testing GET again to see new team member...');
      const getResponse2 = await fetch('http://localhost:3000/api/team/invite?accountInstanceId=471e29fe-0de4-4179-a641-4557a792e9dd', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const getData2 = await getResponse2.json();
      console.log('Updated team members:', getData2.teamMembers);
      
    } else {
      console.error('❌ Invite failed:', postData);
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
};

// Run the test
testInviteWithAuth(); 