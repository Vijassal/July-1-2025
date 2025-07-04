// Browser-based test script for invite functionality
// Run this in the browser console at http://localhost:3000/settings

const testInviteInBrowser = async () => {
  const inviteEmail = 'vishaljassal.4+july3testuser@gmail.com';
  
  console.log('=== BROWSER INVITE TEST ===');
  console.log('Invite Email:', inviteEmail);
  
  try {
    // Step 1: Check current cookies
    console.log('\n1. Current cookies:');
    console.log(document.cookie);
    
    // Step 2: Check if we have the auth cookie
    const authCookie = document.cookie
      .split(';')
      .find(cookie => cookie.trim().startsWith('sb-oskhkfnhikxveddjgodz-auth-token='));
    
    if (authCookie) {
      console.log('✅ Auth cookie found:', authCookie.substring(0, 50) + '...');
    } else {
      console.log('❌ Auth cookie not found');
      console.log('Available cookies:', document.cookie);
    }
    
    // Step 3: Test GET endpoint
    console.log('\n2. Testing GET /api/team/invite...');
    const getResponse = await fetch('/api/team/invite?accountInstanceId=471e29fe-0de4-4179-a641-4557a792e9dd', {
      credentials: 'include'
    });
    
    console.log('GET Response status:', getResponse.status);
    const getData = await getResponse.json();
    console.log('GET Response data:', getData);
    
    if (!getResponse.ok) {
      console.error('❌ GET request failed:', getData);
      return;
    }
    
    // Step 4: Test POST endpoint (invite)
    console.log('\n3. Testing POST /api/team/invite...');
    const postResponse = await fetch('/api/team/invite', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
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
      console.log('\n4. Verifying invite...');
      const verifyResponse = await fetch('/api/team/invite?accountInstanceId=471e29fe-0de4-4179-a641-4557a792e9dd', {
        credentials: 'include'
      });
      
      const verifyData = await verifyResponse.json();
      console.log('Updated team members:', verifyData.teamMembers);
      
      const invitedUser = verifyData.teamMembers?.find(member => 
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
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
};

// Run the test
testInviteInBrowser(); 