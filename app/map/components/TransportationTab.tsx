"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Car, Plus, Edit, Trash2, Users, Clock, DollarSign } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

interface Transportation {
  id: string
  event_id: string
  type: string
  provider: string
  capacity: number
  departure_time: string | null
  pickup_location: string | null
  dropoff_location: string | null
  estimated_cost: number | null
  contact_info: string | null
  notes: string | null
  created_at: string
}

interface TransportationTabProps {
  userId: string
  eventId: string
  eventName: string
}

export default function TransportationTab({ userId, eventId, eventName }: TransportationTabProps) {
  const [transportation, setTransportation] = useState<Transportation[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingTransportation, setEditingTransportation] = useState<Transportation | null>(null)
  const [formData, setFormData] = useState({
    type: "",
    provider: "",
    capacity: "",
    departure_time: "",
    pickup_location: "",
    dropoff_location: "",
    estimated_cost: "",
    contact_info: "",
    notes: "",
  })
  const [localMode, setLocalMode] = useState(false)

  useEffect(() => {
    if (eventId) {
      fetchTransportation()
    }
  }, [eventId])

  const fetchTransportation = async () => {
    try {
      const { data, error } = await supabase
        .from("transportation")
        .select("*")
        .eq("user_id", userId)
        .eq("event_id", eventId)
        .order("created_at", { ascending: false })

      if (error) {
        console.warn("Transportation table not available - running in local mode:", error.message)
        setTransportation([])
        setLocalMode(true)
      } else {
        setTransportation(data || [])
        setLocalMode(false)
      }
    } catch (error) {
      console.warn("Error fetching transportation - running in local mode:", error)
      setTransportation([])
      setLocalMode(true)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!eventId) {
      toast.error("Please select an event first")
      return
    }

    try {
      const transportationData = {
        event_id: eventId,
        type: formData.type,
        provider: formData.provider,
        capacity: Number.parseInt(formData.capacity),
        departure_time: formData.departure_time || null,
        pickup_location: formData.pickup_location || null,
        dropoff_location: formData.dropoff_location || null,
        estimated_cost: formData.estimated_cost ? Number.parseFloat(formData.estimated_cost) : null,
        contact_info: formData.contact_info || null,
        notes: formData.notes || null,
      }

      if (editingTransportation) {
        const { error } = await supabase
          .from("transportation")
          .update(transportationData)
          .eq("id", editingTransportation.id)

        if (error) throw error
        toast.success("Transportation updated successfully!")
      } else {
        const { error } = await supabase.from("transportation").insert([transportationData])

        if (error) throw error
        toast.success("Transportation added successfully!")
      }

      resetForm()
      fetchTransportation()
    } catch (error) {
      console.error("Error saving transportation:", error)
      toast.error("Failed to save transportation")
    }
  }

  const handleEdit = (transport: Transportation) => {
    setEditingTransportation(transport)
    setFormData({
      type: transport.type,
      provider: transport.provider,
      capacity: transport.capacity.toString(),
      departure_time: transport.departure_time || "",
      pickup_location: transport.pickup_location || "",
      dropoff_location: transport.dropoff_location || "",
      estimated_cost: transport.estimated_cost?.toString() || "",
      contact_info: transport.contact_info || "",
      notes: transport.notes || "",
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this transportation option?")) return

    try {
      const { error } = await supabase.from("transportation").delete().eq("id", id)

      if (error) throw error
      toast.success("Transportation deleted successfully!")
      fetchTransportation()
    } catch (error) {
      console.error("Error deleting transportation:", error)
      toast.error("Failed to delete transportation")
    }
  }

  const resetForm = () => {
    setFormData({
      type: "",
      provider: "",
      capacity: "",
      departure_time: "",
      pickup_location: "",
      dropoff_location: "",
      estimated_cost: "",
      contact_info: "",
      notes: "",
    })
    setEditingTransportation(null)
    setShowForm(false)
  }

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "bus":
        return <Car className="h-4 w-4" />
      case "van":
        return <Car className="h-4 w-4" />
      case "car":
        return <Car className="h-4 w-4" />
      case "shuttle":
        return <Car className="h-4 w-4" />
      default:
        return <Car className="h-4 w-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "bus":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "van":
        return "bg-green-100 text-green-800 border-green-200"
      case "car":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "shuttle":
        return "bg-orange-100 text-orange-800 border-orange-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const formatTime = (time: string) => {
    if (!time) return ""
    return new Date(`2000-01-01T${time}`).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Transportation Planning</h2>
          <p className="text-muted-foreground">
            {eventName ? `Organize transportation for ${eventName}` : "Manage transportation options and logistics"}
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Transportation
        </Button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingTransportation ? "Edit Transportation" : "Add New Transportation"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Transportation Type *</Label>
                  <select
                    id="type"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background"
                    required
                  >
                    <option value="">Select Type</option>
                    <option value="Bus">Bus</option>
                    <option value="Van">Van</option>
                    <option value="Car">Car</option>
                    <option value="Shuttle">Shuttle</option>
                    <option value="Limousine">Limousine</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="provider">Provider/Company *</Label>
                  <Input
                    id="provider"
                    value={formData.provider}
                    onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                    placeholder="e.g., ABC Transport, John's Shuttle"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacity (people) *</Label>
                  <Input
                    id="capacity"
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    placeholder="8"
                    min="1"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="departure_time">Departure Time</Label>
                  <Input
                    id="departure_time"
                    type="time"
                    value={formData.departure_time}
                    onChange={(e) => setFormData({ ...formData, departure_time: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estimated_cost">Estimated Cost ($)</Label>
                  <Input
                    id="estimated_cost"
                    type="number"
                    step="0.01"
                    value={formData.estimated_cost}
                    onChange={(e) => setFormData({ ...formData, estimated_cost: e.target.value })}
                    placeholder="150.00"
                    min="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pickup_location">Pickup Location</Label>
                  <Input
                    id="pickup_location"
                    value={formData.pickup_location}
                    onChange={(e) => setFormData({ ...formData, pickup_location: e.target.value })}
                    placeholder="Hotel lobby, Main entrance, etc."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dropoff_location">Drop-off Location</Label>
                  <Input
                    id="dropoff_location"
                    value={formData.dropoff_location}
                    onChange={(e) => setFormData({ ...formData, dropoff_location: e.target.value })}
                    placeholder="Venue entrance, Airport, etc."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_info">Contact Information</Label>
                <Input
                  id="contact_info"
                  value={formData.contact_info}
                  onChange={(e) => setFormData({ ...formData, contact_info: e.target.value })}
                  placeholder="Phone number, email, or booking reference"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Special requirements, accessibility needs, etc."
                  rows={3}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit">{editingTransportation ? "Update Transportation" : "Add Transportation"}</Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Transportation List */}
      {transportation.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Transportation Added</h3>
            <p className="text-muted-foreground mb-4">
              Start organizing by adding transportation options for your event.
            </p>
            <Button onClick={() => setShowForm(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add First Transportation
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {transportation.map((transport) => (
            <Card key={transport.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(transport.type)}
                      <CardTitle className="text-lg">{transport.provider}</CardTitle>
                    </div>
                    <Badge variant="outline" className={getTypeColor(transport.type)}>
                      {transport.type}
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(transport)} className="h-8 w-8 p-0">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(transport.id)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3 text-muted-foreground" />
                    <span>{transport.capacity} people</span>
                  </div>
                  {transport.departure_time && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span>{formatTime(transport.departure_time)}</span>
                    </div>
                  )}
                </div>

                {transport.estimated_cost && (
                  <div className="flex items-center gap-1 text-sm">
                    <DollarSign className="h-3 w-3 text-muted-foreground" />
                    <span>${transport.estimated_cost}</span>
                  </div>
                )}

                {(transport.pickup_location || transport.dropoff_location) && (
                  <div className="space-y-1 text-sm text-muted-foreground">
                    {transport.pickup_location && (
                      <div>
                        <span className="font-medium">Pickup:</span> {transport.pickup_location}
                      </div>
                    )}
                    {transport.dropoff_location && (
                      <div>
                        <span className="font-medium">Drop-off:</span> {transport.dropoff_location}
                      </div>
                    )}
                  </div>
                )}

                {transport.contact_info && (
                  <div className="text-sm">
                    <span className="font-medium">Contact:</span> {transport.contact_info}
                  </div>
                )}

                {transport.notes && (
                  <div className="text-sm text-muted-foreground border-t pt-2">{transport.notes}</div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
