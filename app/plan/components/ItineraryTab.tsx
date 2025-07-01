"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Clock, MapPin, Filter, Users } from "lucide-react"
import { format, parseISO, eachDayOfInterval } from "date-fns"

interface Event {
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
}

interface SubEvent {
  id: string
  name: string
  parent_event_id: string
  date: string
  start_time: string
  end_time: string
  location: string
  type: string
  category: string
  participant_limit: number
  tags: string | null
  parent_event_name?: string
}

interface VendorSchedule {
  id: string
  title: string
  description: string
  date: string
  start_time: string
  end_time: string
  location: string
  vendor_name: string
  vendor_business_name: string
  status: string
}

interface PlanSettings {
  day_start_time: string
  day_end_time: string
}

interface ItineraryTabProps {
  events: Event[]
  subEvents: SubEvent[]
  vendorSchedules: VendorSchedule[]
  planSettings: PlanSettings
  accountInstanceId: string | null
  onRefresh: () => void
}

export default function ItineraryTab({
  events,
  subEvents,
  vendorSchedules,
  planSettings,
  accountInstanceId,
  onRefresh,
}: ItineraryTabProps) {
  const [selectedView, setSelectedView] = useState<"events" | "vendors" | "both">("both")
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([])
  const [selectedVendorIds, setSelectedVendorIds] = useState<string[]>([])
  const [dateRange, setDateRange] = useState({
    start: format(new Date(), "yyyy-MM-dd"),
    end: format(new Date(), "yyyy-MM-dd"),
  })

  // Generate time slots based on plan settings
  const timeSlots = useMemo(() => {
    const slots = []
    const startHour = Number.parseInt(planSettings.day_start_time.split(":")[0])
    const endHour = Number.parseInt(planSettings.day_end_time.split(":")[0])

    // Handle cases where end time is before start time (next day)
    const actualEndHour = endHour <= startHour ? endHour + 24 : endHour

    for (let hour = startHour; hour <= actualEndHour; hour++) {
      const displayHour = hour >= 24 ? hour - 24 : hour
      slots.push(`${displayHour.toString().padStart(2, "0")}:00`)
    }
    return slots
  }, [planSettings])

  // Get days in the selected date range
  const daysInRange = useMemo(() => {
    const start = parseISO(dateRange.start)
    const end = parseISO(dateRange.end)
    return eachDayOfInterval({ start, end })
  }, [dateRange])

  // Filter events and sub-events based on selection
  const filteredEvents = useMemo(() => {
    if (selectedEventIds.length === 0) return events
    return events.filter((event) => selectedEventIds.includes(event.id))
  }, [events, selectedEventIds])

  const filteredSubEvents = useMemo(() => {
    if (selectedEventIds.length === 0) return subEvents
    return subEvents.filter((subEvent) => selectedEventIds.includes(subEvent.parent_event_id))
  }, [subEvents, selectedEventIds])

  const filteredVendorSchedules = useMemo(() => {
    if (selectedVendorIds.length === 0) return vendorSchedules
    return vendorSchedules.filter((schedule) => selectedVendorIds.includes(schedule.id))
  }, [vendorSchedules, selectedVendorIds])

  // Get items for a specific day and time slot
  const getItemsForSlot = (day: Date, timeSlot: string) => {
    const dayStr = format(day, "yyyy-MM-dd")
    const items: Array<{
      type: "event" | "sub-event" | "vendor"
      data: Event | SubEvent | VendorSchedule
    }> = []

    // Add events
    if (selectedView === "events" || selectedView === "both") {
      filteredEvents.forEach((event) => {
        if (event.date === dayStr && event.start_time.startsWith(timeSlot.split(":")[0])) {
          items.push({ type: "event", data: event })
        }
      })

      filteredSubEvents.forEach((subEvent) => {
        if (subEvent.date === dayStr && subEvent.start_time.startsWith(timeSlot.split(":")[0])) {
          items.push({ type: "sub-event", data: subEvent })
        }
      })
    }

    // Add vendor schedules
    if (selectedView === "vendors" || selectedView === "both") {
      filteredVendorSchedules.forEach((schedule) => {
        if (schedule.date === dayStr && schedule.start_time.startsWith(timeSlot.split(":")[0])) {
          items.push({ type: "vendor", data: schedule })
        }
      })
    }

    return items
  }

  const renderTimelineView = () => (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange((prev) => ({ ...prev, end: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="view-select">View</Label>
              <Select
                value={selectedView}
                onValueChange={(value: "events" | "vendors" | "both") => setSelectedView(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="events">Events & Sub-Events</SelectItem>
                  <SelectItem value="vendors">Vendors</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {(selectedView === "events" || selectedView === "both") && (
            <div>
              <Label>Select Events</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {events.map((event) => (
                  <Badge
                    key={event.id}
                    variant={selectedEventIds.includes(event.id) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => {
                      setSelectedEventIds((prev) =>
                        prev.includes(event.id) ? prev.filter((id) => id !== event.id) : [...prev, event.id],
                      )
                    }}
                  >
                    {event.name}
                  </Badge>
                ))}
                <Button variant="ghost" size="sm" onClick={() => setSelectedEventIds([])}>
                  Clear All
                </Button>
              </div>
            </div>
          )}

          {(selectedView === "vendors" || selectedView === "both") && vendorSchedules.length > 0 && (
            <div>
              <Label>Select Vendor Schedules</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {vendorSchedules.map((schedule) => (
                  <Badge
                    key={schedule.id}
                    variant={selectedVendorIds.includes(schedule.id) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => {
                      setSelectedVendorIds((prev) =>
                        prev.includes(schedule.id) ? prev.filter((id) => id !== schedule.id) : [...prev, schedule.id],
                      )
                    }}
                  >
                    {schedule.vendor_business_name}
                  </Badge>
                ))}
                <Button variant="ghost" size="sm" onClick={() => setSelectedVendorIds([])}>
                  Clear All
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>
            {selectedView === "events" && "Events & Sub-Events Timeline"}
            {selectedView === "vendors" && "Vendor Schedules Timeline"}
            {selectedView === "both" && "Shared View - Events & Vendors"}
          </CardTitle>
          <CardDescription>
            Day view from {planSettings.day_start_time} to {planSettings.day_end_time}
          </CardDescription>
          {selectedView === "both" && (
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>Events</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span>Vendors</span>
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="min-w-full">
              {/* Header with days */}
              <div
                className="grid gap-1 mb-2"
                style={{ gridTemplateColumns: `100px repeat(${daysInRange.length}, minmax(200px, 1fr))` }}
              >
                <div className="font-semibold text-sm p-2">Time</div>
                {daysInRange.map((day) => (
                  <div key={day.toISOString()} className="font-semibold text-sm p-2 text-center border rounded">
                    <div>{format(day, "EEE")}</div>
                    <div className="text-lg">{format(day, "d")}</div>
                    <div className="text-xs text-muted-foreground">{format(day, "MMM")}</div>
                  </div>
                ))}
              </div>

              {/* Time slots */}
              {timeSlots.map((timeSlot) => (
                <div
                  key={timeSlot}
                  className="grid gap-1 mb-1"
                  style={{ gridTemplateColumns: `100px repeat(${daysInRange.length}, minmax(200px, 1fr))` }}
                >
                  <div className="text-sm p-2 font-medium text-muted-foreground">{timeSlot}</div>
                  {daysInRange.map((day) => {
                    const items = getItemsForSlot(day, timeSlot)
                    return (
                      <div key={`${day.toISOString()}-${timeSlot}`} className="min-h-[60px] border rounded p-1">
                        {items.map((item, index) => (
                          <div
                            key={index}
                            className={`text-xs p-2 mb-1 rounded border-l-4 ${
                              item.type === "event"
                                ? "bg-blue-100 text-blue-800 border-blue-500"
                                : item.type === "sub-event"
                                  ? "bg-blue-50 text-blue-700 border-blue-300 ml-2"
                                  : "bg-orange-100 text-orange-800 border-orange-500"
                            }`}
                          >
                            <div className="font-medium mb-1">
                              {item.type === "event" && (item.data as Event).name}
                              {item.type === "sub-event" && (item.data as SubEvent).name}
                              {item.type === "vendor" && (item.data as VendorSchedule).title}
                            </div>

                            {item.type === "sub-event" && (
                              <div className="text-xs opacity-75 mb-1">
                                Sub: {(item.data as SubEvent).parent_event_name}
                              </div>
                            )}

                            {item.type === "vendor" && (
                              <div className="text-xs opacity-75 mb-1">
                                {(item.data as VendorSchedule).vendor_business_name}
                              </div>
                            )}

                            <div className="flex items-center gap-1 mb-1">
                              <Clock className="h-3 w-3" />
                              <span>
                                {item.data.start_time} - {item.data.end_time}
                              </span>
                            </div>

                            {item.data.location && (
                              <div className="flex items-center gap-1 mb-1">
                                <MapPin className="h-3 w-3" />
                                <span className="truncate">{item.data.location}</span>
                              </div>
                            )}

                            {(item.type === "event" || item.type === "sub-event") && (
                              <div className="flex items-center gap-1 mb-1">
                                <Users className="h-3 w-3" />
                                <span>{(item.data as Event | SubEvent).participant_limit}</span>
                              </div>
                            )}

                            <div className="flex flex-wrap gap-1">
                              <Badge variant="outline" className="text-xs px-1 py-0">
                                {(item.data as Event | SubEvent).type || (item.data as VendorSchedule).status}
                              </Badge>
                              <Badge variant="outline" className="text-xs px-1 py-0">
                                {(item.data as Event | SubEvent).category || "Vendor"}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Empty state */}
          {events.length === 0 && subEvents.length === 0 && vendorSchedules.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No events or schedules found for the selected date range.</p>
              <p className="text-sm text-muted-foreground mt-2">Create events in the Events page to see them here.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Main Itinerary/Timeline View */}
      {renderTimelineView()}
    </div>
  )
}
