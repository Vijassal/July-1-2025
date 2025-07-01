"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Users, Plus, Edit, Trash2, User, Crown, Heart } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

interface SeatArrangement {
  id: string
  event_id: string
  table_number: number
  table_name: string | null
  seat_number: number
  guest_name: string | null
  guest_type: string | null
  dietary_restrictions: string | null
  special_notes: string | null
  created_at: string
}

interface SeatArrangementTabProps {
  userId: string
  eventId: string
  eventName: string
}

export default function SeatArrangementTab({ userId, eventId, eventName }: SeatArrangementTabProps) {
  const [seatArrangements, setSeatArrangements] = useState<SeatArrangement[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingSeat, setEditingSeat] = useState<SeatArrangement | null>(null)
  const [viewMode, setViewMode] = useState<"table" | "list">("table")
  const [formData, setFormData] = useState({
    table_number: "",
    table_name: "",
    seat_number: "",
    guest_name: "",
    guest_type: "",
    dietary_restrictions: "",
    special_notes: "",
  })
  const [localMode, setLocalMode] = useState(false)

  useEffect(() => {
    if (eventId) {
      fetchSeatArrangements()
    }
  }, [eventId])

  const fetchSeatArrangements = async () => {
    try {
      const { data, error } = await supabase
        .from("seat_arrangements")
        .select("*")
        .eq("user_id", userId)
        .eq("event_id", eventId)
        .order("created_at", { ascending: false })

      if (error) {
        console.warn("Seat arrangements table not available - running in local mode:", error.message)
        setSeatArrangements([])
        setLocalMode(true)
      } else {
        setSeatArrangements(data || [])
        setLocalMode(false)
      }
    } catch (error) {
      console.warn("Error fetching seat arrangements - running in local mode:", error)
      setSeatArrangements([])
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
      const seatData = {
        event_id: eventId,
        table_number: Number.parseInt(formData.table_number),
        table_name: formData.table_name || null,
        seat_number: Number.parseInt(formData.seat_number),
        guest_name: formData.guest_name || null,
        guest_type: formData.guest_type || null,
        dietary_restrictions: formData.dietary_restrictions || null,
        special_notes: formData.special_notes || null,
      }

      if (editingSeat) {
        const { error } = await supabase.from("seat_arrangements").update(seatData).eq("id", editingSeat.id)

        if (error) throw error
        toast.success("Seat arrangement updated successfully!")
      } else {
        const { error } = await supabase.from("seat_arrangements").insert([seatData])

        if (error) throw error
        toast.success("Seat arrangement added successfully!")
      }

      resetForm()
      fetchSeatArrangements()
    } catch (error) {
      console.error("Error saving seat arrangement:", error)
      toast.error("Failed to save seat arrangement")
    }
  }

  const handleEdit = (seat: SeatArrangement) => {
    setEditingSeat(seat)
    setFormData({
      table_number: seat.table_number.toString(),
      table_name: seat.table_name || "",
      seat_number: seat.seat_number.toString(),
      guest_name: seat.guest_name || "",
      guest_type: seat.guest_type || "",
      dietary_restrictions: seat.dietary_restrictions || "",
      special_notes: seat.special_notes || "",
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this seat arrangement?")) return

    try {
      const { error } = await supabase.from("seat_arrangements").delete().eq("id", id)

      if (error) throw error
      toast.success("Seat arrangement deleted successfully!")
      fetchSeatArrangements()
    } catch (error) {
      console.error("Error deleting seat arrangement:", error)
      toast.error("Failed to delete seat arrangement")
    }
  }

  const resetForm = () => {
    setFormData({
      table_number: "",
      table_name: "",
      seat_number: "",
      guest_name: "",
      guest_type: "",
      dietary_restrictions: "",
      special_notes: "",
    })
    setEditingSeat(null)
    setShowForm(false)
  }

  const getGuestTypeIcon = (type: string | null) => {
    switch (type?.toLowerCase()) {
      case "vip":
        return <Crown className="h-4 w-4" />
      case "family":
        return <Heart className="h-4 w-4" />
      case "friend":
        return <User className="h-4 w-4" />
      default:
        return <User className="h-4 w-4" />
    }
  }

  const getGuestTypeColor = (type: string | null) => {
    switch (type?.toLowerCase()) {
      case "vip":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "family":
        return "bg-red-100 text-red-800 border-red-200"
      case "friend":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "colleague":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const groupByTable = () => {
    const tables: { [key: number]: SeatArrangement[] } = {}
    seatArrangements.forEach((seat) => {
      if (!tables[seat.table_number]) {
        tables[seat.table_number] = []
      }
      tables[seat.table_number].push(seat)
    })
    return tables
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const tableGroups = groupByTable()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Seat Arrangement</h2>
          <p className="text-muted-foreground">
            {eventName ? `Organize seating for ${eventName}` : "Manage table assignments and guest seating"}
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex rounded-md border">
            <Button
              variant={viewMode === "table" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("table")}
              className="rounded-r-none"
            >
              Table View
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="rounded-l-none"
            >
              List View
            </Button>
          </div>
          <Button onClick={() => setShowForm(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Seat
          </Button>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingSeat ? "Edit Seat Assignment" : "Add New Seat Assignment"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="table_number">Table Number *</Label>
                  <Input
                    id="table_number"
                    type="number"
                    value={formData.table_number}
                    onChange={(e) => setFormData({ ...formData, table_number: e.target.value })}
                    placeholder="1"
                    min="1"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="table_name">Table Name</Label>
                  <Input
                    id="table_name"
                    value={formData.table_name}
                    onChange={(e) => setFormData({ ...formData, table_name: e.target.value })}
                    placeholder="e.g., Head Table, Family Table"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seat_number">Seat Number *</Label>
                  <Input
                    id="seat_number"
                    type="number"
                    value={formData.seat_number}
                    onChange={(e) => setFormData({ ...formData, seat_number: e.target.value })}
                    placeholder="1"
                    min="1"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="guest_type">Guest Type</Label>
                  <select
                    id="guest_type"
                    value={formData.guest_type}
                    onChange={(e) => setFormData({ ...formData, guest_type: e.target.value })}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background"
                  >
                    <option value="">Select Type</option>
                    <option value="VIP">VIP</option>
                    <option value="Family">Family</option>
                    <option value="Friend">Friend</option>
                    <option value="Colleague">Colleague</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="guest_name">Guest Name</Label>
                <Input
                  id="guest_name"
                  value={formData.guest_name}
                  onChange={(e) => setFormData({ ...formData, guest_name: e.target.value })}
                  placeholder="Full name of the guest"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dietary_restrictions">Dietary Restrictions</Label>
                <Input
                  id="dietary_restrictions"
                  value={formData.dietary_restrictions}
                  onChange={(e) => setFormData({ ...formData, dietary_restrictions: e.target.value })}
                  placeholder="e.g., Vegetarian, Gluten-free, Allergies"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="special_notes">Special Notes</Label>
                <Textarea
                  id="special_notes"
                  value={formData.special_notes}
                  onChange={(e) => setFormData({ ...formData, special_notes: e.target.value })}
                  placeholder="Accessibility needs, preferences, etc."
                  rows={3}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit">{editingSeat ? "Update Seat Assignment" : "Add Seat Assignment"}</Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Seat Arrangements Display */}
      {seatArrangements.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Seat Arrangements</h3>
            <p className="text-muted-foreground mb-4">Start organizing by adding seat assignments for your event.</p>
            <Button onClick={() => setShowForm(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add First Seat
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {viewMode === "table" ? (
            // Table View
            <div className="space-y-6">
              {Object.entries(tableGroups).map(([tableNumber, seats]) => {
                const tableName = seats[0]?.table_name
                return (
                  <Card key={tableNumber}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Table {tableNumber}
                        {tableName && <span className="text-muted-foreground">- {tableName}</span>}
                        <Badge variant="outline" className="ml-auto">
                          {seats.length} seats
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {seats.map((seat) => (
                          <div key={seat.id} className="p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  Seat {seat.seat_number}
                                </Badge>
                                {seat.guest_type && (
                                  <Badge variant="outline" className={`text-xs ${getGuestTypeColor(seat.guest_type)}`}>
                                    {getGuestTypeIcon(seat.guest_type)}
                                    <span className="ml-1">{seat.guest_type}</span>
                                  </Badge>
                                )}
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(seat)}
                                  className="h-6 w-6 p-0"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(seat.id)}
                                  className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>

                            {seat.guest_name && <p className="font-medium text-sm mb-1">{seat.guest_name}</p>}

                            {seat.dietary_restrictions && (
                              <p className="text-xs text-muted-foreground mb-1">
                                <span className="font-medium">Diet:</span> {seat.dietary_restrictions}
                              </p>
                            )}

                            {seat.special_notes && (
                              <p className="text-xs text-muted-foreground">
                                <span className="font-medium">Notes:</span> {seat.special_notes}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            // List View
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {seatArrangements.map((seat) => (
                <Card key={seat.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            Table {seat.table_number}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            Seat {seat.seat_number}
                          </Badge>
                        </div>
                        {seat.table_name && <p className="text-sm text-muted-foreground">{seat.table_name}</p>}
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(seat)} className="h-8 w-8 p-0">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(seat.id)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {seat.guest_name && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{seat.guest_name}</span>
                      </div>
                    )}

                    {seat.guest_type && (
                      <Badge variant="outline" className={`text-xs ${getGuestTypeColor(seat.guest_type)}`}>
                        {getGuestTypeIcon(seat.guest_type)}
                        <span className="ml-1">{seat.guest_type}</span>
                      </Badge>
                    )}

                    {seat.dietary_restrictions && (
                      <div className="text-sm">
                        <span className="font-medium">Diet:</span> {seat.dietary_restrictions}
                      </div>
                    )}

                    {seat.special_notes && (
                      <div className="text-sm text-muted-foreground border-t pt-2">
                        <span className="font-medium">Notes:</span> {seat.special_notes}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
