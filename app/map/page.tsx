"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MapPin, Calendar, Clock, Users, Target, Ruler, Navigation, Truck, Users2, Loader2, Plus } from "lucide-react"
import BlueprintTab from "./components/BlueprintTab"
import DestinationTab from "./components/DestinationTab"
import TransportationTab from "./components/TransportationTab"
import SeatArrangementTab from "./components/SeatArrangementTab"
import { LocalModeIndicator } from "./components/LocalModeIndicator"
import { supabase } from "@/lib/supabase"
import { useAccount } from "@/lib/account-context"
import { getOrCreateAccountInstanceId } from "@/lib/account-utils"
import { toast } from "sonner"

// Event and Vendor Types
interface EventData {
  id: string
  name: string
  date: string
  start_time: string
  end_time: string
  location: string
  type: string
  category: string
  participant_limit: number
  tags: string | null
  account_instance_id: string
}

interface VendorData {
  id: string
  name: string
  business_name: string | null
  date: string
  start_time: string
  end_time: string | null
  location: string | null
  type: string | null
  category: string | null
  event: string | null
  description: string | null
  service_category: string | null
  contact_info: any
  account_instance_id: string
}

interface VendorBooking {
  id: string
  booking_link_id: string
  event_id: string
  vendor_name: string
  vendor_email: string
  vendor_phone: string | null
  service_type: string
  service_description: string | null
  proposed_date: string | null
  proposed_time: string | null
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  updated_at: string
}

export default function MapPage() {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState("blueprint")
  const [localMode, setLocalMode] = useState(false)
  const tab = searchParams.get("tab") || "blueprint"
  
  // Data state
  const [events, setEvents] = useState<EventData[]>([])
  const [vendors, setVendors] = useState<VendorData[]>([])
  const [vendorBookings, setVendorBookings] = useState<VendorBooking[]>([])
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null)
  const [loading, setLoading] = useState(true)
  const [accountInstanceId, setAccountInstanceId] = useState<string | null>(null)
  
  const { currentAccount } = useAccount()

  useEffect(() => {
    const tab = searchParams.get("tab")
    if (tab && ["blueprint", "destination", "transportation", "seating"].includes(tab)) {
      setActiveTab(tab)
    }
  }, [searchParams])

  // Initialize data
  useEffect(() => {
    initializeData()
  }, [currentAccount])

  const initializeData = async () => {
    try {
      setLoading(true)
      
      // Get account instance ID
      const accountId = await getOrCreateAccountInstanceId()
      if (!accountId) {
        toast.error("Failed to initialize account. Please try again.")
        setLocalMode(true)
        return
      }
      
      setAccountInstanceId(accountId)
      
      // Test if database is available
      const { error } = await supabase
        .from("blueprints")
        .select("id")
        .limit(1)

      if (error) {
        console.log("Database not available - running in local mode")
        setLocalMode(true)
        return
      }

      setLocalMode(false)
      
      // Fetch events
      const { data: eventsData, error: eventsError } = await supabase
        .from("events")
        .select("*")
        .eq("account_instance_id", accountId)
        .order("date", { ascending: true })

      if (eventsError) {
        console.error("Error fetching events:", eventsError)
        toast.error("Failed to load events")
      } else {
        setEvents(eventsData || [])
        // Set first event as selected if available
        if (eventsData && eventsData.length > 0) {
          setSelectedEventId(eventsData[0].id)
          setSelectedEvent(eventsData[0])
        }
      }

      // Fetch vendors
      const { data: vendorsData, error: vendorsError } = await supabase
        .from("vendors")
        .select("*")
        .eq("account_instance_id", accountId)
        .order("date", { ascending: true })

      if (vendorsError) {
        console.error("Error fetching vendors:", vendorsError)
        toast.error("Failed to load vendors")
      } else {
        setVendors(vendorsData || [])
      }

      // Fetch vendor bookings for better event-vendor connections
      const { data: bookingsData, error: bookingsError } = await supabase
        .from("vendor_bookings")
        .select("*")
        .eq("account_instance_id", accountId)

      if (bookingsError) {
        console.error("Error fetching vendor bookings:", bookingsError)
        // Don't show error toast for this as it's optional
      } else {
        setVendorBookings(bookingsData || [])
      }

    } catch (error) {
      console.error("Error initializing data:", error)
      toast.error("Failed to initialize data")
      setLocalMode(true)
    } finally {
      setLoading(false)
    }
  }

  // Handle event selection
  const handleEventSelect = (eventId: string) => {
    setSelectedEventId(eventId)
    const event = events.find(e => e.id === eventId)
    setSelectedEvent(event || null)
  }

  // Get vendors for selected event
  const getEventVendors = () => {
    if (!selectedEvent) return []
    
    const connectedVendors: Array<{ id: string; name: string; type: string; source: string }> = []
    
    // Get vendors from vendor_bookings table (proper foreign key relationship)
    const bookingVendors = vendorBookings
      .filter(booking => booking.event_id === selectedEvent.id)
      .map(booking => ({
        id: booking.id,
        name: booking.vendor_name,
        type: booking.service_type,
        source: 'booking'
      }))
    
    connectedVendors.push(...bookingVendors)
    
    // Get vendors from vendors table that might be linked by name or event field
    const linkedVendors = vendors
      .filter(vendor => {
        return vendor.event === selectedEvent.name || 
               vendor.event === selectedEvent.id ||
               vendor.description?.includes(selectedEvent.name) ||
               vendor.description?.includes(selectedEvent.id)
      })
      .map(vendor => ({
        id: vendor.id,
        name: vendor.business_name || vendor.name,
        type: vendor.type || vendor.category || 'Vendor',
        source: 'vendor'
      }))
    
    connectedVendors.push(...linkedVendors)
    
    // Remove duplicates based on name
    const uniqueVendors = connectedVendors.filter((vendor, index, self) => 
      index === self.findIndex(v => v.name === vendor.name)
    )
    
    return uniqueVendors
  }

  // Banner content based on tab
  let bannerIcon, bannerTitle, bannerSubtitle;
  switch (tab) {
    case "destination":
      bannerIcon = <Navigation className="w-6 h-6 text-white" />;
      bannerTitle = "Destination Planner";
      bannerSubtitle = "Plan and manage event destinations, logistics, and site details.";
      break;
    case "transportation":
      bannerIcon = <Truck className="w-6 h-6 text-white" />;
      bannerTitle = "Transportation Organizer";
      bannerSubtitle = "Coordinate shuttles, parking, and guest transportation.";
      break;
    case "seating":
      bannerIcon = <Users2 className="w-6 h-6 text-white" />;
      bannerTitle = "Seating Arranger";
      bannerSubtitle = "Arrange seating, assign guests, and manage table layouts.";
      break;
    default:
      bannerIcon = <Ruler className="w-6 h-6 text-white" />;
      bannerTitle = "Blueprint Designer";
      bannerSubtitle = "Create and edit blueprints for your event spaces. Draw layouts, add measurements, and save up to 10 blueprints.";
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading map data...</span>
        </div>
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="space-y-6">
        {/* Dynamic Banner/Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 text-white shadow-2xl mb-0">
          <div className="absolute inset-0 bg-gradient-to-br from-rose-500/20 via-transparent to-amber-500/20"></div>
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-rose-500 rounded-xl flex items-center justify-center shadow-lg">
                {bannerIcon}
              </div>
              <div>
                <h1 className="text-3xl font-light">{bannerTitle}</h1>
                <p className="text-slate-200 font-light">{bannerSubtitle}</p>
              </div>
            </div>
          </div>
        </div>

        {/* No Events Message */}
        <Card className="border-orange-200/50 shadow-sm bg-white/90 backdrop-blur-sm">
          <CardContent className="p-8 text-center">
            <div className="space-y-4">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                <Calendar className="w-8 h-8 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Events Found</h3>
                <p className="text-gray-600 mb-4">
                  You need to create events first before you can use the map features.
                </p>
                <a 
                  href="/events" 
                  className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Create Your First Event
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Dynamic Banner/Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 text-white shadow-2xl mb-0">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-500/20 via-transparent to-amber-500/20"></div>
        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-rose-500 rounded-xl flex items-center justify-center shadow-lg">
              {bannerIcon}
            </div>
            <div>
              <h1 className="text-3xl font-light">{bannerTitle}</h1>
              <p className="text-slate-200 font-light">{bannerSubtitle}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Event Selector */}
      <div className="flex items-center justify-end">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Target className="w-4 h-4" />
            <span className="font-medium">Active Event</span>
          </div>
          <Select value={selectedEventId || ""} onValueChange={handleEventSelect}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select an event" />
            </SelectTrigger>
            <SelectContent>
              {events.map((event) => (
                <SelectItem key={event.id} value={event.id}>
                  {event.name} - {new Date(event.date).toLocaleDateString('en-US', { 
                    weekday: 'short', 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Event Details Card */}
      {selectedEvent && (
        <Card className="border-orange-200/50 shadow-sm bg-white/90 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-gray-900">{selectedEvent.name}</h2>
                <div className="flex items-center gap-6 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(selectedEvent.date).toLocaleDateString('en-US', { 
                      weekday: 'short', 
                      month: 'short', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{selectedEvent.start_time} - {selectedEvent.end_time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{selectedEvent.location}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  {selectedEvent.type}
                </Badge>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  {selectedEvent.category}
                </Badge>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>{selectedEvent.participant_limit} Attendees</span>
                </div>
              </div>
            </div>
            
            {/* Vendor Connections */}
            {getEventVendors().length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-700">Connected Vendors</h3>
                  <span className="text-xs text-gray-500">
                    {getEventVendors().length} vendor{getEventVendors().length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {getEventVendors().map((vendor) => (
                    <Badge 
                      key={vendor.id} 
                      variant="secondary" 
                      className={
                        vendor.source === 'booking' 
                          ? "bg-green-50 text-green-700 border-green-200" 
                          : "bg-purple-50 text-purple-700 border-purple-200"
                      }
                      title={`Connected via ${vendor.source === 'booking' ? 'booking system' : 'vendor table'}`}
                    >
                      {vendor.name} - {vendor.type}
                      {vendor.source === 'booking' && (
                        <span className="ml-1 text-xs">📅</span>
                      )}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Local Mode Indicator */}
      <LocalModeIndicator isLocalMode={localMode} />

      {/* Render tab content based on ?tab=... */}
      {tab === "blueprint" && selectedEvent && (
        <BlueprintTab 
          userId={currentAccount?.owner_user_id || "user-1"} 
          eventId={selectedEvent.id} 
          eventName={selectedEvent.name} 
        />
      )}
      {tab === "destination" && selectedEvent && (
        <DestinationTab 
          userId={currentAccount?.owner_user_id || "user-1"} 
          eventId={selectedEvent.id} 
          eventName={selectedEvent.name} 
        />
      )}
      {tab === "transportation" && selectedEvent && (
        <TransportationTab 
          userId={currentAccount?.owner_user_id || "user-1"} 
          eventId={selectedEvent.id} 
          eventName={selectedEvent.name} 
        />
      )}
      {tab === "seating" && selectedEvent && (
        <SeatArrangementTab 
          userId={currentAccount?.owner_user_id || "user-1"} 
          eventId={selectedEvent.id} 
          eventName={selectedEvent.name} 
        />
      )}
    </div>
  )
}
