"use client"

import { useState, useEffect } from "react"
import { Plus, Plane, MapPin, Calendar, Users, DollarSign, Package, Share2, Lock, Edit, Check, X, MoreHorizontal, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { createClientSupabase } from "@/lib/supabase"
import { format, differenceInDays, parseISO } from "date-fns"
import { useFeatureFlags } from "@/lib/feature-flags"
import { useRouter } from "next/navigation"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useAccount } from "@/lib/account-context"

interface Trip {
  id: string
  user_id: string
  name: string
  description?: string
  start_date: string
  end_date: string
  is_password_protected: boolean
  created_at: string
}

interface Traveler {
  id: string
  name: string
  email?: string
  phone?: string
  is_organizer: boolean
}

interface Destination {
  id: string
  name: string
  country?: string
  city?: string
  arrival_date?: string
  departure_date?: string
  order_index: number
}

interface Flight {
  id: string
  flight_type: "departure" | "arrival"
  airline?: string
  flight_number?: string
  from_location: string
  to_location: string
  flight_date: string
  departure_time?: string
  arrival_time?: string
  notes?: string
}

interface Accommodation {
  id: string
  name: string
  address?: string
  check_in_date?: string
  check_out_date?: string
  notes?: string
}

interface ItineraryItem {
  id: string
  title: string
  description?: string
  start_date: string
  start_time?: string
  end_time?: string
  is_completed: boolean
}

interface Expense {
  id: string
  category: string
  description: string
  total_amount: number
  currency: string
  expense_date: string
  paid_by_traveler_id: string
  paid_by_name?: string
  receipt_url?: string
  notes?: string
  splits: ExpenseSplit[]
  selected_travelers?: string[] // For equal splitting selection
  conversion_rate?: number
  converted_amount?: number
}

interface ExpenseSplit {
  id: string
  traveler_id: string
  traveler_name?: string
  amount: number
  is_paid: boolean
}

interface PackingList {
  id: string
  name: string
  traveler_id?: string
  traveler_name?: string
  items: PackingItem[]
}

interface PackingItem {
  id: string
  item_name: string
  quantity: number
  is_packed: boolean
  notes?: string
}

// Add to AVAILABLE_CURRENCIES (copy from Budget page)
const AVAILABLE_CURRENCIES = [
  { value: "USD", label: "USD" },
  { value: "EUR", label: "EUR" },
  { value: "JPY", label: "JPY" },
  { value: "GBP", label: "GBP" },
  { value: "AUD", label: "AUD" },
  { value: "CAD", label: "CAD" },
  { value: "CHF", label: "CHF" },
  { value: "CNY", label: "CNY" },
  { value: "HKD", label: "HKD" },
  { value: "NZD", label: "NZD" },
  { value: "SEK", label: "SEK" },
  { value: "KRW", label: "KRW" },
  { value: "SGD", label: "SGD" },
  { value: "NOK", label: "NOK" },
  { value: "MXN", label: "MXN" },
  { value: "INR", label: "INR" },
  { value: "RUB", label: "RUB" },
  { value: "ZAR", label: "ZAR" },
  { value: "TRY", label: "TRY" },
  { value: "BRL", label: "BRL" },
  { value: "TWD", label: "TWD" },
  { value: "DKK", label: "DKK" },
  { value: "PLN", label: "PLN" },
  { value: "THB", label: "THB" },
  { value: "IDR", label: "IDR" },
]

export default function TripPlanPage() {
  const { features } = useFeatureFlags()
  const router = useRouter()
  const supabase = createClientSupabase()
  const { currentAccount } = useAccount()
  const [user, setUser] = useState<any>(null)
  const [trips, setTrips] = useState<Trip[]>([])
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null)
  const [travelers, setTravelers] = useState<Traveler[]>([])
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [flights, setFlights] = useState<Flight[]>([])
  const [accommodations, setAccommodations] = useState<Accommodation[]>([])
  const [itinerary, setItinerary] = useState<ItineraryItem[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [packingLists, setPackingLists] = useState<PackingList[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [itineraryView, setItineraryView] = useState<"day" | "week" | "month">("day")
  const [userCurrency, setUserCurrency] = useState("USD")
  const [exchangeRates, setExchangeRates] = useState<any[]>([])

  // Dialog states
  const [showNewTripDialog, setShowNewTripDialog] = useState(false)
  const [showTravelerDialog, setShowTravelerDialog] = useState(false)
  const [showDestinationDialog, setShowDestinationDialog] = useState(false)
  const [showFlightDialog, setShowFlightDialog] = useState(false)
  const [showAccommodationDialog, setShowAccommodationDialog] = useState(false)
  const [showItineraryDialog, setShowItineraryDialog] = useState(false)
  const [showExpenseDialog, setShowExpenseDialog] = useState(false)
  const [showPackingDialog, setShowPackingDialog] = useState(false)

  // Form states
  const [newTrip, setNewTrip] = useState({
    name: "",
    description: "",
    start_date: "",
    end_date: "",
    password: "",
    is_password_protected: false,
  })

  const [newTraveler, setNewTraveler] = useState({
    name: "",
    email: "",
    phone: "",
    is_organizer: false,
  })

  const [newDestination, setNewDestination] = useState({
    name: "",
    country: "",
    city: "",
    arrival_date: "",
    departure_date: "",
  })

  const [newFlight, setNewFlight] = useState({
    flight_type: "departure" as "departure" | "arrival",
    airline: "",
    flight_number: "",
    from_location: "",
    to_location: "",
    flight_date: "",
    departure_time: "",
    arrival_time: "",
    notes: "",
  })

  const [newAccommodation, setNewAccommodation] = useState({
    name: "",
    address: "",
    check_in_date: "",
    check_out_date: "",
    notes: "",
  })

  const [newItineraryItem, setNewItineraryItem] = useState({
    title: "",
    description: "",
    start_date: "",
    start_time: "",
    end_time: "",
  })

  const [newExpense, setNewExpense] = useState({
    category: "other",
    description: "",
    total_amount: 0,
    currency: "USD",
    expense_date: "",
    paid_by_traveler_id: "",
    notes: "",
    split_type: "equal" as "equal" | "manual",
    splits: [] as { traveler_id: string; amount: number }[],
    selected_travelers: [] as string[],
    conversion_rate: 1,
    converted_amount: 0,
  })

  // Add editing states
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [editingTraveler, setEditingTraveler] = useState<Traveler | null>(null)
  const [editingDestination, setEditingDestination] = useState<Destination | null>(null)
  const [editingFlight, setEditingFlight] = useState<Flight | null>(null)
  const [editingAccommodation, setEditingAccommodation] = useState<Accommodation | null>(null)
  const [editingItineraryItem, setEditingItineraryItem] = useState<ItineraryItem | null>(null)

  // Function definitions
  const fetchTrips = async () => {
    try {
      // Ensure user is authenticated
      if (!user || !user.id) {
        console.log("User not authenticated, skipping trip fetch")
        setTrips([])
        setLoading(false)
        return
      }

      console.log("Fetching trips for user:", user.id)
      console.log("Supabase client:", supabase ? "initialized" : "not initialized")
      
      // Verify authentication is still valid
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        console.log("No active session found")
        toast.error("Session expired. Please log in again.")
        router.push("/auth/login")
        return
      }
      
      console.log("Session found, making database query...")
      
      // Test the connection first
      try {
        const testQuery = await supabase.from("trips").select("count", { count: "exact", head: true })
        console.log("Test query result:", testQuery)
      } catch (testError) {
        console.error("Test query failed:", testError)
      }
      
      const { data, error } = await supabase.from("trips").select("*").order("created_at", { ascending: false })

      console.log("Query completed. Data:", data, "Error:", error)

      // If the table isn't there yet (error code 42P01 or message contains it),
      // fall back to an empty array so the page still renders.
      if (error) {
        console.error("Supabase error details:", error)
        console.error("Error type:", typeof error)
        console.error("Error keys:", Object.keys(error))
        console.error("Error stringified:", JSON.stringify(error, null, 2))
        
        if (error.code === "42P01" || error.message?.includes("does not exist")) {
          toast.error(
            "Trip tables are missing. Run the SQL migration (scripts/create-trip-system-tables.sql) and reload.",
          )
          setTrips([])
          return
        }
        
        // Handle authentication errors
        if (error.code === "PGRST116" || error.message?.includes("JWT")) {
          toast.error("Authentication error. Please log in again.")
          router.push("/auth/login")
          return
        }
        
        // Handle permission errors
        if (error.code === "42501" || error.message?.includes("permission")) {
          toast.error("You don't have permission to access trips. Please contact support.")
          setTrips([])
          return
        }
        
        // Handle network errors
        if (error.code === "PGRST301" || error.message?.includes("network")) {
          toast.error("Network error. Please check your connection and try again.")
          setTrips([])
          return
        }
        
        throw error
      }

      // Handle successful response (even if empty)
      console.log("Trips fetched successfully:", data?.length || 0, "trips")
      setTrips(data || [])
      
      // Show a helpful message if no trips exist
      if (!data || data.length === 0) {
        console.log("No trips found for user. This is normal for new users.")
      }
      
    } catch (error) {
      console.error("Error fetching trips:", error)
      console.error("Error type:", typeof error)
      console.error("Error constructor:", error?.constructor?.name)
      console.error("Error message:", (error as any)?.message)
      console.error("Error stack:", (error as any)?.stack)
      console.error("Error details:", {
        message: (error as any)?.message,
        code: (error as any)?.code,
        details: (error as any)?.details,
        hint: (error as any)?.hint,
        name: (error as any)?.name
      })
      
      // Try to stringify the error for more details
      try {
        console.error("Error stringified:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2))
      } catch (stringifyError) {
        console.error("Could not stringify error:", stringifyError)
      }
      
      toast.error("Failed to load trips")
      setTrips([]) // Set empty array on error
    } finally {
      setLoading(false)
    }
  }

  const fetchTripData = async (tripId: string) => {
    try {
      // Fetch all trip-related data
      const [travelersRes, destinationsRes, flightsRes, accommodationsRes, itineraryRes, expensesRes, packingRes] =
        await Promise.all([
          supabase.from("trip_travelers").select("*").eq("trip_id", tripId),
          supabase.from("trip_destinations").select("*").eq("trip_id", tripId).order("order_index"),
          supabase.from("trip_flights").select("*").eq("trip_id", tripId).order("flight_date"),
          supabase.from("trip_accommodations").select("*").eq("trip_id", tripId),
          supabase.from("trip_itinerary").select("*").eq("trip_id", tripId).order("start_date"),
          supabase
            .from("trip_expenses")
            .select(`
          *,
          trip_expense_splits (
            id,
            traveler_id,
            amount,
            is_paid
          )
        `)
            .eq("trip_id", tripId),
          supabase
            .from("trip_packing_lists")
            .select(`
          *,
          trip_packing_items (*)
        `)
            .eq("trip_id", tripId),
        ])

      if (travelersRes.error) throw travelersRes.error
      if (destinationsRes.error) throw destinationsRes.error
      if (flightsRes.error) throw flightsRes.error
      if (accommodationsRes.error) throw accommodationsRes.error
      if (itineraryRes.error) throw itineraryRes.error
      if (expensesRes.error) throw expensesRes.error
      if (packingRes.error) throw packingRes.error

      setTravelers(travelersRes.data || [])
      setDestinations(destinationsRes.data || [])
      setFlights(flightsRes.data || [])
      setAccommodations(accommodationsRes.data || [])
      setItinerary(itineraryRes.data || [])

      // Process expenses with splits
      const processedExpenses = (expensesRes.data || []).map((expense) => ({
        ...expense,
        splits: expense.trip_expense_splits || [],
      }))
      setExpenses(processedExpenses)

      // Process packing lists
      const processedPackingLists = (packingRes.data || []).map((list) => ({
        ...list,
        items: list.trip_packing_items || [],
      }))
      setPackingLists(processedPackingLists)
    } catch (error) {
      console.error("Error fetching trip data:", error)
      toast.error("Failed to load trip data")
    }
  }

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error("Please log in to access trip planning")
        router.push("/auth/login")
        return
      }
      setUser(user)
    }
    getUser()
  }, [supabase, router])

  // Check if trip plan feature is enabled
  useEffect(() => {
    if (!features.isLoading && !features.trip_plan_enabled) {
      toast.error("Trip Plan feature is not enabled for this account")
      router.push("/dashboard")
    }
  }, [features.isLoading, features.trip_plan_enabled, router])

  // Fetch trips only when user is authenticated
  useEffect(() => {
    if (user) {
      fetchTrips()
    }
  }, [user])

  useEffect(() => {
    if (selectedTrip) {
      fetchTripData(selectedTrip.id)
    }
  }, [selectedTrip])

  useEffect(() => {
    if (currentAccount) {
      setUserCurrency(currentAccount.currency || "USD")
      fetchExchangeRates()
    }
  }, [currentAccount])

  // Add this function before the useEffect that calls it:
  const fetchExchangeRates = async () => {
    const { data, error } = await supabase.from("exchange_rates").select("*")
    if (!error && data) setExchangeRates(data)
  }

  useEffect(() => {
    if (newExpense.currency && userCurrency && exchangeRates.length > 0) {
      const found = exchangeRates.find(r => r.from_currency === newExpense.currency && r.to_currency === userCurrency)
      setNewExpense(prev => ({
        ...prev,
        conversion_rate: found ? found.rate : 1
      }))
    }
  }, [newExpense.currency, userCurrency, exchangeRates])

  // Don't render if feature is disabled or still loading
  if (features.isLoading || !features.trip_plan_enabled) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">
            {features.isLoading ? "Loading..." : "Feature not available"}
          </p>
        </div>
      </div>
    )
  }

  // Don't render if user is not authenticated
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">Loading user...</p>
        </div>
      </div>
    )
  }

  const createTrip = async () => {
    if (!user) {
      toast.error("User not authenticated")
      return
    }

    try {
      // Try to write to Supabase first
      const { data, error } = await supabase
        .from("trips")
        .insert([
          {
            user_id: user.id, // Include user_id to make it user-dependent
            name: newTrip.name,
            description: newTrip.description,
            start_date: newTrip.start_date,
            end_date: newTrip.end_date,
            is_password_protected: newTrip.is_password_protected,
            password_hash: newTrip.is_password_protected ? btoa(newTrip.password) : null,
          },
        ])
        .select()
        .single()

      if (error) {
        if (error.code === "42P01" || error.message?.includes("does not exist")) {
          // Fallback to local fake trip so preview keeps working
          const fakeId = crypto.randomUUID()
          const localTrip = {
            id: fakeId,
            user_id: user.id,
            ...newTrip,
            start_date: newTrip.start_date,
            end_date: newTrip.end_date,
            is_password_protected: newTrip.is_password_protected,
            created_at: new Date().toISOString(),
          }
          setTrips((prev) => [localTrip, ...prev])
          setSelectedTrip(localTrip as Trip)
          toast.message("Created a local (non-persisted) trip. Run the migration to save to Supabase.")
          setShowNewTripDialog(false)
          return
        }
        throw error
      }

      setTrips((prev) => [data, ...prev])
      setSelectedTrip(data)
      setShowNewTripDialog(false)
      setNewTrip({
        name: "",
        description: "",
        start_date: "",
        end_date: "",
        password: "",
        is_password_protected: false,
      })
      toast.success("Trip created successfully!")
    } catch (error) {
      console.error("Error creating trip:", error)
      toast.error("Failed to create trip")
    }
  }

  const addTraveler = async () => {
    if (!selectedTrip) return

    try {
      const { data, error } = await supabase
        .from("trip_travelers")
        .insert([
          {
            trip_id: selectedTrip.id,
            ...newTraveler,
          },
        ])
        .select()
        .single()

      if (error) throw error

      setTravelers((prev) => [...prev, data])
      setShowTravelerDialog(false)
      setNewTraveler({
        name: "",
        email: "",
        phone: "",
        is_organizer: false,
      })
      toast.success("Traveler added successfully!")
    } catch (error) {
      console.error("Error adding traveler:", error)
      toast.error("Failed to add traveler")
    }
  }

  const addDestination = async () => {
    if (!selectedTrip) return

    try {
      const { data, error } = await supabase
        .from("trip_destinations")
        .insert([
          {
            trip_id: selectedTrip.id,
            ...newDestination,
            order_index: destinations.length,
          },
        ])
        .select()
        .single()

      if (error) throw error

      setDestinations((prev) => [...prev, data])
      setShowDestinationDialog(false)
      setNewDestination({
        name: "",
        country: "",
        city: "",
        arrival_date: "",
        departure_date: "",
      })
      toast.success("Destination added successfully!")
    } catch (error) {
      console.error("Error adding destination:", error)
      toast.error("Failed to add destination")
    }
  }

  const addFlight = async () => {
    if (!selectedTrip) return

    try {
      const { data, error } = await supabase
        .from("trip_flights")
        .insert([
          {
            trip_id: selectedTrip.id,
            ...newFlight,
          },
        ])
        .select()
        .single()

      if (error) throw error

      setFlights((prev) => [...prev, data])
      setShowFlightDialog(false)
      setNewFlight({
        flight_type: "departure",
        airline: "",
        flight_number: "",
        from_location: "",
        to_location: "",
        flight_date: "",
        departure_time: "",
        arrival_time: "",
        notes: "",
      })
      toast.success("Flight added successfully!")
    } catch (error) {
      console.error("Error adding flight:", error)
      toast.error("Failed to add flight")
    }
  }

  const addAccommodation = async () => {
    if (!selectedTrip) return

    try {
      const { data, error } = await supabase
        .from("trip_accommodations")
        .insert([
          {
            trip_id: selectedTrip.id,
            ...newAccommodation,
          },
        ])
        .select()
        .single()

      if (error) throw error

      setAccommodations((prev) => [...prev, data])
      setShowAccommodationDialog(false)
      setNewAccommodation({
        name: "",
        address: "",
        check_in_date: "",
        check_out_date: "",
        notes: "",
      })
      toast.success("Accommodation added successfully!")
    } catch (error) {
      console.error("Error adding accommodation:", error)
      toast.error("Failed to add accommodation")
    }
  }

  const addItineraryItem = async () => {
    if (!selectedTrip) return

    try {
      const { data, error } = await supabase
        .from("trip_itinerary")
        .insert([
          {
            trip_id: selectedTrip.id,
            ...newItineraryItem,
          },
        ])
        .select()
        .single()

      if (error) throw error

      setItinerary((prev) => [...prev, data])
      setShowItineraryDialog(false)
      setNewItineraryItem({
        title: "",
        description: "",
        start_date: "",
        start_time: "",
        end_time: "",
      })
      toast.success("Itinerary item added successfully!")
    } catch (error) {
      console.error("Error adding itinerary item:", error)
      toast.error("Failed to add itinerary item")
    }
  }

  const addExpense = async () => {
    if (!selectedTrip) return

    try {
      // First create the expense
      const { data: expenseData, error: expenseError } = await supabase
        .from("trip_expenses")
        .insert([
          {
            trip_id: selectedTrip.id,
            category: newExpense.category,
            description: newExpense.description,
            total_amount: newExpense.total_amount,
            currency: newExpense.currency,
            expense_date: newExpense.expense_date,
            paid_by_traveler_id: newExpense.paid_by_traveler_id,
            notes: newExpense.notes,
            conversion_rate: newExpense.conversion_rate,
            converted_amount: newExpense.converted_amount,
          },
        ])
        .select()
        .single()

      if (expenseError) throw expenseError

      // Create expense splits
      let splits: { expense_id: string; traveler_id: string; amount: number }[] = []
      if (newExpense.split_type === "equal") {
        // Use selected travelers for equal splitting, or all travelers if none selected
        const travelersToSplitWith = newExpense.selected_travelers.length > 0 
          ? travelers.filter(t => newExpense.selected_travelers.includes(t.id))
          : travelers
        
        if (travelersToSplitWith.length > 0) {
          const amountPerPerson = newExpense.total_amount / travelersToSplitWith.length
          splits = travelersToSplitWith.map((traveler) => ({
            expense_id: expenseData.id,
            traveler_id: traveler.id,
            amount: amountPerPerson,
          }))
        }
      } else {
        splits = newExpense.splits.map((split) => ({
          expense_id: expenseData.id,
          traveler_id: split.traveler_id,
          amount: split.amount,
        }))
      }

      const { error: splitsError } = await supabase.from("trip_expense_splits").insert(splits)

      if (splitsError) throw splitsError

      // Refresh expenses
      fetchTripData(selectedTrip.id)
      setShowExpenseDialog(false)
      setNewExpense({
        category: "other",
        description: "",
        total_amount: 0,
        currency: "USD",
        expense_date: "",
        paid_by_traveler_id: "",
        notes: "",
        split_type: "equal",
        splits: [],
        selected_travelers: [],
        conversion_rate: 1,
        converted_amount: 0,
      })
      toast.success("Expense added successfully!")
    } catch (error) {
      console.error("Error adding expense:", error)
      toast.error("Failed to add expense")
    }
  }

  const toggleItineraryItem = async (itemId: string, completed: boolean) => {
    try {
      const { error } = await supabase.from("trip_itinerary").update({ is_completed: completed }).eq("id", itemId)

      if (error) throw error

      setItinerary((prev) => prev.map((item) => (item.id === itemId ? { ...item, is_completed: completed } : item)))
    } catch (error) {
      console.error("Error updating itinerary item:", error)
      toast.error("Failed to update item")
    }
  }

  const calculateTripDuration = (startDate: string, endDate: string) => {
    return differenceInDays(parseISO(endDate), parseISO(startDate)) + 1
  }

  const getTotalExpenses = () => {
    return expenses.reduce((total, expense) => total + expense.total_amount, 0)
  }

  const getExpensesByTraveler = (travelerId: string) => {
    return expenses.reduce((total, expense) => {
      const split = expense.splits.find((s) => s.traveler_id === travelerId)
      return total + (split?.amount || 0)
    }, 0)
  }

  // CRUD Functions for Editing and Deleting

  // Expense CRUD
  const updateExpense = async (expense: Expense) => {
    if (!selectedTrip) return

    try {
      // Update the expense
      const { error: expenseError } = await supabase
        .from("trip_expenses")
        .update({
          category: newExpense.category,
          description: newExpense.description,
          total_amount: newExpense.total_amount,
          currency: newExpense.currency,
          expense_date: newExpense.expense_date,
          paid_by_traveler_id: newExpense.paid_by_traveler_id,
          notes: newExpense.notes,
          conversion_rate: newExpense.conversion_rate,
          converted_amount: newExpense.converted_amount,
        })
        .eq("id", expense.id)

      if (expenseError) throw expenseError

      // Delete existing splits and recreate them
      await supabase.from("trip_expense_splits").delete().eq("expense_id", expense.id)

      // Create new splits based on split type
      let splits: { expense_id: string; traveler_id: string; amount: number }[] = []
      
      if (newExpense.split_type === "equal") {
        // Use selected travelers for equal splitting, or all travelers if none selected
        const travelersToSplitWith = newExpense.selected_travelers.length > 0 
          ? travelers.filter(t => newExpense.selected_travelers.includes(t.id))
          : travelers
        
        if (travelersToSplitWith.length > 0) {
          const amountPerPerson = newExpense.total_amount / travelersToSplitWith.length
          splits = travelersToSplitWith.map((traveler) => ({
            expense_id: expense.id,
            traveler_id: traveler.id,
            amount: amountPerPerson,
          }))
        }
      } else {
        splits = newExpense.splits.map((split) => ({
          expense_id: expense.id,
          traveler_id: split.traveler_id,
          amount: split.amount,
        }))
      }

      if (splits.length > 0) {
        const { error: splitsError } = await supabase
          .from("trip_expense_splits")
          .insert(splits)

        if (splitsError) throw splitsError
      }

      fetchTripData(selectedTrip.id)
      setEditingExpense(null)
      setShowExpenseDialog(false)
      setNewExpense({
        category: "other",
        description: "",
        total_amount: 0,
        currency: "USD",
        expense_date: "",
        paid_by_traveler_id: "",
        notes: "",
        split_type: "equal",
        splits: [],
        selected_travelers: [],
        conversion_rate: 1,
        converted_amount: 0,
      })
      toast.success("Expense updated successfully!")
    } catch (error) {
      console.error("Error updating expense:", error)
      toast.error("Failed to update expense")
    }
  }

  const deleteExpense = async (expenseId: string) => {
    if (!selectedTrip) return

    try {
      // Delete splits first (due to foreign key constraint)
      await supabase.from("trip_expense_splits").delete().eq("expense_id", expenseId)
      
      // Delete the expense
      const { error } = await supabase.from("trip_expenses").delete().eq("id", expenseId)
      
      if (error) throw error

      fetchTripData(selectedTrip.id)
      toast.success("Expense deleted successfully!")
    } catch (error) {
      console.error("Error deleting expense:", error)
      toast.error("Failed to delete expense")
    }
  }

  // Traveler CRUD
  const updateTraveler = async (traveler: Traveler) => {
    if (!selectedTrip) return

    try {
      const { error } = await supabase
        .from("trip_travelers")
        .update({
          name: newTraveler.name,
          email: newTraveler.email,
          phone: newTraveler.phone,
          is_organizer: newTraveler.is_organizer,
        })
        .eq("id", traveler.id)

      if (error) throw error

      fetchTripData(selectedTrip.id)
      setEditingTraveler(null)
      setShowTravelerDialog(false)
      setNewTraveler({
        name: "",
        email: "",
        phone: "",
        is_organizer: false,
      })
      toast.success("Traveler updated successfully!")
    } catch (error) {
      console.error("Error updating traveler:", error)
      toast.error("Failed to update traveler")
    }
  }

  const deleteTraveler = async (travelerId: string) => {
    if (!selectedTrip) return

    try {
      const { error } = await supabase.from("trip_travelers").delete().eq("id", travelerId)
      
      if (error) throw error

      fetchTripData(selectedTrip.id)
      toast.success("Traveler deleted successfully!")
    } catch (error) {
      console.error("Error deleting traveler:", error)
      toast.error("Failed to delete traveler")
    }
  }

  // Destination CRUD
  const updateDestination = async (destination: Destination) => {
    if (!selectedTrip) return

    try {
      const { error } = await supabase
        .from("trip_destinations")
        .update({
          name: newDestination.name,
          country: newDestination.country,
          city: newDestination.city,
          arrival_date: newDestination.arrival_date,
          departure_date: newDestination.departure_date,
          order_index: destination.order_index,
        })
        .eq("id", destination.id)

      if (error) throw error

      fetchTripData(selectedTrip.id)
      setEditingDestination(null)
      setShowDestinationDialog(false)
      setNewDestination({
        name: "",
        country: "",
        city: "",
        arrival_date: "",
        departure_date: "",
      })
      toast.success("Destination updated successfully!")
    } catch (error) {
      console.error("Error updating destination:", error)
      toast.error("Failed to update destination")
    }
  }

  const deleteDestination = async (destinationId: string) => {
    if (!selectedTrip) return

    try {
      const { error } = await supabase.from("trip_destinations").delete().eq("id", destinationId)
      
      if (error) throw error

      fetchTripData(selectedTrip.id)
      toast.success("Destination deleted successfully!")
    } catch (error) {
      console.error("Error deleting destination:", error)
      toast.error("Failed to delete destination")
    }
  }

  // Flight CRUD
  const updateFlight = async (flight: Flight) => {
    if (!selectedTrip) return

    try {
      const { error } = await supabase
        .from("trip_flights")
        .update({
          flight_type: flight.flight_type,
          airline: flight.airline,
          flight_number: flight.flight_number,
          from_location: flight.from_location,
          to_location: flight.to_location,
          flight_date: flight.flight_date,
          departure_time: flight.departure_time,
          arrival_time: flight.arrival_time,
          notes: flight.notes,
        })
        .eq("id", flight.id)

      if (error) throw error

      fetchTripData(selectedTrip.id)
      setEditingFlight(null)
      toast.success("Flight updated successfully!")
    } catch (error) {
      console.error("Error updating flight:", error)
      toast.error("Failed to update flight")
    }
  }

  const deleteFlight = async (flightId: string) => {
    if (!selectedTrip) return

    try {
      const { error } = await supabase.from("trip_flights").delete().eq("id", flightId)
      
      if (error) throw error

      fetchTripData(selectedTrip.id)
      toast.success("Flight deleted successfully!")
    } catch (error) {
      console.error("Error deleting flight:", error)
      toast.error("Failed to delete flight")
    }
  }

  // Accommodation CRUD
  const updateAccommodation = async (accommodation: Accommodation) => {
    if (!selectedTrip) return

    try {
      const { error } = await supabase
        .from("trip_accommodations")
        .update({
          name: accommodation.name,
          address: accommodation.address,
          check_in_date: accommodation.check_in_date,
          check_out_date: accommodation.check_out_date,
          notes: accommodation.notes,
        })
        .eq("id", accommodation.id)

      if (error) throw error

      fetchTripData(selectedTrip.id)
      setEditingAccommodation(null)
      toast.success("Accommodation updated successfully!")
    } catch (error) {
      console.error("Error updating accommodation:", error)
      toast.error("Failed to update accommodation")
    }
  }

  const deleteAccommodation = async (accommodationId: string) => {
    if (!selectedTrip) return

    try {
      const { error } = await supabase.from("trip_accommodations").delete().eq("id", accommodationId)
      
      if (error) throw error

      fetchTripData(selectedTrip.id)
      toast.success("Accommodation deleted successfully!")
    } catch (error) {
      console.error("Error deleting accommodation:", error)
      toast.error("Failed to delete accommodation")
    }
  }

  // Itinerary CRUD
  const updateItineraryItem = async (item: ItineraryItem) => {
    if (!selectedTrip) return

    try {
      const { error } = await supabase
        .from("trip_itinerary")
        .update({
          title: item.title,
          description: item.description,
          start_date: item.start_date,
          start_time: item.start_time,
          end_time: item.end_time,
          is_completed: item.is_completed,
        })
        .eq("id", item.id)

      if (error) throw error

      fetchTripData(selectedTrip.id)
      setEditingItineraryItem(null)
      toast.success("Itinerary item updated successfully!")
    } catch (error) {
      console.error("Error updating itinerary item:", error)
      toast.error("Failed to update itinerary item")
    }
  }

  const deleteItineraryItem = async (itemId: string) => {
    if (!selectedTrip) return

    try {
      const { error } = await supabase.from("trip_itinerary").delete().eq("id", itemId)
      
      if (error) throw error

      fetchTripData(selectedTrip.id)
      toast.success("Itinerary item deleted successfully!")
    } catch (error) {
      console.error("Error deleting itinerary item:", error)
      toast.error("Failed to delete itinerary item")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading trips...</p>
        </div>
      </div>
    )
  }

  if (!selectedTrip) {
    return (
      <div className="space-y-6">
        {/* Banner Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 text-white shadow-2xl mb-0">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-transparent to-emerald-500/20"></div>
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                <Plane className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-light">Trip Planning</h1>
                <p className="text-slate-200 font-light">Organize trips, travelers, expenses, and more</p>
              </div>
            </div>
          </div>
        </div>

        {/* Trip List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Your Trips</h2>
            <Dialog open={showNewTripDialog} onOpenChange={setShowNewTripDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Trip
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Trip</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="trip-name">Trip Name</Label>
                    <Input
                      id="trip-name"
                      value={newTrip.name}
                      onChange={(e) => setNewTrip((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Summer Vacation 2024"
                    />
                  </div>
                  <div>
                    <Label htmlFor="trip-description">Description (Optional)</Label>
                    <Textarea
                      id="trip-description"
                      value={newTrip.description}
                      onChange={(e) => setNewTrip((prev) => ({ ...prev, description: e.target.value }))}
                      placeholder="Brief description of your trip"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="start-date">Start Date</Label>
                      <Input
                        id="start-date"
                        type="date"
                        value={newTrip.start_date}
                        onChange={(e) => setNewTrip((prev) => ({ ...prev, start_date: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="end-date">End Date</Label>
                      <Input
                        id="end-date"
                        type="date"
                        value={newTrip.end_date}
                        onChange={(e) => setNewTrip((prev) => ({ ...prev, end_date: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="password-protected"
                      checked={newTrip.is_password_protected}
                      onCheckedChange={(checked) =>
                        setNewTrip((prev) => ({ ...prev, is_password_protected: checked as boolean }))
                      }
                    />
                    <Label htmlFor="password-protected">Password Protected</Label>
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowNewTripDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createTrip} disabled={!newTrip.name || !newTrip.start_date || !newTrip.end_date}>
                    Create Trip
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {trips.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Plane className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No trips yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Create your first trip to start planning your adventure
                </p>
                <Button onClick={() => setShowNewTripDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Trip
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {trips.map((trip) => (
                <Card key={trip.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg mb-1">{trip.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {format(parseISO(trip.start_date), "MMM d")} - {format(parseISO(trip.end_date), "MMM d, yyyy")}
                        </p>
                      </div>
                      {trip.is_password_protected && <Lock className="w-4 h-4 text-muted-foreground" />}
                    </div>
                    {trip.description && (
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{trip.description}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {calculateTripDuration(trip.start_date, trip.end_date)} days
                      </span>
                      <Button size="sm" onClick={() => setSelectedTrip(trip)}>
                        Open Trip
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Banner Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 text-white shadow-2xl mb-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-transparent to-emerald-500/20"></div>
        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
              <Plane className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-light">Trip Planning</h1>
              <p className="text-slate-200 font-light">Organize trips, travelers, expenses, and more</p>
            </div>
          </div>
        </div>
      </div>

      {/* Trip Header */}
      <div className="flex flex-col items-center justify-center mb-6">
        <div className="flex flex-col items-center">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            {selectedTrip.name}
            {selectedTrip.is_password_protected && <Lock className="w-5 h-5 text-muted-foreground" />}
          </h1>
          <p className="text-muted-foreground text-center">
            {format(parseISO(selectedTrip.start_date), "MMM d")} - {format(parseISO(selectedTrip.end_date), "MMM d, yyyy")}• {calculateTripDuration(selectedTrip.start_date, selectedTrip.end_date)} days
          </p>
        </div>
        <div className="flex items-center space-x-2 mt-4">
          <Button variant="outline" size="sm">
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
          <Button variant="outline" size="sm">
            <Edit className="w-4 h-4 mr-2" />
            Edit Trip
          </Button>
        </div>
      </div>

      {/* Trip Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-row w-full gap-2 bg-slate-50 p-2 rounded-xl shadow-sm">
          <TabsTrigger value="overview" className="rounded-lg px-4 py-2 font-semibold transition-colors data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-400 data-[state=active]:to-orange-400 data-[state=active]:text-white data-[state=active]:shadow data-[state=inactive]:bg-transparent data-[state=inactive]:text-muted-foreground hover:bg-orange-50">Overview</TabsTrigger>
          <TabsTrigger value="flights" className="rounded-lg px-4 py-2 font-semibold transition-colors data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-400 data-[state=active]:to-orange-400 data-[state=active]:text-white data-[state=active]:shadow data-[state=inactive]:bg-transparent data-[state=inactive]:text-muted-foreground hover:bg-orange-50">Flights Info</TabsTrigger>
          <TabsTrigger value="accommodation" className="rounded-lg px-4 py-2 font-semibold transition-colors data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-400 data-[state=active]:to-orange-400 data-[state=active]:text-white data-[state=active]:shadow data-[state=inactive]:bg-transparent data-[state=inactive]:text-muted-foreground hover:bg-orange-50">Stay Info</TabsTrigger>
          <TabsTrigger value="itinerary" className="rounded-lg px-4 py-2 font-semibold transition-colors data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-400 data-[state=active]:to-orange-400 data-[state=active]:text-white data-[state=active]:shadow data-[state=inactive]:bg-transparent data-[state=inactive]:text-muted-foreground hover:bg-orange-50">Trip Itinerary</TabsTrigger>
          <TabsTrigger value="expenses" className="rounded-lg px-4 py-2 font-semibold transition-colors data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-400 data-[state=active]:to-orange-400 data-[state=active]:text-white data-[state=active]:shadow data-[state=inactive]:bg-transparent data-[state=inactive]:text-muted-foreground hover:bg-orange-50">Expenses Tracker</TabsTrigger>
          <TabsTrigger value="packing" className="rounded-lg px-4 py-2 font-semibold transition-colors data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-400 data-[state=active]:to-orange-400 data-[state=active]:text-white data-[state=active]:shadow data-[state=inactive]:bg-transparent data-[state=inactive]:text-muted-foreground hover:bg-orange-50">Packing List</TabsTrigger>
        </TabsList>

        {/* Tab Banners */}
        {activeTab === "overview" && (
          <div className="rounded-xl bg-blue-50 border border-blue-200/50 p-4 flex flex-col items-center gap-3 mb-4 text-center">
            <Users className="w-6 h-6 text-blue-500 mx-auto" />
            <div>
              <div className="font-semibold text-blue-900">Overview</div>
              <div className="text-sm text-blue-800">See travelers, destinations, and trip stats</div>
            </div>
          </div>
        )}
        {activeTab === "flights" && (
          <div className="rounded-xl bg-sky-50 border border-sky-200/50 p-4 flex flex-col items-center gap-3 mb-4 text-center">
            <Plane className="w-6 h-6 text-sky-500 mx-auto" />
            <div>
              <div className="font-semibold text-sky-900">Flights</div>
              <div className="text-sm text-sky-800">Manage all flights for this trip</div>
            </div>
          </div>
        )}
        {activeTab === "accommodation" && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200/50 p-4 flex flex-col items-center gap-3 mb-4 text-center">
            <Package className="w-6 h-6 text-emerald-500 mx-auto" />
            <div>
              <div className="font-semibold text-emerald-900">Stay</div>
              <div className="text-sm text-emerald-800">Track accommodations and lodging</div>
            </div>
          </div>
        )}
        {activeTab === "itinerary" && (
          <div className="rounded-xl bg-purple-50 border border-purple-200/50 p-4 flex flex-col items-center gap-3 mb-4 text-center">
            <Calendar className="w-6 h-6 text-purple-500 mx-auto" />
            <div>
              <div className="font-semibold text-purple-900">Itinerary</div>
              <div className="text-sm text-purple-800">Plan daily activities and events</div>
            </div>
          </div>
        )}
        {activeTab === "expenses" && (
          <div className="rounded-xl bg-orange-50 border border-orange-200/50 p-4 flex flex-col items-center gap-3 mb-4 text-center">
            <DollarSign className="w-6 h-6 text-orange-500 mx-auto" />
            <div>
              <div className="font-semibold text-orange-900">Expenses</div>
              <div className="text-sm text-orange-800">Track and split trip expenses</div>
            </div>
          </div>
        )}
        {activeTab === "packing" && (
          <div className="rounded-xl bg-pink-50 border border-pink-200/50 p-4 flex flex-col items-center gap-3 mb-4 text-center">
            <Package className="w-6 h-6 text-pink-500 mx-auto" />
            <div>
              <div className="font-semibold text-pink-900">Packing</div>
              <div className="text-sm text-pink-800">Organize packing lists for the trip</div>
            </div>
          </div>
        )}

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Travelers Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Travelers ({travelers.length})
                </CardTitle>
                <Dialog open={showTravelerDialog} onOpenChange={setShowTravelerDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingTraveler ? "Edit Traveler" : "Add Traveler"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="traveler-name">Name</Label>
                        <Input
                          id="traveler-name"
                          value={newTraveler.name}
                          onChange={(e) => setNewTraveler((prev) => ({ ...prev, name: e.target.value }))}
                          placeholder="Full name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="traveler-email">Email</Label>
                        <Input
                          id="traveler-email"
                          type="email"
                          value={newTraveler.email}
                          onChange={(e) => setNewTraveler((prev) => ({ ...prev, email: e.target.value }))}
                          placeholder="email@example.com"
                        />
                      </div>
                      <div>
                        <Label htmlFor="traveler-phone">Phone</Label>
                        <Input
                          id="traveler-phone"
                          value={newTraveler.phone}
                          onChange={(e) => setNewTraveler((prev) => ({ ...prev, phone: e.target.value }))}
                          placeholder="Phone number"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="is-organizer"
                          checked={newTraveler.is_organizer}
                          onCheckedChange={(checked) =>
                            setNewTraveler((prev) => ({ ...prev, is_organizer: !!checked }))
                          }
                        />
                        <Label htmlFor="is-organizer">Trip organizer</Label>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => {
                          setShowTravelerDialog(false)
                          setEditingTraveler(null)
                          setNewTraveler({
                            name: "",
                            email: "",
                            phone: "",
                            is_organizer: false,
                          })
                        }}>
                          Cancel
                        </Button>
                        <Button 
                          onClick={editingTraveler ? () => updateTraveler(editingTraveler) : addTraveler} 
                          disabled={!newTraveler.name}
                        >
                          {editingTraveler ? "Update Traveler" : "Add Traveler"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {travelers.map((traveler) => (
                    <div key={traveler.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <p className="font-medium">{traveler.name}</p>
                        {traveler.email && <p className="text-sm text-muted-foreground">{traveler.email}</p>}
                      </div>
                      <div className="flex items-center space-x-2">
                        {traveler.is_organizer && <Badge variant="secondary">Organizer</Badge>}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setEditingTraveler(traveler)
                                setNewTraveler({
                                  name: traveler.name,
                                  email: traveler.email || "",
                                  phone: traveler.phone || "",
                                  is_organizer: traveler.is_organizer,
                                })
                                setShowTravelerDialog(true)
                              }}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => deleteTraveler(traveler.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                  {travelers.length === 0 && (
                    <p className="text-muted-foreground text-center py-4">No travelers added yet</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Destinations Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Destinations ({destinations.length})
                </CardTitle>
                <Dialog open={showDestinationDialog} onOpenChange={setShowDestinationDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingDestination ? "Edit Destination" : "Add Destination"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="destination-name">Destination Name</Label>
                        <Input
                          id="destination-name"
                          value={newDestination.name}
                          onChange={(e) => setNewDestination((prev) => ({ ...prev, name: e.target.value }))}
                          placeholder="e.g., Medellín"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="destination-city">City</Label>
                          <Input
                            id="destination-city"
                            value={newDestination.city}
                            onChange={(e) => setNewDestination((prev) => ({ ...prev, city: e.target.value }))}
                            placeholder="City"
                          />
                        </div>
                        <div>
                          <Label htmlFor="destination-country">Country</Label>
                          <Input
                            id="destination-country"
                            value={newDestination.country}
                            onChange={(e) => setNewDestination((prev) => ({ ...prev, country: e.target.value }))}
                            placeholder="Country"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="arrival-date">Arrival Date</Label>
                          <Input
                            id="arrival-date"
                            type="date"
                            value={newDestination.arrival_date}
                            onChange={(e) => setNewDestination((prev) => ({ ...prev, arrival_date: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="departure-date">Departure Date</Label>
                          <Input
                            id="departure-date"
                            type="date"
                            value={newDestination.departure_date}
                            onChange={(e) => setNewDestination((prev) => ({ ...prev, departure_date: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => {
                          setShowDestinationDialog(false)
                          setEditingDestination(null)
                          setNewDestination({
                            name: "",
                            country: "",
                            city: "",
                            arrival_date: "",
                            departure_date: "",
                          })
                        }}>
                          Cancel
                        </Button>
                        <Button 
                          onClick={editingDestination ? () => updateDestination(editingDestination) : addDestination} 
                          disabled={!newDestination.name}
                        >
                          {editingDestination ? "Update Destination" : "Add Destination"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {destinations.map((destination, index) => (
                    <div key={destination.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <p className="font-medium">{destination.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {destination.city && destination.country
                            ? `${destination.city}, ${destination.country}`
                            : destination.city || destination.country || "Location not specified"}
                        </p>
                        {destination.arrival_date && destination.departure_date && (
                          <p className="text-xs text-muted-foreground">
                            {format(parseISO(destination.arrival_date), "MMM d")} -{" "}
                            {format(parseISO(destination.departure_date), "MMM d")}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">#{index + 1}</Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setEditingDestination(destination)
                                setNewDestination({
                                  name: destination.name,
                                  country: destination.country || "",
                                  city: destination.city || "",
                                  arrival_date: destination.arrival_date || "",
                                  departure_date: destination.departure_date || "",
                                })
                                setShowDestinationDialog(true)
                              }}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => deleteDestination(destination.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                  {destinations.length === 0 && (
                    <p className="text-muted-foreground text-center py-4">No destinations added yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Duration</p>
                    <p className="text-lg font-semibold">
                      {calculateTripDuration(selectedTrip.start_date, selectedTrip.end_date)} days
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Travelers</p>
                    <p className="text-lg font-semibold">{travelers.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Plane className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Flights</p>
                    <p className="text-lg font-semibold">{flights.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Expenses</p>
                    <p className="text-lg font-semibold">${getTotalExpenses().toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Flights Tab */}
        <TabsContent value="flights" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Flight Information</h2>
            <Dialog open={showFlightDialog} onOpenChange={setShowFlightDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Flight
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add Flight</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="flight-type">Flight Type</Label>
                    <Select
                      value={newFlight.flight_type}
                      onValueChange={(value: "departure" | "arrival") =>
                        setNewFlight((prev) => ({ ...prev, flight_type: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="departure">Departure</SelectItem>
                        <SelectItem value="arrival">Arrival</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="airline">Airline</Label>
                      <Input
                        id="airline"
                        value={newFlight.airline}
                        onChange={(e) => setNewFlight((prev) => ({ ...prev, airline: e.target.value }))}
                        placeholder="e.g., Air Canada"
                      />
                    </div>
                    <div>
                      <Label htmlFor="flight-number">Flight Number</Label>
                      <Input
                        id="flight-number"
                        value={newFlight.flight_number}
                        onChange={(e) => setNewFlight((prev) => ({ ...prev, flight_number: e.target.value }))}
                        placeholder="e.g., AC123"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="from-location">From</Label>
                      <Input
                        id="from-location"
                        value={newFlight.from_location}
                        onChange={(e) => setNewFlight((prev) => ({ ...prev, from_location: e.target.value }))}
                        placeholder="e.g., Toronto, ON"
                      />
                    </div>
                    <div>
                      <Label htmlFor="to-location">To</Label>
                      <Input
                        id="to-location"
                        value={newFlight.to_location}
                        onChange={(e) => setNewFlight((prev) => ({ ...prev, to_location: e.target.value }))}
                        placeholder="e.g., Medellín, Colombia"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="flight-date">Date</Label>
                      <Input
                        id="flight-date"
                        type="date"
                        value={newFlight.flight_date}
                        onChange={(e) => setNewFlight((prev) => ({ ...prev, flight_date: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="departure-time">Departure</Label>
                      <Input
                        id="departure-time"
                        type="time"
                        value={newFlight.departure_time}
                        onChange={(e) => setNewFlight((prev) => ({ ...prev, departure_time: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="arrival-time">Arrival</Label>
                      <Input
                        id="arrival-time"
                        type="time"
                        value={newFlight.arrival_time}
                        onChange={(e) => setNewFlight((prev) => ({ ...prev, arrival_time: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="flight-notes">Notes</Label>
                    <Textarea
                      id="flight-notes"
                      value={newFlight.notes}
                      onChange={(e) => setNewFlight((prev) => ({ ...prev, notes: e.target.value }))}
                      placeholder="Additional notes about this flight"
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowFlightDialog(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={addFlight}
                      disabled={!newFlight.from_location || !newFlight.to_location || !newFlight.flight_date}
                    >
                      Add Flight
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Departure Flights */}
            <Card>
              <CardHeader>
                <CardTitle>Departure Flights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {flights
                    .filter((f) => f.flight_type === "departure")
                    .map((flight) => (
                      <div key={flight.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Plane className="w-4 h-4" />
                            <span className="font-medium">
                              {flight.airline} {flight.flight_number}
                            </span>
                          </div>
                          <Badge variant="outline">Departure</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">
                          {flight.from_location} → {flight.to_location}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(parseISO(flight.flight_date), "MMM d, yyyy")}
                          {flight.departure_time && ` • ${flight.departure_time}`}
                          {flight.arrival_time && ` - ${flight.arrival_time}`}
                        </p>
                        {flight.notes && <p className="text-sm text-muted-foreground mt-2">{flight.notes}</p>}
                      </div>
                    ))}
                  {flights.filter((f) => f.flight_type === "departure").length === 0 && (
                    <p className="text-muted-foreground text-center py-4">No departure flights added</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Arrival Flights */}
            <Card>
              <CardHeader>
                <CardTitle>Arrival Flights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {flights
                    .filter((f) => f.flight_type === "arrival")
                    .map((flight) => (
                      <div key={flight.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Plane className="w-4 h-4" />
                            <span className="font-medium">
                              {flight.airline} {flight.flight_number}
                            </span>
                          </div>
                          <Badge variant="outline">Arrival</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">
                          {flight.from_location} → {flight.to_location}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(parseISO(flight.flight_date), "MMM d, yyyy")}
                          {flight.departure_time && ` • ${flight.departure_time}`}
                          {flight.arrival_time && ` - ${flight.arrival_time}`}
                        </p>
                        {flight.notes && <p className="text-sm text-muted-foreground mt-2">{flight.notes}</p>}
                      </div>
                    ))}
                  {flights.filter((f) => f.flight_type === "arrival").length === 0 && (
                    <p className="text-muted-foreground text-center py-4">No arrival flights added</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Accommodation Tab */}
        <TabsContent value="accommodation" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Accommodations</h2>
            <Dialog open={showAccommodationDialog} onOpenChange={setShowAccommodationDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Accommodation
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Accommodation</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="accommodation-name">Name</Label>
                    <Input
                      id="accommodation-name"
                      value={newAccommodation.name}
                      onChange={(e) => setNewAccommodation((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Airbnb in El Poblado"
                    />
                  </div>
                  <div>
                    <Label htmlFor="accommodation-address">Address</Label>
                    <Textarea
                      id="accommodation-address"
                      value={newAccommodation.address}
                      onChange={(e) => setNewAccommodation((prev) => ({ ...prev, address: e.target.value }))}
                      placeholder="Full address"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="check-in">Check-in Date</Label>
                      <Input
                        id="check-in"
                        type="date"
                        value={newAccommodation.check_in_date}
                        onChange={(e) => setNewAccommodation((prev) => ({ ...prev, check_in_date: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="check-out">Check-out Date</Label>
                      <Input
                        id="check-out"
                        type="date"
                        value={newAccommodation.check_out_date}
                        onChange={(e) => setNewAccommodation((prev) => ({ ...prev, check_out_date: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="accommodation-notes">Notes</Label>
                    <Textarea
                      id="accommodation-notes"
                      value={newAccommodation.notes}
                      onChange={(e) => setNewAccommodation((prev) => ({ ...prev, notes: e.target.value }))}
                      placeholder="Additional notes about this accommodation"
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowAccommodationDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={addAccommodation} disabled={!newAccommodation.name}>
                      Add Accommodation
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {accommodations.map((accommodation) => (
              <Card key={accommodation.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    {accommodation.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {accommodation.address && (
                    <p className="text-sm text-muted-foreground mb-3">{accommodation.address}</p>
                  )}
                  {accommodation.check_in_date && accommodation.check_out_date && (
                    <div className="flex items-center text-sm text-muted-foreground mb-2">
                      <Calendar className="w-4 h-4 mr-2" />
                      {format(parseISO(accommodation.check_in_date), "MMM d")} -{" "}
                      {format(parseISO(accommodation.check_out_date), "MMM d, yyyy")}
                    </div>
                  )}
                  {accommodation.notes && <p className="text-sm text-muted-foreground">{accommodation.notes}</p>}
                </CardContent>
              </Card>
            ))}
            {accommodations.length === 0 && (
              <div className="col-span-2 text-center py-12">
                <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No accommodations yet</h3>
                <p className="text-muted-foreground">Add your first accommodation to get started</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Itinerary Tab */}
        <TabsContent value="itinerary" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-2xl font-semibold">Itinerary</h2>
              <div className="flex items-center space-x-2">
                <Button
                  variant={itineraryView === "day" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setItineraryView("day")}
                >
                  Day
                </Button>
                <Button
                  variant={itineraryView === "week" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setItineraryView("week")}
                >
                  Week
                </Button>
                <Button
                  variant={itineraryView === "month" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setItineraryView("month")}
                >
                  Month
                </Button>
              </div>
            </div>
            <Dialog open={showItineraryDialog} onOpenChange={setShowItineraryDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Activity
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Itinerary Item</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="activity-title">Activity Title</Label>
                    <Input
                      id="activity-title"
                      value={newItineraryItem.title}
                      onChange={(e) => setNewItineraryItem((prev) => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g., Breakfast at local café"
                    />
                  </div>
                  <div>
                    <Label htmlFor="activity-description">Description</Label>
                    <Textarea
                      id="activity-description"
                      value={newItineraryItem.description}
                      onChange={(e) => setNewItineraryItem((prev) => ({ ...prev, description: e.target.value }))}
                      placeholder="Additional details about this activity"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="activity-date">Date</Label>
                      <Input
                        id="activity-date"
                        type="date"
                        value={newItineraryItem.start_date}
                        onChange={(e) => setNewItineraryItem((prev) => ({ ...prev, start_date: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="start-time">Start Time</Label>
                      <Input
                        id="start-time"
                        type="time"
                        value={newItineraryItem.start_time}
                        onChange={(e) => setNewItineraryItem((prev) => ({ ...prev, start_time: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="end-time">End Time</Label>
                      <Input
                        id="end-time"
                        type="time"
                        value={newItineraryItem.end_time}
                        onChange={(e) => setNewItineraryItem((prev) => ({ ...prev, end_time: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowItineraryDialog(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={addItineraryItem}
                      disabled={!newItineraryItem.title || !newItineraryItem.start_date}
                    >
                      Add Activity
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-4">
            {Object.keys(
              itinerary.reduce(
                (acc, item) => {
                  const date = item.start_date
                  if (!acc[date]) {
                    acc[date] = []
                  }
                  acc[date].push(item)
                  return acc
                },
                {} as Record<string, ItineraryItem[]>,
              ),
            ).map((date) => {
              const dayItems = itinerary
                .filter((item) => item.start_date === date)
                .sort((a, b) => {
                  const timeA = a.start_time || "00:00"
                  const timeB = b.start_time || "00:00"
                  return timeA.localeCompare(timeB)
                })

              return (
                <Card key={date}>
                  <CardHeader>
                    <CardTitle>{format(parseISO(date), "EEEE, MMMM d, yyyy")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {dayItems.map((item) => (
                        <div key={item.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                          <Checkbox
                            checked={item.is_completed}
                            onCheckedChange={(checked) => toggleItineraryItem(item.id, !!checked)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4
                                className={`font-medium ${item.is_completed ? "line-through text-muted-foreground" : ""}`}
                              >
                                {item.title}
                              </h4>
                              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                {item.start_time && <span>{item.start_time}</span>}
                                {item.start_time && item.end_time && <span>-</span>}
                                {item.end_time && <span>{item.end_time}</span>}
                              </div>
                            </div>
                            {item.description && (
                              <p
                                className={`text-sm mt-1 ${item.is_completed ? "line-through text-muted-foreground" : "text-muted-foreground"}`}
                              >
                                {item.description}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            })}

            {itinerary.length === 0 && (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No activities planned yet</h3>
                <p className="text-muted-foreground">Start building your itinerary</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Expenses Tab */}
        <TabsContent value="expenses" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Expense Tracking</h2>
            <Dialog open={showExpenseDialog} onOpenChange={setShowExpenseDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Expense
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingExpense ? "Edit Expense" : "Add Expense"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="expense-category">Category</Label>
                      <Select
                        value={newExpense.category}
                        onValueChange={(value) => setNewExpense((prev) => ({ ...prev, category: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="flight">Flight</SelectItem>
                          <SelectItem value="accommodation">Accommodation</SelectItem>
                          <SelectItem value="food">Food & Dining</SelectItem>
                          <SelectItem value="transport">Transportation</SelectItem>
                          <SelectItem value="entertainment">Entertainment</SelectItem>
                          <SelectItem value="shopping">Shopping</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="paid-by">Paid By</Label>
                      <Select
                        value={newExpense.paid_by_traveler_id}
                        onValueChange={(value) => setNewExpense((prev) => ({ ...prev, paid_by_traveler_id: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select traveler" />
                        </SelectTrigger>
                        <SelectContent>
                          {travelers.map((traveler) => (
                            <SelectItem key={traveler.id} value={traveler.id}>
                              {traveler.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="expense-description">Description</Label>
                    <Input
                      id="expense-description"
                      value={newExpense.description}
                      onChange={(e) => setNewExpense((prev) => ({ ...prev, description: e.target.value }))}
                      placeholder="e.g., Dinner at restaurant"
                    />
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="expense-amount">Amount</Label>
                      <Input
                        id="expense-amount"
                        type="number"
                        step="0.01"
                        value={newExpense.total_amount}
                        onChange={(e) =>
                          setNewExpense((prev) => ({ ...prev, total_amount: Number.parseFloat(e.target.value) || 0 }))
                        }
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="expense-currency">Currency</Label>
                      <Select
                        value={newExpense.currency}
                        onValueChange={(value) => setNewExpense((prev) => ({ ...prev, currency: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {AVAILABLE_CURRENCIES.map((currency) => (
                            <SelectItem key={currency.value} value={currency.value}>
                              {currency.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="conversion_rate">Exchange Rate</Label>
                      <Input
                        id="conversion_rate"
                        type="number"
                        step="0.0001"
                        value={typeof newExpense.conversion_rate === 'number' && !isNaN(newExpense.conversion_rate) ? newExpense.conversion_rate : 1}
                        onChange={e => setNewExpense({ ...newExpense, conversion_rate: Number.parseFloat(e.target.value) || 1 })}
                        placeholder="1.00"
                      />
                      <div className="text-xs text-muted-foreground">From {newExpense.currency} to {userCurrency}</div>
                    </div>
                    <div>
                      <Label>Converted</Label>
                      <div className="flex items-center h-10 px-2 border rounded bg-muted text-sm">
                        {newExpense.converted_amount.toFixed(2)} {userCurrency}
                      </div>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="expense-date">Date</Label>
                    <Input
                      id="expense-date"
                      type="date"
                      value={newExpense.expense_date}
                      onChange={(e) => setNewExpense((prev) => ({ ...prev, expense_date: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Split Type</Label>
                    <div className="flex items-center space-x-4 mt-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="split-equal"
                          name="split-type"
                          checked={newExpense.split_type === "equal"}
                          onChange={() => setNewExpense((prev) => ({ ...prev, split_type: "equal" }))}
                        />
                        <Label htmlFor="split-equal">Split Equally</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="split-manual"
                          name="split-type"
                          checked={newExpense.split_type === "manual"}
                          onChange={() => setNewExpense((prev) => ({ ...prev, split_type: "manual" }))}
                        />
                        <Label htmlFor="split-manual">Manual Split</Label>
                      </div>
                    </div>
                  </div>
                  
                  {newExpense.split_type === "equal" && (
                    <div className="space-y-2">
                      <Label>Select Travelers to Split With</Label>
                      <div className="text-sm text-muted-foreground mb-2">
                        {newExpense.selected_travelers.length > 0 
                          ? `Split ${newExpense.total_amount} ${newExpense.currency} equally among ${newExpense.selected_travelers.length} travelers (${(newExpense.total_amount / newExpense.selected_travelers.length).toFixed(2)} ${newExpense.currency} each)`
                          : `Split ${newExpense.total_amount} ${newExpense.currency} equally among all ${travelers.length} travelers (${travelers.length > 0 ? (newExpense.total_amount / travelers.length).toFixed(2) : 0} ${newExpense.currency} each)`
                        }
                      </div>
                      {travelers.map((traveler) => (
                        <div key={traveler.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`traveler-${traveler.id}`}
                            checked={newExpense.selected_travelers.includes(traveler.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setNewExpense((prev) => ({
                                  ...prev,
                                  selected_travelers: [...prev.selected_travelers, traveler.id],
                                }))
                              } else {
                                setNewExpense((prev) => ({
                                  ...prev,
                                  selected_travelers: prev.selected_travelers.filter((id) => id !== traveler.id),
                                }))
                              }
                            }}
                          />
                          <Label htmlFor={`traveler-${traveler.id}`} className="text-sm">
                            {traveler.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {newExpense.split_type === "manual" && (
                    <div className="space-y-2">
                      <Label>Manual Split Amounts</Label>
                      {travelers.map((traveler) => (
                        <div key={traveler.id} className="flex items-center space-x-2">
                          <span className="w-24 text-sm">{traveler.name}</span>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={newExpense.splits.find((s) => s.traveler_id === traveler.id)?.amount || ""}
                            onChange={(e) => {
                              const amount = Number.parseFloat(e.target.value) || 0
                              setNewExpense((prev) => ({
                                ...prev,
                                splits: prev.splits
                                  .filter((s) => s.traveler_id !== traveler.id)
                                  .concat([
                                    {
                                      traveler_id: traveler.id,
                                      amount,
                                    },
                                  ]),
                              }))
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  <div>
                    <Label htmlFor="expense-notes">Notes</Label>
                    <Textarea
                      id="expense-notes"
                      value={newExpense.notes}
                      onChange={(e) => setNewExpense((prev) => ({ ...prev, notes: e.target.value }))}
                      placeholder="Additional notes"
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => {
                      setShowExpenseDialog(false)
                      setEditingExpense(null)
                      setNewExpense({
                        category: "other",
                        description: "",
                        total_amount: 0,
                        currency: "USD",
                        expense_date: "",
                        paid_by_traveler_id: "",
                        notes: "",
                        split_type: "equal",
                        splits: [],
                        selected_travelers: [],
                        conversion_rate: 1,
                        converted_amount: 0,
                      })
                    }}>
                      Cancel
                    </Button>
                    <Button
                      onClick={editingExpense ? () => updateExpense(editingExpense) : addExpense}
                      disabled={!newExpense.description || !newExpense.total_amount || !newExpense.paid_by_traveler_id}
                    >
                      {editingExpense ? "Update Expense" : "Add Expense"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Expense Summary */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Expenses</p>
                    <p className="text-lg font-semibold">${getTotalExpenses().toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Per Person</p>
                    <p className="text-lg font-semibold">
                      ${travelers.length > 0 ? (getTotalExpenses() / travelers.length).toFixed(2) : "0.00"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Items</p>
                    <p className="text-lg font-semibold">{expenses.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Expense List */}
          <Card>
            <CardHeader>
              <CardTitle>All Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {expenses.map((expense) => (
                  <div key={expense.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="capitalize">
                          {expense.category}
                        </Badge>
                        <span className="font-medium">{expense.description}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="text-right">
                          <p className="font-semibold">
                            ${expense.total_amount.toFixed(2)} {expense.currency}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Paid by {travelers.find((t) => t.id === expense.paid_by_traveler_id)?.name}
                          </p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setEditingExpense(expense)
                                setNewExpense({
                                  category: expense.category,
                                  description: expense.description,
                                  total_amount: expense.total_amount,
                                  currency: expense.currency,
                                  expense_date: expense.expense_date,
                                  paid_by_traveler_id: expense.paid_by_traveler_id,
                                  notes: expense.notes || "",
                                  split_type: "manual", // Default to manual for editing
                                  splits: expense.splits.map(split => ({
                                    traveler_id: split.traveler_id,
                                    amount: split.amount
                                  })),
                                  selected_travelers: [],
                                  conversion_rate: typeof expense.conversion_rate === 'number' && !isNaN(expense.conversion_rate) ? expense.conversion_rate : 1,
                                  converted_amount: typeof expense.converted_amount === 'number' && !isNaN(expense.converted_amount) ? expense.converted_amount : 0,
                                })
                                setShowExpenseDialog(true)
                              }}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => deleteExpense(expense.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground mb-2">
                      {format(parseISO(expense.expense_date), "MMM d, yyyy")}
                    </div>
                    <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                      {expense.splits.map((split) => {
                        const traveler = travelers.find((t) => t.id === split.traveler_id)
                        return (
                          <div key={split.id} className="flex items-center justify-between p-2 bg-muted rounded">
                            <span className="text-sm">{traveler?.name}</span>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium">${split.amount.toFixed(2)}</span>
                              {split.is_paid ? (
                                <Check className="w-4 h-4 text-green-500" />
                              ) : (
                                <X className="w-4 h-4 text-red-500" />
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    {expense.notes && <p className="text-sm text-muted-foreground mt-2">{expense.notes}</p>}
                  </div>
                ))}
                {expenses.length === 0 && (
                  <div className="text-center py-8">
                    <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No expenses yet</h3>
                    <p className="text-muted-foreground">Start tracking your trip expenses</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Balance Summary */}
          {travelers.length > 0 && expenses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Balance Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {travelers.map((traveler) => {
                    const totalOwed = getExpensesByTraveler(traveler.id)
                    const totalPaid = expenses
                      .filter((e) => e.paid_by_traveler_id === traveler.id)
                      .reduce((sum, e) => sum + e.total_amount, 0)
                    const balance = totalPaid - totalOwed

                    return (
                      <div key={traveler.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div>
                          <p className="font-medium">{traveler.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Paid: ${totalPaid.toFixed(2)} • Owes: ${totalOwed.toFixed(2)}
                          </p>
                        </div>
                        <div className={`text-right ${balance >= 0 ? "text-green-600" : "text-red-600"}`}>
                          <p className="font-semibold">
                            {balance >= 0 ? "+" : ""}${balance.toFixed(2)}
                          </p>
                          <p className="text-xs">{balance >= 0 ? "Gets back" : "Owes"}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Packing Tab */}
        <TabsContent value="packing" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Packing Lists</h2>
            <Dialog open={showPackingDialog} onOpenChange={setShowPackingDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  New List
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Packing List</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="list-name">List Name</Label>
                    <Input id="list-name" placeholder="e.g., My Packing List" />
                  </div>
                  <div>
                    <Label htmlFor="list-owner">Owner</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select owner (optional for shared list)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="shared">Shared List</SelectItem>
                        {travelers.map((traveler) => (
                          <SelectItem key={traveler.id} value={traveler.id}>
                            {traveler.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowPackingDialog(false)}>
                      Cancel
                    </Button>
                    <Button>Create List</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {packingLists.map((list) => (
              <Card key={list.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Package className="w-5 h-5" />
                      {list.name}
                    </div>
                    <Badge variant={list.traveler_id ? "default" : "secondary"}>{list.traveler_name || "Shared"}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {list.items.map((item) => (
                      <div key={item.id} className="flex items-center space-x-2">
                        <Checkbox
                          checked={item.is_packed}
                          onCheckedChange={() => {
                            // Toggle packing status
                          }}
                        />
                        <span className={`flex-1 ${item.is_packed ? "line-through text-muted-foreground" : ""}`}>
                          {item.item_name}
                          {item.quantity > 1 && ` (${item.quantity})`}
                        </span>
                      </div>
                    ))}
                    {list.items.length === 0 && (
                      <p className="text-muted-foreground text-center py-4">No items in this list</p>
                    )}
                  </div>
                  <Separator className="my-4" />
                  <div className="flex items-center space-x-2">
                    <Input placeholder="Add item..." className="flex-1" />
                    <Button size="sm">Add</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {packingLists.length === 0 && (
              <div className="col-span-2 text-center py-12">
                <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No packing lists yet</h3>
                <p className="text-muted-foreground">Create your first packing list to get organized</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
