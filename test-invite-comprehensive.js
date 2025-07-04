// Comprehensive test script for invite functionality
const testInviteComprehensive = async () => {
  const userEmail = 'vishaljassal.4+july1@gmail.com';
  const userPassword = 'Test1234';
  const inviteEmail = 'vishaljassal.4+july3testuser@gmail.com';
  
  console.log('=== COMPREHENSIVE INVITE TEST ===');
  console.log('User Email:', userEmail);
  console.log('Invite Email:', inviteEmail);
  
  try {
    // Step 1: Check if we can access the app
    console.log('\n1. Checking app accessibility...');
    const appResponse = await fetch('http://localhost:3000');
    console.log('App response status:', appResponse.status);
    
    if (!appResponse.ok) {
      console.error('❌ App not accessible');
      return;
    }
    
    // Step 2: Try to access settings page to see auth status
    console.log('\n2. Checking current auth status...');
    const settingsResponse = await fetch('http://localhost:3000/settings', {
      credentials: 'include'
    });
    console.log('Settings response status:', settingsResponse.status);
    
    if (settingsResponse.status === 200) {
      console.log('✅ Already authenticated');
    } else {
      console.log('⚠️ Not authenticated, need to log in');
      console.log('Please log in manually in the browser with:');
      console.log('Email:', userEmail);
      console.log('Password:', userPassword);
      console.log('Then run this test again.');
      return;
    }
    
    // Step 3: Test the invite API endpoints
    console.log('\n3. Testing invite API endpoints...');
    
    // Test GET endpoint first
    console.log('Testing GET /api/team/invite...');
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
      console.error('❌ GET request failed:', getData);
      console.log('This suggests an authentication issue.');
      console.log('Please ensure you are logged in with:', userEmail);
      return;
    }
    
    // Step 4: Test POST endpoint (invite)
    console.log('\n4. Testing POST /api/team/invite (invite user)...');
    
    const postResponse = await fetch('http://localhost:3000/api/team/invite', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: inviteEmail,
        accountInstanceId: '471e29fe-0de4-4179-a641-4557a792e9dd',
        role: 'member'
      })
    });
    
    console.log('POST Response status:', postResponse.status);
    const postData = await postResponse.json();
    console.log('POST Response data:', postData);
    
    if (postResponse.ok) {
      console.log('✅ Invite successful!');
      
      // Step 5: Verify by checking team members again
      console.log('\n5. Verifying invite by checking team members...');
      const verifyResponse = await fetch('http://localhost:3000/api/team/invite?accountInstanceId=471e29fe-0de4-4179-a641-4557a792e9dd', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const verifyData = await verifyResponse.json();
      console.log('Updated team members:', verifyData.teamMembers);
      
      // Check if the invited user appears in the list
      const invitedUser = verifyData.teamMembers?.find((member) => 
        member.email === inviteEmail
      );
      
      if (invitedUser) {
        console.log('✅ Invited user found in team members list!');
        console.log('User details:', invitedUser);
      } else {
        console.log('⚠️ Invited user not found in team members list');
      }
      
    } else {
      console.error('❌ Invite failed:', postData);
      
      // If it's a duplicate invite error, try with a different email
      if (postData.error && postData.error.includes('already been invited')) {
        console.log('\n🔄 User already invited, trying with different email...');
        const alternativeEmail = 'vishaljassal.4+july3testuser2@gmail.com';
        
        const retryResponse = await fetch('http://localhost:3000/api/team/invite', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: alternativeEmail,
            accountInstanceId: '471e29fe-0de4-4179-a641-4557a792e9dd',
            role: 'member'
          })
        });
        
        console.log('Retry Response status:', retryResponse.status);
        const retryData = await retryResponse.json();
        console.log('Retry Response data:', retryData);
        
        if (retryResponse.ok) {
          console.log('✅ Alternative invite successful!');
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
};

// Run the test
testInviteComprehensive(); 