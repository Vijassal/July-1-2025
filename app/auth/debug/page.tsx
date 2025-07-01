"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClientSupabase, clearAuthState } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Trash2, CheckCircle, AlertTriangle } from "lucide-react"
import { toast } from "sonner"

export default function DebugPage() {
  const [loading, setLoading] = useState(false)
  const [authState, setAuthState] = useState<any>(null)
  const [storageInfo, setStorageInfo] = useState<any>({})
  
  const router = useRouter()
  const supabase = createClientSupabase()

  const checkAuthState = async () => {
    setLoading(true)
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        setAuthState({ error: error.message })
      } else {
        setAuthState({ session: session ? 'Active' : 'None', user: session?.user?.email })
      }

      // Check storage
      const storage = {
        localStorage: Object.keys(localStorage).filter(key => 
          key.includes('supabase') || key.includes('auth')
        ),
        sessionStorage: Object.keys(sessionStorage).filter(key => 
          key.includes('supabase') || key.includes('auth')
        )
      }
      setStorageInfo(storage)
      
    } catch (error) {
      setAuthState({ error: 'Failed to check auth state' })
    } finally {
      setLoading(false)
    }
  }

  const handleClearAuth = async () => {
    setLoading(true)
    try {
      await clearAuthState()
      toast.success("Authentication state cleared successfully")
      setAuthState(null)
      setStorageInfo({})
    } catch (error) {
      toast.error("Failed to clear authentication state")
    } finally {
      setLoading(false)
    }
  }

  const handleRefreshSession = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.refreshSession()
      
      if (error) {
        toast.error(`Failed to refresh session: ${error.message}`)
      } else {
        toast.success("Session refreshed successfully")
        await checkAuthState()
      }
    } catch (error) {
      toast.error("Failed to refresh session")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Authentication Debug</h1>
          <p className="text-muted-foreground">
            Use this page to diagnose and fix authentication issues
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Current State
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button onClick={checkAuthState} disabled={loading}>
                Check Auth State
              </Button>
              <Button onClick={handleRefreshSession} disabled={loading} variant="outline">
                Refresh Session
              </Button>
            </div>

            {authState && (
              <div className="space-y-2">
                <h3 className="font-semibold">Authentication Status:</h3>
                {authState.error ? (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{authState.error}</AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={authState.session === 'Active' ? 'default' : 'secondary'}>
                        {authState.session}
                      </Badge>
                      {authState.user && <span className="text-sm text-muted-foreground">{authState.user}</span>}
                    </div>
                  </div>
                )}
              </div>
            )}

            {Object.keys(storageInfo).length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold">Storage Keys:</h3>
                <div className="space-y-1">
                  {storageInfo.localStorage?.length > 0 && (
                    <div>
                      <span className="text-sm font-medium">LocalStorage:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {storageInfo.localStorage.map((key: string) => (
                          <Badge key={key} variant="outline" className="text-xs">
                            {key}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {storageInfo.sessionStorage?.length > 0 && (
                    <div>
                      <span className="text-sm font-medium">SessionStorage:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {storageInfo.sessionStorage.map((key: string) => (
                          <Badge key={key} variant="outline" className="text-xs">
                            {key}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Clear Authentication
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                This will clear all authentication data and sign you out. Use this if you're experiencing 
                "Invalid Refresh Token" errors or other authentication issues.
              </AlertDescription>
            </Alert>
            
            <div className="flex gap-2">
              <Button 
                onClick={handleClearAuth} 
                disabled={loading}
                variant="destructive"
              >
                Clear All Auth Data
              </Button>
              <Button 
                onClick={() => router.push('/auth/login')} 
                variant="outline"
              >
                Go to Login
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button 
            onClick={() => router.push('/')} 
            variant="ghost"
          >
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  )
} 