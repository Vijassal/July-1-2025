"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import {
  Users,
  Clock,
  UserPlus,
  Mail,
  Building2,
  ArrowRight,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
} from "lucide-react"

interface AccountRequest {
  id: string
  client_name: string
  client_email: string
  message?: string
  status: "pending" | "accepted" | "declined"
  created_at: string
}

interface ClientAccount {
  id: string
  name: string
  email: string
  status: "active" | "inactive"
  last_activity: string
}

export default function ProfessionalDashboard() {
  const [loading, setLoading] = useState(false)
  const [accountRequests, setAccountRequests] = useState<AccountRequest[]>([])
  const [clientAccounts, setClientAccounts] = useState<ClientAccount[]>([])

  // Fetch real data on component mount
  useEffect(() => {
    fetchProfessionalData()
  }, [])

  const fetchProfessionalData = async () => {
    try {
      setLoading(true)
      
      const {
        data: { user },
      } = await supabase.auth.getUser()
      
      if (!user?.id) {
        console.error("No authenticated user found")
        return
      }

      // Fetch account creation requests
      const { data: requests, error: requestsError } = await supabase
        .from("account_creation_requests")
        .select("*")
        .eq("professional_id", user.id)
        .order("created_at", { ascending: false })

      if (requestsError) {
        console.error("Error fetching account requests:", requestsError)
      } else {
        setAccountRequests(requests || [])
      }

      // Fetch professional access to client accounts
      const { data: access, error: accessError } = await supabase
        .from("professional_account_access")
        .select(`
          *,
          account_instances (
            id,
            name,
            owner_user_id
          )
        `)
        .eq("professional_id", user.id)
        .eq("is_active", true)

      if (accessError) {
        console.error("Error fetching professional access:", accessError)
      } else {
        // Transform the data to match ClientAccount interface
        const accounts = (access || []).map(acc => ({
          id: acc.account_instance_id,
          name: acc.account_instances?.name || "Unknown Account",
          email: acc.account_instances?.name || "Unknown Email", // Using name as email for now
          status: "active" as const,
          last_activity: acc.granted_at
        }))
        setClientAccounts(accounts)
      }
    } catch (error) {
      console.error("Error fetching professional data:", error)
      toast.error("Failed to load professional data")
    } finally {
      setLoading(false)
    }
  }

  // Form state for creating account requests
  const [newRequest, setNewRequest] = useState({
    client_name: "",
    client_email: "",
    message: "",
  })

  const handleCreateAccountRequest = async () => {
    if (!newRequest.client_name || !newRequest.client_email) {
      toast.error("Please fill in required fields")
      return
    }

    try {
      setLoading(true)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user?.id) {
        toast.error("Authentication required")
        return
      }

      // Create account creation request in database
      const { data: request, error } = await supabase
        .from("account_creation_requests")
        .insert({
          professional_id: user.id,
          client_email: newRequest.client_email,
          client_name: newRequest.client_name,
          account_name: `${newRequest.client_name}'s Event`,
          message: newRequest.message,
          status: "pending"
        })
        .select()
        .single()

      if (error) {
        console.error("Error creating account request:", error)
        toast.error("Failed to send account request")
        return
      }

      setAccountRequests([request, ...accountRequests])
      setNewRequest({ client_name: "", client_email: "", message: "" })
      toast.success("Account request sent successfully!")
    } catch (error) {
      console.error("Error creating account request:", error)
      toast.error("Failed to send account request")
    } finally {
      setLoading(false)
    }
  }

  const handleAccessAccount = (account: ClientAccount) => {
    // In a real app, this would switch context to the client's account
    toast.success(`Accessing ${account.name}'s account...`)
    // Redirect to the client's dashboard with professional context
    // For now, we'll redirect to the main dashboard with account context
    window.location.href = `/dashboard?account_id=${account.id}&professional_access=true`
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <AlertCircle className="w-4 h-4 text-amber-500" />
      case "accepted":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "declined":
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-amber-100 text-amber-800 border-amber-200"
      case "accepted":
        return "bg-green-100 text-green-800 border-green-200"
      case "declined":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-light text-gray-900 mb-2">Professional Dashboard</h1>
        <p className="text-gray-600">Manage your client accounts and event planning services</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-gray-200 shadow-sm">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-2xl font-semibold text-gray-900 mb-1">
              {clientAccounts.filter((account) => account.status === "active").length}
            </div>
            <div className="text-sm text-gray-600">Active Clients</div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 shadow-sm">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <div className="text-2xl font-semibold text-gray-900 mb-1">
              {accountRequests.filter((req) => req.status === "pending").length}
            </div>
            <div className="text-sm text-gray-600">Pending Requests</div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 shadow-sm">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <UserPlus className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-2xl font-semibold text-gray-900 mb-1">{clientAccounts.length}</div>
            <div className="text-sm text-gray-600">Total Clients</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Create Client Account Request */}
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg font-medium text-gray-900">
              <Plus className="w-5 h-5 text-blue-600" />
              Create Client Account Request
            </CardTitle>
            <p className="text-sm text-gray-600">Send a request to a potential client to create an account for them</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="client_name" className="text-sm font-medium text-gray-700">
                Client Name
              </Label>
              <Input
                id="client_name"
                value={newRequest.client_name}
                onChange={(e) => setNewRequest({ ...newRequest, client_name: e.target.value })}
                placeholder="Enter client's full name"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="client_email" className="text-sm font-medium text-gray-700">
                Client Email
              </Label>
              <Input
                id="client_email"
                type="email"
                value={newRequest.client_email}
                onChange={(e) => setNewRequest({ ...newRequest, client_email: e.target.value })}
                placeholder="Enter client's email address"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="message" className="text-sm font-medium text-gray-700">
                Message (Optional)
              </Label>
              <Textarea
                id="message"
                value={newRequest.message}
                onChange={(e) => setNewRequest({ ...newRequest, message: e.target.value })}
                placeholder="Add a personal message"
                className="mt-1"
                rows={3}
              />
            </div>
            <Button
              onClick={handleCreateAccountRequest}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? "Sending..." : "Send Account Request"}
            </Button>
          </CardContent>
        </Card>

        {/* Recent Account Requests */}
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg font-medium text-gray-900">
              <Mail className="w-5 h-5 text-amber-600" />
              Recent Account Requests
            </CardTitle>
            <p className="text-sm text-gray-600">Track the status of your sent account requests</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {accountRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-gray-100 text-gray-600 text-xs">
                        {request.client_name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-gray-900 text-sm">{request.client_name}</div>
                      <div className="text-xs text-gray-500">{request.client_email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(request.status)}
                    <Badge className={`text-xs font-medium ${getStatusColor(request.status)}`}>{request.status}</Badge>
                  </div>
                </div>
              ))}
              {accountRequests.length === 0 && (
                <div className="text-center py-6 text-gray-500">
                  <Mail className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">No account requests sent yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Client Accounts */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg font-medium text-gray-900">
            <Building2 className="w-5 h-5 text-green-600" />
            Client Accounts
          </CardTitle>
          <p className="text-sm text-gray-600">Access and manage your client accounts</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clientAccounts.map((account) => (
              <div key={account.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-blue-100 text-blue-600">
                      {account.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 text-sm">{account.name}</div>
                    <div className="text-xs text-gray-500">{account.email}</div>
                  </div>
                  <Badge
                    className={`text-xs ${
                      account.status === "active"
                        ? "bg-green-100 text-green-800 border-green-200"
                        : "bg-gray-100 text-gray-800 border-gray-200"
                    }`}
                  >
                    {account.status}
                  </Badge>
                </div>
                <div className="text-xs text-gray-500 mb-3">
                  Last activity: {new Date(account.last_activity).toLocaleDateString()}
                </div>
                <Button
                  onClick={() => handleAccessAccount(account)}
                  variant="outline"
                  size="sm"
                  className="w-full text-blue-600 border-blue-200 hover:bg-blue-50"
                >
                  Access Account
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            ))}
            {clientAccounts.length === 0 && (
              <div className="col-span-full text-center py-8 text-gray-500">
                <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="text-sm">No client accounts yet</p>
                <p className="text-xs text-gray-400">Client accounts will appear here once created</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
