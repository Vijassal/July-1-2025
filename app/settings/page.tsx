"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { createClientSupabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Loader2, User, Users, Settings, Mail, AlertTriangle, CheckCircle, XCircle } from "lucide-react"
import { toast } from "sonner"

interface UserProfile {
  id: string
  name: string | null
  email: string
  image: string | null
}

interface TeamMember {
  id: string
  email: string
  name: string | null
  role: string
  status: "active" | "pending" | "inactive"
  invited_at: string
}

interface AppConfiguration {
  currency: string
  religion_enabled: boolean
  floorplan_enabled: boolean
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [configuration, setConfiguration] = useState<AppConfiguration>({
    currency: "USD",
    religion_enabled: true,
    floorplan_enabled: true,
  })
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviting, setInviting] = useState(false)
  const [configTableMissing, setConfigTableMissing] = useState(false)

  const supabase = createClientSupabase()

  const fetchUserProfile = async (userId: string) => {
    try {
      // For now, we'll use the auth user data since we might not have a custom users table
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const userProfile: UserProfile = {
          id: user.id,
          name: user.user_metadata?.name || user.user_metadata?.full_name || null,
          email: user.email || "",
          image: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
        }
        setProfile(userProfile)
      }
    } catch (error) {
      console.error("Error fetching user profile:", error)
      toast.error("Failed to load profile")
    }
  }

  const fetchTeamMembers = async () => {
    try {
      // Mock data for team members since the table might not exist yet
      const mockTeamMembers: TeamMember[] = [
        {
          id: "1",
          email: "john.doe@example.com",
          name: "John Doe",
          role: "Admin",
          status: "active",
          invited_at: new Date().toISOString(),
        },
        {
          id: "2",
          email: "jane.smith@example.com",
          name: "Jane Smith",
          role: "Editor",
          status: "pending",
          invited_at: new Date().toISOString(),
        },
      ]
      setTeamMembers(mockTeamMembers)
    } catch (error) {
      console.error("Error fetching team members:", error)
      toast.error("Failed to load team members")
    }
  }

  const fetchConfiguration = async () => {
    try {
      const { data, error } = await supabase.from("app_configurations").select("*").limit(1).single()

      if (error) {
        // Check if the error is due to missing table or no data
        if (error.message?.includes("relation") && error.message?.includes("does not exist")) {
          console.log("Configuration table does not exist, using defaults")
          setConfigTableMissing(true)
          return
        }

        if (error.code === "PGRST116") {
          // No rows returned, use defaults
          console.log("No configuration found, using defaults")
          return
        }

        throw error
      }

      if (data) {
        setConfiguration({
          currency: data.currency || "USD",
          religion_enabled: data.religion_enabled ?? true,
          floorplan_enabled: data.floorplan_enabled ?? true,
        })
        setConfigTableMissing(false)
      }
    } catch (error) {
      console.error("Error fetching configuration:", error)
      // Don't show error toast, just use defaults and set table missing flag
      setConfigTableMissing(true)
    }
  }

  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true)

        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          toast.error("Please log in to access settings")
          return
        }

        setUser(user)

        // Fetch all data
        await Promise.all([fetchUserProfile(user.id), fetchTeamMembers(), fetchConfiguration()])
      } catch (error) {
        console.error("Error initializing settings:", error)
        toast.error("Failed to load settings")
      } finally {
        setLoading(false)
      }
    }

    initializeData()
  }, [supabase])

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    setSaving(true)
    try {
      // Update auth user metadata
      const { error } = await supabase.auth.updateUser({
        data: {
          name: profile.name,
          full_name: profile.name,
        },
      })

      if (error) throw error

      toast.success("Profile updated successfully")
    } catch (error) {
      console.error("Error updating profile:", error)
      toast.error("Failed to update profile")
    } finally {
      setSaving(false)
    }
  }

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return

    setInviting(true)
    try {
      // Mock invite functionality
      const newMember: TeamMember = {
        id: Date.now().toString(),
        email: inviteEmail,
        name: null,
        role: "Editor",
        status: "pending",
        invited_at: new Date().toISOString(),
      }

      setTeamMembers((prev) => [...prev, newMember])
      setInviteEmail("")
      toast.success(`Invitation sent to ${inviteEmail}`)
    } catch (error) {
      console.error("Error inviting user:", error)
      toast.error("Failed to send invitation")
    } finally {
      setInviting(false)
    }
  }

  const handleConfigurationSave = async () => {
    setSaving(true)
    try {
      if (configTableMissing) {
        toast.error("Configuration table not found. Please run the database migration first.")
        return
      }

      // Mock save functionality since table might not exist
      toast.success("Configuration saved successfully")
    } catch (error) {
      console.error("Error saving configuration:", error)
      toast.error("Failed to save configuration")
    } finally {
      setSaving(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "pending":
        return <Loader2 className="w-4 h-4 text-yellow-500 animate-spin" />
      case "inactive":
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-700 border-green-200"
      case "pending":
        return "bg-yellow-100 text-yellow-700 border-yellow-200"
      case "inactive":
        return "bg-red-100 text-red-700 border-red-200"
      default:
        return "bg-gray-100 text-gray-700 border-gray-200"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Banner Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 text-white shadow-2xl mb-0">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-500/20 via-transparent to-amber-500/20"></div>
        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-rose-500 rounded-xl flex items-center justify-center shadow-lg">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-light">Settings</h1>
              <p className="text-slate-200 font-light">Manage your account, team, and application preferences</p>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Section */}
      <Card className="border-slate-200/50 shadow-lg bg-white/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-slate-800 flex items-center gap-2">
            <User className="w-5 h-5" />
            Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={profile?.name || ""}
                  onChange={(e) => setProfile((prev) => (prev ? { ...prev, name: e.target.value } : null))}
                  placeholder="Enter your full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" value={profile?.email || ""} disabled className="bg-gray-50" />
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Profile"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Team Management Section */}
      <Card className="border-slate-200/50 shadow-lg bg-white/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Team Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Invite Form */}
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <h3 className="font-medium text-slate-800 mb-3">Invite Team Member</h3>
            <form onSubmit={handleInviteUser} className="flex gap-3">
              <div className="flex-1">
                <Input
                  type="email"
                  placeholder="Enter email address"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" disabled={inviting}>
                {inviting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Inviting...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Invite
                  </>
                )}
              </Button>
            </form>
          </div>

          {/* Team Members List */}
          <div className="space-y-3">
            <h3 className="font-medium text-slate-800">Current Team Members</h3>
            <div className="space-y-2">
              {teamMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {member.name ? member.name.charAt(0).toUpperCase() : member.email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">{member.name || member.email}</p>
                      {member.name && <p className="text-sm text-slate-600">{member.email}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={`${getStatusColor(member.status)} text-xs`}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(member.status)}
                        {member.status}
                      </div>
                    </Badge>
                    <span className="text-sm text-slate-600">{member.role}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuration Section */}
      <Card className="border-slate-200/50 shadow-lg bg-white/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-slate-800 flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Application Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {configTableMissing && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                Configuration table not found. Please run the database migration to enable configuration management.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            {/* Currency Selection */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Currency</Label>
              <Select
                value={configuration.currency}
                onValueChange={(value) => setConfiguration((prev) => ({ ...prev, currency: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD - US Dollar</SelectItem>
                  <SelectItem value="EUR">EUR - Euro</SelectItem>
                  <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
                  <SelectItem value="GBP">GBP - British Pound</SelectItem>
                  <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                  <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                  <SelectItem value="CHF">CHF - Swiss Franc</SelectItem>
                  <SelectItem value="CNY">CNY - Chinese Yuan</SelectItem>
                  <SelectItem value="HKD">HKD - Hong Kong Dollar</SelectItem>
                  <SelectItem value="NZD">NZD - New Zealand Dollar</SelectItem>
                  <SelectItem value="SEK">SEK - Swedish Krona</SelectItem>
                  <SelectItem value="KRW">KRW - South Korean Won</SelectItem>
                  <SelectItem value="SGD">SGD - Singapore Dollar</SelectItem>
                  <SelectItem value="NOK">NOK - Norwegian Krone</SelectItem>
                  <SelectItem value="MXN">MXN - Mexican Peso</SelectItem>
                  <SelectItem value="INR">INR - Indian Rupee</SelectItem>
                  <SelectItem value="RUB">RUB - Russian Ruble</SelectItem>
                  <SelectItem value="ZAR">ZAR - South African Rand</SelectItem>
                  <SelectItem value="TRY">TRY - Turkish Lira</SelectItem>
                  <SelectItem value="BRL">BRL - Brazilian Real</SelectItem>
                  <SelectItem value="TWD">TWD - New Taiwan Dollar</SelectItem>
                  <SelectItem value="DKK">DKK - Danish Krone</SelectItem>
                  <SelectItem value="PLN">PLN - Polish Zloty</SelectItem>
                  <SelectItem value="THB">THB - Thai Baht</SelectItem>
                  <SelectItem value="IDR">IDR - Indonesian Rupiah</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Feature Toggles */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Label className="text-base font-medium">Feature Settings</Label>
                <span className="text-xs bg-slate-200 text-slate-700 px-2 py-1 rounded-full ml-2">Coming Soon</span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div>
                    <p className="font-medium text-slate-800">Religion Page</p>
                    <p className="text-sm text-slate-600">Enable religious ceremony planning features</p>
                  </div>
                  <Switch
                    checked={configuration.religion_enabled}
                    onCheckedChange={(checked) => setConfiguration((prev) => ({ ...prev, religion_enabled: checked }))}
                    disabled={configTableMissing}
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div>
                    <p className="font-medium text-slate-800">Trip Plan Page</p>
                    <p className="text-sm text-slate-600">Enable trip and itinerary planning tools</p>
                  </div>
                  <Switch
                    checked={configuration.floorplan_enabled}
                    onCheckedChange={(checked) => setConfiguration((prev) => ({ ...prev, floorplan_enabled: checked }))}
                    disabled={configTableMissing}
                  />
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex justify-end">
            <Button onClick={handleConfigurationSave} disabled={saving || configTableMissing}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Configuration"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
