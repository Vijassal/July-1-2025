"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClientSupabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle, XCircle, Users, Mail } from "lucide-react"
import { toast } from "sonner"

interface InviteData {
  id: string
  account_instance_id: string
  invited_email: string
  role: string
  status: string
  account_instance: {
    name: string
  }
}

export default function TeamInvitePage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [invite, setInvite] = useState<InviteData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  const supabase = createClientSupabase()

  useEffect(() => {
    checkAuthAndInvite()
  }, [])

  const checkAuthAndInvite = async () => {
    try {
      setLoading(true)
      
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        setIsAuthenticated(true)
        setUserEmail(user.email || null)
      }

      // For now, we'll use the token as the invite ID
      // In a real implementation, you'd decode the token to get the invite ID
      const inviteId = params.token as string
      
      if (!inviteId) {
        setError("Invalid invite link")
        return
      }

      // Get invite details
      const { data: inviteData, error: inviteError } = await supabase
        .from("account_instance_users")
        .select(`
          id,
          account_instance_id,
          invited_email,
          role,
          status,
          account_instances (
            name
          )
        `)
        .eq("id", inviteId)
        .single()

      if (inviteError || !inviteData) {
        setError("Invalid or expired invite")
        return
      }

      if (inviteData.status !== "pending") {
        setError("This invite has already been used or expired")
        return
      }

      setInvite({
        ...inviteData,
        account_instance: inviteData.account_instances[0]
      })
    } catch (error) {
      console.error("Error checking invite:", error)
      setError("Failed to load invite")
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptInvite = async () => {
    if (!invite || !isAuthenticated) return

    setAccepting(true)
    try {
      const response = await fetch("/api/team/accept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inviteId: invite.id
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to accept invite")
      }

      toast.success("Invite accepted successfully!")
      
      // Redirect to dashboard
      router.push("/dashboard")
    } catch (error) {
      console.error("Error accepting invite:", error)
      toast.error(error instanceof Error ? error.message : "Failed to accept invite")
    } finally {
      setAccepting(false)
    }
  }

  const handleSignIn = () => {
    // Redirect to sign in page
    router.push("/auth/login")
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading invite...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <CardTitle className="text-xl text-red-800">Invalid Invite</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
            <Button 
              onClick={() => router.push("/")} 
              className="mt-4 w-full"
              variant="outline"
            >
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!invite) {
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <Users className="w-6 h-6 text-green-600" />
          </div>
          <CardTitle className="text-xl">Team Invitation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-2">
            <p className="text-lg font-medium text-slate-800">
              You've been invited to join
            </p>
            <p className="text-2xl font-bold text-primary">
              {invite.account_instance.name}
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-slate-600">
              <Mail className="w-4 h-4" />
              <span>{invite.invited_email}</span>
            </div>
          </div>

          <div className="bg-slate-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-slate-600">Role:</span>
              <span className="text-sm font-medium capitalize">{invite.role}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-600">Status:</span>
              <span className="text-sm font-medium text-green-600">Pending</span>
            </div>
          </div>

          {!isAuthenticated ? (
            <div className="space-y-3">
              <p className="text-sm text-slate-600 text-center">
                Please sign in to accept this invitation
              </p>
              <Button onClick={handleSignIn} className="w-full">
                Sign In to Accept
              </Button>
            </div>
          ) : userEmail !== invite.invited_email ? (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertDescription className="text-yellow-800">
                This invite was sent to {invite.invited_email}, but you're signed in as {userEmail}. 
                Please sign in with the correct email address.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-slate-600 text-center">
                You'll be added to the team and can start collaborating immediately.
              </p>
              <Button 
                onClick={handleAcceptInvite} 
                disabled={accepting}
                className="w-full"
              >
                {accepting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Accepting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Accept Invitation
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 