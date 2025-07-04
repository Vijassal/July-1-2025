import { createClient } from "@supabase/supabase-js"
import type { Database } from "./database.types"

/* -------------------------------------------------------------------------- */
/*                                  CONFIG                                    */
/* -------------------------------------------------------------------------- */
export const SUPABASE_URL = "https://oskhkfnhikxveddjgodz.supabase.co"
export const SUPABASE_ANON_KEY =
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
      // Use localStorage but ensure cookies are also set for API routes
      storage: isBrowser ? window.localStorage : undefined,
      storageKey: 'sb-oskhkfnhikxveddjgodz-auth-token',
      flowType: 'pkce',
    },
  })

  // Add error handling for refresh token issues
  if (isBrowser) {
    supabaseInstance.auth.onAuthStateChange((event, session) => {
      if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed successfully')
        // Also set cookie for API routes
        if (session?.access_token) {
          document.cookie = `sb-oskhkfnhikxveddjgodz-auth-token=${session.access_token}; path=/; max-age=3600; samesite=lax`
        }
      } else if (event === 'SIGNED_IN') {
        // Set cookie when user signs in
        if (session?.access_token) {
          document.cookie = `sb-oskhkfnhikxveddjgodz-auth-token=${session.access_token}; path=/; max-age=3600; samesite=lax`
        }
      } else if (event === 'SIGNED_OUT') {
        // Clear cookie on sign out
        document.cookie = 'sb-oskhkfnhikxveddjgodz-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
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
    
    // Clear cookie
    if (isBrowser) {
      document.cookie = 'sb-oskhkfnhikxveddjgodz-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
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
      // Clear cookie
      document.cookie = 'sb-oskhkfnhikxveddjgodz-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
      
      // Clear localStorage as well
      localStorage.removeItem('sb-oskhkfnhikxveddjgodz-auth-token')
    }
    
    console.log('Authentication state cleared successfully')
  } catch (error) {
    console.error('Error clearing auth state:', error)
  }
}

// Utility function to ensure auth cookie is set for current session
export const ensureAuthCookie = async () => {
  if (!isBrowser) return
  
  try {
    const { data: { session } } = await supabase.auth.getSession()
    console.log('ensureAuthCookie - session:', session ? 'found' : 'not found')
    if (session?.access_token) {
      document.cookie = `sb-oskhkfnhikxveddjgodz-auth-token=${session.access_token}; path=/; max-age=3600; samesite=lax`
      console.log('Auth cookie set for current session')
    } else {
      console.log('No access token found in session')
    }
  } catch (error) {
    console.error('Error setting auth cookie:', error)
  }
}
