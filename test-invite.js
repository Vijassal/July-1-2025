// Test script for invite functionality
const testInvite = async () => {
  const testEmail = 'vishaljassal.4+july3testuser@gmail.com';
  
  console.log('Testing invite functionality...');
  console.log('Test email:', testEmail);
  
  try {
    // First, let's test the GET endpoint to see if we can fetch team members
    console.log('\n1. Testing GET /api/team/invite (fetch team members)...');
    
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
      return;
    }
    
    // Now test the POST endpoint to invite the user
    console.log('\n2. Testing POST /api/team/invite (invite user)...');
    
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
      console.log('\n3. Testing GET again to see new team member...');
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
testInvite(); 