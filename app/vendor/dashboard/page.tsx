"use client"

import { useEffect, useState } from "react"
import { createClientSupabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Store, MessageCircle, Calendar, Settings, DollarSign } from "lucide-react"
import { toast } from "sonner"

interface VendorProfile {
  id: string
  business_name: string
  service_category: string
  description: string
  contact_info: any
  availability: any
}

interface ChatMessage {
  id: string
  client_name: string
  last_message: string
  timestamp: string
  unread: boolean
  event_name: string
}

interface Booking {
  id: string
  event_name: string
  client_name: string
  date: string
  status: "pending" | "confirmed" | "completed"
  amount: number
}

export default function VendorDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [vendorProfile, setVendorProfile] = useState<VendorProfile | null>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const supabase = createClientSupabase()

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) return

        setUser(user)

        // For now, we'll use mock data since the tables might not exist yet
        const mockProfile: VendorProfile = {
          id: "1",
          business_name: "Elite Catering Services",
          service_category: "Catering",
          description: "Premium catering services for weddings and corporate events",
          contact_info: {
            phone: "+1 (555) 123-4567",
            email: "contact@elitecatering.com",
            website: "www.elitecatering.com",
          },
          availability: {
            weekdays: true,
            weekends: true,
            holidays: false,
          },
        }

        const mockChats: ChatMessage[] = [
          {
            id: "1",
            client_name: "Sarah Johnson",
            last_message: "Can we discuss the menu options for the wedding?",
            timestamp: "2024-01-15T10:30:00Z",
            unread: true,
            event_name: "Johnson Wedding",
          },
          {
            id: "2",
            client_name: "Mike Chen",
            last_message: "Thank you for the quote, looks perfect!",
            timestamp: "2024-01-14T15:45:00Z",
            unread: false,
            event_name: "Corporate Gala",
          },
          {
            id: "3",
            client_name: "Emily Davis",
            last_message: "What time should we schedule the tasting?",
            timestamp: "2024-01-14T09:20:00Z",
            unread: true,
            event_name: "Anniversary Party",
          },
        ]

        const mockBookings: Booking[] = [
          {
            id: "1",
            event_name: "Johnson Wedding",
            client_name: "Sarah Johnson",
            date: "2024-02-14",
            status: "confirmed",
            amount: 2500,
          },
          {
            id: "2",
            event_name: "Corporate Gala",
            client_name: "Mike Chen",
            date: "2024-02-20",
            status: "pending",
            amount: 4200,
          },
          {
            id: "3",
            event_name: "Anniversary Party",
            client_name: "Emily Davis",
            date: "2024-03-05",
            status: "confirmed",
            amount: 1800,
          },
        ]

        setVendorProfile(mockProfile)
        setChatMessages(mockChats)
        setBookings(mockBookings)
      } catch (error) {
        console.error("Error fetching data:", error)
        toast.error("Failed to load dashboard data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-700 border-green-200"
      case "pending":
        return "bg-yellow-100 text-yellow-700 border-yellow-200"
      case "completed":
        return "bg-blue-100 text-blue-700 border-blue-200"
      default:
        return "bg-gray-100 text-gray-700 border-gray-200"
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="text-center">
            <Loader2 className="animate-spin h-8 w-8 text-primary mx-auto" />
            <p className="mt-4 text-muted-foreground">Loading your vendor dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  const businessName = vendorProfile?.business_name || "Your Business"
  const unreadCount = chatMessages.filter((chat) => chat.unread).length

  return (
    <div className="space-y-6 max-w-full">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-teal-500 text-white shadow-sm">
            <Store className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">Vendor Dashboard</h1>
            <p className="text-gray-600">Welcome back, {businessName}!</p>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="border-green-200/50 shadow-sm bg-white/90 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Active Bookings</p>
                <p className="text-2xl font-bold text-gray-900">{bookings.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200/50 shadow-sm bg-white/90 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <MessageCircle className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Unread Messages</p>
                <p className="text-2xl font-bold text-gray-900">{unreadCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200/50 shadow-sm bg-white/90 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  $
                  {bookings
                    .filter((b) => b.status === "pending")
                    .reduce((sum, b) => sum + b.amount, 0)
                    .toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-teal-200/50 shadow-sm bg-white/90 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-teal-100 rounded-lg">
                <Store className="h-6 w-6 text-teal-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Service Category</p>
                <p className="text-lg font-bold text-gray-900">{vendorProfile?.service_category}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Messages */}
        <Card className="border-slate-200/50 shadow-lg bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Recent Messages
                {unreadCount > 0 && <Badge className="bg-red-500 text-white text-xs">{unreadCount}</Badge>}
              </CardTitle>
              <Button variant="outline" size="sm">
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {chatMessages.map((chat) => (
                <div
                  key={chat.id}
                  className={`p-3 rounded-lg border ${chat.unread ? "bg-blue-50 border-blue-200" : "bg-slate-50 border-slate-200"}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-slate-800">{chat.client_name}</h4>
                      <p className="text-sm text-slate-600">{chat.event_name}</p>
                    </div>
                    <div className="text-xs text-slate-500">{new Date(chat.timestamp).toLocaleDateString()}</div>
                  </div>
                  <p className="text-sm text-slate-700">{chat.last_message}</p>
                  {chat.unread && (
                    <div className="mt-2">
                      <Badge className="bg-blue-500 text-white text-xs">New</Badge>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Bookings */}
        <Card className="border-slate-200/50 shadow-lg bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Upcoming Bookings
              </CardTitle>
              <Button variant="outline" size="sm">
                View Calendar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div key={booking.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-slate-800">{booking.event_name}</h4>
                      <p className="text-sm text-slate-600">{booking.client_name}</p>
                    </div>
                    <Badge className={`${getStatusColor(booking.status)} text-xs`}>{booking.status}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-600">{new Date(booking.date).toLocaleDateString()}</p>
                    <p className="font-medium text-slate-800">${booking.amount.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-slate-200/50 shadow-lg bg-white/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-slate-800">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white h-16">
              <MessageCircle className="w-5 h-5 mr-2" />
              Open Chat
            </Button>
            <Button className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white h-16">
              <Calendar className="w-5 h-5 mr-2" />
              Manage Schedule
            </Button>
            <Button className="bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 text-white h-16">
              <Settings className="w-5 h-5 mr-2" />
              Profile Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
