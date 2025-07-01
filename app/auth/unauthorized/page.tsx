"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClientSupabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, ArrowLeft, UserPlus } from "lucide-react"
import { getUserRegisteredTypes } from "@/lib/auth-guards"

export default function UnauthorizedPage() {
  const [userTypes, setUserTypes] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClientSupabase()

  useEffect(() => {
    const fetchUserTypes = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user) {
          const types = await getUserRegisteredTypes(user.id)
          setUserTypes(types)
        }
      } catch (error) {
        console.error("Error fetching user types:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserTypes()
  }, [supabase])

  const handleGoBack = () => {
    if (userTypes.length > 0) {
      // Redirect to their primary registered type
      const primaryType = userTypes[0]
      switch (primaryType) {
        case "professional":
          router.push("/professional/dashboard")
          break
        case "vendor":
          router.push("/vendor/dashboard")
          break
        default:
          router.push("/dashboard")
      }
    } else {
      router.push("/auth/login")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-red-800">Access Denied</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertDescription>
              You don't have permission to access this user type. You need to register for this account type first.
            </AlertDescription>
          </Alert>

          {userTypes.length > 0 && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-medium text-blue-800 mb-2">Your registered account types:</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                {userTypes.map((type) => (
                  <li key={type} className="capitalize">
                    • {type} User
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-3">
            <Button onClick={handleGoBack} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {userTypes.length > 0 ? "Go to My Dashboard" : "Back to Login"}
            </Button>

            <Button variant="outline" onClick={() => router.push("/auth/register-user-type")} className="w-full">
              <UserPlus className="w-4 h-4 mr-2" />
              Register for New User Type
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
