"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { MapPin, Plus, Edit, Trash2, Navigation, Clock, DollarSign } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

interface Destination {
  id: string
  event_id: string
  name: string
  address: string
  description: string | null
  estimated_travel_time: number | null
  estimated_cost: number | null
  priority: number
  created_at: string
}

interface DestinationTabProps {
  userId: string
  eventId: string
  eventName: string
}

export default function DestinationTab({ userId, eventId, eventName }: DestinationTabProps) {
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingDestination, setEditingDestination] = useState<Destination | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    description: "",
    estimated_travel_time: "",
    estimated_cost: "",
    priority: "1",
  })
  const [localMode, setLocalMode] = useState(false)

  useEffect(() => {
    if (eventId) {
      fetchDestinations()
    }
  }, [eventId])

  const fetchDestinations = async () => {
    try {
      const { data, error } = await supabase
        .from("destinations")
        .select("*")
        .eq("user_id", userId)
        .eq("event_id", eventId)
        .order("created_at", { ascending: false })

      if (error) {
        console.warn("Destinations table not available - running in local mode:", error.message)
        setDestinations([])
        setLocalMode(true)
      } else {
        setDestinations(data || [])
        setLocalMode(false)
      }
    } catch (error) {
      console.warn("Error fetching destinations - running in local mode:", error)
      setDestinations([])
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
      const destinationData = {
        event_id: eventId,
        name: formData.name,
        address: formData.address,
        description: formData.description || null,
        estimated_travel_time: formData.estimated_travel_time ? Number.parseInt(formData.estimated_travel_time) : null,
        estimated_cost: formData.estimated_cost ? Number.parseFloat(formData.estimated_cost) : null,
        priority: Number.parseInt(formData.priority),
      }

      if (editingDestination) {
        const { error } = await supabase.from("destinations").update(destinationData).eq("id", editingDestination.id)

        if (error) throw error
        toast.success("Destination updated successfully!")
      } else {
        const { error } = await supabase.from("destinations").insert([destinationData])

        if (error) throw error
        toast.success("Destination added successfully!")
      }

      resetForm()
      fetchDestinations()
    } catch (error) {
      console.error("Error saving destination:", error)
      toast.error("Failed to save destination")
    }
  }

  const handleEdit = (destination: Destination) => {
    setEditingDestination(destination)
    setFormData({
      name: destination.name,
      address: destination.address,
      description: destination.description || "",
      estimated_travel_time: destination.estimated_travel_time?.toString() || "",
      estimated_cost: destination.estimated_cost?.toString() || "",
      priority: destination.priority.toString(),
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this destination?")) return

    try {
      const { error } = await supabase.from("destinations").delete().eq("id", id)

      if (error) throw error
      toast.success("Destination deleted successfully!")
      fetchDestinations()
    } catch (error) {
      console.error("Error deleting destination:", error)
      toast.error("Failed to delete destination")
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      address: "",
      description: "",
      estimated_travel_time: "",
      estimated_cost: "",
      priority: "1",
    })
    setEditingDestination(null)
    setShowForm(false)
  }

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1:
        return "bg-red-100 text-red-800 border-red-200"
      case 2:
        return "bg-orange-100 text-orange-800 border-orange-200"
      case 3:
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 1:
        return "High Priority"
      case 2:
        return "Medium Priority"
      case 3:
        return "Low Priority"
      default:
        return "Normal"
    }
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
          <h2 className="text-2xl font-bold">Destination Planning</h2>
          <p className="text-muted-foreground">
            {eventName ? `Plan destinations for ${eventName}` : "Plan destinations and travel routes"}
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Destination
        </Button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingDestination ? "Edit Destination" : "Add New Destination"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Destination Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Wedding Venue, Hotel, Restaurant"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <select
                    id="priority"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background"
                  >
                    <option value="1">High Priority</option>
                    <option value="2">Medium Priority</option>
                    <option value="3">Low Priority</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Full address with city, state, zip"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Additional notes about this destination..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="travel_time">Estimated Travel Time (minutes)</Label>
                  <Input
                    id="travel_time"
                    type="number"
                    value={formData.estimated_travel_time}
                    onChange={(e) => setFormData({ ...formData, estimated_travel_time: e.target.value })}
                    placeholder="30"
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cost">Estimated Cost ($)</Label>
                  <Input
                    id="cost"
                    type="number"
                    step="0.01"
                    value={formData.estimated_cost}
                    onChange={(e) => setFormData({ ...formData, estimated_cost: e.target.value })}
                    placeholder="25.00"
                    min="0"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit">{editingDestination ? "Update Destination" : "Add Destination"}</Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Destinations List */}
      {destinations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Navigation className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Destinations Added</h3>
            <p className="text-muted-foreground mb-4">Start planning by adding destinations for your event.</p>
            <Button onClick={() => setShowForm(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add First Destination
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {destinations.map((destination) => (
            <Card key={destination.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{destination.name}</CardTitle>
                    <Badge variant="outline" className={getPriorityColor(destination.priority)}>
                      {getPriorityLabel(destination.priority)}
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(destination)} className="h-8 w-8 p-0">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(destination.id)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">{destination.address}</p>
                </div>

                {destination.description && <p className="text-sm">{destination.description}</p>}

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {destination.estimated_travel_time && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{destination.estimated_travel_time} min</span>
                    </div>
                  )}
                  {destination.estimated_cost && (
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      <span>${destination.estimated_cost}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
