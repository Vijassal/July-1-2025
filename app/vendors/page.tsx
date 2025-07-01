"use client"

import { useState, useEffect } from "react"
import { createClientSupabase } from "@/lib/supabase"
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
} from "lucide-react"
import { useSearchParams } from "next/navigation"

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
  link_token: string
  show_other_bookings: boolean
  show_vendor_names: boolean
  is_active: boolean
  expires_at: string
}

export default function VendorsPage() {
  const [loading, setLoading] = useState(true)
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [spotlightVendors, setSpotlightVendors] = useState<SpotlightVendor[]>([])
  const [bookingLinks, setBookingLinks] = useState<BookingLink[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null)
  const [editingContact, setEditingContact] = useState<VendorContact | null>(null)
  const [showVendorDialog, setShowVendorDialog] = useState(false)
  const [showContactDialog, setShowContactDialog] = useState(false)
  const [showBookingDialog, setShowBookingDialog] = useState(false)
  const [selectedVendorForContacts, setSelectedVendorForContacts] = useState<string | null>(null)

  const supabase = createClientSupabase()

  const [newVendor, setNewVendor] = useState({
    name: "",
    date: "",
    start_time: "",
    end_time: "",
    location: "",
    type: "",
    category: "",
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
    show_other_bookings: false,
    show_vendor_names: true,
    expires_at: "",
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

      // For now, we'll use mock data since tables might not exist yet
      const mockVendors: Vendor[] = [
        {
          id: "1",
          name: "Elite Catering",
          date: "2024-02-14",
          start_time: "09:00",
          end_time: "17:00",
          location: "Grand Ballroom",
          type: "Catering",
          category: "Food & Beverage",
          contact_info: [
            {
              id: "1",
              name: "Sarah Johnson",
              email: "sarah@elitecatering.com",
              phone: "+1-555-0123",
              role: "Event Coordinator",
              is_primary: true,
            },
          ],
        },
        {
          id: "2",
          name: "Perfect Flowers",
          date: "2024-02-13",
          start_time: "08:00",
          end_time: "12:00",
          location: "Ceremony Hall",
          type: "Decoration",
          category: "Floral",
          contact_info: [
            {
              id: "2",
              name: "Mike Chen",
              email: "mike@perfectflowers.com",
              phone: "+1-555-0124",
              role: "Floral Designer",
              is_primary: true,
            },
          ],
        },
      ]

      const mockSpotlightVendors: SpotlightVendor[] = [
        {
          id: "1",
          business_name: "Premium Photography Studio",
          service_category: "Photography",
          description: "Award-winning wedding photography with 10+ years experience",
          contact_info: { email: "info@premiumphotography.com", phone: "+1-555-0125" },
          pricing_info: { starting_price: 2500, package_options: ["Basic", "Premium", "Luxury"] },
          rating: 4.9,
          review_count: 127,
          is_featured: true,
        },
        {
          id: "2",
          business_name: "Elegant Event Planning",
          service_category: "Planning",
          description: "Full-service event planning for weddings and corporate events",
          contact_info: { email: "hello@eleganteventplanning.com", phone: "+1-555-0126" },
          pricing_info: { starting_price: 3000, package_options: ["Partial", "Full Service"] },
          rating: 4.8,
          review_count: 89,
          is_featured: false,
        },
      ]

      const mockBookingLinks: BookingLink[] = [
        {
          id: "1",
          title: "Johnson Wedding - Vendor Setup",
          description: "Setup scheduling for Johnson wedding on Feb 14th",
          link_token: "jw-2024-feb14-setup",
          show_other_bookings: true,
          show_vendor_names: false,
          is_active: true,
          expires_at: "2024-02-15T00:00:00Z",
        },
      ]

      const mockEvents = [
        { id: "1", title: "Johnson Wedding", date: "2024-02-14" },
        { id: "2", title: "Corporate Gala", date: "2024-03-15" },
      ]

      setVendors(mockVendors)
      setSpotlightVendors(mockSpotlightVendors)
      setBookingLinks(mockBookingLinks)
      setEvents(mockEvents)
    } catch (error) {
      console.error("Error fetching data:", error)
      toast.error("Failed to load vendors data")
    } finally {
      setLoading(false)
    }
  }

  const handleSaveVendor = async () => {
    try {
      if (editingVendor) {
        // Update existing vendor
        setVendors(vendors.map((v) => (v.id === editingVendor.id ? { ...editingVendor, ...newVendor } : v)))
        toast.success("Vendor updated successfully")
      } else {
        // Add new vendor
        const vendor: Vendor = {
          id: Date.now().toString(),
          ...newVendor,
          contact_info: [],
        }
        setVendors([...vendors, vendor])
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
      })
    } catch (error) {
      toast.error("Failed to save vendor")
    }
  }

  const handleDeleteVendor = async (id: string) => {
    try {
      setVendors(vendors.filter((v) => v.id !== id))
      toast.success("Vendor deleted successfully")
    } catch (error) {
      toast.error("Failed to delete vendor")
    }
  }

  const handleSaveContact = async () => {
    try {
      if (!selectedVendorForContacts) return

      const updatedVendors = vendors.map((vendor) => {
        if (vendor.id === selectedVendorForContacts) {
          const contacts = [...vendor.contact_info]

          if (editingContact && editingContact.id) {
            // Update existing contact
            const index = contacts.findIndex((c) => c.id === editingContact.id)
            if (index !== -1) {
              contacts[index] = { ...editingContact, ...newContact }
            }
          } else {
            // Add new contact
            contacts.push({
              id: Date.now().toString(),
              ...newContact,
            })
          }

          return { ...vendor, contact_info: contacts }
        }
        return vendor
      })

      setVendors(updatedVendors)
      toast.success(editingContact ? "Contact updated successfully" : "Contact added successfully")

      setShowContactDialog(false)
      setEditingContact(null)
      setNewContact({
        name: "",
        email: "",
        phone: "",
        role: "",
        is_primary: false,
      })
    } catch (error) {
      toast.error("Failed to save contact")
    }
  }

  const handleDeleteContact = async (vendorId: string, contactId: string) => {
    try {
      const updatedVendors = vendors.map((vendor) => {
        if (vendor.id === vendorId) {
          return {
            ...vendor,
            contact_info: vendor.contact_info.filter((c) => c.id !== contactId),
          }
        }
        return vendor
      })

      setVendors(updatedVendors)
      toast.success("Contact deleted successfully")
    } catch (error) {
      toast.error("Failed to delete contact")
    }
  }

  const handleCreateBookingLink = async () => {
    try {
      const bookingLink: BookingLink = {
        id: Date.now().toString(),
        ...newBookingLink,
        link_token: `booking-${Date.now()}`,
        is_active: true,
      }

      setBookingLinks([...bookingLinks, bookingLink])
      toast.success("Booking link created successfully")

      setShowBookingDialog(false)
      setNewBookingLink({
        title: "",
        description: "",
        event_id: "",
        show_other_bookings: false,
        show_vendor_names: true,
        expires_at: "",
      })
    } catch (error) {
      toast.error("Failed to create booking link")
    }
  }

  const copyBookingLink = (token: string) => {
    const link = `${window.location.origin}/vendor-booking/${token}`
    navigator.clipboard.writeText(link)
    toast.success("Booking link copied to clipboard")
  }

  const addSpotlightVendorToList = (spotlightVendor: SpotlightVendor) => {
    const vendor: Vendor = {
      id: Date.now().toString(),
      name: spotlightVendor.business_name,
      date: "",
      start_time: "",
      end_time: "",
      location: "",
      type: spotlightVendor.service_category,
      category: spotlightVendor.service_category,
      contact_info: [
        {
          id: Date.now().toString(),
          name: spotlightVendor.business_name,
          email: spotlightVendor.contact_info.email || "",
          phone: spotlightVendor.contact_info.phone || "",
          role: "Primary Contact",
          is_primary: true,
        },
      ],
    }

    setVendors([...vendors, vendor])
    toast.success(`${spotlightVendor.business_name} added to your vendor list`)
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
      subtitle: "Share booking links with your vendors for easy scheduling",
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
                  <Dialog open={showVendorDialog} onOpenChange={setShowVendorDialog}>
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
                          })
                        }}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Vendor
                      </Button>
                    </DialogTrigger>
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
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{vendor.contact_info.length} contacts</span>
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
                  </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <div className="space-y-4">
                {bookingLinks.map((link) => (
                  <Card key={link.id} className="border-l-4 border-l-primary">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <h3 className="font-semibold text-lg">{link.title}</h3>
                          <p className="text-sm text-muted-foreground">{link.description}</p>
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <Eye className="w-4 h-4" />
                              {link.show_other_bookings ? "Shows other bookings" : "Private bookings"}
                            </div>
                            <div className="flex items-center gap-1">
                              {link.show_vendor_names ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                              {link.show_vendor_names ? "Names visible" : "Anonymous"}
                            </div>
                            <Badge variant={link.is_active ? "default" : "secondary"}>
                              {link.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                          {link.expires_at && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Clock className="w-4 h-4" />
                              Expires: {new Date(link.expires_at).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" onClick={() => copyBookingLink(link.link_token)}>
                            <Copy className="w-4 h-4 mr-2" />
                            Copy Link
                          </Button>
                          <Button size="sm" variant="outline">
                            <Link className="w-4 h-4 mr-2" />
                            View
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
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
    </div>
  )
}
