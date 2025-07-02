"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { supabase, handleAuthError } from "@/lib/supabase"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Loader2, AlertTriangle } from "lucide-react"
import type { Session } from "@supabase/supabase-js"
import Sidebar from "./Sidebar"
import ProfessionalSidebar from "./ProfessionalSidebar"
import UserBar from "./UserBar"
import { useAccount } from "@/lib/account-context"

interface ClientLayoutProps {
  children: React.ReactNode
}

// Loading component
function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}

// Error component
function ErrorScreen({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center max-w-md p-8 bg-white rounded-lg shadow-sm border border-red-200">
        <div className="flex justify-center mb-4">
          <AlertTriangle className="h-12 w-12 text-red-500" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h2>
        <p className="text-red-600 mb-6">{error}</p>
        <div className="space-y-3">
          <button
            onClick={onRetry}
            className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={() => (window.location.href = "/auth/login")}
            className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    </div>
  )
}

// Unauthenticated layout component
function UnauthenticatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-rose-50 to-pink-50">
      <nav className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-border">
        <div className="max-w-full mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link
                href="/auth/login"
                className="text-xl font-bold text-primary hover:text-primary/80 transition-colors"
              >
                Events Planning
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/auth/login"
                className="text-foreground hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/auth/register"
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </nav>
      <main className="min-h-[calc(100vh-4rem)]">{children}</main>
    </div>
  )
}

// Authenticated layout component
function AuthenticatedLayout({
  children,
  sidebarOpen,
  setSidebarOpen,
  isProfessional,
}: {
  children: React.ReactNode
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  isProfessional: boolean
}) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // Choose which sidebar to render based on user type
  const SidebarComponent = isProfessional ? ProfessionalSidebar : Sidebar

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <SidebarComponent open={sidebarOpen} setOpen={setSidebarOpen} />

      {sidebarOpen && isMobile && (
        <div className="fixed inset-0 bg-black/50 z-30" onClick={() => setSidebarOpen(false)} />
      )}

      <div
        className="flex flex-col flex-1 min-w-0 h-screen transition-all duration-300 relative"
        style={{
          marginLeft: isMobile ? "0" : sidebarOpen ? "240px" : "64px",
        }}
      >
        <div
          className="absolute top-0 left-0 h-14 bg-white z-20"
          style={{
            width: isMobile ? "0" : sidebarOpen ? "1px" : "1px",
            marginLeft: "-1px",
          }}
        />
        <UserBar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-auto bg-white">
          <div className="p-6 animate-fade-in">{children}</div>
        </main>
      </div>
    </div>
  )
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [initialized, setInitialized] = useState(false)
  const pathname = usePathname()
  const { isLoading } = useAccount()

  console.log("[ClientLayout] render", { loading, isLoading, session, pathname })

  // Check if current route is a professional route
  const isProfessionalRoute = pathname?.startsWith("/professional")

  // Single initialization effect
  useEffect(() => {
    if (initialized) return

    let mounted = true

    const initializeAuth = async () => {
      try {
        // Get initial session
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) {
          const handledError = await handleAuthError(sessionError)
          if (mounted) {
            setError(handledError.error)
            setLoading(false)
          }
          return
        }

        if (mounted) {
          setSession(session)
          setLoading(false)
          setInitialized(true)
        }
      } catch (err) {
        console.error("Auth error:", err)
        const handledError = await handleAuthError(err)
        if (mounted) {
          setError(handledError.error)
          setLoading(false)
        }
      }
    }

    initializeAuth()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (mounted && initialized) {
        if (event === 'SIGNED_OUT') {
          setSession(null)
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setSession(session)
        }
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [initialized])

  // Handle responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      setSidebarOpen(window.innerWidth >= 768)
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const isAuthPage = pathname?.startsWith("/auth/")

  if (error) {
    console.log("[ClientLayout] Showing ErrorScreen", { error })
    return <ErrorScreen error={error} onRetry={() => window.location.reload()} />
  }

  if (loading) {
    console.log("[ClientLayout] Showing LoadingScreen (local loading)")
    return <LoadingScreen />
  }

  if (isLoading) {
    console.log("[ClientLayout] Showing LoadingScreen (account context loading)")
    return <LoadingScreen />
  }

  if (isAuthPage || !session) {
    console.log("[ClientLayout] Showing UnauthenticatedLayout")
    return <UnauthenticatedLayout>{children}</UnauthenticatedLayout>
  }

  console.log("[ClientLayout] Showing AuthenticatedLayout")
  return (
    <AuthenticatedLayout sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} isProfessional={isProfessionalRoute}>
      {children}
    </AuthenticatedLayout>
  )
}
