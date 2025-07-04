const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = "https://oskhkfnhikxveddjgodz.supabase.co"
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9za2hrZm5oaWt4dmVkZGpnb2R6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4NzYwNDMsImV4cCI6MjA2MzQ1MjA0M30.Izet6wonn6vwEM9ZzOkSK2WkcIIMSP5nqoNpbFGF0EM"

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function testSupabaseConnection() {
  try {
    console.log('Testing Supabase connection...')
    
    // Test 1: Basic connection
    console.log('1. Testing basic connection...')
    const { data: healthData, error: healthError } = await supabase.from('trips').select('count', { count: 'exact', head: true })
    console.log('Health check result:', { data: healthData, error: healthError })
    
    // Test 2: Check if table exists
    console.log('\n2. Testing table existence...')
    const { data: tableData, error: tableError } = await supabase.from('trips').select('*').limit(1)
    console.log('Table check result:', { data: tableData, error: tableError })
    
    // Test 3: Test with authentication (this should fail with anon key)
    console.log('\n3. Testing with authentication...')
    const { data: authData, error: authError } = await supabase.from('trips').select('*')
    console.log('Auth check result:', { data: authData, error: authError })
    
    // Test 4: Check RLS policies
    console.log('\n4. Testing RLS policies...')
    if (authError) {
      console.log('RLS is working (expected error for anon user):', authError.message)
    } else {
      console.log('Warning: RLS might not be working properly')
    }
    
    // Test 5: Check network connectivity
    console.log('\n5. Testing network connectivity...')
    try {
      const response = await fetch(SUPABASE_URL + '/rest/v1/trips?select=count', {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      })
      console.log('Network test result:', response.status, response.statusText)
    } catch (networkError) {
      console.error('Network test failed:', networkError.message)
    }
    
  } catch (error) {
    console.error('Test failed:', error)
  }
}

testSupabaseConnection() 