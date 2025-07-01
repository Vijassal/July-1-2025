"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import {
  Plus,
  Users,
  Edit3,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Search,
  Trash2,
  Settings,
  Save,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Filter,
  X,
  BarChart3,
  UserCheck,
  UserPlus2,
  Calculator,
  Loader2,
} from "lucide-react"

interface AdditionalParticipant {
  id: string
  main_participant_id: string
  account_instance_id: string
  first_name: string
  last_name: string
  email?: string
  phone?: string
  family?: string
  relationship?: string
  invited_by?: string
  tags?: string[]
  events?: string[]
  sub_events?: string[]
  is_child?: boolean
  child_age?: number
  custom_fields?: { [key: string]: any }
  created_at?: string
  updated_at?: string
}

interface Participant {
  id: string
  account_instance_id: string
  first_name: string
  last_name: string
  email?: string
  phone?: string
  family?: string
  relationship?: string
  invited_by?: string
  tags?: string[]
  events?: string[]
  sub_events?: string[]
  is_child?: boolean
  child_age?: number
  custom_fields?: { [key: string]: any }
  created_at?: string
  updated_at?: string
  additional_participants?: AdditionalParticipant[]
}

interface TableColumn {
  id: string
  label: string
  visible: boolean
  type: "default" | "custom"
}

interface StatBlock {
  id: string
  label: string
  visible: boolean
  type: "count" | "calculation"
  field?: string
  maxAge?: number // New field for children age filter
}

interface CustomField {
  id: string
  name: string
  type: "text" | "dropdown" | "checkbox"
  options?: string[]
}

interface ViewSettings {
  name: string
  columns: TableColumn[]
  stats: StatBlock[]
  customFields: CustomField[]
}

const DEFAULT_COLUMNS: TableColumn[] = [
  { id: "name", label: "Name", visible: true, type: "default" },
  { id: "contact", label: "Contact Info", visible: true, type: "default" },
  { id: "family", label: "Family", visible: true, type: "default" },
  { id: "relationship", label: "Relationship", visible: true, type: "default" },
  { id: "invited_by", label: "Invited By", visible: true, type: "default" },
  { id: "events", label: "Events", visible: true, type: "default" },
  { id: "sub_events", label: "Sub-Events", visible: false, type: "default" },
  { id: "tags", label: "Tags", visible: true, type: "default" },
  { id: "additional_count", label: "Additional Guests", visible: true, type: "default" },
]

const DEFAULT_STATS: StatBlock[] = [
  { id: "totalParticipants", label: "Total Participants", visible: true, type: "count" },
  { id: "totalGuests", label: "Total Guests", visible: true, type: "count" },
  { id: "participantsWithAdditional", label: "Multi-Guest Parties", visible: true, type: "count" },
  { id: "averagePartySize", label: "Avg Party Size", visible: true, type: "calculation" },
  { id: "totalAdditionalGuests", label: "Additional Guests", visible: false, type: "count" },
  { id: "familyCount", label: "Family Members", visible: false, type: "count" },
  { id: "friendsCount", label: "Friends", visible: false, type: "count" },
  { id: "childrenCount", label: "Children", visible: false, type: "count", maxAge: 18 }, // Default max age of 18
]

const mockEvents = ["Wedding Day", "Reception", "Rehearsal Dinner"]
const mockSubEvents = ["Ceremony", "Cocktail Hour", "Dinner", "Dancing"]
const mockUsers = ["Alice", "Bob", "Charlie"]
const mockTags = ["Family", "VIP", "Friend", "Colleague"]

const getStatIcon = (statId: string) => {
  const iconMap = {
    totalParticipants: Users,
    totalGuests: UserCheck,
    participantsWithAdditional: UserPlus2,
    averagePartySize: Calculator,
    totalAdditionalGuests: UserPlus2,
    familyCount: Users,
    friendsCount: Users,
    childrenCount: Users,
  }
  return iconMap[statId as keyof typeof iconMap] || BarChart3
}

export default function InvitePage() {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)
  const [accountInstanceId, setAccountInstanceId] = useState<string | null>(null)

  // Settings state
  const [columns, setColumns] = useState<TableColumn[]>(DEFAULT_COLUMNS)
  const [stats, setStats] = useState<StatBlock[]>(DEFAULT_STATS)
  const [customFields, setCustomFields] = useState<CustomField[]>([])
  const [savedViews, setSavedViews] = useState<ViewSettings[]>([])
  const [currentViewName, setCurrentViewName] = useState<string>("Default")
  const [tableDensity, setTableDensity] = useState<"compact" | "normal" | "comfortable">("normal")

  // Filter and sort state
  const [sortConfig, setSortConfig] = useState<{
    key: string
    direction: "asc" | "desc"
  } | null>(null)
  const [columnFilters, setColumnFilters] = useState<{ [key: string]: string }>({})
  const [showFilters, setShowFilters] = useState(false)

  // UI state
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [editingParticipantId, setEditingParticipantId] = useState<string | null>(null)
  const [newViewName, setNewViewName] = useState("")

  // Add this state
  const [allExpanded, setAllExpanded] = useState(false)

  // Form state
  const [newParticipant, setNewParticipant] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    family: "",
    relationship: "",
    invited_by: "",
    events: [] as string[],
    sub_events: [] as string[],
    tags: [] as string[],
    is_child: false,
    child_age: "",
  })
  const [newAdditionalParticipant, setNewAdditionalParticipant] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    family: "",
    relationship: "",
    invited_by: "",
    events: [] as string[],
    sub_events: [] as string[],
    tags: [] as string[],
    is_child: false,
    child_age: "",
  })
  const [newCustomField, setNewCustomField] = useState({
    name: "",
    type: "text" as const,
    options: [] as string[],
  })
  const [tagList, setTagList] = useState<string[]>(mockTags)

  // Fetch account instance ID
  useEffect(() => {
    async function fetchAccountInstance() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (!session?.user?.email) {
          setAccountInstanceId(null)
          setLoading(false)
          return
        }

        const { data: accounts, error } = await supabase
          .from("account_instances")
          .select("id, name")
          .eq("name", session.user.email)

        if (error || !accounts || accounts.length === 0) {
          console.error("Error fetching account instance:", error)
          setAccountInstanceId(null)
          setLoading(false)
          return
        }

        setAccountInstanceId(accounts[0].id)
      } catch (error) {
        console.error("Error in fetchAccountInstance:", error)
        setAccountInstanceId(null)
        setLoading(false)
      }
    }
    fetchAccountInstance()
  }, [])

  // Fetch participants when account instance is available
  useEffect(() => {
    if (accountInstanceId) {
      fetchParticipants()
    }
  }, [accountInstanceId])

  // Fetch participants from Supabase
  const fetchParticipants = async () => {
    if (!accountInstanceId) return

    try {
      setLoading(true)

      // Fetch main participants
      const { data: participantsData, error: participantsError } = await supabase
        .from("participants")
        .select("*")
        .eq("account_instance_id", accountInstanceId)
        .order("created_at", { ascending: false })

      if (participantsError) {
        console.error("Error fetching participants:", participantsError)
        toast.error("Failed to load participants")
        return
      }

      // Fetch additional participants
      const { data: additionalData, error: additionalError } = await supabase
        .from("additional_participants")
        .select("*")
        .eq("account_instance_id", accountInstanceId)

      if (additionalError) {
        console.error("Error fetching additional participants:", additionalError)
        toast.error("Failed to load additional participants")
        return
      }

      // Group additional participants by main participant ID
      const additionalByMain =
        additionalData?.reduce(
          (acc, additional) => {
            if (!acc[additional.main_participant_id]) {
              acc[additional.main_participant_id] = []
            }
            acc[additional.main_participant_id].push(additional)
            return acc
          },
          {} as { [key: string]: AdditionalParticipant[] },
        ) || {}

      // Combine data
      const combinedParticipants: Participant[] =
        participantsData?.map((participant) => ({
          ...participant,
          additional_participants: additionalByMain[participant.id] || [],
        })) || []

      setParticipants(combinedParticipants)
    } catch (error) {
      console.error("Error in fetchParticipants:", error)
      toast.error("Failed to load participants")
    } finally {
      setLoading(false)
    }
  }

  // Load saved settings on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem("participantListSettings")
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings)
        if (settings.columns) setColumns(settings.columns)
        if (settings.stats) setStats(settings.stats)
        if (settings.customFields) setCustomFields(settings.customFields)
        if (settings.savedViews) setSavedViews(settings.savedViews)
        if (settings.currentViewName) setCurrentViewName(settings.currentViewName)
        if (settings.tableDensity) setTableDensity(settings.tableDensity)
      } catch (error) {
        console.error("Error loading saved settings:", error)
      }
    }
  }, [])

  // Save settings to localStorage
  const saveSettings = () => {
    const settings = {
      columns,
      stats,
      customFields,
      savedViews,
      currentViewName,
      tableDensity,
    }
    localStorage.setItem("participantListSettings", JSON.stringify(settings))
  }

  // Auto-save when settings change
  useEffect(() => {
    saveSettings()
  }, [columns, stats, customFields, savedViews, currentViewName, tableDensity])

  // Enhanced filtering and sorting
  const getFilteredAndSortedParticipants = () => {
    const filtered = participants.filter((participant) => {
      // Search term filter
      const matchesSearch =
        participant.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        participant.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        participant.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        participant.relationship?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        participant.additional_participants?.some(
          (ap) =>
            ap.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ap.last_name.toLowerCase().includes(searchTerm.toLowerCase()),
        )

      if (!matchesSearch) return false

      // Column-specific filters
      for (const [columnId, filterValue] of Object.entries(columnFilters)) {
        if (!filterValue) continue

        let columnValue = ""
        switch (columnId) {
          case "name":
            columnValue = `${participant.first_name} ${participant.last_name}`
            break
          case "contact":
            columnValue = `${participant.email || ""} ${participant.phone || ""}`
            break
          case "family":
            columnValue = participant.family || ""
            break
          case "relationship":
            columnValue = participant.relationship || ""
            break
          case "invited_by":
            columnValue = participant.invited_by || ""
            break
          case "events":
            columnValue = participant.events?.join(", ") || ""
            break
          case "sub_events":
            columnValue = participant.sub_events?.join(", ") || ""
            break
          case "tags":
            columnValue = participant.tags?.join(", ") || ""
            break
          case "additional_count":
            columnValue = (participant.additional_participants?.length || 0).toString()
            break
          default:
            // Handle custom fields
            if (columnId.startsWith("custom_")) {
              const fieldId = columnId.replace("custom_", "")
              const field = customFields.find((f) => f.id === fieldId)
              if (field && participant.custom_fields) {
                columnValue = participant.custom_fields[field.name] || ""
              }
            }
        }

        if (!columnValue.toLowerCase().includes(filterValue.toLowerCase())) {
          return false
        }
      }

      return true
    })

    // Sorting
    if (sortConfig) {
      filtered.sort((a, b) => {
        let aValue: any = ""
        let bValue: any = ""

        switch (sortConfig.key) {
          case "name":
            aValue = `${a.first_name} ${a.last_name}`
            bValue = `${b.first_name} ${b.last_name}`
            break
          case "contact":
            aValue = a.email || ""
            bValue = b.email || ""
            break
          case "family":
            aValue = a.family || ""
            bValue = b.family || ""
            break
          case "relationship":
            aValue = a.relationship || ""
            bValue = b.relationship || ""
            break
          case "invited_by":
            aValue = a.invited_by || ""
            bValue = b.invited_by || ""
            break
          case "events":
            aValue = a.events?.join(", ") || ""
            bValue = b.events?.join(", ") || ""
            break
          case "sub_events":
            aValue = a.sub_events?.join(", ") || ""
            bValue = b.sub_events?.join(", ") || ""
            break
          case "tags":
            aValue = a.tags?.join(", ") || ""
            bValue = b.tags?.join(", ") || ""
            break
          case "additional_count":
            aValue = a.additional_participants?.length || 0
            bValue = b.additional_participants?.length || 0
            break
          default:
            // Handle custom fields
            if (sortConfig.key.startsWith("custom_")) {
              const fieldId = sortConfig.key.replace("custom_", "")
              const field = customFields.find((f) => f.id === fieldId)
              if (field) {
                aValue = a.custom_fields?.[field.name] || ""
                bValue = b.custom_fields?.[field.name] || ""
              }
            }
        }

        // Handle different data types
        if (typeof aValue === "number" && typeof bValue === "number") {
          return sortConfig.direction === "asc" ? aValue - bValue : bValue - aValue
        }

        // String comparison
        const aStr = String(aValue).toLowerCase()
        const bStr = String(bValue).toLowerCase()

        if (aStr < bStr) return sortConfig.direction === "asc" ? -1 : 1
        if (aStr > bStr) return sortConfig.direction === "asc" ? 1 : -1
        return 0
      })
    }

    return filtered
  }

  const filteredParticipants = getFilteredAndSortedParticipants()

  // Statistics calculations
  const calculateStats = () => {
    const totalParticipants = participants.length
    const totalGuests = participants.reduce(
      (total, participant) => total + 1 + (participant.additional_participants?.length || 0),
      0,
    )
    const participantsWithAdditional = participants.filter(
      (participant) => (participant.additional_participants?.length || 0) > 0,
    ).length
    const averagePartySize = totalParticipants > 0 ? (totalGuests / totalParticipants).toFixed(1) : "0"
    const totalAdditionalGuests = participants.reduce(
      (total, participant) => total + (participant.additional_participants?.length || 0),
      0,
    )
    const familyCount = participants.filter((participant) =>
      participant.relationship?.toLowerCase().includes("family"),
    ).length
    const friendsCount = participants.filter((participant) =>
      participant.relationship?.toLowerCase().includes("friend"),
    ).length

    // Enhanced children count with age filtering
    const getChildrenCount = (maxAge?: number) => {
      return participants.reduce((total, participant) => {
        const mainIsChild =
          participant.is_child &&
          (maxAge === undefined || (participant.child_age !== undefined && participant.child_age <= maxAge))
            ? 1
            : 0
        const additionalChildren =
          participant.additional_participants?.filter(
            (ap) => ap.is_child && (maxAge === undefined || (ap.child_age !== undefined && ap.child_age <= maxAge)),
          ).length || 0
        return total + mainIsChild + additionalChildren
      }, 0)
    }

    const childrenCount = getChildrenCount()

    return {
      totalParticipants,
      totalGuests,
      participantsWithAdditional,
      averagePartySize,
      totalAdditionalGuests,
      familyCount,
      friendsCount,
      childrenCount,
      getChildrenCount, // Return the function for dynamic calculation
    }
  }

  const statsData = (() => {
    const calculated = calculateStats();
    // Remove getChildrenCount from the returned object for stat rendering
    const { getChildrenCount, ...rest } = calculated;
    return rest;
  })();

  const getStatValue = (stat: StatBlock) => {
    if (stat.id === "childrenCount" && stat.maxAge !== undefined) {
      return calculateStats().getChildrenCount(stat.maxAge)
    }
    return statsData[stat.id as keyof typeof statsData] || 0
  }

  const getStatLabel = (stat: StatBlock) => {
    if (stat.id === "childrenCount" && stat.maxAge !== undefined) {
      return `Children (${stat.maxAge} & below)`
    }
    return stat.label
  }

  const visibleColumns = columns.filter((col) => col.visible)
  const visibleStats = stats.filter((stat) => stat.visible)

  // Column management
  const toggleColumn = (columnId: string) => {
    setColumns(columns.map((col) => (col.id === columnId ? { ...col, visible: !col.visible } : col)))
  }

  // Stat management
  const toggleStat = (statId: string) => {
    setStats(stats.map((stat) => (stat.id === statId ? { ...stat, visible: !stat.visible } : stat)))
  }

  // Update stat max age
  const updateStatMaxAge = (statId: string, maxAge: number) => {
    setStats(stats.map((stat) => (stat.id === statId ? { ...stat, maxAge } : stat)))
  }

  // Custom field management
  const addCustomField = () => {
    if (newCustomField.name) {
      const customField: CustomField = {
        id: Date.now().toString(),
        name: newCustomField.name,
        type: newCustomField.type,
        options: newCustomField.type === "dropdown" ? newCustomField.options : undefined,
      }
      setCustomFields([...customFields, customField])

      // Add column for this custom field
      const newColumn: TableColumn = {
        id: `custom_${customField.id}`,
        label: customField.name,
        visible: true,
        type: "custom",
      }
      setColumns([...columns, newColumn])

      setNewCustomField({ name: "", type: "text", options: [] })
    }
  }

  const removeCustomField = (fieldId: string) => {
    setCustomFields(customFields.filter((field) => field.id !== fieldId))
    setColumns(columns.filter((col) => col.id !== `custom_${fieldId}`))
  }

  // View management
  const saveCurrentView = () => {
    if (newViewName) {
      const view: ViewSettings = {
        name: newViewName,
        columns: [...columns],
        stats: [...stats],
        customFields: [...customFields],
      }
      setSavedViews([...savedViews.filter((v) => v.name !== newViewName), view])
      setCurrentViewName(newViewName)
      setNewViewName("")
    }
  }

  const loadView = (viewName: string) => {
    const view = savedViews.find((v) => v.name === viewName)
    if (view) {
      setColumns(view.columns)
      setStats(view.stats)
      setCustomFields(view.customFields)
      setCurrentViewName(viewName)
    }
  }

  const deleteView = (viewName: string) => {
    setSavedViews(savedViews.filter((v) => v.name !== viewName))
    if (currentViewName === viewName) {
      setCurrentViewName("Default")
    }
  }

  // Add these functions after the other utility functions
  const expandAll = () => {
    const participantsWithAdditional = participants
      .filter((p) => (p.additional_participants?.length || 0) > 0)
      .map((p) => p.id)
    setExpandedRows(new Set(participantsWithAdditional))
    setAllExpanded(true)
  }

  const collapseAll = () => {
    setExpandedRows(new Set())
    setAllExpanded(false)
  }

  // Participant management functions
  const handleAddParticipant = async () => {
    if (!newParticipant.first_name || !newParticipant.last_name || !accountInstanceId) {
      toast.error("Please fill in required fields")
      return
    }

    try {
      const participantData = {
        account_instance_id: accountInstanceId,
        first_name: newParticipant.first_name,
        last_name: newParticipant.last_name,
        email: newParticipant.email || null,
        phone: newParticipant.phone || null,
        family: newParticipant.family || null,
        relationship: newParticipant.relationship || null,
        invited_by: newParticipant.invited_by || null,
        events: newParticipant.events.length > 0 ? newParticipant.events : null,
        sub_events: newParticipant.sub_events.length > 0 ? newParticipant.sub_events : null,
        tags: newParticipant.tags.length > 0 ? newParticipant.tags : null,
        is_child: newParticipant.is_child || null,
        child_age: newParticipant.child_age ? Number.parseInt(newParticipant.child_age) : null,
      }

      const { data, error } = await supabase.from("participants").insert([participantData]).select().single()

      if (error) {
        console.error("Error adding participant:", error)
        toast.error("Failed to add participant")
        return
      }

      // Add to local state
      const newParticipantWithAdditional: Participant = {
        ...data,
        additional_participants: [],
      }
      setParticipants([newParticipantWithAdditional, ...participants])

      // Reset form
      setNewParticipant({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        family: "",
        relationship: "",
        invited_by: "",
        events: [],
        sub_events: [],
        tags: [],
        is_child: false,
        child_age: "",
      })
      setIsAddDialogOpen(false)
      toast.success("Participant added successfully!")
    } catch (error) {
      console.error("Error in handleAddParticipant:", error)
      toast.error("Failed to add participant")
    }
  }

  const addAdditionalParticipant = async (participantId: string) => {
    if (!newAdditionalParticipant.first_name || !newAdditionalParticipant.last_name || !accountInstanceId) {
      toast.error("Please fill in required fields")
      return
    }

    try {
      const additionalData = {
        main_participant_id: participantId,
        account_instance_id: accountInstanceId,
        first_name: newAdditionalParticipant.first_name,
        last_name: newAdditionalParticipant.last_name,
        email: newAdditionalParticipant.email || null,
        phone: newAdditionalParticipant.phone || null,
        family: newAdditionalParticipant.family || null,
        relationship: newAdditionalParticipant.relationship || null,
        invited_by: newAdditionalParticipant.invited_by || null,
        events: newAdditionalParticipant.events.length > 0 ? newAdditionalParticipant.events : null,
        sub_events: newAdditionalParticipant.sub_events.length > 0 ? newAdditionalParticipant.sub_events : null,
        tags: newAdditionalParticipant.tags.length > 0 ? newAdditionalParticipant.tags : null,
        is_child: newAdditionalParticipant.is_child || null,
        child_age: newAdditionalParticipant.child_age ? Number.parseInt(newAdditionalParticipant.child_age) : null,
      }

      const { data, error } = await supabase.from("additional_participants").insert([additionalData]).select().single()

      if (error) {
        console.error("Error adding additional participant:", error)
        toast.error("Failed to add additional participant")
        return
      }

      // Update local state
      setParticipants(
        participants.map((participant) =>
          participant.id === participantId
            ? {
                ...participant,
                additional_participants: [...(participant.additional_participants || []), data],
              }
            : participant,
        ),
      )

      // Reset form
      setNewAdditionalParticipant({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        family: "",
        relationship: "",
        invited_by: "",
        events: [],
        sub_events: [],
        tags: [],
        is_child: false,
        child_age: "",
      })
      setEditingParticipantId(null)
      toast.success("Additional participant added successfully!")
    } catch (error) {
      console.error("Error in addAdditionalParticipant:", error)
      toast.error("Failed to add additional participant")
    }
  }

  const removeAdditionalParticipant = async (participantId: string, additionalParticipantId: string) => {
    try {
      const { error } = await supabase.from("additional_participants").delete().eq("id", additionalParticipantId)

      if (error) {
        console.error("Error removing additional participant:", error)
        toast.error("Failed to remove additional participant")
        return
      }

      // Update local state
      setParticipants(
        participants.map((participant) =>
          participant.id === participantId
            ? {
                ...participant,
                additional_participants:
                  participant.additional_participants?.filter((ap) => ap.id !== additionalParticipantId) || [],
              }
            : participant,
        ),
      )

      toast.success("Additional participant removed successfully!")
    } catch (error) {
      console.error("Error in removeAdditionalParticipant:", error)
      toast.error("Failed to remove additional participant")
    }
  }

  const toggleRowExpansion = (participantId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(participantId)) {
      newExpanded.delete(participantId)
    } else {
      newExpanded.add(participantId)
    }
    setExpandedRows(newExpanded)
  }

  const handleContactClick = (participant: Participant, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedParticipant(participant)
    setIsDetailsDialogOpen(true)
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase()
  }

  const getRelationshipColor = (relationship: string) => {
    const colors = {
      Family: "bg-rose-100 text-rose-700 border-rose-200",
      "College Friend": "bg-blue-100 text-blue-700 border-blue-200",
      "Work Colleague": "bg-purple-100 text-purple-700 border-purple-200",
      "High School Friend": "bg-green-100 text-green-700 border-green-200",
      Friend: "bg-blue-100 text-blue-700 border-blue-200",
    }
    return colors[relationship as keyof typeof colors] || "bg-gray-100 text-gray-700 border-gray-200"
  }

  const getStatColor = (index: number) => {
    const colors = [
      "from-slate-500 to-slate-600",
      "from-emerald-500 to-emerald-600",
      "from-amber-500 to-amber-600",
      "from-rose-500 to-rose-600",
      "from-blue-500 to-blue-600",
      "from-purple-500 to-purple-600",
    ]
    return colors[index % colors.length]
  }

  const getStatBgColor = (index: number) => {
    const colors = [
      "bg-slate-50/80",
      "bg-emerald-50/80",
      "bg-amber-50/80",
      "bg-rose-50/80",
      "bg-blue-50/80",
      "bg-purple-50/80",
    ]
    return colors[index % colors.length]
  }

  const getStatBorderColor = (index: number) => {
    const colors = [
      "border-slate-200/50",
      "border-emerald-200/50",
      "border-amber-200/50",
      "border-rose-200/50",
      "border-blue-200/50",
      "border-purple-200/50",
    ]
    return colors[index % colors.length]
  }

  const renderCellContent = (participant: Participant, column: TableColumn) => {
    switch (column.id) {
      case "name":
        return (
          <div
            className="flex items-center space-x-2 cursor-pointer hover:text-rose-600 transition-colors min-w-0"
            onClick={(e) => handleContactClick(participant, e)}
          >
            <Avatar
              className={`border border-white shadow-sm ${
                tableDensity === "compact" ? "w-6 h-6" : tableDensity === "comfortable" ? "w-10 h-10" : "w-8 h-8"
              }`}
            >
              <AvatarFallback className="bg-gradient-to-br from-rose-400 to-amber-400 text-white font-medium">
                {getInitials(participant.first_name, participant.last_name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="font-medium text-slate-800 truncate">
                {participant.first_name} {participant.last_name}
              </div>
              {participant.is_child && (
                <div className={`text-blue-600 truncate ${tableDensity === "compact" ? "text-xs" : "text-xs"}`}>
                  Child (Age: {participant.child_age})
                </div>
              )}
            </div>
          </div>
        )
      case "contact":
        return (
          <div className="space-y-1">
            <div className="text-sm text-slate-700">{participant.email || "-"}</div>
            {participant.phone && <div className="text-xs text-slate-500">{participant.phone}</div>}
          </div>
        )
      case "family":
        return <div className="text-sm text-slate-600">{participant.family || "-"}</div>
      case "relationship":
        return (
          <Badge className={`${getRelationshipColor(participant.relationship || "")} font-light border text-xs`}>
            {participant.relationship || "Unknown"}
          </Badge>
        )
      case "invited_by":
        return <div className="text-sm text-slate-600">{participant.invited_by || "-"}</div>
      case "events":
        return (
          <div className="flex flex-wrap gap-1 max-w-[200px]">
            {(participant.events || []).slice(0, tableDensity === "compact" ? 1 : 2).map((event) => (
              <Badge
                key={event}
                variant="outline"
                className={`${tableDensity === "compact" ? "text-xs px-1 py-0" : "text-xs"} truncate max-w-[80px]`}
                title={event}
              >
                {event}
              </Badge>
            ))}
            {(participant.events || []).length > (tableDensity === "compact" ? 1 : 2) && (
              <Badge variant="outline" className="text-xs" title={(participant.events || []).join(", ")}>
                +{((participant.events || []).length || 0) - (tableDensity === "compact" ? 1 : 2)}
              </Badge>
            )}
          </div>
        )
      case "sub_events":
        return (
          <div className="flex flex-wrap gap-1">
            {(participant.sub_events || []).slice(0, 2).map((subEvent) => (
              <Badge key={subEvent} variant="outline" className="text-xs">
                {subEvent}
              </Badge>
            ))}
            {(participant.sub_events || []).length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{((participant.sub_events || []).length || 0) - 2}
              </Badge>
            )}
          </div>
        )
      case "tags":
        return (
          <div className="flex flex-wrap gap-1 max-w-[150px]">
            {(participant.tags || []).slice(0, tableDensity === "compact" ? 1 : 2).map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className={`${tableDensity === "compact" ? "text-xs px-1 py-0" : "text-xs"} truncate max-w-[60px]`}
                title={tag}
              >
                {tag}
              </Badge>
            ))}
            {(participant.tags || []).length > (tableDensity === "compact" ? 1 : 2) && (
              <Badge variant="secondary" className="text-xs" title={(participant.tags || []).join(", ")}>
                +{((participant.tags || []).length || 0) - (tableDensity === "compact" ? 1 : 2)}
              </Badge>
            )}
          </div>
        )
      case "additional_count":
        return (
          <div className="flex items-center justify-center space-x-1">
            <span className="text-sm font-medium text-slate-800">
              {1 + (participant.additional_participants?.length || 0)}
            </span>
            {(participant.additional_participants?.length || 0) > 0 && (
              <Badge variant="outline" className="border-emerald-300 text-emerald-700 bg-emerald-50 font-light text-xs">
                +{participant.additional_participants?.length || 0}
              </Badge>
            )}
          </div>
        )
      default:
        // Handle custom fields
        if (column.id.startsWith("custom_")) {
          const fieldId = column.id.replace("custom_", "")
          const field = customFields.find((f) => f.id === fieldId)
          if (field && participant.custom_fields) {
            return <div className="text-sm text-slate-600">{participant.custom_fields[field.name] || "-"}</div>
          }
        }
        return "-"
    }
  }

  // Sorting functions
  const handleSort = (columnId: string) => {
    setSortConfig((current) => {
      if (current?.key === columnId) {
        // Toggle direction or clear sort
        if (current.direction === "asc") {
          return { key: columnId, direction: "desc" }
        } else {
          return null // Clear sort
        }
      } else {
        // New sort
        return { key: columnId, direction: "asc" }
      }
    })
  }

  const getSortIcon = (columnId: string) => {
    if (sortConfig?.key !== columnId) {
      return null // Don't show any icon when not sorted
    }
    return sortConfig.direction === "asc" ? (
      <ArrowUp className="w-3 h-3 text-blue-500 ml-1" />
    ) : (
      <ArrowDown className="w-3 h-3 text-blue-500 ml-1" />
    )
  }

  // Filter functions
  const updateColumnFilter = (columnId: string, value: string) => {
    setColumnFilters((prev) => ({
      ...prev,
      [columnId]: value,
    }))
  }

  const clearColumnFilter = (columnId: string) => {
    setColumnFilters((prev) => {
      const newFilters = { ...prev }
      delete newFilters[columnId]
      return newFilters
    })
  }

  const clearAllFilters = () => {
    setColumnFilters({})
    setSortConfig(null)
    setSearchTerm("")
  }

  const hasActiveFilters = Object.keys(columnFilters).length > 0 || sortConfig !== null || searchTerm !== ""

  // Multi-select component for form
  const MultiSelectBubbles = ({
    options,
    value,
    onChange,
    placeholder,
  }: {
    options: string[]
    value: string[]
    onChange: (v: string[]) => void
    placeholder: string
  }) => (
    <div className="flex flex-wrap gap-2 min-h-[32px] p-2 border border-slate-200 rounded-md bg-white">
      {options.map((opt) => (
        <span
          key={opt}
          onClick={() => (value.includes(opt) ? onChange(value.filter((v) => v !== opt)) : onChange([...value, opt]))}
          className={`px-2 py-1 text-xs rounded cursor-pointer transition-colors ${
            value.includes(opt)
              ? "bg-rose-100 text-rose-700 border border-rose-300"
              : "bg-slate-100 text-slate-700 border border-slate-300 hover:bg-slate-200"
          }`}
        >
          {opt}
        </span>
      ))}
      {value.length === 0 && <span className="text-slate-400 text-sm">{placeholder}</span>}
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading participants...</p>
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
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-rose-500 rounded-xl flex items-center justify-center shadow-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-light">Invite Management</h1>
              <p className="text-slate-200 font-light">Manage your event invitations and guest lists</p>
            </div>
          </div>
        </div>
      </div>
      {/* Stats Section */}
      <div
        className={`grid gap-4 ${
          visibleStats.length === 1
            ? "grid-cols-1"
            : visibleStats.length === 2
              ? "grid-cols-2"
              : visibleStats.length === 3
                ? "grid-cols-1 sm:grid-cols-3"
                : visibleStats.length === 4
                  ? "grid-cols-2 lg:grid-cols-4"
                  : visibleStats.length === 5
                    ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-5"
                    : visibleStats.length === 6
                      ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-6"
                      : visibleStats.length === 7
                        ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7"
                        : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8"
        }`}
      >
        {visibleStats.map((stat, index) => (
          <Card
            key={stat.id}
            className={`${getStatBorderColor(index)} shadow-lg ${getStatBgColor(
              index,
            )} backdrop-blur-sm hover:shadow-xl transition-all duration-300`}
          >
            <CardContent className="p-4 text-center">
              <div
                className={`w-8 h-8 bg-gradient-to-br ${getStatColor(
                  index,
                )} rounded-lg flex items-center justify-center mx-auto mb-2`}
              >
                {(() => {
                  const IconComponent = getStatIcon(stat.id)
                  return <IconComponent className="w-4 h-4 text-white" />
                })()}
              </div>
              <div className="text-2xl font-light text-slate-800 mb-1">{getStatValue(stat)}</div>
              <div className="text-xs text-slate-600 font-light">{getStatLabel(stat)}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search and Controls */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Search participants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-slate-200 focus:border-rose-400 bg-white/80 backdrop-blur-sm"
            />
          </div>

          <div className="flex gap-3 flex-wrap">
            {/* Filter Toggle */}
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={`border-slate-200 hover:bg-white/80 bg-white/60 backdrop-blur-sm shadow-sm ${
                showFilters ? "bg-slate-100" : ""
              }`}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
              {Object.keys(columnFilters).length > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {Object.keys(columnFilters).length}
                </Badge>
              )}
            </Button>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button
                variant="outline"
                onClick={clearAllFilters}
                className="border-slate-200 hover:bg-white/80 bg-white/60 backdrop-blur-sm shadow-sm text-slate-600"
              >
                <X className="w-4 h-4 mr-2" />
                Clear All
              </Button>
            )}

            {/* Add this after the Clear All button */}
            {participants.some((p) => (p.additional_participants?.length || 0) > 0) && (
              <Button
                variant="outline"
                onClick={allExpanded ? collapseAll : expandAll}
                className="border-slate-200 hover:bg-white/80 bg-white/60 backdrop-blur-sm shadow-sm"
              >
                {allExpanded ? (
                  <>
                    <ChevronUp className="w-4 h-4 mr-2" />
                    Collapse All
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 mr-2" />
                    Expand All
                  </>
                )}
              </Button>
            )}

            {/* Settings Button */}
            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="border-slate-200 hover:bg-white/80 bg-white/60 backdrop-blur-sm shadow-sm"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-4xl bg-white border-slate-200 max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-slate-800 font-light text-2xl">Participant List Settings</DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="table" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="table">Table Settings</TabsTrigger>
                    <TabsTrigger value="custom">Custom Fields</TabsTrigger>
                    <TabsTrigger value="stats">Stat Blocks</TabsTrigger>
                    <TabsTrigger value="views">View Saver</TabsTrigger>
                  </TabsList>

                  {/* Table Settings */}
                  <TabsContent value="table" className="space-y-4">
                    <div>
                      <h3 className="text-lg font-medium text-slate-800 mb-3">Table Columns</h3>
                      <div className="space-y-2">
                        {columns.map((column) => (
                          <div
                            key={column.id}
                            className="flex items-center justify-between p-3 border border-slate-200 rounded-lg"
                          >
                            <div className="flex items-center space-x-3">
                              <Checkbox checked={column.visible} onCheckedChange={() => toggleColumn(column.id)} />
                              <span className="text-sm font-medium text-slate-700">{column.label}</span>
                              {column.type === "custom" && (
                                <Badge variant="outline" className="text-xs">
                                  Custom
                                </Badge>
                              )}
                            </div>
                            {column.visible ? (
                              <Eye className="w-4 h-4 text-green-600" />
                            ) : (
                              <EyeOff className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-slate-700 mb-2">Table Density</h4>
                      <div className="flex gap-2">
                        {(["compact", "normal", "comfortable"] as const).map((density) => (
                          <Button
                            key={density}
                            variant={tableDensity === density ? "default" : "outline"}
                            size="sm"
                            onClick={() => setTableDensity(density)}
                            className="capitalize"
                          >
                            {density}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  {/* Custom Fields */}
                  <TabsContent value="custom" className="space-y-4">
                    <div>
                      <h3 className="text-lg font-medium text-slate-800 mb-3">Custom Fields</h3>

                      {/* Add new custom field */}
                      <div className="p-4 border border-slate-200 rounded-lg bg-slate-50 space-y-3">
                        <h4 className="font-medium text-slate-700">Add New Custom Field</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <Input
                            placeholder="Field name"
                            value={newCustomField.name}
                            onChange={(e) => setNewCustomField({ ...newCustomField, name: e.target.value })}
                          />
                          <Select
                            value={newCustomField.type}
                            onValueChange={(value: "text" | "dropdown" | "checkbox") =>
                              setNewCustomField({ ...newCustomField, type: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="text">Text</SelectItem>
                              <SelectItem value="dropdown">Dropdown</SelectItem>
                              <SelectItem value="checkbox">Checkbox</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button onClick={addCustomField} disabled={!newCustomField.name}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Field
                          </Button>
                        </div>
                        {newCustomField.type === 'dropdown' && (
                          <Input
                            placeholder="Options (comma-separated)"
                            value={newCustomField.options.join(", ")}
                            onChange={(e) =>
                              setNewCustomField({
                                ...newCustomField,
                                options: e.target.value
                                  .split(",")
                                  .map((s) => s.trim())
                                  .filter(Boolean),
                              })
                            }
                          />
                        )}
                      </div>

                      {/* Existing custom fields */}
                      <div className="space-y-2">
                        {customFields.map((field) => (
                          <div
                            key={field.id}
                            className="flex items-center justify-between p-3 border border-slate-200 rounded-lg"
                          >
                            <div>
                              <span className="text-sm font-medium text-slate-700">{field.name}</span>
                              <Badge variant="outline" className="ml-2 text-xs">
                                {field.type}
                              </Badge>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeCustomField(field.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                        {customFields.length === 0 && (
                          <p className="text-slate-500 text-center py-4">No custom fields created yet</p>
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  {/* Stat Blocks */}
                  <TabsContent value="stats" className="space-y-4">
                    <div>
                      <h3 className="text-lg font-medium text-slate-800 mb-3">Stat Blocks</h3>
                      <div className="space-y-2">
                        {stats.map((stat) => (
                          <div
                            key={stat.id}
                            className="flex items-center justify-between p-3 border border-slate-200 rounded-lg"
                          >
                            <div className="flex items-center space-x-3">
                              <Checkbox checked={stat.visible} onCheckedChange={() => toggleStat(stat.id)} />
                              <div className="flex flex-col">
                                <span className="text-sm font-medium text-slate-700">{stat.label}</span>
                                {stat.id === "childrenCount" && (
                                  <span className="text-xs text-slate-500">
                                    Age filter: {stat.maxAge || 18} and below
                                  </span>
                                )}
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {stat.type}
                              </Badge>
                            </div>
                            <div className="flex items-center space-x-2">
                              {stat.id === "childrenCount" && (
                                <div className="flex items-center space-x-2">
                                  <Label className="text-xs text-slate-600">Max Age:</Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={stat.maxAge || 18}
                                    onChange={(e) => updateStatMaxAge(stat.id, Number.parseInt(e.target.value) || 18)}
                                    className="w-16 h-8 text-xs"
                                  />
                                </div>
                              )}
                              <span className="text-sm text-slate-600">{getStatValue(stat)}</span>
                              {stat.visible ? (
                                <Eye className="w-4 h-4 text-green-600" />
                              ) : (
                                <EyeOff className="w-4 h-4 text-slate-400" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  {/* View Saver */}
                  <TabsContent value="views" className="space-y-4">
                    <div>
                      <h3 className="text-lg font-medium text-slate-800 mb-3">Saved Views</h3>

                      {/* Save current view */}
                      <div className="p-4 border border-slate-200 rounded-lg bg-slate-50 space-y-3">
                        <h4 className="font-medium text-slate-700">Save Current View</h4>
                        <div className="flex gap-3">
                          <Input
                            placeholder="View name"
                            value={newViewName}
                            onChange={(e) => setNewViewName(e.target.value)}
                            className="flex-1"
                          />
                          <Button onClick={saveCurrentView} disabled={!newViewName}>
                            <Save className="w-4 h-4 mr-2" />
                            Save View
                          </Button>
                        </div>
                      </div>

                      {/* Current view indicator */}
                      <div className="p-3 border border-blue-200 rounded-lg bg-blue-50">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-blue-800">Current View: {currentViewName}</span>
                          <Badge className="bg-blue-100 text-blue-800">Active</Badge>
                        </div>
                      </div>

                      {/* Saved views list */}
                      <div className="space-y-2">
                        {savedViews.map((view) => (
                          <div
                            key={view.name}
                            className="flex items-center justify-between p-3 border border-slate-200 rounded-lg"
                          >
                            <div>
                              <span className="text-sm font-medium text-slate-700">{view.name}</span>
                              <div className="text-xs text-slate-500">
                                {view.columns.filter((c) => c.visible).length} columns,{" "}
                                {view.stats.filter((s) => s.visible).length} stats
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => loadView(view.name)}
                                disabled={currentViewName === view.name}
                              >
                                Load
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteView(view.name)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                        {savedViews.length === 0 && (
                          <p className="text-slate-500 text-center py-4">No saved views yet</p>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>

            {/* Add Guest Button */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white rounded-xl px-6 shadow-lg hover:shadow-xl transition-all duration-300">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Guest
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl bg-white border-slate-200 max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-slate-800 font-light text-2xl">Add New Guest</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                  <div>
                    <Label htmlFor="first_name" className="text-slate-700 font-medium">
                      First Name *
                    </Label>
                    <Input
                      id="first_name"
                      value={newParticipant.first_name}
                      onChange={(e) => setNewParticipant({ ...newParticipant, first_name: e.target.value })}
                      className="border-slate-200 focus:border-rose-400"
                      placeholder="Enter first name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="last_name" className="text-slate-700 font-medium">
                      Last Name *
                    </Label>
                    <Input
                      id="last_name"
                      value={newParticipant.last_name}
                      onChange={(e) => setNewParticipant({ ...newParticipant, last_name: e.target.value })}
                      className="border-slate-200 focus:border-rose-400"
                      placeholder="Enter last name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-slate-700 font-medium">
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={newParticipant.email}
                      onChange={(e) => setNewParticipant({ ...newParticipant, email: e.target.value })}
                      className="border-slate-200 focus:border-rose-400"
                      placeholder="Enter email address"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="text-slate-700 font-medium">
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      value={newParticipant.phone}
                      onChange={(e) => setNewParticipant({ ...newParticipant, phone: e.target.value })}
                      className="border-slate-200 focus:border-rose-400"
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="family" className="text-slate-700 font-medium">
                      Family
                    </Label>
                    <Input
                      id="family"
                      value={newParticipant.family}
                      onChange={(e) => setNewParticipant({ ...newParticipant, family: e.target.value })}
                      className="border-slate-200 focus:border-rose-400"
                      placeholder="Enter family name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="relationship" className="text-slate-700 font-medium">
                      Relationship
                    </Label>
                    <Input
                      id="relationship"
                      value={newParticipant.relationship}
                      onChange={(e) => setNewParticipant({ ...newParticipant, relationship: e.target.value })}
                      className="border-slate-200 focus:border-rose-400"
                      placeholder="e.g., Family, Friend, Colleague"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="invited_by" className="text-slate-700 font-medium">
                      Invited By
                    </Label>
                    <Select
                      value={newParticipant.invited_by}
                      onValueChange={(value) => setNewParticipant({ ...newParticipant, invited_by: value })}
                    >
                      <SelectTrigger className="border-slate-200 focus:border-rose-400">
                        <SelectValue placeholder="Select who invited them" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockUsers.map((user) => (
                          <SelectItem key={user} value={user}>
                            {user}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-slate-700 font-medium">Events</Label>
                    <MultiSelectBubbles
                      options={mockEvents}
                      value={newParticipant.events}
                      onChange={(value) => setNewParticipant({ ...newParticipant, events: value })}
                      placeholder="Select events"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-slate-700 font-medium">Sub-Events</Label>
                    <MultiSelectBubbles
                      options={mockSubEvents}
                      value={newParticipant.sub_events}
                      onChange={(value) => setNewParticipant({ ...newParticipant, sub_events: value })}
                      placeholder="Select sub-events"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-slate-700 font-medium">Tags</Label>
                    <MultiSelectBubbles
                      options={tagList}
                      value={newParticipant.tags}
                      onChange={(value) => setNewParticipant({ ...newParticipant, tags: value })}
                      placeholder="Select tags"
                    />
                  </div>
                  <div className="md:col-span-2 flex items-center space-x-2">
                    <Checkbox
                      id="is_child"
                      checked={newParticipant.is_child}
                      onCheckedChange={(checked) =>
                        setNewParticipant({
                          ...newParticipant,
                          is_child: !!checked,
                          child_age: checked ? newParticipant.child_age : "",
                        })
                      }
                    />
                    <Label htmlFor="is_child" className="text-slate-700 font-medium">
                      Child?
                    </Label>
                    {newParticipant.is_child && (
                      <Input
                        type="number"
                        placeholder="Age"
                        value={newParticipant.child_age}
                        onChange={(e) => setNewParticipant({ ...newParticipant, child_age: e.target.value })}
                        className="w-20 border-slate-200 focus:border-rose-400"
                      />
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <Button
                      onClick={handleAddParticipant}
                      className="w-full bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white py-3"
                    >
                      Add Guest
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Column Filters */}
        {showFilters && (
          <Card className="border-slate-200/50 shadow-sm bg-white/90 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-slate-700">Column Filters</h3>
                  <Button variant="ghost" size="sm" onClick={() => setShowFilters(false)} className="h-6 w-6 p-0">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {visibleColumns.map((column) => (
                    <div key={column.id} className="space-y-1">
                      <Label className="text-xs text-slate-600">{column.label}</Label>
                      <div className="relative">
                        <Input
                          placeholder={`Filter ${column.label.toLowerCase()}...`}
                          value={columnFilters[column.id] || ""}
                          onChange={(e) => updateColumnFilter(column.id, e.target.value)}
                          className="text-sm h-8"
                        />
                        {columnFilters[column.id] && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => clearColumnFilter(column.id)}
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0 hover:bg-slate-100"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Participant Table */}
      <Card className="border-slate-200/50 shadow-lg bg-white/90 backdrop-blur-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table
              className={`min-w-full ${
                tableDensity === "compact" ? "text-xs" : tableDensity === "comfortable" ? "text-base" : "text-sm"
              }`}
            >
              <TableHeader>
                <TableRow
                  className={`border-slate-200/50 bg-slate-50/50 ${
                    tableDensity === "compact" ? "h-8" : tableDensity === "comfortable" ? "h-14" : "h-10"
                  }`}
                >
                  <TableHead className="w-12"></TableHead>
                  {visibleColumns.map((column) => (
                    <TableHead key={column.id} className="font-medium text-slate-700">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort(column.id)}
                        className="h-auto p-0 font-medium text-slate-700 hover:text-slate-900 flex items-center justify-start w-full text-left"
                      >
                        {column.label}
                        {getSortIcon(column.id)}
                      </Button>
                    </TableHead>
                  ))}
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredParticipants.map((participant) => (
                  <>
                    <TableRow
                      key={participant.id}
                      className="border-slate-200/50 hover:bg-slate-50/50 transition-colors"
                    >
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 rounded-md"
                          onClick={(e) => toggleRowExpansion(participant.id, e)}
                          disabled={(participant.additional_participants?.length || 0) === 0}
                        >
                          {(participant.additional_participants?.length || 0) > 0 ? (
                            expandedRows.has(participant.id) ? (
                              <ChevronDown className="h-3 w-3 text-slate-500" />
                            ) : (
                              <ChevronRight className="h-3 w-3 text-slate-500" />
                            )
                          ) : (
                            <div className="h-3 w-3"></div>
                          )}
                        </Button>
                      </TableCell>
                      {visibleColumns.map((column) => (
                        <TableCell
                          key={column.id}
                          className={`${
                            tableDensity === "compact"
                              ? "px-2 py-1"
                              : tableDensity === "comfortable"
                                ? "px-6 py-4"
                                : "px-4 py-2"
                          } border-r border-slate-100/50 last:border-r-0`}
                        >
                          {renderCellContent(participant, column)}
                        </TableCell>
                      ))}
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation()
                            // Handle edit
                          }}
                        >
                          <Edit3 className="h-3 w-3 text-slate-500" />
                        </Button>
                      </TableCell>
                    </TableRow>

                    {/* Additional Participants */}
                    {expandedRows.has(participant.id) &&
                      participant.additional_participants?.map((additionalParticipant) => (
                        <TableRow key={additionalParticipant.id} className="border-slate-200/50 bg-slate-50/30">
                          <TableCell></TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-3 ml-4">
                              <Avatar className="w-6 h-6 border border-white shadow-sm">
                                <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-400 text-white text-xs">
                                  {getInitials(additionalParticipant.first_name, additionalParticipant.last_name)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium text-slate-700 text-sm">
                                  {additionalParticipant.first_name} {additionalParticipant.last_name}
                                </div>
                                {additionalParticipant.is_child && (
                                  <div className="text-xs text-blue-600">
                                    Child (Age: {additionalParticipant.child_age})
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          {visibleColumns.slice(1).map((column) => (
                            <TableCell key={column.id}>
                              {column.id === "contact" ? (
                                <div className="text-sm text-slate-600">
                                  {additionalParticipant.email && <div>{additionalParticipant.email}</div>}
                                  {additionalParticipant.phone && (
                                    <div className="text-xs">{additionalParticipant.phone}</div>
                                  )}
                                </div>
                              ) : column.id === "family" ? (
                                <div className="text-sm text-slate-600">{additionalParticipant.family || "-"}</div>
                              ) : column.id === "relationship" ? (
                                <Badge
                                  variant="outline"
                                  className="border-blue-300 text-blue-700 bg-blue-50 font-light text-xs"
                                >
                                  {additionalParticipant.relationship || "Unknown"}
                                </Badge>
                              ) : column.id === "invited_by" ? (
                                <div className="text-sm text-slate-600">{additionalParticipant.invited_by || "-"}</div>
                              ) : column.id === "events" ? (
                                <div className="flex flex-wrap gap-1">
                                  {(additionalParticipant.events || []).slice(0, 2).map((event) => (
                                    <Badge key={event} variant="outline" className="text-xs">
                                      {event}
                                    </Badge>
                                  ))}
                                  {(additionalParticipant.events || []).length > 2 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{(additionalParticipant.events || []).length - 2}
                                    </Badge>
                                  )}
                                </div>
                              ) : column.id === "sub_events" ? (
                                <div className="flex flex-wrap gap-1">
                                  {(additionalParticipant.sub_events || []).slice(0, 2).map((subEvent) => (
                                    <Badge key={subEvent} variant="outline" className="text-xs">
                                      {subEvent}
                                    </Badge>
                                  ))}
                                  {(additionalParticipant.sub_events || []).length > 2 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{(additionalParticipant.sub_events || []).length - 2}
                                    </Badge>
                                  )}
                                </div>
                              ) : column.id === "tags" ? (
                                <div className="flex flex-wrap gap-1">
                                  {(additionalParticipant.tags || []).slice(0, 2).map((tag) => (
                                    <Badge key={tag} variant="secondary" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                  {(additionalParticipant.tags || []).length > 2 && (
                                    <Badge variant="secondary" className="text-xs">
                                      +{(additionalParticipant.tags || []).length - 2}
                                    </Badge>
                                  )}
                                </div>
                              ) : column.id === "additional_count" ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setEditingParticipantId(participant.id)
                                  }}
                                  className="text-xs border-rose-200 text-rose-600 hover:bg-rose-50 h-6"
                                >
                                  <Plus className="w-3 h-3 mr-1" />
                                  Add
                                </Button>
                              ) : (
                                <div className="text-sm text-slate-600">-</div>
                              )}
                            </TableCell>
                          ))}
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation()
                                removeAdditionalParticipant(participant.id, additionalParticipant.id)
                              }}
                              className="h-6 w-6 text-slate-400 hover:text-red-500"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}

                    {/* Add Additional Participant Form */}
                    {expandedRows.has(participant.id) && editingParticipantId === participant.id && (
                      <TableRow className="border-slate-200/50 bg-rose-50/30">
                        <TableCell></TableCell>
                        <TableCell colSpan={visibleColumns.length + 1}>
                          <div className="ml-4 p-4 bg-white rounded-lg border-2 border-rose-200 shadow-sm">
                            <div className="grid grid-cols-2 gap-3 mb-3">
                              <Input
                                placeholder="First Name"
                                value={newAdditionalParticipant.first_name}
                                onChange={(e) =>
                                  setNewAdditionalParticipant({
                                    ...newAdditionalParticipant,
                                    first_name: e.target.value,
                                  })
                                }
                                className="text-sm"
                              />
                              <Input
                                placeholder="Last Name"
                                value={newAdditionalParticipant.last_name}
                                onChange={(e) =>
                                  setNewAdditionalParticipant({
                                    ...newAdditionalParticipant,
                                    last_name: e.target.value,
                                  })
                                }
                                className="text-sm"
                              />
                              <Input
                                placeholder="Email"
                                value={newAdditionalParticipant.email}
                                onChange={(e) =>
                                  setNewAdditionalParticipant({ ...newAdditionalParticipant, email: e.target.value })
                                }
                                className="text-sm"
                              />
                              <Input
                                placeholder="Phone"
                                value={newAdditionalParticipant.phone}
                                onChange={(e) =>
                                  setNewAdditionalParticipant({ ...newAdditionalParticipant, phone: e.target.value })
                                }
                                className="text-sm"
                              />
                              <Input
                                placeholder="Family"
                                value={newAdditionalParticipant.family}
                                onChange={(e) =>
                                  setNewAdditionalParticipant({ ...newAdditionalParticipant, family: e.target.value })
                                }
                                className="text-sm"
                              />
                              <Input
                                placeholder="Relationship"
                                value={newAdditionalParticipant.relationship}
                                onChange={(e) =>
                                  setNewAdditionalParticipant({
                                    ...newAdditionalParticipant,
                                    relationship: e.target.value,
                                  })
                                }
                                className="text-sm"
                              />
                            </div>
                            <div className="grid grid-cols-1 gap-3 mb-3">
                              <Select
                                value={newAdditionalParticipant.invited_by}
                                onValueChange={(value) =>
                                  setNewAdditionalParticipant({ ...newAdditionalParticipant, invited_by: value })
                                }
                              >
                                <SelectTrigger className="text-sm">
                                  <SelectValue placeholder="Invited By" />
                                </SelectTrigger>
                                <SelectContent>
                                  {mockUsers.map((user) => (
                                    <SelectItem key={user} value={user}>
                                      {user}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <div className="space-y-2">
                                <Label className="text-xs text-slate-600">Events</Label>
                                <MultiSelectBubbles
                                  options={mockEvents}
                                  value={newAdditionalParticipant.events}
                                  onChange={(value) =>
                                    setNewAdditionalParticipant({ ...newAdditionalParticipant, events: value })
                                  }
                                  placeholder="Select events"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-xs text-slate-600">Tags</Label>
                                <MultiSelectBubbles
                                  options={tagList}
                                  value={newAdditionalParticipant.tags}
                                  onChange={(value) =>
                                    setNewAdditionalParticipant({ ...newAdditionalParticipant, tags: value })
                                  }
                                  placeholder="Select tags"
                                />
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id="additional_is_child"
                                  checked={newAdditionalParticipant.is_child}
                                  onCheckedChange={(checked) =>
                                    setNewAdditionalParticipant({
                                      ...newAdditionalParticipant,
                                      is_child: !!checked,
                                      child_age: checked ? newAdditionalParticipant.child_age : "",
                                    })
                                  }
                                />
                                <Label htmlFor="additional_is_child" className="text-sm">
                                  Child?
                                </Label>
                                {newAdditionalParticipant.is_child && (
                                  <Input
                                    type="number"
                                    placeholder="Age"
                                    value={newAdditionalParticipant.child_age}
                                    onChange={(e) =>
                                      setNewAdditionalParticipant({
                                        ...newAdditionalParticipant,
                                        child_age: e.target.value,
                                      })
                                    }
                                    className="w-20 text-sm"
                                  />
                                )}
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                onClick={() => addAdditionalParticipant(participant.id)}
                                className="bg-rose-500 hover:bg-rose-600 text-white text-xs"
                              >
                                Add Guest
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingParticipantId(null)}
                                className="text-xs"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>

            {filteredParticipants.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600 font-light">No participants found</p>
                <p className="text-slate-500 text-sm font-light">Try adjusting your search terms</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Contact Details Dialog - Replace the entire dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="sm:max-w-4xl bg-white border-slate-200 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-slate-800 font-light text-2xl">
              {selectedParticipant
                ? `${selectedParticipant.first_name} ${selectedParticipant.last_name}`
                : "Participant Details"}
            </DialogTitle>
          </DialogHeader>
          {selectedParticipant && (
            <div className="space-y-6 pt-4">
              <Tabs defaultValue="main" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="main">Main Participant</TabsTrigger>
                  <TabsTrigger value="additional">
                    Additional Guests ({selectedParticipant.additional_participants?.length || 0})
                  </TabsTrigger>
                </TabsList>

                {/* Main Participant Tab */}
                <TabsContent value="main" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-slate-700">First Name</Label>
                        <Input
                          value={selectedParticipant.first_name}
                          onChange={(e) =>
                            setSelectedParticipant({
                              ...selectedParticipant,
                              first_name: e.target.value,
                            })
                          }
                          className="border-slate-200 focus:border-rose-400"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-slate-700">Last Name</Label>
                        <Input
                          value={selectedParticipant.last_name}
                          onChange={(e) =>
                            setSelectedParticipant({
                              ...selectedParticipant,
                              last_name: e.target.value,
                            })
                          }
                          className="border-slate-200 focus:border-rose-400"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-slate-700">Email</Label>
                        <Input
                          value={selectedParticipant.email || ""}
                          onChange={(e) =>
                            setSelectedParticipant({
                              ...selectedParticipant,
                              email: e.target.value,
                            })
                          }
                          className="border-slate-200 focus:border-rose-400"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-slate-700">Phone</Label>
                        <Input
                          value={selectedParticipant.phone || ""}
                          onChange={(e) =>
                            setSelectedParticipant({
                              ...selectedParticipant,
                              phone: e.target.value,
                            })
                          }
                          className="border-slate-200 focus:border-rose-400"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-slate-700">Family</Label>
                        <Input
                          value={selectedParticipant.family || ""}
                          onChange={(e) =>
                            setSelectedParticipant({
                              ...selectedParticipant,
                              family: e.target.value,
                            })
                          }
                          className="border-slate-200 focus:border-rose-400"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-slate-700">Relationship</Label>
                        <Input
                          value={selectedParticipant.relationship || ""}
                          onChange={(e) =>
                            setSelectedParticipant({
                              ...selectedParticipant,
                              relationship: e.target.value,
                            })
                          }
                          className="border-slate-200 focus:border-rose-400"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-slate-700">Invited By</Label>
                        <Select
                          value={selectedParticipant.invited_by || ""}
                          onValueChange={(value) =>
                            setSelectedParticipant({
                              ...selectedParticipant,
                              invited_by: value,
                            })
                          }
                        >
                          <SelectTrigger className="border-slate-200 focus:border-rose-400">
                            <SelectValue placeholder="Select who invited them" />
                          </SelectTrigger>
                          <SelectContent>
                            {mockUsers.map((user) => (
                              <SelectItem key={user} value={user}>
                                {user}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="edit_is_child"
                          checked={selectedParticipant.is_child || false}
                          onCheckedChange={(checked) =>
                            setSelectedParticipant({
                              ...selectedParticipant,
                              is_child: !!checked,
                              child_age: checked ? selectedParticipant.child_age : undefined,
                            })
                          }
                        />
                        <Label htmlFor="edit_is_child" className="text-sm font-medium text-slate-700">
                          Child?
                        </Label>
                        {selectedParticipant.is_child && (
                          <Input
                            type="number"
                            placeholder="Age"
                            value={selectedParticipant.child_age || ""}
                            onChange={(e) =>
                              setSelectedParticipant({
                                ...selectedParticipant,
                                child_age: e.target.value ? Number.parseInt(e.target.value) : undefined,
                              })
                            }
                            className="w-20 border-slate-200 focus:border-rose-400"
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-slate-700">Events</Label>
                      <MultiSelectBubbles
                        options={mockEvents}
                        value={selectedParticipant.events || []}
                        onChange={(value) =>
                          setSelectedParticipant({
                            ...selectedParticipant,
                            events: value,
                          })
                        }
                        placeholder="Select events"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-slate-700">Sub-Events</Label>
                      <MultiSelectBubbles
                        options={mockSubEvents}
                        value={selectedParticipant.sub_events || []}
                        onChange={(value) =>
                          setSelectedParticipant({
                            ...selectedParticipant,
                            sub_events: value,
                          })
                        }
                        placeholder="Select sub-events"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-slate-700">Tags</Label>
                      <MultiSelectBubbles
                        options={tagList}
                        value={selectedParticipant.tags || []}
                        onChange={(value) =>
                          setSelectedParticipant({
                            ...selectedParticipant,
                            tags: value,
                          })
                        }
                        placeholder="Select tags"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={async () => {
                        // Save main participant changes
                        try {
                          const updateData = {
                            first_name: selectedParticipant.first_name,
                            last_name: selectedParticipant.last_name,
                            email: selectedParticipant.email || null,
                            phone: selectedParticipant.phone || null,
                            family: selectedParticipant.family || null,
                            relationship: selectedParticipant.relationship || null,
                            invited_by: selectedParticipant.invited_by || null,
                            events: selectedParticipant.events?.length ? selectedParticipant.events : null,
                            sub_events: selectedParticipant.sub_events?.length ? selectedParticipant.sub_events : null,
                            tags: selectedParticipant.tags?.length ? selectedParticipant.tags : null,
                            is_child: selectedParticipant.is_child || null,
                            child_age: selectedParticipant.child_age || null,
                          }

                          const { error } = await supabase
                            .from("participants")
                            .update(updateData)
                            .eq("id", selectedParticipant.id)

                          if (error) {
                            console.error("Error updating participant:", error)
                            toast.error("Failed to update participant")
                            return
                          }

                          // Update local state
                          setParticipants(
                            participants.map((p) => (p.id === selectedParticipant.id ? selectedParticipant : p)),
                          )

                          toast.success("Participant updated successfully!")
                          setIsDetailsDialogOpen(false)
                        } catch (error) {
                          console.error("Error in update:", error)
                          toast.error("Failed to update participant")
                        }
                      }}
                      className="bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white"
                    >
                      Save Changes
                    </Button>
                  </div>
                </TabsContent>

                {/* Additional Participants Tab */}
                <TabsContent value="additional" className="space-y-6">
                  {(selectedParticipant.additional_participants || []).length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                      <p className="text-slate-600 font-light">No additional guests</p>
                      <p className="text-slate-500 text-sm font-light">Additional guests will appear here</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {(selectedParticipant.additional_participants || []).map((additional, index) => (
                        <Card key={additional.id} className="border-slate-200">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center space-x-3">
                                <Avatar className="w-10 h-10">
                                  <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-400 text-white">
                                    {getInitials(additional.first_name, additional.last_name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <h4 className="font-medium text-slate-800">
                                    {additional.first_name} {additional.last_name}
                                  </h4>
                                  <p className="text-sm text-slate-600">{additional.relationship || "Unknown"}</p>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeAdditionalParticipant(selectedParticipant.id, additional.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-3">
                                <div>
                                  <Label className="text-xs text-slate-600">First Name</Label>
                                  <Input
                                    value={additional.first_name}
                                    onChange={(e) => {
                                      const updatedAdditional = [...(selectedParticipant.additional_participants || [])]
                                      updatedAdditional[index] = { ...additional, first_name: e.target.value }
                                      setSelectedParticipant({
                                        ...selectedParticipant,
                                        additional_participants: updatedAdditional,
                                      })
                                    }}
                                    className="text-sm h-8"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs text-slate-600">Last Name</Label>
                                  <Input
                                    value={additional.last_name}
                                    onChange={(e) => {
                                      const updatedAdditional = [...(selectedParticipant.additional_participants || [])]
                                      updatedAdditional[index] = { ...additional, last_name: e.target.value }
                                      setSelectedParticipant({
                                        ...selectedParticipant,
                                        additional_participants: updatedAdditional,
                                      })
                                    }}
                                    className="text-sm h-8"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs text-slate-600">Email</Label>
                                  <Input
                                    value={additional.email || ""}
                                    onChange={(e) => {
                                      const updatedAdditional = [...(selectedParticipant.additional_participants || [])]
                                      updatedAdditional[index] = { ...additional, email: e.target.value }
                                      setSelectedParticipant({
                                        ...selectedParticipant,
                                        additional_participants: updatedAdditional,
                                      })
                                    }}
                                    className="text-sm h-8"
                                  />
                                </div>
                              </div>

                              <div className="space-y-3">
                                <div>
                                  <Label className="text-xs text-slate-600">Phone</Label>
                                  <Input
                                    value={additional.phone || ""}
                                    onChange={(e) => {
                                      const updatedAdditional = [...(selectedParticipant.additional_participants || [])]
                                      updatedAdditional[index] = { ...additional, phone: e.target.value }
                                      setSelectedParticipant({
                                        ...selectedParticipant,
                                        additional_participants: updatedAdditional,
                                      })
                                    }}
                                    className="text-sm h-8"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs text-slate-600">Relationship</Label>
                                  <Input
                                    value={additional.relationship || ""}
                                    onChange={(e) => {
                                      const updatedAdditional = [...(selectedParticipant.additional_participants || [])]
                                      updatedAdditional[index] = { ...additional, relationship: e.target.value }
                                      setSelectedParticipant({
                                        ...selectedParticipant,
                                        additional_participants: updatedAdditional,
                                      })
                                    }}
                                    className="text-sm h-8"
                                  />
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`additional_child_${index}`}
                                    checked={additional.is_child || false}
                                    onCheckedChange={(checked) => {
                                      const updatedAdditional = [...(selectedParticipant.additional_participants || [])]
                                      updatedAdditional[index] = {
                                        ...additional,
                                        is_child: !!checked,
                                        child_age: checked ? additional.child_age : undefined,
                                      }
                                      setSelectedParticipant({
                                        ...selectedParticipant,
                                        additional_participants: updatedAdditional,
                                      })
                                    }}
                                  />
                                  <Label htmlFor={`additional_child_${index}`} className="text-xs">
                                    Child?
                                  </Label>
                                  {additional.is_child && (
                                    <Input
                                      type="number"
                                      placeholder="Age"
                                      value={additional.child_age || ""}
                                      onChange={(e) => {
                                        const updatedAdditional = [
                                          ...(selectedParticipant.additional_participants || []),
                                        ]
                                        updatedAdditional[index] = {
                                          ...additional,
                                          child_age: e.target.value ? Number.parseInt(e.target.value) : undefined,
                                        }
                                        setSelectedParticipant({
                                          ...selectedParticipant,
                                          additional_participants: updatedAdditional,
                                        })
                                      }}
                                      className="w-16 text-xs h-8"
                                    />
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="mt-4 space-y-3">
                              <div>
                                <Label className="text-xs text-slate-600">Events</Label>
                                <MultiSelectBubbles
                                  options={mockEvents}
                                  value={additional.events || []}
                                  onChange={(value) => {
                                    const updatedAdditional = [...(selectedParticipant.additional_participants || [])]
                                    updatedAdditional[index] = { ...additional, events: value }
                                    setSelectedParticipant({
                                      ...selectedParticipant,
                                      additional_participants: updatedAdditional,
                                    })
                                  }}
                                  placeholder="Select events"
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-slate-600">Tags</Label>
                                <MultiSelectBubbles
                                  options={tagList}
                                  value={additional.tags || []}
                                  onChange={(value) => {
                                    const updatedAdditional = [...(selectedParticipant.additional_participants || [])]
                                    updatedAdditional[index] = { ...additional, tags: value }
                                    setSelectedParticipant({
                                      ...selectedParticipant,
                                      additional_participants: updatedAdditional,
                                    })
                                  }}
                                  placeholder="Select tags"
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}

                      <div className="flex justify-end space-x-3 pt-4 border-t">
                        <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button
                          onClick={async () => {
                            // Save all additional participants changes
                            try {
                              for (const additional of selectedParticipant.additional_participants || []) {
                                const updateData = {
                                  first_name: additional.first_name,
                                  last_name: additional.last_name,
                                  email: additional.email || null,
                                  phone: additional.phone || null,
                                  family: additional.family || null,
                                  relationship: additional.relationship || null,
                                  invited_by: additional.invited_by || null,
                                  events: additional.events?.length ? additional.events : null,
                                  sub_events: additional.sub_events?.length ? additional.sub_events : null,
                                  tags: additional.tags?.length ? additional.tags : null,
                                  is_child: additional.is_child || null,
                                  child_age: additional.child_age || null,
                                }

                                const { error } = await supabase
                                  .from("additional_participants")
                                  .update(updateData)
                                  .eq("id", additional.id)

                                if (error) {
                                  console.error("Error updating additional participant:", error)
                                  toast.error("Failed to update additional participant")
                                  return
                                }
                              }

                              // Update local state
                              setParticipants(
                                participants.map((p) => (p.id === selectedParticipant.id ? selectedParticipant : p)),
                              )

                              toast.success("Additional participants updated successfully!")
                              setIsDetailsDialogOpen(false)
                            } catch (error) {
                              console.error("Error in update:", error)
                              toast.error("Failed to update additional participants")
                            }
                          }}
                          className="bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white"
                        >
                          Save All Changes
                        </Button>
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="text-center text-sm text-slate-500">
        Showing {filteredParticipants.length} participants ({statsData.totalGuests} total guests) of{" "}
        {participants.length} participants
        {hasActiveFilters && <span className="text-amber-600"> • Filters active</span>}
        {sortConfig && (
          <span className="text-blue-600">
            {" "}
            • Sorted by {visibleColumns.find((c) => c.id === sortConfig.key)?.label} ({sortConfig.direction})
          </span>
        )}
        • View: {currentViewName}
      </div>
    </div>
  )
}
