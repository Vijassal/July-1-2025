import { createClient } from "@supabase/supabase-js"
import type { Database } from "./database.types"

/* -------------------------------------------------------------------------- */
/*                                  CONFIG                                    */
/* -------------------------------------------------------------------------- */
const SUPABASE_URL = "https://oskhkfnhikxveddjgodz.supabase.co"
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9za2hrZm5oaWt4dmVkZGpnb2R6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4NzYwNDMsImV4cCI6MjA2MzQ1MjA0M30.Izet6wonn6vwEM9ZzOkSK2WkcIIMSP5nqoNpbFGF0EM"

const isBrowser = typeof window !== "undefined"

/* -------------------------------------------------------------------------- */
/*                               SINGLETON                                    */
/* -------------------------------------------------------------------------- */
let supabaseInstance: ReturnType<typeof createClient<Database>> | null = null

export const createClientSupabase = () => {
  if (supabaseInstance) return supabaseInstance

  supabaseInstance = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      /* Enable these options only in the browser to avoid SSR crashes */
      persistSession: isBrowser,
      autoRefreshToken: isBrowser,
      detectSessionInUrl: isBrowser,
      storage: isBrowser ? window.localStorage : undefined,
      storageKey: 'supabase-auth-token',
      flowType: 'pkce',
    },
  })

  // Add error handling for refresh token issues
  if (isBrowser) {
    supabaseInstance.auth.onAuthStateChange((event, session) => {
      if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed successfully')
      } else if (event === 'SIGNED_OUT') {
        // Clear any stored tokens on sign out
        localStorage.removeItem('supabase-auth-token')
      }
    })
  }

  return supabaseInstance
}

/* Directly export the singleton so it can be imported where needed */
export const supabase = createClientSupabase()

// Helper function to handle refresh token errors
export const handleAuthError = async (error: any) => {
  if (error?.message?.includes('Invalid Refresh Token') || error?.message?.includes('Refresh Token Not Found')) {
    console.warn('Refresh token error detected, clearing session and redirecting to login')
    
    // Clear the session
    await supabase.auth.signOut()
    
    // Clear any stored tokens
    if (isBrowser) {
      localStorage.removeItem('supabase-auth-token')
      sessionStorage.removeItem('supabase-auth-token')
    }
    
    // Redirect to login
    if (isBrowser && window.location.pathname !== '/auth/login') {
      window.location.href = '/auth/login'
    }
    
    return { error: 'Session expired. Please log in again.' }
  }
  
  return { error: error?.message || 'Authentication error occurred' }
}

// Utility function to clear all authentication state
export const clearAuthState = async () => {
  try {
    await supabase.auth.signOut()
    
    if (isBrowser) {
      // Clear all possible storage locations
      localStorage.removeItem('supabase-auth-token')
      sessionStorage.removeItem('supabase-auth-token')
      localStorage.removeItem('sb-oskhkfnhikxveddjgodz-auth-token')
      sessionStorage.removeItem('sb-oskhkfnhikxveddjgodz-auth-token')
      
      // Clear any other potential storage keys
      Object.keys(localStorage).forEach(key => {
        if (key.includes('supabase') || key.includes('auth')) {
          localStorage.removeItem(key)
        }
      })
      
      Object.keys(sessionStorage).forEach(key => {
        if (key.includes('supabase') || key.includes('auth')) {
          sessionStorage.removeItem(key)
        }
      })
    }
    
    console.log('Authentication state cleared successfully')
  } catch (error) {
    console.error('Error clearing auth state:', error)
  }
}
