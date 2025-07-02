"use client"

import { useState, useEffect } from "react"
import { createClientSupabase } from "@/lib/supabase"
import { AccountService } from "@/lib/account-service"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import {
  Plus,
  Edit,
  Trash2,
  Users,
  Star,
  Calendar,
  Link,
  Copy,
  Eye,
  EyeOff,
  Mail,
  Phone,
  MapPin,
  Clock,
  Loader2,
  CheckCircle,
  XCircle,
} from "lucide-react"
import { useSearchParams } from "next/navigation"
import { generateBookingToken } from "@/lib/jwt-utils"

interface Vendor {
  id: string
  name: string
  date: string
  start_time: string
  end_time: string
  location: string
  type: string
  category: string
  contact_info: VendorContact[]
  vendor_contacts?: VendorContact[]
  account_instance_id?: string
  event_id?: string
}

interface VendorContact {
  id?: string
  name: string
  email: string
  phone: string
  role: string
  is_primary: boolean
}

interface SpotlightVendor {
  id: string
  business_name: string
  service_category: string
  description: string
  contact_info: any
  pricing_info: any
  rating: number
  review_count: number
  is_featured: boolean
}

interface BookingLink {
  id: string
  title: string
  description: string
  link_type: 'external' | 'internal'
  external_url?: string
  link_token?: string
  event_id?: string
  is_active: boolean
  expires_at?: string
  event?: {
    id: string
    name: string
    date: string
    location: string
  }
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
  event?: {
    id: string
    name: string
    date: string
    location: string
  }
}

export default function VendorsPage() {
  const [loading, setLoading] = useState(true)
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [spotlightVendors, setSpotlightVendors] = useState<SpotlightVendor[]>([])
  const [bookingLinks, setBookingLinks] = useState<BookingLink[]>([])
  const [vendorBookings, setVendorBookings] = useState<VendorBooking[]>([])
  const [events, setEvents] = useState<{id: string, name: string, date: string}[]>([])
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null)
  const [editingContact, setEditingContact] = useState<VendorContact | null>(null)
  const [showVendorDialog, setShowVendorDialog] = useState(false)
  const [showContactDialog, setShowContactDialog] = useState(false)
  const [showBookingDialog, setShowBookingDialog] = useState(false)
  const [showBookingManagementDialog, setShowBookingManagementDialog] = useState(false)
  const [selectedBookingLink, setSelectedBookingLink] = useState<BookingLink | null>(null)
  const [selectedVendorForContacts, setSelectedVendorForContacts] = useState<string | null>(null)
  const [currentAccountInstance, setCurrentAccountInstance] = useState<any>(null)

  const supabase = createClientSupabase()

  const [newVendor, setNewVendor] = useState({
    name: "",
    date: "",
    start_time: "",
    end_time: "",
    location: "",
    type: "",
    category: "",
    event_id: "",
  })

  const [newContact, setNewContact] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    is_primary: false,
  })

  const [newBookingLink, setNewBookingLink] = useState({
    title: "",
    description: "",
    event_id: "",
    expires_at: "",
    show_events: false,
    show_other_bookings: false,
    anonymous_events: false,
    anonymous_vendors: false,
  })

  const searchParams = useSearchParams()
  const tabParamRaw = searchParams.get("tab")
  const tabParam = tabParamRaw ?? ""
  const activeTab = ["vendors", "spotlight", "booking", "shared"].includes(tabParam) ? tabParam : "vendors"

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Get current user and account instance
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      // Get account context
      const accountContext = await AccountService.getCurrentAccountContext(user.id)
      const accountInstance = accountContext.accountInstance
      setCurrentAccountInstance(accountInstance)

      if (!accountInstance) {
        toast.error("No account instance found")
        return
      }

      // Fetch vendors from database with their contacts
      const { data: vendorsData, error: vendorsError } = await supabase
        .from("vendors")
        .select(`
          *,
          vendor_contacts (
            id,
            name,
            email,
            phone,
            role,
            is_primary
          )
        `)
        .eq("account_instance_id", accountInstance.id)

      if (vendorsError) {
        console.error("Error fetching vendors:", vendorsError)
        toast.error("Failed to load vendors")
      } else {
        setVendors(vendorsData || [])
      }

      // Fetch spotlight vendors
      const { data: spotlightData, error: spotlightError } = await supabase
        .from("spotlight_vendors")
        .select("*")
        .eq("is_approved", true)

      if (spotlightError) {
        console.error("Error fetching spotlight vendors:", spotlightError)
      } else {
        setSpotlightVendors(spotlightData || [])
      }

      // Fetch booking links with event details
      const { data: bookingData, error: bookingError } = await supabase
        .from("vendor_booking_links")
        .select(`
          *,
          event:events (
            id,
            name,
            date,
            location
          )
        `)
        .eq("created_by", user.id)

      if (bookingError) {
        console.error("Error fetching booking links:", bookingError)
      } else {
        setBookingLinks(bookingData || [])
      }

      // Fetch vendor bookings for all booking links
      if (bookingData && bookingData.length > 0) {
        const { data: bookingsData, error: bookingsError } = await supabase
          .from("vendor_bookings")
          .select(`
            *,
            event:events (
              id,
              name,
              date,
              location
            )
          `)
          .in('booking_link_id', bookingData.map(link => link.id))

        if (bookingsError) {
          console.error("Error fetching vendor bookings:", bookingsError)
          // Don't show error to user if table doesn't exist yet
          if (!bookingsError.message?.includes('relation "vendor_bookings" does not exist')) {
            toast.error("Failed to load vendor bookings")
          }
        } else {
          setVendorBookings(bookingsData || [])
        }
      } else {
        setVendorBookings([])
      }

      // Fetch events for booking links
      const { data: eventsData, error: eventsError } = await supabase
        .from("events")
        .select("id, name, date")
        .eq("account_instance_id", accountInstance.id)

      if (eventsError) {
        console.error("Error fetching events:", eventsError)
      } else {
        setEvents(eventsData || [])
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      toast.error("Failed to load vendors data")
    } finally {
      setLoading(false)
    }
  }

  const handleSaveVendor = async () => {
    try {
      if (!currentAccountInstance) {
        toast.error("No account instance found")
        return
      }

      if (editingVendor) {
        // Debug log
        console.log('Updating vendor:', {
          name: newVendor.name,
          date: newVendor.date,
          start_time: newVendor.start_time,
          end_time: newVendor.end_time,
          location: newVendor.location,
          type: newVendor.type,
          category: newVendor.category,
          event_id: newVendor.event_id === "none" ? null : (newVendor.event_id || null),
          updated_at: new Date().toISOString(),
        }, 'id:', editingVendor.id)
        const { error } = await supabase
          .from("vendors")
          .update({
            name: newVendor.name,
            date: newVendor.date,
            start_time: newVendor.start_time,
            end_time: newVendor.end_time,
            location: newVendor.location,
            type: newVendor.type,
            category: newVendor.category,
            event_id: newVendor.event_id === "none" ? null : (newVendor.event_id || null),
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingVendor.id)

        if (error) {
          console.error("Error updating vendor:", error)
          toast.error("Failed to update vendor")
          return
        }

        toast.success("Vendor updated successfully")
      } else {
        // Add new vendor
        const { data, error } = await supabase
          .from("vendors")
          .insert({
            name: newVendor.name,
            date: newVendor.date,
            start_time: newVendor.start_time,
            end_time: newVendor.end_time,
            location: newVendor.location,
            type: newVendor.type,
            category: newVendor.category,
            event_id: newVendor.event_id === "none" ? null : (newVendor.event_id || null),
            account_instance_id: currentAccountInstance.id,
            contact_info: [],
          })
          .select()
          .single()

        if (error) {
          console.error("Error creating vendor:", error)
          toast.error("Failed to create vendor")
          return
        }

        toast.success("Vendor added successfully")
      }

      setShowVendorDialog(false)
      setEditingVendor(null)
      setNewVendor({
        name: "",
        date: "",
        start_time: "",
        end_time: "",
        location: "",
        type: "",
        category: "",
        event_id: "",
      })
      
      // Refresh data
      fetchData()
    } catch (error) {
      console.error("Error saving vendor:", error)
      toast.error("Failed to save vendor")
    }
  }

  const handleDeleteVendor = async (id: string) => {
    try {
      const { error } = await supabase
        .from("vendors")
        .delete()
        .eq("id", id)

      if (error) {
        console.error("Error deleting vendor:", error)
        toast.error("Failed to delete vendor")
        return
      }

      toast.success("Vendor deleted successfully")
      setShowVendorDialog(false)
      setEditingVendor(null)
      fetchData()
    } catch (error) {
      console.error("Error deleting vendor:", error)
      toast.error("Failed to delete vendor")
    }
  }

  const handleSaveContact = async () => {
    try {
      if (!selectedVendorForContacts) return

      if (editingContact && editingContact.id) {
        // Update existing contact
        const { error } = await supabase
          .from("vendor_contacts")
          .update({
            name: newContact.name,
            email: newContact.email,
            phone: newContact.phone,
            role: newContact.role,
            is_primary: newContact.is_primary,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingContact.id)

        if (error) {
          console.error("Error updating contact:", error)
          toast.error("Failed to update contact")
          return
        }

        toast.success("Contact updated successfully")
      } else {
        // Add new contact
        const { error } = await supabase
          .from("vendor_contacts")
          .insert({
            vendor_id: selectedVendorForContacts,
            name: newContact.name,
            email: newContact.email,
            phone: newContact.phone,
            role: newContact.role,
            is_primary: newContact.is_primary,
          })

        if (error) {
          console.error("Error creating contact:", error)
          toast.error("Failed to create contact")
          return
        }

        toast.success("Contact added successfully")
      }

      setShowContactDialog(false)
      setEditingContact(null)
      setNewContact({
        name: "",
        email: "",
        phone: "",
        role: "",
        is_primary: false,
      })
      
      // Refresh data
      fetchData()
    } catch (error) {
      console.error("Error saving contact:", error)
      toast.error("Failed to save contact")
    }
  }

  const handleDeleteContact = async (vendorId: string, contactId: string) => {
    try {
      const { error } = await supabase
        .from("vendor_contacts")
        .delete()
        .eq("id", contactId)

      if (error) {
        console.error("Error deleting contact:", error)
        toast.error("Failed to delete contact")
        return
      }

      toast.success("Contact deleted successfully")
      fetchData()
    } catch (error) {
      console.error("Error deleting contact:", error)
      toast.error("Failed to delete contact")
    }
  }

  const handleCreateBookingLink = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from("vendor_booking_links")
        .insert({
          event_id: newBookingLink.event_id || null,
          link_token: `booking-${Date.now()}`,
          title: newBookingLink.title,
          description: newBookingLink.description,
          expires_at: newBookingLink.expires_at || null,
          show_events: newBookingLink.show_events,
          show_other_bookings: newBookingLink.show_other_bookings,
          anonymous_events: newBookingLink.anonymous_events,
          anonymous_vendors: newBookingLink.anonymous_vendors,
          created_by: user.id,
          account_instance_id: currentAccountInstance.id,
        })
        .select()
        .single()

      if (error) {
        console.error("Error creating booking link:", JSON.stringify(error, null, 2))
        toast.error("Failed to create booking link")
        return
      }

      toast.success("Booking link created successfully")
      setShowBookingDialog(false)
      setNewBookingLink({
        title: "",
        description: "",
        event_id: "",
        expires_at: "",
        show_events: false,
        show_other_bookings: false,
        anonymous_events: false,
        anonymous_vendors: false,
      })
      fetchData()
    } catch (error) {
      console.error("Error creating booking link:", JSON.stringify(error, null, 2))
      toast.error("Failed to create booking link")
    }
  }

  const copyBookingLink = (link: BookingLink) => {
    const url = `${window.location.origin}/booking-invitation/${link.link_token}`
    if (url) {
      navigator.clipboard.writeText(url)
      toast.success("Booking link copied to clipboard")
    } else {
      toast.error("No booking link available")
    }
  }

  const openBookingManagement = (link: BookingLink) => {
    setSelectedBookingLink(link)
    setShowBookingManagementDialog(true)
  }

  const handleBookingStatusUpdate = async (bookingId: string, status: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from("vendor_bookings")
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq("id", bookingId)

      if (error) {
        console.error("Error updating booking status:", error)
        toast.error("Failed to update booking status")
        return
      }

      toast.success(`Booking ${status} successfully`)
      
      // Refresh data
      fetchData()
    } catch (error) {
      console.error("Error updating booking status:", error)
      toast.error("Failed to update booking status")
    }
  }

  const getBookingsForLink = (linkId: string) => {
    return vendorBookings.filter(booking => booking.booking_link_id === linkId)
  }

  const addSpotlightVendorToList = async (spotlightVendor: SpotlightVendor) => {
    try {
      if (!currentAccountInstance) {
        toast.error("No account instance found")
        return
      }

               const { data: vendorData, error: vendorError } = await supabase
           .from("vendors")
           .insert({
             name: spotlightVendor.business_name,
             date: "",
             start_time: "",
             end_time: "",
             location: "",
             type: spotlightVendor.service_category,
             category: spotlightVendor.service_category,
             account_instance_id: currentAccountInstance.id,
             contact_info: [],
           })
           .select()
           .single()

         if (vendorError) {
           console.error("Error adding spotlight vendor:", vendorError)
           toast.error("Failed to add vendor")
           return
         }

         // Add the contact separately
         if (vendorData) {
           const { error: contactError } = await supabase
             .from("vendor_contacts")
             .insert({
               vendor_id: vendorData.id,
               name: spotlightVendor.business_name,
               email: spotlightVendor.contact_info.email || "",
               phone: spotlightVendor.contact_info.phone || "",
               role: "Primary Contact",
               is_primary: true,
             })

           if (contactError) {
             console.error("Error adding vendor contact:", contactError)
           }
         }

               if (vendorError) {
           console.error("Error adding spotlight vendor:", vendorError)
           toast.error("Failed to add vendor")
           return
         }

      toast.success(`${spotlightVendor.business_name} added to your vendor list`)
      fetchData()
    } catch (error) {
      console.error("Error adding spotlight vendor:", error)
      toast.error("Failed to add vendor")
    }
  }

  // Banner content mapping
  const tabKeys = ["vendors", "spotlight", "booking", "shared"] as const;
  type TabKey = typeof tabKeys[number];
  const bannerConfig: Record<TabKey, { icon: React.ReactNode; iconBg: string; title: string; subtitle: string }> = {
    vendors: {
      icon: <Users className="w-6 h-6 text-white" />,
      iconBg: "from-orange-500 to-rose-500",
      title: "Vendors Management",
      subtitle: "Manage your event vendors and collaborations",
    },
    spotlight: {
      icon: <Star className="w-6 h-6 text-white" />,
      iconBg: "from-yellow-400 to-amber-500",
      title: "Spotlight Vendors",
      subtitle: "Discover and add pre-approved vendors to your event",
    },
    booking: {
      icon: <Calendar className="w-6 h-6 text-white" />,
      iconBg: "from-blue-500 to-indigo-500",
      title: "Vendor Booking Links",
      subtitle: "Create external booking links or internal vendor scheduling invitations",
    },
    shared: {
      icon: <MapPin className="w-6 h-6 text-white" />,
      iconBg: "from-green-500 to-emerald-500",
      title: "Shared Data with Vendors",
      subtitle: "Share blueprints, maps, and other event data with your vendors",
    },
  };
  const banner = bannerConfig[(tabKeys.includes(activeTab as TabKey) ? activeTab : "vendors") as TabKey];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="animate-spin h-8 w-8 text-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading vendors...</p>
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
            <div className={`w-12 h-12 bg-gradient-to-br ${banner.iconBg} rounded-xl flex items-center justify-center shadow-lg`}>
              {banner.icon}
            </div>
            <div>
              <h1 className="text-3xl font-light">{banner.title}</h1>
              <p className="text-slate-300">{banner.subtitle}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Content (controlled by URL) */}
      {activeTab === "vendors" && (
        <>
          <Card className="border-slate-200/50 shadow-lg bg-white/90 backdrop-blur-sm mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div className="flex flex-wrap gap-3 justify-end w-full">
                  <Dialog open={showVendorDialog} onOpenChange={(open) => {
                    setShowVendorDialog(open);
                    if (!open) setEditingVendor(null);
                  }}>
                    <DialogTrigger asChild>
                      <Button
                        className="bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white"
                        onClick={() => {
                          setEditingVendor(null)
                          setNewVendor({
                            name: "",
                            date: "",
                            start_time: "",
                            end_time: "",
                            location: "",
                            type: "",
                            category: "",
                            event_id: "none",
                          })
                          setShowVendorDialog(true)
                        }}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Vendor
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>{editingVendor ? "Edit Vendor" : "Add New Vendor"}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="name">Vendor Name</Label>
                          <Input
                            id="name"
                            value={newVendor.name}
                            onChange={(e) => setNewVendor({ ...newVendor, name: e.target.value })}
                            placeholder="Enter vendor name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="date">Date</Label>
                          <Input
                            id="date"
                            type="date"
                            value={newVendor.date}
                            onChange={(e) => setNewVendor({ ...newVendor, date: e.target.value })}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="start_time">Start Time</Label>
                            <Input
                              id="start_time"
                              type="time"
                              value={newVendor.start_time}
                              onChange={(e) => setNewVendor({ ...newVendor, start_time: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label htmlFor="end_time">End Time</Label>
                            <Input
                              id="end_time"
                              type="time"
                              value={newVendor.end_time}
                              onChange={(e) => setNewVendor({ ...newVendor, end_time: e.target.value })}
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="location">Location</Label>
                          <Input
                            id="location"
                            value={newVendor.location}
                            onChange={(e) => setNewVendor({ ...newVendor, location: e.target.value })}
                            placeholder="Enter location"
                          />
                        </div>
                        <div>
                          <Label htmlFor="type">Type</Label>
                          <Select value={newVendor.type} onValueChange={(value) => setNewVendor({ ...newVendor, type: value })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select vendor type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Catering">Catering</SelectItem>
                              <SelectItem value="Photography">Photography</SelectItem>
                              <SelectItem value="Music">Music</SelectItem>
                              <SelectItem value="Decoration">Decoration</SelectItem>
                              <SelectItem value="Transportation">Transportation</SelectItem>
                              <SelectItem value="Planning">Planning</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="category">Category</Label>
                          <Input
                            id="category"
                            value={newVendor.category}
                            onChange={(e) => setNewVendor({ ...newVendor, category: e.target.value })}
                            placeholder="Enter category"
                          />
                        </div>
                        <div>
                          <Label htmlFor="event">Linked Event (Optional)</Label>
                          <Select value={newVendor.event_id} onValueChange={(value) => setNewVendor({ ...newVendor, event_id: value })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select an event to link" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No event linked</SelectItem>
                              {events.map((event) => (
                                <SelectItem key={event.id} value={event.id}>
                                  {event.name} - {event.date}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setShowVendorDialog(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleSaveVendor}>
                            {editingVendor ? "Update" : "Add"} Vendor
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-200/50 shadow-lg bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5" />
                Vendors
              </CardTitle>
              <p className="text-sm text-muted-foreground">Manage your event vendors and collaborations</p>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto px-4">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50">
                      <TableHead>Vendor Name</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Linked Event</TableHead>
                      <TableHead>Contacts</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vendors.map((vendor) => (
                      <TableRow key={vendor.id}>
                        <TableCell className="font-medium">{vendor.name}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{vendor.date}</div>
                            <div className="text-muted-foreground">
                              {vendor.start_time} - {vendor.end_time}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{vendor.location}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{vendor.type}</Badge>
                        </TableCell>
                        <TableCell>
                          {vendor.event_id ? (
                            <div className="text-sm">
                              {events.find(e => e.id === vendor.event_id)?.name || "Unknown Event"}
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">Not linked</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{vendor.vendor_contacts?.length || 0} contacts</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedVendorForContacts(vendor.id)
                                setEditingContact(null)
                                setShowContactDialog(true)
                              }}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingVendor(vendor)
                                setNewVendor({
                                  name: vendor.name,
                                  date: vendor.date,
                                  start_time: vendor.start_time,
                                  end_time: vendor.end_time,
                                  location: vendor.location,
                                  type: vendor.type,
                                  category: vendor.category,
                                  event_id: vendor.event_id || "none",
                                })
                                setShowVendorDialog(true)
                              }}
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleDeleteVendor(vendor.id)}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
      {activeTab === "spotlight" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5" />
              Spotlight Vendors
            </CardTitle>
            <p className="text-sm text-muted-foreground">Discover and add pre-approved vendors to your event</p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {spotlightVendors.map((vendor) => (
                <Card key={vendor.id} className="border-2 hover:border-primary/50 transition-colors">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">{vendor.business_name}</h3>
                          <Badge variant="secondary">{vendor.service_category}</Badge>
                        </div>
                        {vendor.is_featured && (
                          <Badge className="bg-yellow-100 text-yellow-800">
                            <Star className="w-3 h-3 mr-1" />
                            Featured
                          </Badge>
                        )}
                      </div>

                      <p className="text-sm text-muted-foreground line-clamp-3">{vendor.description}</p>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < Math.floor(vendor.rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm font-medium">{vendor.rating}</span>
                        <span className="text-sm text-muted-foreground">({vendor.review_count} reviews)</span>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Mail className="w-4 h-4" />
                          {vendor.contact_info.email}
                        </div>
                        {vendor.contact_info.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-4 h-4" />
                            {vendor.contact_info.phone}
                          </div>
                        )}
                      </div>

                      <Button className="w-full" onClick={() => addSpotlightVendorToList(vendor)}>
                        Add to My Vendors
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      {activeTab === "booking" && (
        <>
          <Card className="border-slate-200/50 shadow-lg bg-white/90 backdrop-blur-sm mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div className="flex flex-wrap gap-3 justify-end w-full">
                  <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
                    <DialogTrigger asChild>
                      <Button
                        className="bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create Booking Link
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Create Booking Link</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="booking-title">Title</Label>
                          <Input
                            id="booking-title"
                            value={newBookingLink.title}
                            onChange={(e) => setNewBookingLink({ ...newBookingLink, title: e.target.value })}
                            placeholder="Enter booking link title"
                          />
                        </div>
                        <div>
                          <Label htmlFor="booking-description">Description</Label>
                          <Textarea
                            id="booking-description"
                            value={newBookingLink.description}
                            onChange={(e) => setNewBookingLink({ ...newBookingLink, description: e.target.value })}
                            placeholder="Enter description"
                          />
                        </div>
                        <div>
                          <Label htmlFor="booking-event">Event (Optional)</Label>
                          <Select value={newBookingLink.event_id} onValueChange={(value) => setNewBookingLink({ ...newBookingLink, event_id: value })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select event" />
                            </SelectTrigger>
                            <SelectContent>
                              {events.map((event) => (
                                <SelectItem key={event.id} value={event.id}>
                                  {event.name} - {event.date}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="booking-expires">Expires At (Optional)</Label>
                          <Input
                            id="booking-expires"
                            type="datetime-local"
                            value={newBookingLink.expires_at}
                            onChange={(e) => setNewBookingLink({ ...newBookingLink, expires_at: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>Booking Link Options</Label>
                          <div className="flex flex-col gap-2 mt-2">
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={newBookingLink.show_events}
                                onChange={e => setNewBookingLink({ ...newBookingLink, show_events: e.target.checked })}
                              />
                              Show events/sub-events currently scheduled
                            </label>
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={newBookingLink.show_other_bookings}
                                onChange={e => setNewBookingLink({ ...newBookingLink, show_other_bookings: e.target.checked })}
                              />
                              Show other vendors' scheduled times
                            </label>
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={newBookingLink.anonymous_events}
                                onChange={e => setNewBookingLink({ ...newBookingLink, anonymous_events: e.target.checked })}
                              />
                              Make events anonymous when showing
                            </label>
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={newBookingLink.anonymous_vendors}
                                onChange={e => setNewBookingLink({ ...newBookingLink, anonymous_vendors: e.target.checked })}
                              />
                              Make other vendors anonymous when showing
                            </label>
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setShowBookingDialog(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleCreateBookingLink}>
                            Create Link
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Booking Links
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Create external booking links (Calendly, Acuity, etc.) or internal vendor scheduling invitations
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {bookingLinks.length === 0 && (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Booking Links Yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Create your first booking link to start inviting vendors
                    </p>
                  </div>
                )}
                {bookingLinks.map((link) => (
                  <Card key={link.id} className="border-l-4 border-l-primary">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <h3 className="font-semibold text-lg">{link.title}</h3>
                          <p className="text-sm text-muted-foreground">{link.description}</p>
                          {link.expires_at && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Clock className="w-4 h-4" />
                              Expires: {new Date(link.expires_at).toLocaleDateString()}
                            </div>
                          )}
                          <div className="mt-2">
                            <a
                              href={`/booking-invitation/${link.link_token}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 underline hover:text-blue-800 text-sm"
                            >
                              {`${window.location.origin}/booking-invitation/${link.link_token}`}
                            </a>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" onClick={() => copyBookingLink(link)}>
                            <Copy className="w-4 h-4 mr-2" />
                            Copy Link
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => window.open(`/booking-invitation/${link.link_token}`, '_blank')}
                          >
                            <Link className="w-4 h-4 mr-2" />
                            Open Link
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              const jwtToken = generateBookingToken(link.id, link.event_id);
                              window.open(`https://scheduler.mycompany.com?token=${jwtToken}&event_id=${link.event_id || ''}`, '_blank');
                            }}
                          >
                            <Calendar className="w-4 h-4 mr-2" />
                            Open Scheduler
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => openBookingManagement(link)}
                          >
                            <Users className="w-4 h-4 mr-2" />
                            Manage Bookings ({getBookingsForLink(link.id).length})
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* Note about vendor dashboard */}
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <h4 className="font-medium text-amber-900 mb-1">Vendor Dashboard Coming Soon</h4>
                  <p className="text-sm text-amber-800">
                    For internal vendor scheduling, you'll need to build a vendor dashboard where vendors can log in and see their booking invitations. 
                    This will be a separate section in the app for vendors to manage their bookings and availability.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Note about database setup */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <h4 className="font-medium text-blue-900 mb-1">Database Setup Required</h4>
                  <p className="text-sm text-blue-800">
                    To enable booking management, run the SQL script <code className="bg-blue-100 px-1 rounded">scripts/create-vendor-bookings-table.sql</code> in your Supabase SQL editor.
                    This will create the vendor_bookings table with proper security policies.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Note about scheduler tool */}
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <h4 className="font-medium text-green-900 mb-1">Independent Scheduler Tool Available</h4>
                  <p className="text-sm text-green-800">
                    Use the "Open Scheduler" button to launch the independent scheduling tool. This tool can be deployed to a separate subdomain (e.g., scheduler.mycompany.com) 
                    and provides a Calendly-like booking experience for vendors. See the <code className="bg-green-100 px-1 rounded">scheduler-tool/</code> folder for the complete implementation.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
      {activeTab === "shared" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Shared Data with Vendors
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Share blueprints, maps, and other event data with your vendors
            </p>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Shared Data Yet</h3>
              <p className="text-muted-foreground mb-4">
                Create blueprints and maps in the Maps section to share with vendors
              </p>
              <Button variant="outline">Go to Maps</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contact Dialog */}
      <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingContact ? "Edit Contact" : "Add New Contact"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="contact-name">Name</Label>
              <Input
                id="contact-name"
                value={newContact.name}
                onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                placeholder="Enter contact name"
              />
            </div>
            <div>
              <Label htmlFor="contact-email">Email</Label>
              <Input
                id="contact-email"
                type="email"
                value={newContact.email}
                onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                placeholder="Enter email"
              />
            </div>
            <div>
              <Label htmlFor="contact-phone">Phone</Label>
              <Input
                id="contact-phone"
                value={newContact.phone}
                onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                placeholder="Enter phone number"
              />
            </div>
            <div>
              <Label htmlFor="contact-role">Role</Label>
              <Input
                id="contact-role"
                value={newContact.role}
                onChange={(e) => setNewContact({ ...newContact, role: e.target.value })}
                placeholder="Enter role"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is-primary"
                checked={newContact.is_primary}
                onChange={(e) => setNewContact({ ...newContact, is_primary: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="is-primary">Primary Contact</Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowContactDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveContact}>
                {editingContact ? "Update" : "Add"} Contact
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Booking Management Dialog */}
      <Dialog open={showBookingManagementDialog} onOpenChange={setShowBookingManagementDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Manage Bookings - {selectedBookingLink?.title}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              Review and manage vendor booking requests for this link
            </p>
          </DialogHeader>
          <div className="space-y-4">
            {selectedBookingLink && (
              <>
                {/* Booking Link Info */}
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-blue-900">{selectedBookingLink.title}</h4>
                        <p className="text-sm text-blue-800">{selectedBookingLink.description}</p>
                      </div>
                      <div className="space-y-1">
                        {selectedBookingLink.event && (
                          <div className="text-sm text-blue-800">
                            <strong>Event:</strong> {selectedBookingLink.event.name} - {new Date(selectedBookingLink.event.date).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Bookings List */}
                <div className="space-y-3">
                  <h3 className="font-medium">Booking Requests ({getBookingsForLink(selectedBookingLink.id).length})</h3>
                  {getBookingsForLink(selectedBookingLink.id).length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h4 className="text-lg font-medium mb-2">No Booking Requests Yet</h4>
                      <p className="text-muted-foreground">
                        Share the booking link with vendors to start receiving booking requests
                      </p>
                    </div>
                  ) : (
                    getBookingsForLink(selectedBookingLink.id).map((booking) => (
                      <Card key={booking.id} className="border-l-4 border-l-blue-500">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold">{booking.vendor_name}</h4>
                                <Badge 
                                  variant={
                                    booking.status === 'approved' ? 'default' : 
                                    booking.status === 'rejected' ? 'destructive' : 'secondary'
                                  }
                                >
                                  {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                                </Badge>
                              </div>
                              <div className="grid md:grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p><strong>Email:</strong> {booking.vendor_email}</p>
                                  {booking.vendor_phone && <p><strong>Phone:</strong> {booking.vendor_phone}</p>}
                                  <p><strong>Service:</strong> {booking.service_type.charAt(0).toUpperCase() + booking.service_type.slice(1)}</p>
                                </div>
                                <div>
                                  {booking.proposed_date && <p><strong>Preferred Date:</strong> {new Date(booking.proposed_date).toLocaleDateString()}</p>}
                                  {booking.proposed_time && <p><strong>Preferred Time:</strong> {booking.proposed_time}</p>}
                                  <p><strong>Submitted:</strong> {new Date(booking.created_at).toLocaleDateString()}</p>
                                </div>
                              </div>
                              {booking.service_description && (
                                <div>
                                  <p className="text-sm"><strong>Description:</strong></p>
                                  <p className="text-sm text-muted-foreground">{booking.service_description}</p>
                                </div>
                              )}
                            </div>
                            {booking.status === 'pending' && (
                              <div className="flex flex-col gap-2 ml-4">
                                <Button 
                                  size="sm" 
                                  onClick={() => handleBookingStatusUpdate(booking.id, 'approved')}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Approve
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={() => handleBookingStatusUpdate(booking.id, 'rejected')}
                                >
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Reject
                                </Button>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
