"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Calendar,
  Clock,
  MapPin,
  Plus,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Loader2,
  Users,
  Check,
  Trash2,
  Settings,
  Building2,
  Search,
  X,
} from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { getOrCreateAccountInstanceId } from "@/lib/account-utils"

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

const VIEW_OPTIONS = [
  { key: "day", label: "Day" },
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
  { key: "year", label: "Year" },
]

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

function getToday() {
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth(), date: now.getDate() }
}

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

interface PersonalCalendarItem {
  id: string
  title: string
  description: string | null
  date: string
  start_time: string | null
  end_time: string | null
  is_checklist: boolean
  is_completed: boolean
}

type Task = {
  title: string
  date: string
  notes: string
  assignee: string
  budget: string
  tag: string
  reminder: string
  startTime: string
  endTime: string
  location: string
  files: FileList | null
  todoList: string[]
}

function TaskModal({
  open,
  onClose,
  onSave,
  date,
}: {
  open: boolean
  onClose: () => void
  onSave: (task: Task) => void
  date: string
}) {
  const [title, setTitle] = useState("")
  const [notes, setNotes] = useState("")
  const [assignee, setAssignee] = useState("")
  const [budget, setBudget] = useState("")
  const [tag, setTag] = useState("")
  const [reminder, setReminder] = useState("")
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [location, setLocation] = useState("")
  const [files, setFiles] = useState<FileList | null>(null)
  const [todoList, setTodoList] = useState<string[]>([])
  const [todoInput, setTodoInput] = useState("")

  function handleAddTodo(e: React.FormEvent) {
    e.preventDefault()
    if (todoInput.trim()) {
      setTodoList((list) => [...list, todoInput.trim()])
      setTodoInput("")
    }
  }

  function handleRemoveTodo(idx: number) {
    setTodoList((list) => list.filter((_, i) => i !== idx))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return

    onSave({
      title,
      date,
      notes,
      assignee,
      budget,
      tag,
      reminder,
      startTime,
      endTime,
      location,
      files,
      todoList,
    })

    setTitle("")
    setNotes("")
    setAssignee("")
    setBudget("")
    setTag("")
    setReminder("")
    setStartTime("")
    setEndTime("")
    setLocation("")
    setFiles(null)
    setTodoList([])
    setTodoInput("")
  }

  if (!open) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl bg-white border-slate-200 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-slate-800 font-light text-2xl flex items-center gap-2">
            <Plus className="w-5 h-5 text-rose-500" />
            Add Personal Item
          </DialogTitle>
          <DialogDescription className="text-slate-600">
            Create a personal event or task for your planning timeline
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="title" className="text-slate-700 font-medium">
                Title *
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="border-slate-200 focus:border-rose-400"
                placeholder="Enter item title"
                required
                maxLength={60}
              />
            </div>

            <div>
              <Label htmlFor="date" className="text-slate-700 font-medium">
                Date
              </Label>
              <Input id="date" value={date} className="border-slate-200 bg-slate-50" readOnly />
            </div>

            <div>
              <Label htmlFor="assignee" className="text-slate-700 font-medium">
                Assignee
              </Label>
              <Input
                id="assignee"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                className="border-slate-200 focus:border-rose-400"
                placeholder="Who is responsible?"
              />
            </div>

            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="startTime" className="text-slate-700 font-medium">
                  Start Time
                </Label>
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="border-slate-200 focus:border-rose-400"
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="endTime" className="text-slate-700 font-medium">
                  End Time
                </Label>
                <Input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="border-slate-200 focus:border-rose-400"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="location" className="text-slate-700 font-medium">
                Location
              </Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="border-slate-200 focus:border-rose-400"
                placeholder="Event location"
              />
            </div>

            <div>
              <Label htmlFor="budget" className="text-slate-700 font-medium">
                Budget
              </Label>
              <Input
                id="budget"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="border-slate-200 focus:border-rose-400"
                placeholder="Budget amount"
              />
            </div>

            <div>
              <Label htmlFor="tag" className="text-slate-700 font-medium">
                Tag
              </Label>
              <Input
                id="tag"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                className="border-slate-200 focus:border-rose-400"
                placeholder="Category or tag"
              />
            </div>

            <div>
              <Label htmlFor="reminder" className="text-slate-700 font-medium">
                Reminder
              </Label>
              <Input
                id="reminder"
                type="datetime-local"
                value={reminder}
                onChange={(e) => setReminder(e.target.value)}
                className="border-slate-200 focus:border-rose-400"
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="notes" className="text-slate-700 font-medium">
                Notes
              </Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="border-slate-200 focus:border-rose-400"
                placeholder="Additional notes or details"
                rows={3}
              />
            </div>

            <div className="md:col-span-2">
              <Label className="text-slate-700 font-medium">To Do List</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={todoInput}
                  onChange={(e) => setTodoInput(e.target.value)}
                  className="border-slate-200 focus:border-rose-400"
                  placeholder="Add to-do item"
                />
                <Button type="button" onClick={handleAddTodo} variant="outline">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {todoList.length > 0 && (
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {todoList.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                      <span className="text-sm text-slate-700">{item}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveTodo(idx)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white"
            >
              Save Item
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function CalendarPage() {
  const [view, setView] = useState<"day" | "week" | "month" | "year">("month")
  const [current, setCurrent] = useState(getToday())
  const [tasks, setTasks] = useState<Task[]>([])
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [modal, setModal] = useState<{ open: boolean; date: string }>({ open: false, date: "" })
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [personalItems, setPersonalItems] = useState<PersonalCalendarItem[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [subEvents, setSubEvents] = useState<SubEvent[]>([])
  const [vendorSchedules, setVendorSchedules] = useState<VendorSchedule[]>([])
  const [loading, setLoading] = useState(true)
  const [accountInstanceId, setAccountInstanceId] = useState<string | null>(null)
  
  // Add filtering state
  const [showFilters, setShowFilters] = useState(false)
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([])
  const [selectedSubEventIds, setSelectedSubEventIds] = useState<string[]>([])
  const [selectedVendorIds, setSelectedVendorIds] = useState<string[]>([])
  const [filterSearch, setFilterSearch] = useState("")

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Get or create account instance
      const accountInstanceId = await getOrCreateAccountInstanceId()
      if (!accountInstanceId) {
        toast.error("Failed to initialize account. Please try again.")
        return
      }

      setAccountInstanceId(accountInstanceId)

      // Fetch events
      const { data: eventsData } = await supabase
        .from("events")
        .select("*")
        .eq("account_instance_id", accountInstanceId)

      // Fetch sub-events
      const { data: subEventsData } = await supabase
        .from("sub_events")
        .select("*")
        .eq("account_instance_id", accountInstanceId)

      // Fetch vendors (using the correct table name)
      const { data: vendorsData } = await supabase
        .from("vendors")
        .select("*")
        .eq("account_instance_id", accountInstanceId)

      // Fetch personal calendar items
      const { data: personalData } = await supabase
        .from("personal_calendar_items")
        .select("*")
        .eq("account_instance_id", accountInstanceId)
        .order("date", { ascending: true })

      if (eventsData) setEvents(eventsData)
      if (subEventsData) setSubEvents(subEventsData)
      if (vendorsData) {
        // Transform vendors data to match VendorSchedule interface
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
          status: vendor.type || vendor.category || "Scheduled"
        }))
        setVendorSchedules(transformedVendors)
      }
      if (personalData) setPersonalItems(personalData)
    } catch (error) {
      console.error("Error fetching data:", error)
      toast.error("Failed to load calendar data")
    } finally {
      setLoading(false)
    }
  }

  const savePersonalItem = async (task: Task) => {
    // Get or create account instance ID
    const currentAccountInstanceId = accountInstanceId || await getOrCreateAccountInstanceId()
    if (!currentAccountInstanceId) {
      toast.error("Failed to initialize account. Please try again.")
      return
    }

    // Update state if we got a new account instance ID
    if (!accountInstanceId) {
      setAccountInstanceId(currentAccountInstanceId)
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const itemData = {
        title: task.title,
        description: task.notes || null,
        date: task.date,
        start_time: task.startTime || null,
        end_time: task.endTime || null,
        is_checklist: false,
        account_instance_id: currentAccountInstanceId,
        created_by: user.id,
      }

      const { error } = await supabase.from("personal_calendar_items").insert(itemData)

      if (error) {
        console.error("Error saving personal calendar item:", error)
        toast.error("Failed to save item")
      } else {
        toast.success("Item added successfully")
        setTasks((prev) => [...prev, task])
        fetchData() // Refresh data
      }
    } catch (error) {
      console.error("Error saving personal calendar item:", error)
      toast.error("Failed to save item")
    }
  }

  const toggleItemCompletion = async (item: PersonalCalendarItem) => {
    try {
      const { error } = await supabase
        .from("personal_calendar_items")
        .update({ is_completed: !item.is_completed })
        .eq("id", item.id)

      if (error) {
        console.error("Error updating item completion:", error)
        toast.error("Failed to update item")
      } else {
        fetchData() // Refresh data
      }
    } catch (error) {
      console.error("Error updating item completion:", error)
      toast.error("Failed to update item")
    }
  }

  const deletePersonalItem = async (itemId: string) => {
    try {
      const { error } = await supabase.from("personal_calendar_items").delete().eq("id", itemId)

      if (error) {
        console.error("Error deleting personal calendar item:", error)
        toast.error("Failed to delete item")
      } else {
        toast.success("Item deleted successfully")
        fetchData() // Refresh data
      }
    } catch (error) {
      console.error("Error deleting personal calendar item:", error)
      toast.error("Failed to delete item")
    }
  }

  const today = getToday()
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  function handlePrev() {
    if (view === "month") {
      setCurrent((c) => {
        if (c.month === 0) return { year: c.year - 1, month: 11, date: c.date }
        return { year: c.year, month: c.month - 1, date: c.date }
      })
    } else if (view === "year") {
      setCurrent((c) => ({ year: c.year - 1, month: c.month, date: c.date }))
    }
  }

  function handleNext() {
    if (view === "month") {
      setCurrent((c) => {
        if (c.month === 11) return { year: c.year + 1, month: 0, date: c.date }
        return { year: c.year, month: c.month + 1, date: c.date }
      })
    } else if (view === "year") {
      setCurrent((c) => ({ year: c.year + 1, month: c.month, date: c.date }))
    }
  }

  function getDateString(year: number, month: number, day: number) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
  }

  // Get all items for a specific date with filtering
  const getItemsForDate = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd")
    const items: Array<{
      type: "event" | "sub-event" | "vendor" | "personal"
      data: Event | SubEvent | VendorSchedule | PersonalCalendarItem
    }> = []

    // Add events (with filtering)
    events.forEach((event) => {
      if (event.date === dateStr && (selectedEventIds.length === 0 || selectedEventIds.includes(event.id))) {
        items.push({ type: "event", data: event })
      }
    })

    // Add sub-events (with filtering)
    subEvents.forEach((subEvent) => {
      if (subEvent.date === dateStr && (selectedSubEventIds.length === 0 || selectedSubEventIds.includes(subEvent.id))) {
        items.push({ type: "sub-event", data: subEvent })
      }
    })

    // Add vendor schedules (with filtering)
    vendorSchedules.forEach((schedule) => {
      if (schedule.date === dateStr && (selectedVendorIds.length === 0 || selectedVendorIds.includes(schedule.id))) {
        items.push({ type: "vendor", data: schedule })
      }
    })

    // Add personal items
    personalItems.forEach((item) => {
      if (item.date === dateStr) {
        items.push({ type: "personal", data: item })
      }
    })

    return items
  }

  function renderMonthView() {
    const daysInMonth = getDaysInMonth(current.year, current.month)
    const firstDay = getFirstDayOfMonth(current.year, current.month)
    const prevMonthDays = getDaysInMonth(current.year, (current.month + 11) % 12)

    const days: { date: number; thisMonth: boolean; isToday: boolean }[] = []

    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({
        date: prevMonthDays - i,
        thisMonth: false,
        isToday: false,
      })
    }

    for (let d = 1; d <= daysInMonth; d++) {
      days.push({
        date: d,
        thisMonth: true,
        isToday: d === today.date && current.month === today.month && current.year === today.year,
      })
    }

    while (days.length % 7 !== 0) {
      days.push({ date: days.length % 7, thisMonth: false, isToday: false })
    }

    return (
      <Card className="border-slate-200/50 shadow-lg bg-white/90 backdrop-blur-sm h-full">
        <CardContent className="p-6 h-full flex flex-col">
          <div className="grid grid-cols-7 mb-4 text-center">
            {WEEKDAYS.map((d) => (
              <div key={d} className="font-semibold text-slate-600 py-2">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2 flex-1 h-full">
            {days.map((d, i) => {
              const dateStr = getDateString(current.year, current.month, d.date)
              const dayDate = new Date(current.year, current.month, d.date)
              const dayItems = d.thisMonth ? getItemsForDate(dayDate) : []

              return (
                <div
                  key={i}
                  className={`relative h-full min-h-0 flex flex-col rounded-lg border transition-all duration-200 hover:shadow-md group cursor-pointer
                    ${d.thisMonth ? "bg-white border-slate-200" : "bg-slate-50 border-slate-100 text-slate-400"}
                    ${d.isToday ? "ring-2 ring-rose-400 border-rose-300 bg-gradient-to-br from-rose-50 to-amber-50" : ""}
                  `}
                  onClick={() => d.thisMonth && setSelectedDate(dayDate)}
                >
                  <div className="flex items-center justify-between p-2">
                    <div
                      className={`font-medium text-lg ${
                        d.isToday
                          ? "text-white bg-gradient-to-r from-rose-500 to-amber-500 rounded-full w-8 h-8 flex items-center justify-center text-sm shadow-sm"
                          : d.thisMonth
                            ? "text-slate-800"
                            : "text-slate-400"
                      }`}
                    >
                      {d.date}
                    </div>
                    {d.thisMonth && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 hover:bg-rose-100 text-rose-600"
                        onClick={(e) => {
                          e.stopPropagation()
                          setModal({ open: true, date: dateStr })
                        }}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    )}
                  </div>

                  <div className="flex-1 px-2 pb-2 overflow-y-auto">
                    {dayItems.slice(0, 3).map((item, idx) => (
                      <div
                        key={idx}
                        className={`text-xs rounded px-2 py-1 mb-1 font-medium truncate ${
                          item.type === "event"
                            ? "bg-blue-100 text-blue-800"
                            : item.type === "sub-event"
                              ? "bg-purple-100 text-purple-800"
                              : item.type === "vendor"
                                ? "bg-orange-100 text-orange-800"
                                : "bg-green-100 text-green-800"
                        }`}
                      >
                        {item.type === "event" && (item.data as Event).name}
                        {item.type === "sub-event" && (item.data as SubEvent).name}
                        {item.type === "vendor" && (item.data as VendorSchedule).title}
                        {item.type === "personal" && (item.data as PersonalCalendarItem).title}
                      </div>
                    ))}
                    {dayItems.length > 3 && <div className="text-xs text-slate-500">+{dayItems.length - 3} more</div>}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    )
  }

  function renderYearView() {
    return (
      <div className="grid grid-cols-3 gap-4">
        {months.map((m, idx) => (
          <Card
            key={m}
            className={`cursor-pointer transition-all duration-200 hover:shadow-md border-slate-200
              ${idx === current.month ? "ring-2 ring-rose-400 bg-gradient-to-br from-rose-50 to-amber-50" : "bg-white hover:bg-slate-50"}`}
            onClick={() => {
              setCurrent((c) => ({ ...c, month: idx }))
              setView("month")
            }}
          >
            <CardContent className="p-6 text-center">
              <div className={`font-medium text-lg ${idx === current.month ? "text-rose-700" : "text-slate-800"}`}>
                {m}
              </div>
              <div className="text-slate-600 text-sm">{current.year}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  function renderDayView() {
    const intervals = Array.from({ length: 48 }, (_, i) => {
      const hour = Math.floor(i / 2)
      const minute = i % 2 === 0 ? 0 : 30
      const hour12 = hour % 12 === 0 ? 12 : hour % 12
      const ampm = hour < 12 ? "AM" : "PM"
      const label = `${hour12}:${minute === 0 ? "00" : "30"} ${ampm}`
      return { label, hour, minute, index: i }
    })

    const now = new Date()
    const nowMinutes = now.getHours() * 60 + now.getMinutes()
    const indicatorTop = (nowMinutes / 1440) * (48 * 48)

    return (
      <Card className="border-slate-200/50 shadow-lg bg-white/90 backdrop-blur-sm">
        <CardContent className="p-0">
          <div className="relative max-h-[70vh] overflow-y-auto">
            {/* Current time indicator */}
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: `${indicatorTop}px`,
                height: 0,
                borderTop: "2px solid #f43f5e",
                zIndex: 10,
                display: "flex",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: 10,
                  height: 10,
                  background: "#f43f5e",
                  borderRadius: "50%",
                  marginLeft: 80,
                  marginTop: -5,
                  boxShadow: "0 0 0 3px rgba(244, 63, 94, 0.2)",
                }}
              />
            </div>

            <div>
              {intervals.map((interval, idx) => (
                <div
                  key={idx}
                  className="flex items-center border-b border-slate-100 h-12 relative px-4 hover:bg-slate-50 transition-colors"
                  style={{ minHeight: 48 }}
                >
                  <div className="w-20 text-right pr-4 text-slate-500 text-sm select-none font-medium">
                    {interval.label}
                  </div>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  function renderWeekView() {
    const now = new Date(current.year, current.month, today.date)
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay())

    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(weekStart)
      date.setDate(weekStart.getDate() + i)
      return date
    })

    return (
      <div className="grid grid-cols-7 gap-4">
        {weekDays.map((date, i) => {
          const dayItems = getItemsForDate(date)
          const isToday = date.toDateString() === new Date().toDateString()

          return (
            <Card
              key={i}
              className={`border-slate-200/50 shadow-sm transition-all duration-200 hover:shadow-md cursor-pointer
                ${isToday ? "ring-2 ring-rose-400 bg-gradient-to-br from-rose-50 to-amber-50" : "bg-white"}`}
              onClick={() => setSelectedDate(date)}
            >
              <CardContent className="p-4">
                <div className={`font-medium text-center mb-2 ${isToday ? "text-rose-700" : "text-slate-800"}`}>
                  {WEEKDAYS[i]}
                </div>
                <div className={`text-center mb-3 text-2xl font-light ${isToday ? "text-rose-600" : "text-slate-600"}`}>
                  {date.getDate()}
                </div>

                <div className="space-y-1">
                  {dayItems.slice(0, 3).map((item, idx) => (
                    <div
                      key={idx}
                      className={`text-xs rounded px-2 py-1 truncate font-medium ${
                        item.type === "event"
                          ? "bg-blue-100 text-blue-800"
                          : item.type === "sub-event"
                            ? "bg-purple-100 text-purple-800"
                            : item.type === "vendor"
                              ? "bg-orange-100 text-orange-800"
                              : "bg-green-100 text-green-800"
                      }`}
                    >
                      {item.type === "event" && (item.data as Event).name}
                      {item.type === "sub-event" && (item.data as SubEvent).name}
                      {item.type === "vendor" && (item.data as VendorSchedule).title}
                      {item.type === "personal" && (item.data as PersonalCalendarItem).title}
                    </div>
                  ))}
                  {dayItems.length > 3 && <div className="text-xs text-slate-500">+{dayItems.length - 3} more</div>}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-slate-200/50 shadow-lg bg-white/90 backdrop-blur-sm">
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-rose-500 mx-auto" />
              <div>
                <h3 className="text-lg font-medium text-slate-800">Loading Calendar</h3>
                <p className="text-slate-600">Fetching your calendar data...</p>
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
              <CalendarDays className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-light">Calendar</h1>
              <p className="text-slate-300">Manage your personal items and view your schedule</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      <Card className="border-slate-200/50 shadow-sm bg-white/90 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex gap-2">
              {VIEW_OPTIONS.map((opt) => (
                <Button
                  key={opt.key}
                  variant={view === opt.key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setView(opt.key as any)}
                  className={
                    view === opt.key
                      ? "bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white"
                      : "border-slate-200 hover:bg-slate-50"
                  }
                >
                  {opt.label}
                </Button>
              ))}
            </div>

            <div className="flex items-center gap-3">
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
              <Button
                variant="outline"
                onClick={handlePrev}
                className="border-slate-200 hover:bg-slate-50 bg-transparent"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="text-xl font-light text-slate-800 min-w-[200px] text-center">
                {view === "month" && `${months[current.month]} ${current.year}`}
                {view === "year" && current.year}
                {view === "day" && `${months[current.month]} ${today.date}, ${current.year}`}
                {view === "week" && `Week of ${months[current.month]} ${today.date}, ${current.year}`}
              </div>
              <Button
                variant="outline"
                onClick={handleNext}
                className="border-slate-200 hover:bg-slate-50 bg-transparent"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters Panel */}
      {showFilters && (
        <Card className="border-slate-200/50 shadow-sm bg-white/90 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-slate-500" />
                <Input
                  placeholder="Search events, sub-events, or vendors..."
                  value={filterSearch}
                  onChange={(e) => setFilterSearch(e.target.value)}
                  className="max-w-md"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Events Filter */}
                <div className="space-y-2">
                  <h4 className="font-medium text-slate-800 flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-blue-500" />
                    Events ({events.length})
                  </h4>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {events
                      .filter(event => 
                        !filterSearch || 
                        event.name.toLowerCase().includes(filterSearch.toLowerCase())
                      )
                      .map(event => (
                        <div key={event.id} className="flex items-center gap-2">
                          <Checkbox
                            id={`event-${event.id}`}
                            checked={selectedEventIds.includes(event.id)}
                            onCheckedChange={(checked: boolean) => {
                              if (checked) {
                                setSelectedEventIds(prev => [...prev, event.id])
                              } else {
                                setSelectedEventIds(prev => prev.filter(id => id !== event.id))
                              }
                            }}
                          />
                          <Label htmlFor={`event-${event.id}`} className="text-sm">
                            {event.name}
                          </Label>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Sub-Events Filter */}
                <div className="space-y-2">
                  <h4 className="font-medium text-slate-800 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-purple-500" />
                    Sub-Events ({subEvents.length})
                  </h4>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {subEvents
                      .filter(subEvent => 
                        !filterSearch || 
                        subEvent.name.toLowerCase().includes(filterSearch.toLowerCase())
                      )
                      .map(subEvent => (
                        <div key={subEvent.id} className="flex items-center gap-2">
                          <Checkbox
                            id={`subevent-${subEvent.id}`}
                            checked={selectedSubEventIds.includes(subEvent.id)}
                            onCheckedChange={(checked: boolean) => {
                              if (checked) {
                                setSelectedSubEventIds(prev => [...prev, subEvent.id])
                              } else {
                                setSelectedSubEventIds(prev => prev.filter(id => id !== subEvent.id))
                              }
                            }}
                          />
                          <Label htmlFor={`subevent-${subEvent.id}`} className="text-sm">
                            {subEvent.name}
                          </Label>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Vendors Filter */}
                <div className="space-y-2">
                  <h4 className="font-medium text-slate-800 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-orange-500" />
                    Vendors ({vendorSchedules.length})
                  </h4>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {vendorSchedules
                      .filter(vendor => 
                        !filterSearch || 
                        vendor.title.toLowerCase().includes(filterSearch.toLowerCase()) ||
                        vendor.vendor_name.toLowerCase().includes(filterSearch.toLowerCase())
                      )
                      .map(vendor => (
                        <div key={vendor.id} className="flex items-center gap-2">
                          <Checkbox
                            id={`vendor-${vendor.id}`}
                            checked={selectedVendorIds.includes(vendor.id)}
                            onCheckedChange={(checked: boolean) => {
                              if (checked) {
                                setSelectedVendorIds(prev => [...prev, vendor.id])
                              } else {
                                setSelectedVendorIds(prev => prev.filter(id => id !== vendor.id))
                              }
                            }}
                          />
                          <Label htmlFor={`vendor-${vendor.id}`} className="text-sm">
                            {vendor.title}
                          </Label>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              {/* Clear All Filters */}
              {(selectedEventIds.length > 0 || selectedSubEventIds.length > 0 || selectedVendorIds.length > 0) && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedEventIds([])
                    setSelectedSubEventIds([])
                    setSelectedVendorIds([])
                    setFilterSearch("")
                  }}
                  className="border-rose-200 text-rose-600 hover:bg-rose-50"
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear All Filters
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Calendar Views */}
      <div className="h-[70vh]">
        <Card className="flex flex-col h-full border-slate-200/50 shadow-lg bg-white/90 backdrop-blur-sm overflow-hidden">
          <CardContent className="flex-1 h-full overflow-y-auto p-6">
            <div className="flex-1 flex flex-col h-full">
              {view === "month" && renderMonthView()}
              {view === "year" && renderYearView()}
              {view === "day" && renderDayView()}
              {view === "week" && renderWeekView()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Day Details Sidebar */}
      {selectedDate && (
        <Card className="border-slate-200/50 shadow-sm bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-slate-800 font-light text-xl flex items-center gap-2">
                <Calendar className="w-5 h-5 text-rose-500" />
                {format(selectedDate, "EEEE, MMMM d, yyyy")}
              </CardTitle>
              <Button
                size="sm"
                onClick={() => setModal({ open: true, date: format(selectedDate, "yyyy-MM-dd") })}
                className="bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {getItemsForDate(selectedDate).map((item, index) => (
                <div
                  key={index}
                  className={`p-3 rounded border-l-4 ${
                    item.type === "event"
                      ? "border-blue-500 bg-blue-50"
                      : item.type === "sub-event"
                        ? "border-purple-500 bg-purple-50"
                        : item.type === "vendor"
                          ? "border-orange-500 bg-orange-50"
                          : "border-green-500 bg-green-50"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium">
                        {item.type === "event" && (item.data as Event).name}
                        {item.type === "sub-event" && (item.data as SubEvent).name}
                        {item.type === "vendor" && (item.data as VendorSchedule).title}
                        {item.type === "personal" && (item.data as PersonalCalendarItem).title}
                      </div>

                      {(item.data.start_time || item.data.end_time) && (
                        <div className="flex items-center gap-1 text-sm text-slate-600 mt-1">
                          <Clock className="h-3 w-3" />
                          {item.data.start_time} - {item.data.end_time}
                        </div>
                      )}

                      {((item.type === "event" || item.type === "sub-event" || item.type === "vendor") && (item.data as Event | SubEvent | VendorSchedule).location) && (
                        <div className="flex items-center gap-1 text-sm text-slate-600">
                          <MapPin className="h-3 w-3" />
                          {(item.data as Event | SubEvent | VendorSchedule).location}
                        </div>
                      )}

                      {(item.type === "event" || item.type === "sub-event") && (
                        <div className="flex items-center gap-1 text-sm text-slate-600">
                          <Users className="h-3 w-3" />
                          {(item.data as Event | SubEvent).participant_limit} participants
                        </div>
                      )}

                      <div className="flex gap-1 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {(item.data as Event | SubEvent).type || (item.data as VendorSchedule).status || "Personal"}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {(item.data as Event | SubEvent).category || "Vendor"}
                        </Badge>
                      </div>
                    </div>

                    {item.type === "personal" && (
                      <div className="flex items-center gap-2">
                        {(item.data as PersonalCalendarItem).is_checklist && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleItemCompletion(item.data as PersonalCalendarItem)}
                          >
                            {(item.data as PersonalCalendarItem).is_completed ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : (
                              <div className="h-4 w-4 border rounded" />
                            )}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deletePersonalItem((item.data as PersonalCalendarItem).id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {getItemsForDate(selectedDate).length === 0 && (
                <p className="text-slate-500 text-center py-4">No events scheduled for this day</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Task Modal */}
      <TaskModal
        open={modal.open}
        onClose={() => setModal({ open: false, date: "" })}
        onSave={(task) => {
          savePersonalItem(task)
          setModal({ open: false, date: "" })
        }}
        date={modal.date}
      />
    </div>
  )
}
