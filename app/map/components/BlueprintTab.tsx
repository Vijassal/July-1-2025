"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Upload, Save, Plus, Edit, Trash2, Ruler, Square, Circle, Minus, Type, RotateCcw } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import CanvasDesigner from "./CanvasDesigner"

interface Blueprint {
  id: string
  name: string
  description: string
  width_ft: number
  height_ft: number
  measurements_unit: string
  created_at: string
  updated_at: string
}

interface BlueprintTabProps {
  userId?: string
  eventId?: string
  eventName?: string
}

export default function BlueprintTab({ userId = "user-1", eventId = "event-1", eventName = "Haldi & Mendhi" }: BlueprintTabProps) {
  const [blueprints, setBlueprints] = useState<Blueprint[]>([])
  const [selectedBlueprint, setSelectedBlueprint] = useState<Blueprint | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Demo blueprint for immediate testing
  const demoBlueprint: Blueprint = {
    id: "demo-1",
    name: "Demo Reception Hall",
    description: "A sample blueprint to test the canvas designer",
    width_ft: 30,
    height_ft: 20,
    measurements_unit: "ft",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  // Form states
  const [blueprintName, setBlueprintName] = useState("")
  const [blueprintDescription, setBlueprintDescription] = useState("")
  const [roomWidth, setRoomWidth] = useState<number>(20)
  const [roomHeight, setRoomHeight] = useState<number>(15)
  const [measurementUnit, setMeasurementUnit] = useState<"ft" | "in">("ft")

  useEffect(() => {
    fetchBlueprints()
  }, [userId, eventId])

  const fetchBlueprints = async () => {
    try {
      // Try to fetch from blueprints table, create it if it doesn't exist
      const { data, error } = await supabase
        .from("blueprints")
        .select("*")
        .eq("user_id", userId)
        .eq("event_id", eventId)
        .order("updated_at", { ascending: false })

      if (error) {
        console.error("Error fetching blueprints:", error)
        // If table doesn't exist, add demo blueprint
        setBlueprints([demoBlueprint])
        setSelectedBlueprint(demoBlueprint)
      } else {
        const fetchedBlueprints = data || []
        if (fetchedBlueprints.length === 0) {
          // Add demo blueprint if no blueprints exist
          setBlueprints([demoBlueprint])
          setSelectedBlueprint(demoBlueprint)
        } else {
          setBlueprints(fetchedBlueprints)
        }
      }
    } catch (error) {
      console.error("Error fetching blueprints:", error)
      // Add demo blueprint on error
      setBlueprints([demoBlueprint])
      setSelectedBlueprint(demoBlueprint)
    } finally {
      setLoading(false)
    }
  }

  const createNewBlueprint = async () => {
    if (!blueprintName.trim()) {
      toast.error("Please enter a blueprint name")
      return
    }

    if (blueprints.length >= 10) {
      toast.error("Maximum of 10 blueprints allowed")
      return
    }

    setSaving(true)
    try {
      const { data, error } = await supabase
        .from("blueprints")
        .insert({
          user_id: userId,
          event_id: eventId,
          name: blueprintName,
          description: blueprintDescription,
          measurements_unit: measurementUnit,
          width_ft: roomWidth,
          height_ft: roomHeight,
        })
        .select()
        .single()

      if (error) throw error

      setBlueprints((prev) => [data, ...prev])
      setSelectedBlueprint(data)
      setIsCreating(false)
      setBlueprintName("")
      setBlueprintDescription("")
      toast.success("Blueprint created successfully")
    } catch (error) {
      console.error("Error creating blueprint:", error)
      toast.error("Failed to create blueprint - table may not exist yet")
    } finally {
      setSaving(false)
    }
  }

  const deleteBlueprint = async (blueprintId: string) => {
    if (!confirm("Are you sure you want to delete this blueprint?")) return

    try {
      const { error } = await supabase.from("blueprints").delete().eq("id", blueprintId)

      if (error) throw error

      setBlueprints((prev) => prev.filter((b) => b.id !== blueprintId))
      if (selectedBlueprint?.id === blueprintId) {
        setSelectedBlueprint(null)
      }
      toast.success("Blueprint deleted successfully")
    } catch (error) {
      console.error("Error deleting blueprint:", error)
      toast.error("Failed to delete blueprint")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Ruler className="h-5 w-5" />
                Blueprint Designer
              </CardTitle>
              <CardDescription>
                Create and edit blueprints for your event spaces. Draw layouts, add measurements, and save up to 10
                blueprints.
              </CardDescription>
            </div>
            <Badge variant="secondary">{blueprints.length}/10 Blueprints</Badge>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Blueprints List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Your Blueprints</CardTitle>
                <Button
                  size="sm"
                  onClick={() => setIsCreating(true)}
                  disabled={blueprints.length >= 10}
                  className="flex items-center gap-1"
                >
                  <Plus className="h-4 w-4" />
                  New
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {blueprints.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No blueprints yet. Create your first one!
                </p>
              ) : (
                blueprints.map((blueprint) => (
                  <div
                    key={blueprint.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedBlueprint?.id === blueprint.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-accent"
                    }`}
                    onClick={() => setSelectedBlueprint(blueprint)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{blueprint.name}</h4>
                        <p className="text-xs text-muted-foreground">
                          {blueprint.width_ft} × {blueprint.height_ft} {blueprint.measurements_unit}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteBlueprint(blueprint.id)
                        }}
                        className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Create New Blueprint Form */}
          {isCreating && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-lg">New Blueprint</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="blueprint-name">Name</Label>
                  <Input
                    id="blueprint-name"
                    value={blueprintName}
                    onChange={(e) => setBlueprintName(e.target.value)}
                    placeholder="e.g., Main Reception Hall"
                  />
                </div>

                <div>
                  <Label htmlFor="blueprint-description">Description</Label>
                  <Textarea
                    id="blueprint-description"
                    value={blueprintDescription}
                    onChange={(e) => setBlueprintDescription(e.target.value)}
                    placeholder="Optional description..."
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="room-width">Width</Label>
                    <Input
                      id="room-width"
                      type="number"
                      value={roomWidth}
                      onChange={(e) => setRoomWidth(Number(e.target.value))}
                      min="1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="room-height">Height</Label>
                    <Input
                      id="room-height"
                      type="number"
                      value={roomHeight}
                      onChange={(e) => setRoomHeight(Number(e.target.value))}
                      min="1"
                    />
                  </div>
                </div>

                <div>
                  <Label>Unit</Label>
                  <div className="flex gap-2 mt-1">
                    <Button
                      size="sm"
                      variant={measurementUnit === "ft" ? "default" : "outline"}
                      onClick={() => setMeasurementUnit("ft")}
                    >
                      Feet
                    </Button>
                    <Button
                      size="sm"
                      variant={measurementUnit === "in" ? "default" : "outline"}
                      onClick={() => setMeasurementUnit("in")}
                    >
                      Inches
                    </Button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={createNewBlueprint} disabled={saving} className="flex-1">
                    {saving ? "Creating..." : "Create Blueprint"}
                  </Button>
                  <Button variant="outline" onClick={() => setIsCreating(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Canvas Area */}
        <div className="lg:col-span-3">
          {selectedBlueprint ? (
            <Card className="h-[600px]">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Edit className="h-4 w-4" />
                      {selectedBlueprint.name}
                    </CardTitle>
                    <CardDescription>
                      {selectedBlueprint.width_ft} × {selectedBlueprint.height_ft} {selectedBlueprint.measurements_unit}
                      {selectedBlueprint.description && ` • ${selectedBlueprint.description}`}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0 h-full">
                <CanvasDesigner
                  blueprint={selectedBlueprint}
                  userId={userId}
                  eventId={eventId}
                />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Ruler className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Blueprint Selected</h3>
                  <p className="text-muted-foreground mb-4">
                    Select an existing blueprint or create a new one to start designing.
                  </p>
                  <Button
                    onClick={() => setIsCreating(true)}
                    disabled={blueprints.length >= 10}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Create Your First Blueprint
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}