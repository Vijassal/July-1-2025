"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClientSupabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Users, Briefcase, Store, CheckCircle } from "lucide-react"
import { toast } from "sonner"
import { getUserRegisteredTypes } from "@/lib/auth-guards"

type UserType = "regular" | "professional" | "vendor"

interface UserTypeConfig {
  title: string
  description: string
  icon: React.ComponentType<any>
  requirements: string[]
}

const userTypeConfigs: Record<UserType, UserTypeConfig> = {
  regular: {
    title: "Regular User",
    description: "Plan your own events with full access to all features",
    icon: Users,
    requirements: ["Valid email address", "Basic account information"],
  },
  professional: {
    title: "Professional Event Planner",
    description: "Manage multiple client accounts and provide professional services",
    icon: Briefcase,
    requirements: ["Professional credentials", "Business information", "Client management experience"],
  },
  vendor: {
    title: "Vendor",
    description: "Provide services to event planners and manage bookings",
    icon: Store,
    requirements: ["Business registration", "Service portfolio", "Contact information"],
  },
}

export default function RegisterUserTypePage() {
  const [selectedType, setSelectedType] = useState<UserType | "">("")
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [registeredTypes, setRegisteredTypes] = useState<string[]>([])
  const [formData, setFormData] = useState({
    businessName: "",
    serviceCategory: "",
    description: "",
    experience: "",
    credentials: "",
  })

  const router = useRouter()
  const supabase = createClientSupabase()

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
          router.push("/auth/login")
          return
        }

        const types = await getUserRegisteredTypes(user.id)
        setRegisteredTypes(types)
      } catch (error) {
        console.error("Error fetching user data:", error)
        toast.error("Failed to load user information")
      } finally {
        setInitialLoading(false)
      }
    }

    fetchUserData()
  }, [supabase, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedType) return

    setLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("User not authenticated")

      // Register the user for the new type
      const { error: registrationError } = await supabase.from("user_type_registrations").insert({
        user_id: user.id,
        user_type: selectedType,
      })

      if (registrationError) {
        if (registrationError.code === "23505") {
          toast.error("You are already registered for this user type")
          return
        }
        throw registrationError
      }

      // If registering as vendor, create vendor profile
      if (selectedType === "vendor") {
        const { error: vendorError } = await supabase.from("vendor_profiles").insert({
          user_id: user.id,
          business_name: formData.businessName,
          service_category: formData.serviceCategory,
          description: formData.description,
        })

        if (vendorError) {
          console.error("Error creating vendor profile:", vendorError)
          // Don't fail the registration, just log the error
        }
      }

      toast.success(`Successfully registered as ${userTypeConfigs[selectedType].title}!`)

      // Redirect to the appropriate dashboard
      switch (selectedType) {
        case "professional":
          router.push("/professional/dashboard")
          break
        case "vendor":
          router.push("/vendor/dashboard")
          break
        default:
          router.push("/dashboard")
      }
    } catch (error) {
      console.error("Registration error:", error)
      toast.error("Failed to register for user type")
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="max-w-2xl mx-auto pt-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Register for User Type</h1>
          <p className="text-gray-600">Choose the type of account you'd like to register for</p>
        </div>

        {registeredTypes.length > 0 && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>Currently registered as:</strong>{" "}
              {registeredTypes.map((type) => userTypeConfigs[type as UserType]?.title || type).join(", ")}
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Select User Type</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <Label>Choose User Type</Label>
                <div className="grid gap-4">
                  {Object.entries(userTypeConfigs).map(([type, config]) => {
                    const Icon = config.icon
                    const isRegistered = registeredTypes.includes(type)

                    return (
                      <div
                        key={type}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          selectedType === type
                            ? "border-primary bg-primary/5"
                            : isRegistered
                              ? "border-green-200 bg-green-50 opacity-60"
                              : "border-gray-200 hover:border-gray-300"
                        } ${isRegistered ? "cursor-not-allowed" : ""}`}
                        onClick={() => !isRegistered && setSelectedType(type as UserType)}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${isRegistered ? "bg-green-100" : "bg-primary/10"}`}>
                            <Icon className={`w-5 h-5 ${isRegistered ? "text-green-600" : "text-primary"}`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{config.title}</h3>
                              {isRegistered && <CheckCircle className="w-4 h-4 text-green-600" />}
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{config.description}</p>
                            <ul className="text-xs text-gray-500 space-y-1">
                              {config.requirements.map((req, index) => (
                                <li key={index} className="flex items-center gap-1">
                                  <div className="w-1 h-1 bg-gray-400 rounded-full" />
                                  {req}
                                </li>
                              ))}
                            </ul>
                            {isRegistered && (
                              <p className="text-xs text-green-600 mt-2 font-medium">Already registered</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {selectedType === "vendor" && (
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium">Vendor Information</h3>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="businessName">Business Name *</Label>
                      <Input
                        id="businessName"
                        value={formData.businessName}
                        onChange={(e) => setFormData((prev) => ({ ...prev, businessName: e.target.value }))}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="serviceCategory">Service Category *</Label>
                      <Select
                        value={formData.serviceCategory}
                        onValueChange={(value) => setFormData((prev) => ({ ...prev, serviceCategory: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="catering">Catering</SelectItem>
                          <SelectItem value="photography">Photography</SelectItem>
                          <SelectItem value="music">Music & Entertainment</SelectItem>
                          <SelectItem value="flowers">Flowers & Decoration</SelectItem>
                          <SelectItem value="venue">Venue</SelectItem>
                          <SelectItem value="transportation">Transportation</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Business Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe your services..."
                      rows={3}
                    />
                  </div>
                </div>
              )}

              {selectedType === "professional" && (
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium">Professional Information</h3>

                  <div>
                    <Label htmlFor="experience">Years of Experience</Label>
                    <Input
                      id="experience"
                      value={formData.experience}
                      onChange={(e) => setFormData((prev) => ({ ...prev, experience: e.target.value }))}
                      placeholder="e.g., 5 years"
                    />
                  </div>

                  <div>
                    <Label htmlFor="credentials">Credentials & Certifications</Label>
                    <Textarea
                      id="credentials"
                      value={formData.credentials}
                      onChange={(e) => setFormData((prev) => ({ ...prev, credentials: e.target.value }))}
                      placeholder="List your professional credentials..."
                      rows={3}
                    />
                  </div>
                </div>
              )}

              <Button
                type="submit"
                disabled={!selectedType || loading || registeredTypes.includes(selectedType)}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registering...
                  </>
                ) : (
                  `Register as ${selectedType ? userTypeConfigs[selectedType].title : "User"}`
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
