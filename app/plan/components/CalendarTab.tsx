"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Plus, Clock, MapPin, Check, Edit, Trash2, ChevronLeft, ChevronRight, Users } from "lucide-react"
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
  isAfter,
} from "date-fns"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

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

interface CalendarTabProps {
  events: Event[]
  subEvents: SubEvent[]
  vendorSchedules: VendorSchedule[]
  accountInstanceId: string | null
  onRefresh: () => void
}

export default function CalendarTab({
  events,
  subEvents,
  vendorSchedules,
  accountInstanceId,
  onRefresh,
}: CalendarTabProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [personalItems, setPersonalItems] = useState<PersonalCalendarItem[]>([])
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingItem, setEditingItem] = useState<PersonalCalendarItem | null>(null)
  const [newItem, setNewItem] = useState({
    title: "",
    description: "",
    date: format(new Date(), "yyyy-MM-dd"),
    start_time: "",
    end_time: "",
    is_checklist: false,
  })

  useEffect(() => {
    fetchPersonalItems()
  }, [accountInstanceId])

  const fetchPersonalItems = async () => {
    if (!accountInstanceId) return

    try {
      const { data, error } = await supabase
        .from("personal_calendar_items")
        .select("*")
        .eq("account_instance_id", accountInstanceId)
        .order("date", { ascending: true })

      if (error) {
        console.error("Error fetching personal calendar items:", error)
      } else {
        setPersonalItems(data || [])
      }
    } catch (error) {
      console.error("Error fetching personal calendar items:", error)
    }
  }

  const savePersonalItem = async () => {
    if (!accountInstanceId || !newItem.title.trim()) {
      toast.error("Please fill in the required fields")
      return
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const itemData = {
        title: newItem.title,
        description: newItem.description || null,
        date: newItem.date,
        start_time: newItem.start_time || null,
        end_time: newItem.end_time || null,
        is_checklist: newItem.is_checklist,
        account_instance_id: accountInstanceId,
        created_by: user.id,
      }

      let error
      if (editingItem) {
        const { error: updateError } = await supabase
          .from("personal_calendar_items")
          .update(itemData)
          .eq("id", editingItem.id)
        error = updateError
      } else {
        const { error: insertError } = await supabase.from("personal_calendar_items").insert(itemData)
        error = insertError
      }

      if (error) {
        console.error("Error saving personal calendar item:", error)
        toast.error("Failed to save item")
      } else {
        toast.success(editingItem ? "Item updated successfully" : "Item added successfully")
        setShowAddDialog(false)
        setEditingItem(null)
        setNewItem({
          title: "",
          description: "",
          date: format(new Date(), "yyyy-MM-dd"),
          start_time: "",
          end_time: "",
          is_checklist: false,
        })
        fetchPersonalItems()
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
        fetchPersonalItems()
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
        fetchPersonalItems()
      }
    } catch (error) {
      console.error("Error deleting personal calendar item:", error)
      toast.error("Failed to delete item")
    }
  }

  // Get calendar days for the current month
  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentDate)
    const end = endOfMonth(currentDate)
    return eachDayOfInterval({ start, end })
  }, [currentDate])

  // Get all items for a specific date
  const getItemsForDate = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd")
    const items: Array<{
      type: "event" | "sub-event" | "vendor" | "personal"
      data: Event | SubEvent | VendorSchedule | PersonalCalendarItem
    }> = []

    // Add events
    events.forEach((event) => {
      if (event.date === dateStr) {
        items.push({ type: "event", data: event })
      }
    })

    // Add sub-events
    subEvents.forEach((subEvent) => {
      if (subEvent.date === dateStr) {
        items.push({ type: "sub-event", data: subEvent })
      }
    })

    // Add vendor schedules
    vendorSchedules.forEach((schedule) => {
      if (schedule.date === dateStr) {
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

  // Separate upcoming and past events
  const { upcomingEvents, pastEvents } = useMemo(() => {
    const today = new Date()
    const upcoming: Array<{
      type: "event" | "sub-event" | "vendor" | "personal"
      data: Event | SubEvent | VendorSchedule | PersonalCalendarItem
    }> = []
    const past: Array<{
      type: "event" | "sub-event" | "vendor" | "personal"
      data: Event | SubEvent | VendorSchedule | PersonalCalendarItem
    }> = []

    const allItems = [
      ...events.map((e) => ({ type: "event" as const, data: e })),
      ...subEvents.map((e) => ({ type: "sub-event" as const, data: e })),
      ...vendorSchedules.map((e) => ({ type: "vendor" as const, data: e })),
      ...personalItems.map((e) => ({ type: "personal" as const, data: e })),
    ]

    allItems.forEach((item) => {
      const itemDate = parseISO(item.data.date)
      if (isAfter(itemDate, today) || isSameDay(itemDate, today)) {
        upcoming.push(item)
      } else {
        past.push(item)
      }
    })

    return {
      upcomingEvents: upcoming.sort((a, b) => new Date(a.data.date).getTime() - new Date(b.data.date).getTime()),
      pastEvents: past.sort((a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime()),
    }
  }, [events, subEvents, vendorSchedules, personalItems])

  const startEdit = (item: PersonalCalendarItem) => {
    setEditingItem(item)
    setNewItem({
      title: item.title,
      description: item.description || "",
      date: item.date,
      start_time: item.start_time || "",
      end_time: item.end_time || "",
      is_checklist: item.is_checklist,
    })
    setShowAddDialog(true)
  }

  return (
    <div className="space-y-6">
      {/* Main Calendar View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          {/* ...calendar code previously inside TabsContent 'calendar'... */}
        </div>
        {/* Day Details */}
        <div>
          {/* ...day details code previously inside TabsContent 'calendar'... */}
        </div>
      </div>
      {/* Upcoming Events Section */}
      <div>
        {/* ...upcoming events code previously inside TabsContent 'upcoming'... */}
      </div>
      {/* Past Events Section */}
      <div>
        {/* ...past events code previously inside TabsContent 'past'... */}
      </div>
    </div>
  )
}
