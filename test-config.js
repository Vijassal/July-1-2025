const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://oskhkfnhikxveddjgodz.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9za2hrZm5oaWt4dmVkZGpnb2R6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4NzYwNDMsImV4cCI6MjA2MzQ1MjA0M30.Izet6wonn6vwEM9ZzOkSK2WkcIIMSP5nqoNpbFGF0EM'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConfig() {
  try {
    console.log('Testing app_configurations table...')
    
    // Check if table exists
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'app_configurations')
    
    if (columnsError) {
      console.error('Error checking table structure:', columnsError)
      return
    }
    
    console.log('Table structure:', columns)
    
    // Check existing configurations
    const { data: configs, error: configError } = await supabase
      .from('app_configurations')
      .select('*')
      .limit(5)
    
    if (configError) {
      console.error('Error fetching configurations:', configError)
      return
    }
    
    console.log('Existing configurations:', configs)
    
    // Check account instances
    const { data: accounts, error: accountError } = await supabase
      .from('account_instances')
      .select('id, name, owner_user_id')
      .limit(5)
    
    if (accountError) {
      console.error('Error fetching accounts:', accountError)
      return
    }
    
    console.log('Account instances:', accounts)
    
  } catch (error) {
    console.error('Test failed:', error)
  }
}

testConfig() 