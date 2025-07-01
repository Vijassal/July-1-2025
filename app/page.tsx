"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClientSupabase } from "@/lib/supabase"
import { Loader2 } from "lucide-react"

export default function Home() {
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClientSupabase()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          console.error("Auth error:", error)
          router.replace("/auth/login")
          return
        }

        // If user is authenticated, redirect to dashboard
        if (session?.user) {
          router.replace("/dashboard")
        } else {
          // If not authenticated, redirect to login
          router.replace("/auth/login")
        }
      } catch (error) {
        console.error("Unexpected error:", error)
        router.replace("/auth/login")
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router, supabase])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  // This should rarely be seen since we redirect immediately
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  )
}
