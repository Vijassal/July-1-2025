"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Calendar, Clock, MapPin, Users, ChevronDown, ChevronRight, CalendarDays } from "lucide-react"
import { toast } from "sonner"
import { useSearchParams } from "next/navigation"
import { getOrCreateAccountInstanceId } from "@/lib/account-utils"

// Event and Sub-Event Types
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

interface SubEventData {
  id: string
  parent_event_id: string
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

// Helper to format time as h:mm AM/PM
function formatTime12hr(time: string) {
  if (!time) return ""
  const [hourStr, minuteStr] = time.split(":")
  let hour = Number.parseInt(hourStr, 10)
  const minute = Number.parseInt(minuteStr, 10)
  const ampm = hour >= 12 ? "PM" : "AM"
  hour = hour % 12
  if (hour === 0) hour = 12
  return `${hour}:${minute.toString().padStart(2, "0")} ${ampm}`
}

export default function EventsPage() {
  // Add state for active tab
  const [activeTab, setActiveTab] = useState<"all" | "addEvent" | "addSubEvent">("all")

  // Sync activeTab with URL tab param
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  useEffect(() => {
    if (tabParam === "addEvent" || tabParam === "addSubEvent" || tabParam === "all") {
      setActiveTab(tabParam);
    } else {
      setActiveTab("all");
    }
  }, [tabParam]);

  // State for Events and Sub-Events
  const [events, setEvents] = useState<EventData[]>([])
  const [subEvents, setSubEvents] = useState<SubEventData[]>([])
  const [accountInstanceId, setAccountInstanceId] = useState<string | null>(null)
  const [fetchingAccountInstance, setFetchingAccountInstance] = useState(true)

  // Event Form State
  const [eventForm, setEventForm] = useState({
    name: "",
    date: "",
    startTime: "",
    endTime: "",
    location: "",
    type: "",
    category: "",
    participantLimit: "",
    tags: "",
  })
  const [eventError, setEventError] = useState("")
  const [eventSuccess, setEventSuccess] = useState("")

  // Sub-Event Form State
  const [subEventForm, setSubEventForm] = useState({
    parentEventId: "",
    name: "",
    date: "",
    startTime: "",
    endTime: "",
    location: "",
    type: "",
    category: "",
    participantLimit: "",
    tags: "",
  })
  const [subEventError, setSubEventError] = useState("")
  const [subEventSuccess, setSubEventSuccess] = useState("")

  // Use an object to track expansion state for each event
  const [expandedEvents, setExpandedEvents] = useState<{ [key: string]: boolean }>({})
  const [expandedSubEvents, setExpandedSubEvents] = useState<Set<string>>(new Set())

  // Fetch account_instance_id
  useEffect(() => {
    async function fetchAccountInstance() {
      setFetchingAccountInstance(true)
      
      const accountInstanceId = await getOrCreateAccountInstanceId()
      if (!accountInstanceId) {
        toast.error("Failed to initialize account. Please try again.")
        setAccountInstanceId(null)
      } else {
        setAccountInstanceId(accountInstanceId)
      }
      
      setFetchingAccountInstance(false)
    }
    fetchAccountInstance()
  }, [])

  useEffect(() => {
    if (accountInstanceId) {
      fetchEvents()
      fetchSubEvents()
    }
  }, [accountInstanceId])

  // Fetch Events
  const fetchEvents = async () => {
    if (!accountInstanceId) return setEvents([])
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("account_instance_id", accountInstanceId)
      .order("date", { ascending: true })

    if (error) setEvents([])
    else setEvents(data || [])
  }

  // Fetch Sub-Events
  const fetchSubEvents = async () => {
    if (!accountInstanceId) return setSubEvents([])
    const { data, error } = await supabase.from("sub_events").select("*").eq("account_instance_id", accountInstanceId)

    if (error) setSubEvents([])
    else setSubEvents(data || [])
  }

  // Toggle main event expansion
  const toggleMainEventExpansion = (eventId: string) => {
    setExpandedEvents((prevExpanded) => ({
      ...prevExpanded,
      [eventId]: !prevExpanded[eventId],
    }))
  }

  // Toggle sub-events expansion within a main event
  const toggleSubEventExpansion = (eventId: string) => {
    setExpandedSubEvents((prevExpanded) => {
      const newExpanded = new Set(prevExpanded)
      if (newExpanded.has(eventId)) {
        newExpanded.delete(eventId)
      } else {
        newExpanded.add(eventId)
      }
      return newExpanded
    })
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  }

  const getCategoryGradient = (category: string) => {
    const gradients = {
      wedding: "from-rose-400 to-pink-500",
      corporate: "from-blue-400 to-indigo-500",
      birthday: "from-amber-400 to-orange-500",
      conference: "from-purple-400 to-violet-500",
      social: "from-emerald-400 to-teal-500",
      other: "from-gray-400 to-slate-500",
    }
    return gradients[category?.toLowerCase() as keyof typeof gradients] || gradients.other
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      wedding: "text-rose-700 bg-rose-50 border-rose-200",
      corporate: "text-blue-700 bg-blue-50 border-blue-200",
      birthday: "text-amber-700 bg-amber-50 border-amber-200",
      conference: "text-purple-700 bg-purple-50 border-purple-200",
      social: "text-emerald-700 bg-emerald-50 border-emerald-200",
      other: "text-gray-700 bg-gray-50 border-gray-200",
    }
    return colors[category?.toLowerCase() as keyof typeof colors] || colors.other
  }

  // Event Form Handlers
  const handleEventChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setEventForm({ ...eventForm, [e.target.name]: e.target.value })
    setEventError("")
    setEventSuccess("")
  }

  const handleEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!eventForm.name || !eventForm.date || !eventForm.startTime || !eventForm.endTime || !eventForm.location) {
      setEventError("Please fill out all required fields.")
      return
    }

    const payload = {
      name: eventForm.name,
      date: eventForm.date,
      start_time: eventForm.startTime,
      end_time: eventForm.endTime,
      location: eventForm.location,
      type: eventForm.type,
      category: eventForm.category,
      participant_limit: eventForm.participantLimit ? Number(eventForm.participantLimit) : null,
      tags: eventForm.tags || null,
      account_instance_id: accountInstanceId,
    }

    if (
      !payload.name ||
      !payload.date ||
      !payload.start_time ||
      !payload.end_time ||
      !payload.location ||
      !payload.type ||
      !payload.category ||
      payload.participant_limit === null
    ) {
      setEventError("All fields except tags are required.")
      return
    }

    const { data, error } = await supabase.from("events").insert([payload]).select()

    if (error || !data) {
      setEventError("Failed to add event: " + (error?.message || "Unknown error"))
      return
    }

    setEvents([...events, data[0]])
    setEventSuccess("Event added successfully!")
    setEventForm({
      name: "",
      date: "",
      startTime: "",
      endTime: "",
      location: "",
      type: "",
      category: "",
      participantLimit: "",
      tags: "",
    })
    toast.success("Event added successfully!")
  }

  // Sub-Event Form Handlers
  const handleSubEventChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setSubEventForm({ ...subEventForm, [e.target.name]: e.target.value })
    setSubEventError("")
    setSubEventSuccess("")
  }

  const handleSubEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const payload = {
      parent_event_id: subEventForm.parentEventId || null,
      name: subEventForm.name,
      date: subEventForm.date,
      start_time: subEventForm.startTime,
      end_time: subEventForm.endTime,
      location: subEventForm.location,
      type: subEventForm.type,
      category: subEventForm.category,
      participant_limit: subEventForm.participantLimit ? Number(subEventForm.participantLimit) : null,
      tags: subEventForm.tags || null,
      account_instance_id: accountInstanceId,
    }

    if (
      !payload.parent_event_id ||
      !payload.name ||
      !payload.date ||
      !payload.start_time ||
      !payload.end_time ||
      !payload.location ||
      !payload.type ||
      !payload.category ||
      payload.participant_limit === null
    ) {
      setSubEventError("All fields except tags are required.")
      return
    }

    const { data, error } = await supabase.from("sub_events").insert([payload]).select()

    if (error || !data) {
      setSubEventError("Failed to add sub-event: " + (error?.message || "Unknown error"))
      return
    }

    setSubEvents([...subEvents, data[0]])
    setSubEventSuccess("Sub-Event added successfully!")
    setSubEventForm({
      parentEventId: "",
      name: "",
      date: "",
      startTime: "",
      endTime: "",
      location: "",
      type: "",
      category: "",
      participantLimit: "",
      tags: "",
    })
    toast.success("Sub-Event added successfully!")
  }

  const handleEditEvent = (eventId: string, isSubEvent = false) => {
    toast.info(`Edit ${isSubEvent ? "sub-event" : "event"}: ${eventId}`)
  }

  const handleAddSubEvent = (parentEventId: string) => {
    setActiveTab("addSubEvent")
    setSubEventForm({ ...subEventForm, parentEventId })
  }

  return (
    <div className="space-y-8">
      {/* Banner Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 text-white shadow-2xl mb-0">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-500/20 via-transparent to-amber-500/20"></div>
        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-rose-500 rounded-xl flex items-center justify-center shadow-lg">
              <CalendarDays className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-light">Events Management</h1>
              <p className="text-slate-300">Organize and manage your events efficiently</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Gap */}
      <div className="h-2" />

      {/* Tab Content */}
      {activeTab === "all" && (
        <div>
          {/* Events Grid */}
          {events.length === 0 ? (
            <Card className="p-12 text-center bg-white shadow-sm border border-gray-200">
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-gray-100 w-fit mx-auto">
                  <Calendar className="h-8 w-8 text-gray-500" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-gray-900">No events scheduled</h3>
                  <p className="text-gray-600 max-w-md mx-auto">
                    Get started by creating your first event. Organize meetings, conferences, and special occasions.
                  </p>
                </div>
                <Button
                  onClick={() => setActiveTab("addEvent")}
                  className="bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white shadow-sm hover:shadow-md transition-all duration-200 gap-2 px-6 py-2.5"
                >
                  <Plus className="h-4 w-4" />
                  Create Event
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {events.map((event) => {
                const isMainEventExpanded = expandedEvents[event.id] || false
                const eventSubEvents = subEvents.filter((se) => se.parent_event_id === event.id)
                const hasSubEvents = eventSubEvents.length > 0

                return (
                  <Card
                    key={event.id}
                    className="group bg-white shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200"
                  >
                    {/* Event Header with Gradient */}
                    <div className={`h-1 bg-gradient-to-r ${getCategoryGradient(event.category)}`} />

                    <CardHeader className="pb-4">
                      <div className="space-y-3">
                        {/* Title and Category with Expand Icon */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-gray-800 transition-colors">
                              {event.name}
                            </CardTitle>
                            <button
                              onClick={() => toggleMainEventExpansion(event.id)}
                              className="p-1 rounded-md hover:bg-gray-100 transition-colors"
                            >
                              {isMainEventExpanded ? (
                                <ChevronDown className="h-4 w-4 text-gray-500" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-gray-500" />
                              )}
                            </button>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={`${getCategoryColor(event.category)} font-medium text-xs px-2 py-1`}
                            >
                              {event.category}
                            </Badge>
                            <Badge variant="secondary" className="bg-gray-100 text-gray-700 text-xs px-2 py-1">
                              {event.type}
                            </Badge>
                          </div>
                        </div>

                        {/* Key Info - Always Visible */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="h-4 w-4 text-orange-500" />
                            <span>{formatDate(event.date)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin className="h-4 w-4 text-rose-500" />
                            <span className="truncate">{event.location}</span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>

                    {/* Expanded Details */}
                    {isMainEventExpanded && (
                      <CardContent className="pt-0 space-y-4">
                        {/* Detailed Info */}
                        <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Clock className="h-3 w-3" />
                              <span>Start Time</span>
                            </div>
                            <p className="text-sm font-medium text-gray-900">{formatTime(event.start_time)}</p>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Clock className="h-3 w-3" />
                              <span>End Time</span>
                            </div>
                            <p className="text-sm font-medium text-gray-900">{formatTime(event.end_time)}</p>
                          </div>
                          <div className="space-y-1 col-span-2">
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Users className="h-3 w-3" />
                              <span>Capacity</span>
                            </div>
                            <p className="text-sm font-medium text-gray-900">{event.participant_limit} attendees</p>
                          </div>
                        </div>

                        {/* Tags */}
                        {event.tags && (
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium text-gray-700">Tags</h4>
                            <div className="flex flex-wrap gap-1">
                              {event.tags.split(",").map((tag, index) => (
                                <Badge key={index} variant="outline" className="text-xs bg-white text-gray-600">
                                  {tag.trim()}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Sub-Events */}
                        {hasSubEvents && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <button
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  toggleSubEventExpansion(event.id)
                                }}
                                className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-orange-600 transition-colors"
                              >
                                {expandedSubEvents.has(event.id) ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                                Sub-Events ({eventSubEvents.length})
                              </button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  handleAddSubEvent(event.id)
                                }}
                                className="gap-1 text-xs h-7 px-2 border-gray-300 text-gray-600 hover:bg-gray-50"
                              >
                                <Plus className="h-3 w-3" />
                                Add
                              </Button>
                            </div>

                            {expandedSubEvents.has(event.id) && (
                              <div className="space-y-2">
                                {eventSubEvents.map((subEvent) => (
                                  <div
                                    key={subEvent.id}
                                    className="p-3 rounded-lg bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer"
                                    onClick={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      handleEditEvent(subEvent.id, true)
                                    }}
                                  >
                                    <div className="space-y-1">
                                      <div className="flex items-center justify-between">
                                        <h5 className="text-sm font-medium text-gray-900">{subEvent.name}</h5>
                                        <Badge
                                          variant="outline"
                                          className={`${getCategoryColor(subEvent.category)} text-xs`}
                                        >
                                          {subEvent.category}
                                        </Badge>
                                      </div>
                                      <div className="flex items-center gap-3 text-xs text-gray-600">
                                        <span>{formatTime(subEvent.start_time)}</span>
                                        <span>•</span>
                                        <span className="truncate">{subEvent.location}</span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-2">
                          <Button
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              handleEditEvent(event.id)
                            }}
                            variant="outline"
                            size="sm"
                            className="flex-1 h-8 text-xs border-gray-300 text-gray-700 hover:bg-gray-50"
                          >
                            Edit Event
                          </Button>
                          {!hasSubEvents && (
                            <Button
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                handleAddSubEvent(event.id)
                              }}
                              variant="outline"
                              size="sm"
                              className="flex-1 h-8 text-xs border-gray-300 text-gray-700 hover:bg-gray-50"
                            >
                              Add Sub-Event
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Add Event Form */}
      {activeTab === "addEvent" && (
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-purple-600">Add New Event</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleEventSubmit} className="space-y-4">
              {eventError && <div className="text-red-500 text-sm font-medium">{eventError}</div>}
              {eventSuccess && <div className="text-green-500 text-sm font-medium">{eventSuccess}</div>}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Name *</label>
                  <input
                    name="name"
                    value={eventForm.name}
                    onChange={handleEventChange}
                    placeholder="Event Name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Date *</label>
                  <input
                    name="date"
                    type="date"
                    value={eventForm.date}
                    onChange={handleEventChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Start Time *</label>
                  <input
                    name="startTime"
                    type="time"
                    value={eventForm.startTime}
                    onChange={handleEventChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">End Time *</label>
                  <input
                    name="endTime"
                    type="time"
                    value={eventForm.endTime}
                    onChange={handleEventChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Location *</label>
                  <input
                    name="location"
                    value={eventForm.location}
                    onChange={handleEventChange}
                    placeholder="Location"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Type</label>
                  <input
                    name="type"
                    value={eventForm.type}
                    onChange={handleEventChange}
                    placeholder="Type"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Category</label>
                  <input
                    name="category"
                    value={eventForm.category}
                    onChange={handleEventChange}
                    placeholder="Category"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Participant Limit</label>
                  <input
                    name="participantLimit"
                    type="number"
                    min="1"
                    value={eventForm.participantLimit}
                    onChange={handleEventChange}
                    placeholder="Participant Limit"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Tags</label>
                  <input
                    name="tags"
                    value={eventForm.tags}
                    onChange={handleEventChange}
                    placeholder="Tags (comma separated)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600 text-white px-6 py-2"
                >
                  Add Event
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Add Sub-Event Form */}
      {activeTab === "addSubEvent" && (
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-purple-600">Add New Sub-Event</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubEventSubmit} className="space-y-4">
              {events.length === 0 && (
                <div className="text-red-500 text-sm font-medium">Please add an Event before adding a Sub-Event.</div>
              )}
              {subEventError && <div className="text-red-500 text-sm font-medium">{subEventError}</div>}
              {subEventSuccess && <div className="text-green-500 text-sm font-medium">{subEventSuccess}</div>}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Parent Event *</label>
                  <select
                    name="parentEventId"
                    value={subEventForm.parentEventId}
                    onChange={handleSubEventChange}
                    disabled={events.length === 0}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50"
                  >
                    <option value="">Select Event</option>
                    {events.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        {ev.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Name *</label>
                  <input
                    name="name"
                    value={subEventForm.name}
                    onChange={handleSubEventChange}
                    placeholder="Sub-Event Name"
                    disabled={events.length === 0}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Date *</label>
                  <input
                    name="date"
                    type="date"
                    value={subEventForm.date}
                    onChange={handleSubEventChange}
                    disabled={events.length === 0}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Start Time *</label>
                  <input
                    name="startTime"
                    type="time"
                    value={subEventForm.startTime}
                    onChange={handleSubEventChange}
                    disabled={events.length === 0}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">End Time *</label>
                  <input
                    name="endTime"
                    type="time"
                    value={subEventForm.endTime}
                    onChange={handleSubEventChange}
                    disabled={events.length === 0}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Location *</label>
                  <input
                    name="location"
                    value={subEventForm.location}
                    onChange={handleSubEventChange}
                    placeholder="Location"
                    disabled={events.length === 0}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Type *</label>
                  <input
                    name="type"
                    value={subEventForm.type}
                    onChange={handleSubEventChange}
                    placeholder="Type"
                    disabled={events.length === 0}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Category *</label>
                  <input
                    name="category"
                    value={subEventForm.category}
                    onChange={handleSubEventChange}
                    placeholder="Category"
                    disabled={events.length === 0}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Participant Limit *</label>
                  <input
                    name="participantLimit"
                    type="number"
                    min="1"
                    value={subEventForm.participantLimit}
                    onChange={handleSubEventChange}
                    placeholder="Participant Limit"
                    disabled={events.length === 0}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Tags</label>
                  <input
                    name="tags"
                    value={subEventForm.tags}
                    onChange={handleSubEventChange}
                    placeholder="Tags (comma separated)"
                    disabled={events.length === 0}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  type="submit"
                  disabled={events.length === 0}
                  className="bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600 text-white px-6 py-2"
                >
                  Add Sub-Event
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
