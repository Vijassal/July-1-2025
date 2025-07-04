import { createRouteHandlerClient as createSupabaseRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { Database } from "./database.types"

// Supabase configuration (same as in supabase.ts)
const SUPABASE_URL = "https://oskhkfnhikxveddjgodz.supabase.co"
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9za2hrZm5oaWt4dmVkZGpnb2R6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4NzYwNDMsImV4cCI6MjA2MzQ1MjA0M30.Izet6wonn6vwEM9ZzOkSK2WkcIIMSP5nqoNpbFGF0EM"

// Function for API routes that need authentication
export const createRouteHandlerClient = async () => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = SUPABASE_URL
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = SUPABASE_ANON_KEY
  
  console.log("Creating route handler client with:", {
    url: SUPABASE_URL,
    key: SUPABASE_ANON_KEY.substring(0, 20) + "..."
  })
  
  // Pass the cookies function directly (Next.js 14+)
  return createSupabaseRouteHandlerClient<Database>({ cookies })
} 