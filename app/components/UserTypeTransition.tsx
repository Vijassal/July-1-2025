"use client"

import { useEffect, useState } from "react"
import { createClientSupabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, User, Briefcase, Store, ArrowRight } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface UserTypeRegistration {
  id: string
  user_type: "regular" | "professional" | "vendor"
  is_active: boolean
  registered_at: string
}

export default function UserTypeTransition() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [registrations, setRegistrations] = useState<UserTypeRegistration[]>([])
  const [transitioning, setTransitioning] = useState<string | null>(null)

  const supabase = createClientSupabase()
  const router = useRouter()

  useEffect(() => {
    const fetchUserTypes = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          router.push("/auth/login")
          return
        }

        setUser(user)

        const { data: registrations, error } = await supabase
          .from("user_type_registrations")
          .select("*")
          .eq("user_id", user.id)
          .order("registered_at", { ascending: false })

        if (error) throw error

        setRegistrations(registrations || [])
      } catch (error) {
        console.error("Error fetching user types:", error)
        toast.error("Failed to load user types")
      } finally {
        setLoading(false)
      }
    }

    fetchUserTypes()
  }, [supabase, router])

  const handleTransition = async (userType: "regular" | "professional" | "vendor") => {
    if (!user) return

    setTransitioning(userType)
    try {
      // Check if already registered
      const existingReg = registrations.find((reg) => reg.user_type === userType)

      if (existingReg) {
        if (!existingReg.is_active) {
          // Reactivate existing registration
          const { error } = await supabase
            .from("user_type_registrations")
            .update({ is_active: true })
            .eq("id", existingReg.id)

          if (error) throw error
          toast.success(`${userType} access reactivated!`)
        } else {
          toast.info(`You already have ${userType} access`)
        }
      } else {
        // Create new registration
        const { error } = await supabase.from("user_type_registrations").insert({
          user_id: user.id,
          user_type: userType,
          is_active: true,
        })

        if (error) throw error
        toast.success(`Successfully registered as ${userType}!`)
      }

      // Refresh registrations
      const { data: updatedRegistrations } = await supabase
        .from("user_type_registrations")
        .select("*")
        .eq("user_id", user.id)
        .order("registered_at", { ascending: false })

      setRegistrations(updatedRegistrations || [])

      // Redirect to appropriate dashboard
      setTimeout(() => {
        switch (userType) {
          case "professional":
            router.push("/professional/dashboard")
            break
          case "vendor":
            router.push("/vendor/dashboard")
            break
          default:
            router.push("/dashboard")
        }
      }, 1000)
    } catch (error) {
      console.error("Error transitioning user type:", error)
      toast.error("Failed to transition user type")
    } finally {
      setTransitioning(null)
    }
  }

  const getUserTypeIcon = (type: string) => {
    switch (type) {
      case "professional":
        return <Briefcase className="w-5 h-5" />
      case "vendor":
        return <Store className="w-5 h-5" />
      default:
        return <User className="w-5 h-5" />
    }
  }

  const getUserTypeDescription = (type: string) => {
    switch (type) {
      case "professional":
        return "Manage multiple client accounts and events"
      case "vendor":
        return "Provide services and manage bookings"
      default:
        return "Plan and manage your own events"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-8 w-8 text-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading your account types...</p>
        </div>
      </div>
    )
  }

  const activeRegistrations = registrations.filter((reg) => reg.is_active)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Account Type Management</h1>
          <p className="text-gray-600">Switch between your account types or register for new ones</p>
        </div>

        {/* Current Active Types */}
        {activeRegistrations.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Your Active Account Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {activeRegistrations.map((reg) => (
                  <div key={reg.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    {getUserTypeIcon(reg.user_type)}
                    <div className="flex-1">
                      <p className="font-medium capitalize">{reg.user_type}</p>
                      <p className="text-sm text-gray-600">
                        Active since {new Date(reg.registered_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="default">Active</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Available Account Types */}
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { type: "regular" as const, title: "Regular User", color: "blue" },
            { type: "professional" as const, title: "Event Planner", color: "purple" },
            { type: "vendor" as const, title: "Service Vendor", color: "green" },
          ].map(({ type, title, color }) => {
            const isActive = activeRegistrations.some((reg) => reg.user_type === type)
            const isTransitioning = transitioning === type

            return (
              <Card key={type} className={`border-${color}-200 hover:border-${color}-300 transition-colors`}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 bg-${color}-100 rounded-lg`}>{getUserTypeIcon(type)}</div>
                    <div>
                      <CardTitle className="text-lg">{title}</CardTitle>
                      <p className="text-sm text-gray-600">{getUserTypeDescription(type)}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {isActive ? (
                    <Button
                      onClick={() => {
                        switch (type) {
                          case "professional":
                            router.push("/professional/dashboard")
                            break
                          case "vendor":
                            router.push("/vendor/dashboard")
                            break
                          default:
                            router.push("/dashboard")
                        }
                      }}
                      className="w-full"
                      variant="outline"
                    >
                      <ArrowRight className="w-4 h-4 mr-2" />
                      Go to Dashboard
                    </Button>
                  ) : (
                    <Button onClick={() => handleTransition(type)} disabled={isTransitioning} className="w-full">
                      {isTransitioning ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Registering...
                        </>
                      ) : (
                        `Register as ${title}`
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
