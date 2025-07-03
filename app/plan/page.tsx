"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Calendar,
  Clock,
  MapPin,
  Settings,
  Search,
  X,
  CalendarDays,
  Building2,
  Sparkles,
  Palette,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"
import { getOrCreateAccountInstanceId } from "@/lib/account-utils"

const LOCAL_STORAGE_KEY = "planPageSettings"

interface VendorData {
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
  account_instance_id?: string
}

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
  tags?: string
  account_instance_id?: string
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
  tags?: string
  account_instance_id?: string
}

// Modern BlockTooltip component
function BlockTooltip({ item, x, y }: { item: any; x?: number; y?: number }) {
  if (!item) return null

  const style: React.CSSProperties = {
    position: "fixed",
    zIndex: 99999,
    left: x ? x + 10 : "50%",
    top: y ? y - 10 : "50%",
    transform: x && y ? "none" : "translate(-50%, -100%)",
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "16px",
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
    maxWidth: "320px",
    fontSize: "14px",
    lineHeight: "1.5",
  }

  const getTypeIcon = () => {
    switch (item.blockType) {
      case "event":
        return <CalendarDays className="w-4 h-4 text-blue-600" />
      case "subevent":
        return <Calendar className="w-4 h-4 text-purple-600" />
      case "vendor":
        return <Building2 className="w-4 h-4 text-orange-600" />
      default:
        return <Sparkles className="w-4 h-4 text-slate-600" />
    }
  }

  return (
    <div style={style} className="bg-white rounded-xl shadow-xl border border-slate-200">
      <div className="flex items-center gap-2 mb-2">
        {getTypeIcon()}
        <span className="font-semibold text-slate-900">{item.title}</span>
      </div>
      <div className="text-sm text-slate-600 mb-2 flex items-center gap-1">
        <Clock className="w-3 h-3" />
        {item.startTime} - {item.endTime}
      </div>
      {item.location && (
        <div className="text-sm text-slate-600 flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          {item.location}
        </div>
      )}
      <div className="flex items-center gap-2 mt-2">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color || "#3b82f6" }} />
        <span className="text-xs text-slate-500 capitalize">
          {item.blockType === "event"
            ? "Event"
            : item.blockType === "subevent"
              ? "Sub-Event"
              : item.blockType === "vendor"
                ? "Vendor"
                : "Personal Item"}
        </span>
      </div>
    </div>
  )
}

function isColorDark(hex: string) {
  const r = Number.parseInt(hex.slice(1, 3), 16)
  const g = Number.parseInt(hex.slice(3, 5), 16)
  const b = Number.parseInt(hex.slice(5, 7), 16)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000
  return brightness < 128
}

// Modern SectionFilter component
function SectionFilter({
  title,
  items,
  selectedIds,
  onToggle,
  colors,
  onColorChange,
  filterSearch,
  showMoreLimit,
  icon: Icon,
  nameField = "name",
}: any) {
  const [showMore, setShowMore] = useState(false)

  const filteredItems = items.filter((item: any) => 
    (item[nameField] || item.name || "").toLowerCase().includes(filterSearch.toLowerCase())
  )
  const displayItems = showMore ? filteredItems : filteredItems.slice(0, showMoreLimit)

  return (
    <Card className="border-slate-200/50 shadow-sm bg-white/90 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-slate-800 font-medium text-base flex items-center gap-2">
          <Icon className="w-4 h-4 text-rose-500" />
          {title}
          <Badge variant="secondary" className="ml-auto">
            {filteredItems.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {displayItems.map((item: any) => (
          <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
            <input
              type="checkbox"
              checked={selectedIds.includes(item.id)}
              onChange={() => onToggle(item.id)}
              className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
            />
            <div className="relative">
              <input
                type="color"
                value={colors[item.id] || "#3b82f6"}
                onChange={(e) => onColorChange(item.id, e.target.value)}
                className="w-6 h-6 rounded border border-slate-300 cursor-pointer"
              />
              <Palette className="w-3 h-3 absolute -top-1 -right-1 text-slate-400 pointer-events-none" />
            </div>
            <span className="text-sm text-slate-700 flex-1 truncate font-medium">
              {item[nameField] || item.name || "Untitled"}
            </span>
          </div>
        ))}

        {filteredItems.length > showMoreLimit && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowMore(!showMore)}
            className="w-full text-rose-600 hover:text-rose-700 hover:bg-rose-50"
          >
            {showMore ? (
              <>
                <ChevronUp className="w-4 h-4 mr-1" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-1" />
                Show {filteredItems.length - showMoreLimit} More
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

function EventFilterGroup({
  events,
  subEvents,
  selectedEventIds,
  onToggleEvent,
  eventColors,
  onEventColorChange,
  selectedSubEventIds,
  onToggleSubEvent,
  subEventColors,
  onSubEventColorChange,
  filterSearch,
}: any) {
  const [openEventIds, setOpenEventIds] = useState<string[]>([])

  const toggleEventCollapse = (eventId: string) => {
    setOpenEventIds((ids) => (ids.includes(eventId) ? ids.filter((id) => id !== eventId) : [...ids, eventId]))
  }

  const filteredEvents = events.filter((event: any) => event.name.toLowerCase().includes(filterSearch.toLowerCase()))

  return (
    <Card className="border-slate-200/50 shadow-sm bg-white/90 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-slate-800 font-medium text-base flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-rose-500" />
          Events & Sub-Events
          <Badge variant="secondary" className="ml-auto">
            {filteredEvents.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {filteredEvents.map((event: any) => {
          const eventSubEvents = subEvents.filter((se: any) => se.parent_event_id === event.id)
          const isOpen = openEventIds.includes(event.id)

          return (
            <div key={event.id} className="space-y-2">
              <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                <input
                  type="checkbox"
                  checked={selectedEventIds.includes(event.id)}
                  onChange={() => onToggleEvent(event.id)}
                  className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                />
                <div className="relative">
                  <input
                    type="color"
                    value={eventColors[event.id] || "#3b82f6"}
                    onChange={(e) => onEventColorChange(event.id, e.target.value)}
                    className="w-6 h-6 rounded border border-slate-300 cursor-pointer"
                  />
                  <Palette className="w-3 h-3 absolute -top-1 -right-1 text-slate-400 pointer-events-none" />
                </div>
                <span className="text-sm text-slate-700 flex-1 truncate font-medium">{event.name}</span>

                {eventSubEvents.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleEventCollapse(event.id)}
                    className="h-6 w-6 p-0 hover:bg-slate-200"
                  >
                    {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </Button>
                )}
              </div>

              {isOpen && eventSubEvents.length > 0 && (
                <div className="ml-6 space-y-2 pl-4 border-l-2 border-slate-200">
                  {eventSubEvents.map((subEvent: any) => (
                    <div
                      key={subEvent.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedSubEventIds.includes(subEvent.id)}
                        onChange={() => onToggleSubEvent(subEvent.id)}
                        className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                      />
                      <div className="relative">
                        <input
                          type="color"
                          value={subEventColors[subEvent.id] || "#8b5cf6"}
                          onChange={(e) => onSubEventColorChange(e.target.value)}
                          className="w-6 h-6 rounded border border-slate-300 cursor-pointer"
                        />
                        <Palette className="w-3 h-3 absolute -top-1 -right-1 text-slate-400 pointer-events-none" />
                      </div>
                      <span className="text-sm text-slate-600 flex-1 truncate">{subEvent.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

// Helper function
function getDaysInRange(start: string, end: string) {
  const days = []
  const currentDate = new Date(start + "T00:00:00")
  const endDate = new Date(end + "T00:00:00")

  while (currentDate <= endDate) {
    days.push(currentDate.toISOString().slice(0, 10))
    currentDate.setDate(currentDate.getDate() + 1)
  }
  return days
}

// Enhanced ItineraryPanel component
const ItineraryPanel = ({
  itemType,
  scrollRef,
  onScroll,
  visibleDays,
  getTodayDateString,
  timeLabels,
  getItemsForDay,
  currentTime,
  eventColors,
  subEventColors,
  vendorColors,
  isColorDark,
  setHoveredBlockId,
  setTooltipPos,
  setSelectedTask,
}: {
  itemType: "event" | "vendor"
  scrollRef: React.RefObject<HTMLDivElement>
  onScroll: () => void
  visibleDays: string[]
  getTodayDateString: () => string
  timeLabels: string[]
  getItemsForDay: (day: string, itemType: "event" | "vendor") => any[]
  currentTime: Date
  eventColors: Record<string, string>
  subEventColors: Record<string, string>
  vendorColors: Record<string, string>
  isColorDark: (hex: string) => boolean
  setHoveredBlockId: (id: string | null) => void
  setTooltipPos: (pos: { x: number; y: number } | null) => void
  setSelectedTask: (task: any) => void
}) => {
  const getTypeIcon = (blockType: string) => {
    switch (blockType) {
      case "event":
        return <CalendarDays className="w-3 h-3" />
      case "subevent":
        return <Calendar className="w-3 h-3" />
      case "vendor":
        return <Building2 className="w-3 h-3" />
      default:
        return <Sparkles className="w-3 h-3" />
    }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Enhanced Header */}
      <div className="flex sticky top-0 z-20 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 flex-shrink-0">
        <div className="w-20 flex-shrink-0 border-r border-slate-200 bg-white" />
        <div className="flex-1 flex">
          {visibleDays.map((day) => {
            const isToday = day === getTodayDateString()
            const dayName = new Date(day + "T00:00:00").toLocaleDateString("en-US", { weekday: "short" })
            const dayNumber = new Date(day + "T00:00:00").getDate()
            const monthName = new Date(day + "T00:00:00").toLocaleDateString("en-US", { month: "short" })

            return (
              <div
                key={`${itemType}-header-${day}`}
                className={`border-l border-slate-200 text-center py-4 transition-colors ${
                  isToday ? "bg-gradient-to-b from-rose-50 to-amber-50" : "bg-white"
                }`}
                style={{
                  flex: visibleDays.length <= 7 ? `1 1 ${100 / visibleDays.length}%` : "0 0 200px",
                  minWidth: visibleDays.length <= 7 ? `${Math.max(120, 100 / visibleDays.length)}px` : "200px",
                }}
              >
                <div className="text-xs text-slate-500 font-medium uppercase tracking-wide">{dayName}</div>
                <div className={`text-2xl font-light mt-1 ${isToday ? "text-rose-600" : "text-slate-800"}`}>
                  {dayNumber}
                </div>
                <div className="text-xs text-slate-400 font-medium">{monthName}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Enhanced Scrolling Content */}
      <div className="flex-1 overflow-y-auto" ref={scrollRef} onScroll={onScroll}>
        <div
          className="flex relative pb-8"
          style={{
            height: "1920px",
            overflowX: visibleDays.length > 7 ? "auto" : "hidden",
          }}
        >
          {/* Enhanced Time Gutter */}
          <div className="w-20 flex-shrink-0 text-right text-xs text-slate-400 select-none pt-4 sticky left-0 bg-white z-10 border-r border-slate-200">
            {timeLabels.map((label) => (
              <div key={label} className="relative h-[80px] flex items-start justify-end pr-3 pt-1">
                <span className="bg-white px-1 text-slate-500 font-medium">{label}</span>
              </div>
            ))}
          </div>

          {/* Enhanced Day Columns */}
          <div className="flex-1 flex">
            {visibleDays.map((day) => {
              const isToday = day === getTodayDateString()
              const itemsForDay = getItemsForDay(day, itemType)

              return (
                <div
                  key={`${itemType}-col-${day}`}
                  className="border-l border-slate-200 relative"
                  style={{
                    flex: visibleDays.length <= 7 ? `1 1 ${100 / visibleDays.length}%` : "0 0 200px",
                    minWidth: visibleDays.length <= 7 ? `${Math.max(120, 100 / visibleDays.length)}px` : "200px",
                  }}
                >
                  {/* Grid lines */}
                  <div className="absolute inset-0 z-0">
                    {timeLabels.map((_, i) => (
                      <div key={i} className="h-[80px] border-t border-slate-100"></div>
                    ))}
                  </div>

                  {/* Today highlight */}
                  {isToday && (
                    <div className="absolute inset-0 bg-gradient-to-b from-rose-50/30 to-amber-50/30 z-0"></div>
                  )}

                  {/* Current time indicator */}
                  {isToday && (
                    <div
                      className="absolute w-full flex items-center z-10"
                      style={{ top: `${((currentTime.getHours() * 60 + currentTime.getMinutes()) / 1440) * 1920}px` }}
                    >
                      <div className="w-2 h-2 rounded-full bg-rose-500 -ml-1 z-10 shadow-sm"></div>
                      <div className="flex-grow h-0.5 bg-rose-500 shadow-sm"></div>
                    </div>
                  )}

                  {/* Enhanced Event Blocks */}
                  <div className="absolute inset-0 z-10 p-1">
                    {itemsForDay.map((item: any) => {
                      const width = 100 / item.numCols
                      const left = item.colIndex * width
                      const top = (item.relativeStartMinutes / 1440) * 1920
                      const height = (item.duration / 1440) * 1920
                      const isSmall = height < 40
                      const isTiny = height < 25

                      const getColor = () => {
                        const id = item.id.split("-").slice(1).join("-")
                        if (item.blockType === "event") return eventColors[id] || "#3B82F6"
                        if (item.blockType === "subevent") return subEventColors[id] || "#8B5CF6"
                        if (item.blockType === "vendor") return vendorColors[id] || "#F59E0B"
                        return "#6B7280"
                      }

                      const color = getColor()
                      const isDarkColor = isColorDark(color)

                      return (
                        <div
                          key={item.id}
                          className="absolute rounded-lg shadow-sm cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] border border-white/50 backdrop-blur-sm"
                          style={{
                            top: `${top}px`,
                            left: `${left}%`,
                            width: `${width - 1}%`,
                            height: `${height}px`,
                            backgroundColor: color,
                            color: isDarkColor ? "white" : "black",
                          }}
                          onMouseEnter={(e) => {
                            setHoveredBlockId(item.id)
                            setTooltipPos({ x: e.clientX, y: e.clientY })
                          }}
                          onMouseLeave={() => {
                            setHoveredBlockId(null)
                            setTooltipPos(null)
                          }}
                          onClick={() => setSelectedTask(item)}
                        >
                          <div className="h-full flex flex-col p-2">
                            <div className="flex items-start gap-1 flex-shrink-0">
                              {getTypeIcon(item.blockType)}
                              {!isTiny && <span className="text-xs font-medium truncate flex-1">{item.name}</span>}
                            </div>

                            {!isSmall && (
                              <>
                                <div className="text-xs opacity-90 mt-1 flex items-center gap-1">
                                  <Clock className="w-2 h-2" />
                                  {item.startTime} - {item.endTime}
                                </div>
                                {item.location && !isTiny && (
                                  <div className="text-xs opacity-75 truncate mt-1 flex items-center gap-1">
                                    <MapPin className="w-2 h-2" />
                                    {item.location}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

// Enhanced ItineraryView component
const ItineraryView = ({
  type,
  agendaStartTime,
  dateRange,
  getFilteredItems,
  eventColors,
  subEventColors,
  vendorColors,
  setHoveredBlockId,
  setTooltipPos,
  setSelectedTask,
}: {
  type: "event" | "vendor" | "both"
  agendaStartTime: number
  dateRange: { from: string; to: string }
  getFilteredItems: (itemType: "event" | "vendor") => any[]
  eventColors: Record<string, string>
  subEventColors: Record<string, string>
  vendorColors: Record<string, string>
  setHoveredBlockId: (id: string | null) => void
  setTooltipPos: (pos: { x: number; y: number } | null) => void
  setSelectedTask: (task: any) => void
}) => {
  const [currentTime, setCurrentTime] = useState(new Date())
  const eventScrollRef = useRef<HTMLDivElement>(null)
  const vendorScrollRef = useRef<HTMLDivElement>(null)
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null)

  const handleScroll = (scroller: "event" | "vendor") => {
    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current)
    }

    const sourceRef = scroller === "event" ? eventScrollRef : vendorScrollRef
    const targetRef = scroller === "event" ? vendorScrollRef : eventScrollRef

    if (
      sourceRef.current &&
      targetRef.current &&
      Math.abs(sourceRef.current.scrollTop - targetRef.current.scrollTop) > 1
    ) {
      targetRef.current.scrollTop = sourceRef.current.scrollTop
    }

    scrollTimeout.current = setTimeout(() => {
      // Clear timeout after a short delay
    }, 50)
  }

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    // agendaStartTime is in minutes. Each hour is 80px high.
    const hour = agendaStartTime / 60
    const initialScrollTop = hour * 80

    if (eventScrollRef.current) {
      eventScrollRef.current.scrollTop = initialScrollTop
    }
    if (vendorScrollRef.current) {
      vendorScrollRef.current.scrollTop = initialScrollTop
    }
  }, [type, agendaStartTime])

  const allDays = dateRange.from && dateRange.to ? getDaysInRange(dateRange.from, dateRange.to) : []

  // Limit to 7 days maximum for optimal display
  const visibleDays = allDays.slice(0, 7)

  if (visibleDays.length === 0) {
    return (
      <Card className="flex-grow flex items-center justify-center text-center py-12 bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200">
        <div className="space-y-4">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-rose-100 to-amber-100 rounded-full flex items-center justify-center">
            <CalendarDays className="w-8 h-8 text-rose-500" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-slate-800 mb-2">Select Date Range</h3>
            <p className="text-slate-600">Please select a valid date range to display your itinerary timeline.</p>
          </div>
        </div>
      </Card>
    )
  }

  const timeLabels = Array.from({ length: 24 }, (_, i) => {
    const startHour = agendaStartTime / 60
    const hour = (startHour + i) % 24
    const hour12 = hour % 12 === 0 ? 12 : hour % 12
    const ampm = hour < 12 ? "AM" : "PM"

    if (hour === 0) return `12 AM`
    if (hour === 12) return "12 PM"
    return `${hour12} ${ampm}`
  })

  const getItemsForDay = (day: string, itemType: "event" | "vendor") => {
    const filteredItems = getFilteredItems(itemType)
    const dayItems = filteredItems
      .filter((item: any) => item.date === day)
      .map((item: any) => {
        const [startH, startM] = item.startTime.split(":").map(Number)
        const [endH, endM] = (item.endTime || "23:59").split(":").map(Number)

        const startMinutes = startH * 60 + startM
        let endMinutes = endH * 60 + endM
        if (endMinutes === 0 && startMinutes !== 0) endMinutes = 24 * 60

        let duration = endMinutes - startMinutes
        if (duration < 0) {
          duration += 1440
        }

        let relativeStartMinutes
        if (startMinutes >= agendaStartTime) {
          relativeStartMinutes = startMinutes - agendaStartTime
        } else {
          relativeStartMinutes = 1440 - agendaStartTime + startMinutes
        }
        const relativeEndMinutes = relativeStartMinutes + duration

        return { ...item, startMinutes, endMinutes, duration, relativeStartMinutes, relativeEndMinutes }
      })
      .sort((a: any, b: any) => a.relativeStartMinutes - b.relativeStartMinutes)

    // Overlap detection
    const eventGroups: any[][] = []

    if (dayItems.length > 0) {
      let currentGroup = [dayItems[0]]

      for (let i = 1; i < dayItems.length; i++) {
        const event = dayItems[i]
        const groupEndTime = Math.max(...currentGroup.map((e) => e.relativeEndMinutes))

        if (event.relativeStartMinutes < groupEndTime) {
          currentGroup.push(event)
        } else {
          eventGroups.push(currentGroup)
          currentGroup = [event]
        }
      }
      eventGroups.push(currentGroup)
    }

    eventGroups.forEach((group) => {
      const columns: any[][] = []
      group.sort((a, b) => a.relativeStartMinutes - b.relativeStartMinutes)

      group.forEach((event) => {
        let placed = false
        for (let i = 0; i < columns.length; i++) {
          if (columns[i][columns[i].length - 1].relativeEndMinutes <= event.relativeStartMinutes) {
            columns[i].push(event)
            placed = true
            break
          }
        }
        if (!placed) columns.push([event])
      })

      const numCols = columns.length
      columns.forEach((col, colIndex) => {
        col.forEach((event: any) => {
          event.numCols = numCols
          event.colIndex = colIndex
        })
      })
    })

    return dayItems
  }

  const panelProps = {
    visibleDays,
    getTodayDateString: () => {
      const today = new Date()
      return today.toISOString().slice(0, 10)
    },
    timeLabels,
    getItemsForDay,
    currentTime,
    eventColors,
    subEventColors,
    vendorColors,
    isColorDark,
    setHoveredBlockId,
    setTooltipPos,
    setSelectedTask,
  }

  if (type === "both") {
    return (
      <Card className="flex flex-col h-full border-slate-200/50 shadow-lg bg-white/90 backdrop-blur-sm overflow-hidden">
        {/* Enhanced Header */}
        <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-slate-800 font-light text-xl flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-rose-500" />
              Shared Timeline View
            </CardTitle>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500 shadow-sm"></div>
                <span className="text-slate-600 font-medium">Events</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500 shadow-sm"></div>
                <span className="text-slate-600 font-medium">Vendors</span>
              </div>
            </div>
          </div>
        </CardHeader>

        {/* Content Area */}
        <div className="flex flex-1 overflow-hidden">
          <ItineraryPanel
            itemType="event"
            scrollRef={eventScrollRef}
            onScroll={() => handleScroll("event")}
            {...panelProps}
          />
          <div className="w-px bg-gradient-to-b from-slate-200 to-slate-300" />
          <ItineraryPanel
            itemType="vendor"
            scrollRef={vendorScrollRef}
            onScroll={() => handleScroll("vendor")}
            {...panelProps}
          />
        </div>
      </Card>
    )
  }

  // Single View
  return (
    <Card className="flex flex-col h-full border-slate-200/50 shadow-lg bg-white/90 backdrop-blur-sm overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 pb-4">
        <CardTitle className="text-slate-800 font-light text-xl flex items-center gap-2">
          {type === "event" ? (
            <>
              <CalendarDays className="w-5 h-5 text-blue-500" />
              Events Timeline
            </>
          ) : (
            <>
              <Building2 className="w-5 h-5 text-orange-500" />
              Vendors Timeline
            </>
          )}
        </CardTitle>
      </CardHeader>
      <ItineraryPanel
        itemType={type === "event" ? "event" : "vendor"}
        scrollRef={eventScrollRef}
        onScroll={() => {}}
        {...panelProps}
      />
    </Card>
  )
}

export default function PlanPage() {
  const [agendaViewType, setAgendaViewType] = useState<"event" | "vendor" | "both">("both")
  const [agendaStartTime, setAgendaStartTime] = useState(6 * 60) // 6 AM
  const [showFilters, setShowFilters] = useState(false)
  const [filterSearch, setFilterSearch] = useState("")
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([])
  const [selectedSubEventIds, setSelectedSubEventIds] = useState<string[]>([])
  const [selectedVendorIds, setSelectedVendorIds] = useState<string[]>([])
  const [eventColors, setEventColors] = useState<Record<string, string>>({})
  const [subEventColors, setSubEventColors] = useState<Record<string, string>>({})
  const [vendorColors, setVendorColors] = useState<Record<string, string>>({})
  const [events, setEvents] = useState<EventData[]>([])
  const [subEvents, setSubEventData] = useState<SubEventData[]>([])
  const [vendors, setVendors] = useState<VendorData[]>([])
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null)
  const [hoveredBlockId, setHoveredBlockId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState(() => {
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    return {
      from: today.toISOString().slice(0, 10),
      to: tomorrow.toISOString().slice(0, 10),
    }
  })
  const [selectedTask, setSelectedTask] = useState<any | null>(null)

  // Load settings from localStorage on initial render
  useEffect(() => {
    const savedSettings = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings)
        if (parsed.dateRange) setDateRange(parsed.dateRange)
        if (parsed.agendaViewType) setAgendaViewType(parsed.agendaViewType)
        if (parsed.filterSearch) setFilterSearch(parsed.filterSearch)
        if (parsed.selectedEventIds) setSelectedEventIds(parsed.selectedEventIds)
        if (parsed.selectedSubEventIds) setSelectedSubEventIds(parsed.selectedSubEventIds)
        if (parsed.selectedVendorIds) setSelectedVendorIds(parsed.selectedVendorIds)
        if (parsed.eventColors) setEventColors(parsed.eventColors)
        if (parsed.subEventColors) setSubEventColors(parsed.subEventColors)
        if (parsed.vendorColors) setVendorColors(parsed.vendorColors)
        if ("agendaStartTime" in parsed && parsed.agendaStartTime !== null) {
          setAgendaStartTime(parsed.agendaStartTime)
        }
      } catch (error) {
        console.error("Failed to parse plan page settings from localStorage", error)
      }
    }
  }, [])

  // Save settings to localStorage whenever they change
  useEffect(() => {
    const settingsToSave = {
      dateRange,
      agendaViewType,
      filterSearch,
      selectedEventIds,
      selectedSubEventIds,
      selectedVendorIds,
      eventColors,
      subEventColors,
      vendorColors,
      agendaStartTime,
    }

    const handler = setTimeout(() => {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(settingsToSave))
    }, 500)

    return () => {
      clearTimeout(handler)
    }
  }, [
    dateRange,
    agendaViewType,
    filterSearch,
    selectedEventIds,
    selectedSubEventIds,
    selectedVendorIds,
    eventColors,
    subEventColors,
    vendorColors,
    agendaStartTime,
  ])

  // Time options for start time dropdown
  const timeOptions = Array.from({ length: 24 }, (_, i) => {
    const hour = i
    const minute = 0
    const hour12 = hour % 12 === 0 ? 12 : hour % 12
    const ampm = hour < 12 ? "AM" : "PM"
    const label = `${hour12}:${minute === 0 ? "00" : "30"} ${ampm}`
    return { value: hour * 60 + minute, label }
  })

  function getTodayDateString() {
    const today = new Date()
    return today.toISOString().slice(0, 10)
  }

  function getAgendaTimelineData() {
    const allData: any[] = []

    events.forEach((ev) => {
      allData.push({
        ...ev,
        title: ev.name,
        blockType: "event",
        color: eventColors[ev.id] || "#3b82f6",
        id: `event-${ev.id}`,
        startTime: ev.start_time || "00:00",
        endTime: ev.end_time || "01:00",
      })
    })

    subEvents.forEach((se) => {
      allData.push({
        ...se,
        title: se.name,
        blockType: "subevent",
        color: subEventColors[se.id] || "#8b5cf6",
        id: `subevent-${se.id}`,
        startTime: se.start_time || "00:00",
        endTime: se.end_time || "01:00",
      })
    })

    vendors.forEach((v) => {
      allData.push({
        ...v,
        title: v.title,
        blockType: "vendor",
        color: vendorColors[v.id] || "#10b981",
        id: `vendor-${v.id}`,
        startTime: v.start_time || "00:00",
        endTime: v.end_time || "01:00",
      })
    })

    return allData
  }

  useEffect(() => {
    async function fetchAll() {
      try {
        setLoading(true)

        // Get or create account instance
        const accountInstanceId = await getOrCreateAccountInstanceId()
        if (!accountInstanceId) {
          toast.error("Failed to initialize account. Please try again.")
          return
        }

        // Fetch events using correct schema
        const { data: eventsData } = await supabase
          .from("events")
          .select("*")
          .eq("account_instance_id", accountInstanceId)

        // Fetch sub-events using correct schema
        const { data: subEventsData } = await supabase
          .from("sub_events")
          .select("*")
          .eq("account_instance_id", accountInstanceId)

        // Fetch vendors (using the correct table name)
        const { data: vendorsData } = await supabase
          .from("vendors")
          .select("*")
          .eq("account_instance_id", accountInstanceId)

        if (eventsData) setEvents(eventsData)
        if (subEventsData) setSubEventData(subEventsData)
        if (vendorsData) {
          // Transform vendors data to match VendorData interface
          const transformedVendors = vendorsData.map(vendor => ({
            id: vendor.id,
            title: vendor.name || vendor.business_name || "Vendor",
            description: vendor.description || vendor.event || "",
            date: vendor.date,
            start_time: vendor.start_time,
            end_time: vendor.end_time || "",
            location: vendor.location || "",
            vendor_name: vendor.name || "",
            vendor_business_name: vendor.business_name || vendor.name || "",
            status: vendor.type || vendor.category || "Scheduled",
            account_instance_id: vendor.account_instance_id
          }))
          setVendors(transformedVendors)
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        toast.error("Failed to load planning data")
      } finally {
        setLoading(false)
      }
    }

    fetchAll()
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (tooltipPos) setTooltipPos(null)
    }

    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape" && tooltipPos) setTooltipPos(null)
    }

    document.addEventListener("click", handleClick)
    document.addEventListener("keydown", handleEsc)
    return () => {
      document.removeEventListener("click", handleClick)
      document.removeEventListener("keydown", handleEsc)
    }
  }, [tooltipPos])

  function getAgendaTimelineDataFiltered(typeOverride?: "event" | "vendor") {
    const allData = getAgendaTimelineData()
    const type = typeOverride || agendaViewType

    if (type === "event") {
      return allData.filter((item) => item.blockType === "event" || item.blockType === "subevent")
    } else if (type === "vendor") {
      return allData.filter((item) => item.blockType === "vendor")
    }

    return allData
  }

  const getFilteredItems = (itemType: "event" | "vendor") => {
    const allItems = getAgendaTimelineDataFiltered(itemType)
    return allItems.filter((item) => {
      const id = item.id.split("-").slice(1).join("-")
      if (item.blockType === "event") return selectedEventIds.includes(id)
      if (item.blockType === "subevent") return selectedSubEventIds.includes(id)
      if (item.blockType === "vendor") return selectedVendorIds.includes(id)
      return false
    })
  }

  if (loading) {
    return (
      <div className="space-y-6 max-w-full p-6">
        <Card className="border-slate-200/50 shadow-lg bg-white/90 backdrop-blur-sm">
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-rose-500 mx-auto" />
              <div>
                <h3 className="text-lg font-medium text-slate-800">Loading Your Plan</h3>
                <p className="text-slate-600">Fetching your events and timeline data...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-full p-6">
      {/* Enhanced Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-500/20 via-transparent to-amber-500/20"></div>
        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-amber-500 rounded-xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-light">Event Planning Dashboard</h1>
              <p className="text-slate-300">Orchestrate your timeline with precision and elegance</p>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced View Controls */}
      <Card className="border-slate-200/50 shadow-lg bg-white/90 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex flex-wrap gap-3">
              <Button
                variant={agendaViewType === "event" ? "default" : "outline"}
                onClick={() => setAgendaViewType("event")}
                className={
                  agendaViewType === "event"
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md"
                    : "border-slate-200 hover:bg-slate-50"
                }
              >
                <CalendarDays className="w-4 h-4 mr-2" />
                Events Only
              </Button>
              <Button
                variant={agendaViewType === "vendor" ? "default" : "outline"}
                onClick={() => setAgendaViewType("vendor")}
                className={
                  agendaViewType === "vendor"
                    ? "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-md"
                    : "border-slate-200 hover:bg-slate-50"
                }
              >
                <Building2 className="w-4 h-4 mr-2" />
                Vendors Only
              </Button>
              <Button
                variant={agendaViewType === "both" ? "default" : "outline"}
                onClick={() => setAgendaViewType("both")}
                className={
                  agendaViewType === "both"
                    ? "bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white shadow-md"
                    : "border-slate-200 hover:bg-slate-50"
                }
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Shared View
              </Button>
            </div>

            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={`border-slate-200 hover:bg-slate-50 ${showFilters ? "bg-slate-100" : ""}`}
            >
              <Settings className="w-4 h-4 mr-2" />
              {showFilters ? "Hide Filters" : "Show Filters"}
              {(selectedEventIds.length > 0 || selectedSubEventIds.length > 0 || selectedVendorIds.length > 0) && (
                <Badge variant="secondary" className="ml-2">
                  {selectedEventIds.length + selectedSubEventIds.length + selectedVendorIds.length}
                </Badge>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Date Navigation */}
      <Card className="border-slate-200/50 shadow-sm bg-white/90 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="startDate" className="text-slate-700 font-medium">
                From:
              </Label>
              <Input
                type="date"
                id="startDate"
                value={dateRange.from}
                onChange={(e) => setDateRange((dr) => ({ ...dr, from: e.target.value }))}
                className="border-slate-200 focus:border-rose-400"
              />
            </div>

            <div className="flex items-center gap-2">
              <Label htmlFor="endDate" className="text-slate-700 font-medium">
                To:
              </Label>
              <Input
                type="date"
                id="endDate"
                value={dateRange.to}
                onChange={(e) => setDateRange((dr) => ({ ...dr, to: e.target.value }))}
                className="border-slate-200 focus:border-rose-400"
              />
            </div>

            <Button
              variant="outline"
              onClick={() => setDateRange({ from: getTodayDateString(), to: getTodayDateString() })}
              className="border-rose-200 text-rose-600 hover:bg-rose-50"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Today
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Timeline View */}
      <div className="h-[70vh]">
        <ItineraryView
          key={agendaStartTime}
          type={agendaViewType}
          agendaStartTime={agendaStartTime}
          dateRange={dateRange}
          getFilteredItems={getFilteredItems}
          eventColors={eventColors}
          subEventColors={subEventColors}
          vendorColors={vendorColors}
          setHoveredBlockId={setHoveredBlockId}
          setTooltipPos={setTooltipPos}
          setSelectedTask={setSelectedTask}
        />
      </div>

      {/* Enhanced Filters Sidebar */}
      {showFilters && (
        <div className="fixed right-0 top-0 h-full w-full sm:w-96 bg-white/95 backdrop-blur-md border-l border-slate-200 shadow-2xl z-50 flex flex-col overflow-hidden">
          <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-light text-slate-800">Filters & Settings</h2>
                <p className="text-slate-600 text-sm">Customize your timeline view</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowFilters(false)} className="hover:bg-slate-200">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search events, sub-events, vendors..."
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
                className="pl-10 border-slate-200 focus:border-rose-400"
              />
            </div>

            {/* Agenda Filters */}
            <div className="space-y-4">
              <EventFilterGroup
                events={events}
                subEvents={subEvents}
                selectedEventIds={selectedEventIds}
                onToggleEvent={(id: any) =>
                  setSelectedEventIds(
                    selectedEventIds.includes(id)
                      ? selectedEventIds.filter((eid: any) => eid !== id)
                      : [...selectedEventIds, id],
                  )
                }
                eventColors={eventColors}
                onEventColorChange={(id: any, color: any) => setEventColors((c: any) => ({ ...c, [id]: color }))}
                selectedSubEventIds={selectedSubEventIds}
                onToggleSubEvent={(id: any) =>
                  setSelectedSubEventIds(
                    selectedSubEventIds.includes(id)
                      ? selectedSubEventIds.filter((sid: any) => sid !== id)
                      : [...selectedSubEventIds, id],
                  )
                }
                subEventColors={subEventColors}
                onSubEventColorChange={(id: any, color: any) => setSubEventColors((c: any) => ({ ...c, [id]: color }))}
                filterSearch={filterSearch}
              />

              <SectionFilter
                title="Vendors"
                items={vendors}
                selectedIds={selectedVendorIds}
                onToggle={(id: any) =>
                  setSelectedVendorIds(
                    selectedVendorIds.includes(id)
                      ? selectedVendorIds.filter((vid: any) => vid !== id)
                      : [...selectedVendorIds, id],
                  )
                }
                colors={vendorColors}
                onColorChange={(id: any, color: any) => setVendorColors((c: any) => ({ ...c, [id]: color }))}
                filterSearch={filterSearch}
                showMoreLimit={5}
                icon={Building2}
                nameField="title"
              />

              {/* Enhanced Settings */}
              <Card className="border-slate-200/50 shadow-sm bg-white/90 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-slate-800 font-medium text-base flex items-center gap-2">
                    <Settings className="w-4 h-4 text-rose-500" />
                    Display Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-slate-700 font-medium mb-2 block">Timeline Start Time</Label>
                    <Select
                      value={agendaStartTime.toString()}
                      onValueChange={(value) => setAgendaStartTime(Number(value))}
                    >
                      <SelectTrigger className="border-slate-200 focus:border-rose-400">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {timeOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value.toString()}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-6 border-t border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100 space-y-3">
            <Button
              variant="outline"
              onClick={() => {
                setSelectedEventIds([])
                setSelectedSubEventIds([])
                setSelectedVendorIds([])
                setFilterSearch("")
              }}
              className="w-full border-slate-200 hover:bg-slate-50"
            >
              <X className="w-4 h-4 mr-2" />
              Clear All Filters
            </Button>
            <Button
              onClick={() => setShowFilters(false)}
              className="w-full bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white"
            >
              Apply Filters
            </Button>
          </div>
        </div>
      )}

      {/* Tooltip */}
      {tooltipPos && hoveredBlockId && (
        <BlockTooltip
          item={getAgendaTimelineData().find((item) => item.id === hoveredBlockId)}
          x={tooltipPos.x}
          y={tooltipPos.y}
        />
      )}
    </div>
  )
}
