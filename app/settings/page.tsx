"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { createClientSupabase, ensureAuthCookie } from "@/lib/supabase"
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useAccount } from "@/lib/account-context"
import { SubscriptionService } from "@/lib/subscription-service"
import { useFeatureFlags } from "@/lib/feature-flags"

interface UserProfile {
  id: string
  name: string | null
  email: string
  image: string | null
}

interface TeamMember {
  id: string
  email?: string
  invited_email?: string
  name: string | null
  role: string
  status: "active" | "pending" | "inactive"
  invited_at?: string
  is_owner?: boolean
}

interface AppConfiguration {
  currency: string
  religion_enabled: boolean
  floorplan_enabled: boolean
  trip_plan_enabled: boolean
}

const AVAILABLE_CURRENCIES = [
  { value: "USD", label: "USD" },
  { value: "EUR", label: "EUR" },
  { value: "JPY", label: "JPY" },
  { value: "GBP", label: "GBP" },
  { value: "AUD", label: "AUD" },
  { value: "CAD", label: "CAD" },
  { value: "CHF", label: "CHF" },
  { value: "CNY", label: "CNY" },
  { value: "HKD", label: "HKD" },
  { value: "NZD", label: "NZD" },
  { value: "SEK", label: "SEK" },
  { value: "KRW", label: "KRW" },
  { value: "SGD", label: "SGD" },
  { value: "NOK", label: "NOK" },
  { value: "MXN", label: "MXN" },
  { value: "INR", label: "INR" },
  { value: "RUB", label: "RUB" },
  { value: "ZAR", label: "ZAR" },
  { value: "TRY", label: "TRY" },
  { value: "BRL", label: "BRL" },
  { value: "TWD", label: "TWD" },
  { value: "DKK", label: "DKK" },
  { value: "PLN", label: "PLN" },
  { value: "THB", label: "THB" },
  { value: "IDR", label: "IDR" },
]

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [teamMembersLoading, setTeamMembersLoading] = useState(false)
  const [configuration, setConfiguration] = useState<AppConfiguration>({
    currency: "USD",
    religion_enabled: true,
    floorplan_enabled: true,
    trip_plan_enabled: true,
  })
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteFirstName, setInviteFirstName] = useState("")
  const [inviteLastName, setInviteLastName] = useState("")
  const [inviting, setInviting] = useState(false)
  const { currentAccount, refreshAccountData } = useAccount();
  const { refreshFeatures } = useFeatureFlags();
  const [activeTab, setActiveTab] = useState("settings");
  const [subLoading, setSubLoading] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null);
  const [currency, setCurrency] = useState<string>("USD");
  const [deletingMember, setDeletingMember] = useState<string | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<TeamMember | null>(null);

  const supabase = createClientSupabase()

  const fetchUserProfile = async (userId: string) => {
    try {
      const {
        data: { user },
        error
      } = await supabase.auth.getUser()

      if (error) throw error

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
    if (!currentAccount?.id) {
      console.log("No current account, skipping team members fetch")
      return
    }

    console.log("Fetching team members for account:", currentAccount.id);
    setTeamMembersLoading(true)
    try {
      // Directly query the account_instance_users table
      const { data, error } = await supabase
        .from("account_instance_users")
        .select("id, user_id, invited_email, role, status, is_owner, created_at")
        .eq("account_instance_id", currentAccount.id)

      if (error) {
        throw error
      }

      console.log("Team members data from database:", data);
      
      const mappedMembers = (data || []).map((member: any) => ({
        id: member.id,
        email: undefined, // not available from this query
        invited_email: member.invited_email,
        name: null, // no name available from this table
        role: member.role,
        status: member.status,
        invited_at: member.created_at,
        is_owner: member.is_owner,
      }));

      console.log("Mapped team members:", mappedMembers);
      setTeamMembers(mappedMembers);
    } catch (error) {
      console.error("Error fetching team members:", error)
      toast.error(error instanceof Error ? error.message : "Failed to load team members")
      setTeamMembers([])
    } finally {
      setTeamMembersLoading(false)
    }
  }

  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true)

        const {
          data: { user },
          error
        } = await supabase.auth.getUser()

        if (error) throw error

        if (!user) {
          toast.error("Please log in to access settings")
          return
        }

        setUser(user)

        // Ensure auth cookie is set for API routes
        await ensureAuthCookie()

        // Fetch all data
        await Promise.all([fetchUserProfile(user.id), fetchTeamMembers()])
      } catch (error) {
        console.error("Error initializing settings:", error)
        toast.error("Failed to load settings")
      } finally {
        setLoading(false)
      }
    }

    initializeData()
  }, [supabase])

  useEffect(() => {
    if (currentAccount) {
      console.log('[Settings] currentAccount:', currentAccount)
      setCurrency(currentAccount.currency || "USD")
      setConfiguration(prev => ({
        ...prev,
        trip_plan_enabled: currentAccount.trip_plan_enabled ?? true
      }))
      // Ensure auth cookie is set and fetch team members when account changes
      const fetchWithAuth = async () => {
        await ensureAuthCookie()
        await fetchTeamMembers()
      }
      fetchWithAuth()
    }
  }, [currentAccount])

  // Fetch subscription info for Subscription tab
  useEffect(() => {
    const fetchSubscription = async () => {
      if (!user?.id) return;
      setSubLoading(true);
      setSubscriptionError(null);
      try {
        const result = await SubscriptionService.getUserSubscriptionWithPlan(user.id);
        setSubscription(result);
      } catch (err) {
        console.error("Error fetching subscription:", err)
        setSubscriptionError("Failed to load subscription info");
      } finally {
        setSubLoading(false);
      }
    };
    if (activeTab === "subscription") fetchSubscription();
  }, [activeTab, user]);

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

  const handleConfigurationSave = async () => {
    if (!currentAccount?.id) {
      toast.error("No account found")
      return
    }

    setSaving(true)
    try {
      // Save trip_plan_enabled to account_instances table
      const { error } = await supabase
        .from("account_instances")
        .update({ 
          trip_plan_enabled: configuration.trip_plan_enabled 
        })
        .eq("id", currentAccount.id)

      if (error) throw error

      toast.success("Configuration saved successfully")
      
      // Immediately refresh feature flags
      await refreshFeatures()
      
      // Refresh account data to get updated values
      await refreshAccountData()
      
      // Force a small delay to ensure all contexts are updated
      setTimeout(() => {
        window.location.reload()
      }, 500)
      
    } catch (error) {
      console.error("Error saving configuration:", error)
      toast.error("Failed to save configuration")
    } finally {
      setSaving(false)
    }
  }

  // Update currency on account instance
  const handleCurrencyChange = async (value: string) => {
    setCurrency(value);
    setSaving(true);
    try {
      const { error } = await supabase
        .from("account_instances")
        .update({ currency: value })
        .eq("id", currentAccount?.id);

      if (error) throw error;
      toast.success("Currency updated successfully");
    } catch (error) {
      console.error("Error updating currency:", error);
      toast.error("Failed to update currency");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    if (!currentAccount?.id) {
      toast.error("No account found");
      return;
    }

    console.log("Starting delete operation for member:", memberId);
    setDeletingMember(memberId);
    try {
      const response = await fetch("/api/team/remove", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          memberId,
          accountInstanceId: currentAccount.id,
        }),
      });

      const data = await response.json();
      console.log("Delete API response:", { status: response.status, data });
      console.log("Response data details:", JSON.stringify(data, null, 2));
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to remove team member");
      }

      toast.success(data.message || "Team member removed successfully");
      console.log("Refreshing team members list...");
      await fetchTeamMembers(); // Refresh the team members list
      console.log("Team members refresh completed");
    } catch (error) {
      console.error("Error in delete operation:", error);
      toast.error(error instanceof Error ? error.message : "Failed to remove team member");
    } finally {
      setDeletingMember(null);
      setMemberToDelete(null);
    }
  };

  const confirmDeleteMember = (member: TeamMember) => {
    console.log('Confirming delete for member:', member);
    setMemberToDelete(member);
  };

  const cancelDelete = () => {
    setMemberToDelete(null);
  };

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
    <div className="space-y-8">
      {/* Top Navigation Bar (1:1 Budget style) */}
      <div className="flex items-center w-full mt-8 mb-8">
        <nav className="flex bg-white/90 backdrop-blur-sm border border-slate-200/60 rounded-xl shadow-sm overflow-x-auto px-2 py-1 gap-2">
          <button
            className={`px-5 py-2 rounded-lg font-medium transition-colors text-sm ${activeTab === "settings" ? "bg-gradient-to-br from-orange-400 to-amber-400 text-white shadow" : "text-slate-600 hover:bg-slate-100"}`}
            onClick={() => setActiveTab("settings")}
            type="button"
          >
            Settings
          </button>
          <button
            className={`px-5 py-2 rounded-lg font-medium transition-colors text-sm ${activeTab === "subscription" ? "bg-gradient-to-br from-orange-400 to-amber-400 text-white shadow" : "text-slate-600 hover:bg-slate-100"}`}
            onClick={() => setActiveTab("subscription")}
            type="button"
          >
            Subscription
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "settings" && (
        <div className="space-y-8">
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

          {/* Delete Confirmation Dialog */}
          {memberToDelete && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h3 className="text-lg font-semibold text-slate-800 mb-2">Remove Team Member</h3>
                <p className="text-slate-600 mb-4">
                  Are you sure you want to remove <strong>{memberToDelete.name || memberToDelete.invited_email || memberToDelete.email}</strong> from the team? This action cannot be undone.
                </p>
                <div className="flex gap-3 justify-end">
                  <Button variant="outline" onClick={cancelDelete} disabled={deletingMember === memberToDelete.id}>
                    Cancel
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={() => handleDeleteMember(memberToDelete.id)}
                    disabled={deletingMember === memberToDelete.id}
                  >
                    {deletingMember === memberToDelete.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Removing...
                      </>
                    ) : (
                      "Remove Member"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

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
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!inviteEmail.trim() || !inviteFirstName.trim() || !inviteLastName.trim() || !currentAccount?.id) return;
                    setInviting(true);
                    try {
                      const response = await fetch("/api/team/invite", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        credentials: "include",
                        body: JSON.stringify({
                          email: inviteEmail.trim(),
                          firstName: inviteFirstName.trim(),
                          lastName: inviteLastName.trim(),
                          accountInstanceId: currentAccount.id,
                          role: "member",
                        }),
                      });
                      const data = await response.json();
                      if (!response.ok) throw new Error(data.error || "Failed to send invitation");
                      setInviteEmail("");
                      setInviteFirstName("");
                      setInviteLastName("");
                      toast.success(data.message || `Invitation sent to ${inviteEmail}`);
                      await fetchTeamMembers();
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : "Failed to send invitation");
                    } finally {
                      setInviting(false);
                    }
                  }}
                  className="space-y-3"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Input
                        type="text"
                        placeholder="First Name"
                        value={inviteFirstName}
                        onChange={(e) => setInviteFirstName(e.target.value)}
                        required
                        disabled={inviting}
                      />
                    </div>
                    <div>
                      <Input
                        type="text"
                        placeholder="Last Name"
                        value={inviteLastName}
                        onChange={(e) => setInviteLastName(e.target.value)}
                        required
                        disabled={inviting}
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <Input
                        type="email"
                        placeholder="Enter email address"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        required
                        disabled={inviting}
                      />
                    </div>
                    <Button type="submit" disabled={inviting || !currentAccount?.id}>
                      {inviting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Inviting...
                        </>
                      ) : (
                        <>
                          <Mail className="mr-2 h-4 w-4" /> Invite
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </div>

              {/* Team Members List */}
              <div className="space-y-3">
                <h3 className="font-medium text-slate-800">Current Team Members</h3>
                {teamMembersLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="ml-2 text-sm text-muted-foreground">Loading team members...</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {teamMembers.length > 0 ? (
                      teamMembers.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                              {(member.name ? member.name.charAt(0) : (member.invited_email || member.email)?.charAt(0) || '?').toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-slate-800">
                                {member.name || member.invited_email || member.email}
                                {member.is_owner && (
                                  <span className="ml-2 px-2 py-0.5 text-xs rounded bg-orange-100 text-orange-700 border border-orange-200">Owner</span>
                                )}
                              </p>
                              {member.name && <p className="text-sm text-slate-600">{member.invited_email || member.email}</p>}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge className={`${getStatusColor(member.status)} text-xs`}>
                              <div className="flex items-center gap-1">
                                {getStatusIcon(member.status)}
                                {member.status}
                              </div>
                            </Badge>
                            <span className="text-sm text-slate-600">{member.is_owner ? 'Owner' : member.role}</span>
                            {!member.is_owner && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => confirmDeleteMember(member)}
                                disabled={deletingMember === member.id}
                                className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                              >
                                {deletingMember === member.id ? (
                                  <>
                                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                    Removing...
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="mr-1 h-3 w-3" />
                                    Remove
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-slate-500">
                        <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                        <p className="text-sm">No team members yet</p>
                        <p className="text-xs text-slate-400">Invite someone to get started</p>
                      </div>
                    )}
                  </div>
                )}
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
              <div className="grid gap-6 md:grid-cols-2">
                {/* Currency Selection */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">Currency</Label>
                  <Select
                    value={currency}
                    onValueChange={handleCurrencyChange}
                    disabled={saving || loading || !currentAccount}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {AVAILABLE_CURRENCIES.map((currency) => (
                        <SelectItem key={currency.value} value={currency.value}>
                          {currency.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {saving && <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground"><Loader2 className="animate-spin h-4 w-4" /> Saving...</div>}
                </div>

                {/* Feature Toggles */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Label className="text-base font-medium">Feature Settings</Label>
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
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <div>
                        <p className="font-medium text-slate-800">Trip Plan Page</p>
                        <p className="text-sm text-slate-600">Enable trip and itinerary planning tools</p>
                      </div>
                      <Switch
                        checked={configuration.trip_plan_enabled}
                        onCheckedChange={(checked) => setConfiguration((prev) => ({ ...prev, trip_plan_enabled: checked }))}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex justify-end">
                <Button onClick={handleConfigurationSave} disabled={saving}>
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
      )}
      {activeTab === "subscription" && (
        <div className="space-y-8">
          {/* Subscription Card (always render) */}
          <Card className="border-slate-200/50 shadow-lg bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Subscription Plan</CardTitle>
            </CardHeader>
            <CardContent>
              {subLoading ? (
                <div className="flex items-center gap-2 py-8"><Loader2 className="animate-spin h-6 w-6 text-primary" /> Loading subscription...</div>
              ) : subscriptionError ? (
                <div className="text-red-600 py-8">{subscriptionError}</div>
              ) : subscription && subscription.plan ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-lg">{subscription.plan.name}</span>
                    <Badge className="ml-2 capitalize">{subscription.subscription.status}</Badge>
                  </div>
                  <div className="text-slate-700">{subscription.plan.description}</div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <span className="font-medium">Period:</span><br />
                      {subscription.subscription.current_period_start ? new Date(subscription.subscription.current_period_start).toLocaleDateString() : "-"} - {subscription.subscription.current_period_end ? new Date(subscription.subscription.current_period_end).toLocaleDateString() : "-"}
                    </div>
                    <div>
                      <span className="font-medium">Trial Ends:</span><br />
                      {subscription.subscription.trial_end ? new Date(subscription.subscription.trial_end).toLocaleDateString() : "-"}
                    </div>
                    <div>
                      <span className="font-medium">Max Events:</span><br />
                      {subscription.plan.max_events}
                    </div>
                    <div>
                      <span className="font-medium">Max Participants:</span><br />
                      {subscription.plan.max_participants}
                    </div>
                    <div>
                      <span className="font-medium">Max Professional Accounts:</span><br />
                      {subscription.plan.max_professional_accounts}
                    </div>
                  </div>
                  {subscription.plan.features && (
                    <div className="mt-4">
                      <span className="font-medium">Features:</span>
                      <ul className="list-disc ml-6 text-slate-700">
                        {Object.entries(subscription.plan.features).map(([key, value]) => (
                          <li key={key}><span className="font-semibold">{key}:</span> {String(value)}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-slate-600 py-8">No active subscription found.</div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
