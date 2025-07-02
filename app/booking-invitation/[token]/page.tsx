"use client"

// NOTE: This page is intentionally isolated from the app shell. It does NOT depend on account instance.
// It supports showing other vendors' bookings and/or scheduled events if enabled by the booking link settings.

import { useState, useEffect } from "react"
import { createClientSupabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle,
  XCircle,
  Loader2,
  ArrowLeft,
  Mail,
  Phone,
  Building,
} from "lucide-react"
import { useRouter } from "next/navigation"

interface BookingLink {
  id: string
  title: string
  description: string
  link_token?: string
  event_id?: string
  is_active: boolean
  expires_at?: string
  show_events?: boolean
  show_other_bookings?: boolean
  anonymous_events?: boolean
  anonymous_vendors?: boolean
  event?: {
    id: string
    name: string
    date: string
    location: string
    description: string
  }
}

interface VendorBooking {
  id: string
  vendor_name: string
  vendor_email: string
  vendor_phone: string
  service_type: string
  service_description: string
  proposed_date: string
  proposed_time: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

export default function BookingInvitationPage({ params }: { params: { token: string } }) {
  const [loading, setLoading] = useState(true)
  const [bookingLink, setBookingLink] = useState<BookingLink | null>(null)
  const [existingBookings, setExistingBookings] = useState<VendorBooking[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [showBookingForm, setShowBookingForm] = useState(false)
  const [scheduledEvents, setScheduledEvents] = useState<any[]>([])
  
  const router = useRouter()
  const supabase = createClientSupabase()

  const [newBooking, setNewBooking] = useState({
    vendor_name: "",
    vendor_email: "",
    vendor_phone: "",
    service_type: "",
    service_description: "",
    proposed_date: "",
    proposed_time: "",
  })

  useEffect(() => {
    fetchBookingLink()
  }, [params.token])

  const fetchBookingLink = async () => {
    try {
      setLoading(true)

      // Fetch the booking link with event details and options
      const { data: linkData, error: linkError } = await supabase
        .from("vendor_booking_links")
        .select(`
          *,
          event:events (
            id,
            name,
            date,
            location,
            description
          )
        `)
        .eq("link_token", params.token)
        .single()

      if (linkError || !linkData) {
        toast.error("Invalid or expired booking link")
        return
      }

      // Check if link is expired
      if (linkData.expires_at && new Date(linkData.expires_at) < new Date()) {
        toast.error("This booking link has expired")
        return
      }

      // Check if link is active
      if (!linkData.is_active) {
        toast.error("This booking link is no longer active")
        return
      }

      setBookingLink(linkData)

      // Fetch events/sub-events if enabled
      if (linkData.show_events) {
        // Fetch all events and sub-events for the same account instance as the booking link's event
        let eventFilter = linkData.event_id ? { id: linkData.event_id } : {}
        const { data: eventsData, error: eventsError } = await supabase
          .from("events")
          .select("id, name, date, location, description, parent_event_id")
          .match(eventFilter)
        if (!eventsError) {
          setScheduledEvents(eventsData || [])
        }
      } else {
        setScheduledEvents([])
      }

      // Fetch existing bookings if allowed
      if (linkData.show_other_bookings) {
        const { data: bookingsData, error: bookingsError } = await supabase
          .from("vendor_bookings")
          .select("*")
          .eq("booking_link_id", linkData.id)
          .order("created_at", { ascending: false })

        if (!bookingsError) {
          setExistingBookings(bookingsData || [])
        }
      }

    } catch (error) {
      console.error("Error fetching booking link:", error)
      toast.error("Failed to load booking information")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitBooking = async () => {
    try {
      setSubmitting(true)

      if (!bookingLink) return

      // Validate required fields
      if (!newBooking.vendor_name || !newBooking.vendor_email || !newBooking.service_type) {
        toast.error("Please fill in all required fields")
        return
      }

      const { data, error } = await supabase
        .from("vendor_bookings")
        .insert({
          booking_link_id: bookingLink.id,
          event_id: bookingLink.event_id,
          vendor_name: newBooking.vendor_name,
          vendor_email: newBooking.vendor_email,
          vendor_phone: newBooking.vendor_phone,
          service_type: newBooking.service_type,
          service_description: newBooking.service_description,
          proposed_date: newBooking.proposed_date,
          proposed_time: newBooking.proposed_time,
          status: 'pending',
        })
        .select()
        .single()

      if (error) {
        console.error("Error submitting booking:", error)
        toast.error("Failed to submit booking")
        return
      }

      toast.success("Booking submitted successfully! We'll be in touch soon.")
      setShowBookingForm(false)
      setNewBooking({
        vendor_name: "",
        vendor_email: "",
        vendor_phone: "",
        service_type: "",
        service_description: "",
        proposed_date: "",
        proposed_time: "",
      })

      // Refresh existing bookings
      fetchBookingLink()

    } catch (error) {
      console.error("Error submitting booking:", error)
      toast.error("Failed to submit booking")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-8 w-8 text-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading booking invitation...</p>
        </div>
      </div>
    )
  }

  if (!bookingLink) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Invalid Booking Link</h1>
          <p className="text-muted-foreground mb-4">This booking link is invalid or has expired.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Vendor Booking</h1>
                <p className="text-sm text-gray-600">Submit your booking request</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Event Details */}
        <Card className="border-slate-200/50 shadow-lg bg-white/90 backdrop-blur-sm mb-8">
          <CardContent className="p-6">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold mb-2">{bookingLink.title}</h1>
              <p className="text-muted-foreground text-lg">{bookingLink.description}</p>
            </div>

            {bookingLink.event && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Event Details
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium text-lg">{bookingLink.event.name}</h3>
                    <p className="text-muted-foreground">{bookingLink.event.description}</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>{new Date(bookingLink.event.date).toLocaleDateString()}</span>
                    </div>
                    {bookingLink.event.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span>{bookingLink.event.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Scheduled Events */}
        {bookingLink.show_events && scheduledEvents.length > 0 && (
          <Card className="border-slate-200/50 shadow-lg bg-white/90 backdrop-blur-sm mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Scheduled Events
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {bookingLink.anonymous_events
                  ? "Some events are already scheduled. Details are hidden for privacy."
                  : "The following events/sub-events are already scheduled."}
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {scheduledEvents.map(ev => (
                  <div key={ev.id} className="flex items-center gap-4 border-b py-2">
                    <div className="flex-1">
                      <div className="font-medium">
                        {bookingLink.anonymous_events ? "Event Reserved" : ev.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {bookingLink.anonymous_events ? null : ev.description}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {ev.date ? new Date(ev.date).toLocaleDateString() : ""}
                      {ev.location && !bookingLink.anonymous_events && (
                        <>
                          <MapPin className="w-3 h-3 ml-2" />
                          {ev.location}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Booking Form */}
        <Card className="border-slate-200/50 shadow-lg bg-white/90 backdrop-blur-sm mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="w-5 h-5" />
              Vendor Booking Form
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Submit your booking request for this event
            </p>
          </CardHeader>
          <CardContent>
            {!showBookingForm ? (
              <div className="text-center py-8">
                <Button 
                  onClick={() => setShowBookingForm(true)}
                  className="bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white"
                >
                  Submit Booking Request
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="vendor-name">Business/Vendor Name *</Label>
                    <Input
                      id="vendor-name"
                      value={newBooking.vendor_name}
                      onChange={(e) => setNewBooking({ ...newBooking, vendor_name: e.target.value })}
                      placeholder="Enter your business name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="vendor-email">Email Address *</Label>
                    <Input
                      id="vendor-email"
                      type="email"
                      value={newBooking.vendor_email}
                      onChange={(e) => setNewBooking({ ...newBooking, vendor_email: e.target.value })}
                      placeholder="Enter your email"
                    />
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="vendor-phone">Phone Number</Label>
                    <Input
                      id="vendor-phone"
                      value={newBooking.vendor_phone}
                      onChange={(e) => setNewBooking({ ...newBooking, vendor_phone: e.target.value })}
                      placeholder="Enter your phone number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="service-type">Service Type *</Label>
                    <Select 
                      value={newBooking.service_type} 
                      onValueChange={(value) => setNewBooking({ ...newBooking, service_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select service type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="catering">Catering</SelectItem>
                        <SelectItem value="photography">Photography</SelectItem>
                        <SelectItem value="music">Music/Entertainment</SelectItem>
                        <SelectItem value="decor">Decor & Flowers</SelectItem>
                        <SelectItem value="transportation">Transportation</SelectItem>
                        <SelectItem value="venue">Venue</SelectItem>
                        <SelectItem value="planning">Event Planning</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="service-description">Service Description</Label>
                  <Textarea
                    id="service-description"
                    value={newBooking.service_description}
                    onChange={(e) => setNewBooking({ ...newBooking, service_description: e.target.value })}
                    placeholder="Describe your services, packages, or what you can offer for this event"
                    rows={4}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="proposed-date">Preferred Date</Label>
                    <Input
                      id="proposed-date"
                      type="date"
                      value={newBooking.proposed_date}
                      onChange={(e) => setNewBooking({ ...newBooking, proposed_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="proposed-time">Preferred Time</Label>
                    <Input
                      id="proposed-time"
                      type="time"
                      value={newBooking.proposed_time}
                      onChange={(e) => setNewBooking({ ...newBooking, proposed_time: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowBookingForm(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSubmitBooking}
                    disabled={submitting}
                    className="bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Booking"
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Existing Bookings */}
        {bookingLink.show_other_bookings && existingBookings.length > 0 && (
          <Card className="border-slate-200/50 shadow-lg bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Other Vendor Bookings
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {bookingLink.anonymous_vendors ? "Anonymous bookings" : "Showing vendor names"}
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {existingBookings.map((booking) => (
                  <Card key={booking.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">
                              {bookingLink.anonymous_vendors ? "Vendor" : booking.vendor_name}
                            </h3>
                            <Badge 
                              variant={
                                booking.status === 'approved' ? 'default' : 
                                booking.status === 'rejected' ? 'destructive' : 'secondary'
                              }
                            >
                              {booking.status === 'approved' && <CheckCircle className="w-3 h-3 mr-1" />}
                              {booking.status === 'rejected' && <XCircle className="w-3 h-3 mr-1" />}
                              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {booking.service_type.charAt(0).toUpperCase() + booking.service_type.slice(1)}
                          </p>
                          {booking.service_description && (
                            <p className="text-sm">{booking.service_description}</p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            {booking.proposed_date && (
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(booking.proposed_date).toLocaleDateString()}
                              </div>
                            )}
                            {booking.proposed_time && (
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {booking.proposed_time}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
} 