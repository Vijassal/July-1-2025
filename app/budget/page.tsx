"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { createClientSupabase } from "@/lib/supabase"
import { useAccount } from "@/lib/account-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import {
  Plus,
  Edit,
  Trash2,
  DollarSign,
  Receipt,
  Package,
  TrendingUp,
  TrendingDown,
  Calculator,
  Loader2,
  ArrowUpDown,
  Settings,
} from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { DialogFooter } from "@/components/ui/dialog"

interface Budget {
  id: string
  purchase: string
  vendor_id: string | null
  vendor_name?: string
  date: string
  event_id: string | null
  event_title?: string
  category: string
  category_id?: string
  cost: number
  tags: string[] | null
  payment_for: string | null
  payment_by: string | null
  conversion_rate: number | null
  converted_amount: number | null
  currency: string | null
  actual_currency?: string
  logged_payments: LoggedPayment[]
  notes?: string
  actual_cost?: number
  paid?: boolean
}

interface LoggedPayment {
  id: string
  budget_id: string
  budget_item_id: string
  purchase: string
  payment_amount: number
  payment_by: string
  payment_for: string
  payment_date: string
  item: string
  logged_items: LoggedItem[]
  payment_method: string
  payment_status: string
  payment_reference: string
  notes: string
  receipt_url: string
  currency?: string
  conversion_rate?: number | null
  paid?: boolean
}

interface LoggedItem {
  id: string
  logged_payment_id: string
  item: string
  per_cost: number
  subtotal: number
  total: number
  quantity: number
  notes: string
  currency?: string
  conversion_rate?: number | null
  paid?: boolean
}

interface ExchangeRate {
  id: string
  from_currency: string
  to_currency: string
  rate: number
  date: string
}

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

// Column definitions for each tab
const budgetColumns = {
  expense_item: "Expense Item",
  event: "Event",
  vendor: "Vendor",
  expense_date: "Expense Date",
  category: "Category",
  budget_cost: "Budget Cost",
  actual_cost: "Actual Cost",
  total_paid: "Total Paid",
  remaining_cost: "Remaining Cost",
  notes: "Notes",
  paid: "Paid",
}
const paymentColumns = {
  expense_item: "Expense Item",
  payment_amount: "Payment Amount",
  payment_method: "Payment Method",
  payment_date: "Payment Date",
  payment_for: "Payment For",
  payment_by: "Payment By",
  paid: "Paid",
}
const itemColumns = {
  logged_payment_item: "Logged Payment Item",
  number_of_units: "Number of Units",
  per_unit_cost: "Per Unit Cost",
  subtotal: "Subtotal",
  paid: "Paid",
}

export default function BudgetPage() {
  const searchParams = useSearchParams()
  const { currentAccount } = useAccount()
  const [activeTab, setActiveTab] = useState("budgets")
  const [loading, setLoading] = useState(true)
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [vendors, setVendors] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([])
  const [userCurrency, setUserCurrency] = useState("USD")
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null)
  const [editingPayment, setEditingPayment] = useState<LoggedPayment | null>(null)
  const [editingItem, setEditingItem] = useState<LoggedItem | null>(null)
  const [showBudgetDialog, setShowBudgetDialog] = useState(false)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [showItemDialog, setShowItemDialog] = useState(false)
  const [showFuturePaymentDialog, setShowFuturePaymentDialog] = useState(false)
  const [selectedBudgetForPayment, setSelectedBudgetForPayment] = useState<string | null>(null)
  const [selectedPaymentForItem, setSelectedPaymentForItem] = useState<string | null>(null)
  const [autoCalcActual, setAutoCalcActual] = useState(true)
  const [categories, setCategories] = useState<any[]>([])
  const [futurePayments, setFuturePayments] = useState<any[]>([])
  const [visibleColumns, setVisibleColumns] = useState<Record<string, Record<string, boolean>>>({
    budgets: {
      expense_item: true,
      event: true,
      vendor: true,
      expense_date: true,
      category: true,
      budget_cost: true,
      actual_cost: true,
      total_paid: true,
      remaining_cost: true,
      notes: true,
      paid: true,
    },
    payments: {
      expense_item: true,
      payment_amount: true,
      payment_method: true,
      payment_date: true,
      payment_for: true,
      payment_by: true,
      paid: true,
    },
    items: {
      logged_payment_item: true,
      number_of_units: true,
      per_unit_cost: true,
      subtotal: true,
      paid: true,
    }
  })

  const supabase = createClientSupabase()

  const [newBudget, setNewBudget] = useState({
    purchase: "",
    vendor_id: "",
    date: "",
    event_id: "",
    category: "",
    category_id: "",
    newCategoryName: "",
    cost: 0,
    tags: [] as string[],
    payment_for: "",
    payment_by: "",
    currency: "USD",
    actual_currency: "USD",
    notes: "",
    actual_cost: undefined as number | undefined,
    conversion_rate: 1,
    paid: false,
  })

  const [newPayment, setNewPayment] = useState({
    purchase: "",
    payment_amount: 0,
    payment_by: "",
    payment_for: "",
    payment_date: "",
    item: "",
    budget_item_id: "",
    payment_method: "",
    payment_status: "pending",
    payment_reference: "",
    notes: "",
    receipt_url: "",
    currency: "USD",
    newPaymentFor: "",
    newPaymentBy: "",
    conversion_rate: 1,
    paid: false,
  })

  const [newItem, setNewItem] = useState({
    item: "",
    per_cost: 0,
    subtotal: 0,
    total: 0,
    quantity: 1,
    logged_payment_id: "",
    notes: "",
    currency: "USD",
    conversion_rate: 1,
    paid: false,
  })

  const [newFuturePayment, setNewFuturePayment] = useState({
    budget_item_id: "",
    amount: 0,
    due_date: "",
    status: "pending",
    notes: "",
    currency: "USD",
    conversion_rate: 1,
  })

  const [paymentForOptions, setPaymentForOptions] = useState<string[]>([])
  const [paymentByOptions, setPaymentByOptions] = useState<string[]>([])

  useEffect(() => {
    const tab = searchParams.get("tab")
    if (tab && ["budgets", "payments", "items"].includes(tab)) {
      setActiveTab(tab)
    }
  }, [searchParams])

  useEffect(() => {
    if (currentAccount) {
      setNewBudget((prev) => ({ ...prev, currency: currentAccount.currency || "USD" }))
      fetchData()
    }
  }, [currentAccount])

  useEffect(() => {
    if (newBudget.currency && userCurrency) {
      console.log('Looking for exchange rate:', { from: newBudget.currency, to: userCurrency })
      console.log('Available exchange rates:', exchangeRates)
      const found = exchangeRates.find(r => r.from_currency === newBudget.currency && r.to_currency === userCurrency)
      console.log('Found exchange rate:', found)
      setNewBudget(b => ({ ...b, conversion_rate: found ? found.rate : 1 }))
    }
  }, [newBudget.currency, userCurrency, exchangeRates])

  useEffect(() => {
    if (newPayment.currency && userCurrency) {
      const found = exchangeRates.find(r => r.from_currency === newPayment.currency && r.to_currency === userCurrency)
      setNewPayment(p => ({ ...p, conversion_rate: found ? found.rate : 1 }))
    }
  }, [newPayment.currency, userCurrency, exchangeRates])

  useEffect(() => {
    if (newItem.currency && userCurrency) {
      const found = exchangeRates.find(r => r.from_currency === newItem.currency && r.to_currency === userCurrency)
      setNewItem(i => ({ ...i, conversion_rate: found ? found.rate : 1 }))
    }
  }, [newItem.currency, userCurrency, exchangeRates])

  useEffect(() => {
    if (newFuturePayment.currency && userCurrency) {
      const found = exchangeRates.find(r => r.from_currency === newFuturePayment.currency && r.to_currency === userCurrency)
      setNewFuturePayment(f => ({ ...f, conversion_rate: found ? found.rate : 1 }))
    }
  }, [newFuturePayment.currency, userCurrency, exchangeRates])

  const fetchData = async () => {
    if (!currentAccount) return

    try {
      setLoading(true)

      // Fetch vendors first (needed for budget processing)
      const { data: vendorsData, error: vendorsError } = await supabase
        .from('vendors')
        .select('id, name, business_name')
        .eq('account_instance_id', currentAccount.id)
        .order('name')

      if (vendorsError) throw vendorsError

      // Fetch events first (needed for budget processing)
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('id, name, date')
        .eq('account_instance_id', currentAccount.id)
        .order('date')

      if (eventsError) throw eventsError

      // Fetch budgets with vendor and event information
      const { data: budgetsData, error: budgetsError } = await supabase
        .from('budgets')
        .select('*')
        .eq('account_instance_id', currentAccount.id)
        .order('created_at', { ascending: false })

      if (budgetsError) throw budgetsError

      // Fetch logged payments for each budget
      const budgetsWithPayments = await Promise.all(
        budgetsData.map(async (budget) => {
          const { data: paymentsData, error: paymentsError } = await supabase
            .from('logged_payments')
            .select('*')
            .eq('budget_id', budget.id)
            .eq('account_instance_id', currentAccount.id)
            .order('payment_date', { ascending: false })

          if (paymentsError) throw paymentsError

          // Fetch logged items for each payment
          const paymentsWithItems = await Promise.all(
            paymentsData.map(async (payment) => {
              const { data: itemsData, error: itemsError } = await supabase
                .from('logged_item_costs')
                .select('*')
                .eq('logged_payment_id', payment.id)
                .eq('account_instance_id', currentAccount.id)

              if (itemsError) throw itemsError

              return {
                ...payment,
                logged_items: itemsData || []
              }
            })
          )

          // Get vendor name if vendor_id exists
          let vendorName = null
          if (budget.vendor_id && vendorsData) {
            const vendor = vendorsData.find(v => v.id === budget.vendor_id)
            vendorName = vendor?.name
          }

          // Get event title if event_id exists
          let eventTitle = null
          if (budget.event_id && eventsData) {
            const event = eventsData.find(e => e.id === budget.event_id)
            eventTitle = event?.name || null
          }

          return {
            ...budget,
            vendor_name: vendorName,
            event_title: eventTitle,
            logged_payments: paymentsWithItems
          }
        })
      )

      // Fetch exchange rates
      const { data: ratesData, error: ratesError } = await supabase
        .from('exchange_rates')
        .select('*')
        .order('date', { ascending: false })

      if (ratesError) throw ratesError

      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('account_instance_id', currentAccount.id)
        .order('name')

      if (categoriesError) throw categoriesError
      setCategories(categoriesData)

      // Fetch future payments
      const { data: futurePaymentsData, error: futurePaymentsError } = await supabase
        .from('future_payments')
        .select('*')
        .eq('account_instance_id', currentAccount.id)

      if (futurePaymentsError) throw futurePaymentsError
      setFuturePayments(futurePaymentsData)

      setBudgets(budgetsWithPayments)
      setVendors(vendorsData.map(v => ({ id: v.id, name: v.business_name || v.name })))
      setEvents(eventsData)
      setExchangeRates(ratesData || [])
      setUserCurrency(currentAccount.currency || "USD")

    } catch (error) {
      console.error("Error fetching data:", error, JSON.stringify(error))
      toast.error("Failed to load budget data")
    } finally {
      setLoading(false)
    }
  }

  const calculateConvertedAmount = (amount: number, fromCurrency: string, toCurrency: string) => {
    if (fromCurrency === toCurrency) return amount

    const rate = exchangeRates.find((r) => r.from_currency === fromCurrency && r.to_currency === toCurrency)

    return rate ? amount * rate.rate : amount
  }

  const handleSaveBudget = async () => {
    if (!currentAccount) return

    try {
      const convertedAmount = calculateConvertedAmount(newBudget.cost, newBudget.currency, userCurrency)
      const conversionRate =
        newBudget.currency === userCurrency
          ? 1
          : exchangeRates.find((r) => r.from_currency === newBudget.currency && r.to_currency === userCurrency)?.rate ||
            1

      const budgetData = {
        purchase: newBudget.purchase,
        vendor_id: newBudget.vendor_id || null,
        date: newBudget.date,
        event_id: newBudget.event_id || null,
        category: newBudget.category,
        cost: newBudget.cost,
        tags: newBudget.tags.length > 0 ? newBudget.tags : null,
        payment_for: newBudget.payment_for || null,
        payment_by: newBudget.payment_by || null,
        conversion_rate: newBudget.conversion_rate,
        converted_amount: convertedAmount,
        currency: newBudget.currency,
        account_instance_id: currentAccount.id,
        paid: newBudget.paid,
      }

      if (editingBudget) {
        // Update existing budget
        const { error } = await supabase
          .from('budgets')
          .update(budgetData)
          .eq('id', editingBudget.id)
          .eq('account_instance_id', currentAccount.id)

        if (error) throw error
        toast.success("Budget updated successfully")
      } else {
        // Add new budget
        const { error } = await supabase
          .from('budgets')
          .insert(budgetData)

        if (error) throw error
        toast.success("Budget added successfully")
      }

      setShowBudgetDialog(false)
      setEditingBudget(null)
      resetBudgetForm()
      fetchData() // Refresh data
    } catch (error) {
      console.error("Error saving budget:", error)
      toast.error("Failed to save budget")
    }
  }

  const handleSavePayment = async () => {
    if (!currentAccount || !selectedBudgetForPayment) return

    try {
      const paymentData = {
        budget_id: selectedBudgetForPayment,
        purchase: newPayment.purchase,
        payment_amount: newPayment.payment_amount,
        payment_by: newPayment.payment_by,
        payment_for: newPayment.payment_for,
        payment_date: newPayment.payment_date,
        item: newPayment.item,
        account_instance_id: currentAccount.id,
        conversion_rate: newPayment.conversion_rate,
        paid: newPayment.paid,
      }

      if (editingPayment) {
        // Update existing payment
        const { error } = await supabase
          .from('logged_payments')
          .update(paymentData)
          .eq('id', editingPayment.id)
          .eq('account_instance_id', currentAccount.id)

        if (error) throw error
        toast.success("Payment updated successfully")
      } else {
        // Add new payment
        const { error } = await supabase
          .from('logged_payments')
          .insert(paymentData)

        if (error) throw error
        toast.success("Payment added successfully")
      }

      setShowPaymentDialog(false)
      setEditingPayment(null)
      resetPaymentForm()
      fetchData() // Refresh data
    } catch (error) {
      console.error("Error saving payment:", error)
      toast.error("Failed to save payment")
    }
  }

  const handleSaveItem = async () => {
    if (!currentAccount || !selectedPaymentForItem) return

    try {
      const itemData = {
        logged_payment_id: selectedPaymentForItem,
        item: newItem.item,
        per_cost: newItem.per_cost,
        subtotal: newItem.subtotal,
        total: newItem.total,
        account_instance_id: currentAccount.id,
        conversion_rate: newItem.conversion_rate,
        paid: newItem.paid,
      }

      if (editingItem) {
        // Update existing item
        const { error } = await supabase
          .from('logged_item_costs')
          .update(itemData)
          .eq('id', editingItem.id)
          .eq('account_instance_id', currentAccount.id)

        if (error) throw error
        toast.success("Item updated successfully")
      } else {
        // Add new item
        const { error } = await supabase
          .from('logged_item_costs')
          .insert(itemData)

        if (error) throw error
        toast.success("Item added successfully")
      }

      setShowItemDialog(false)
      setEditingItem(null)
      resetItemForm()
      fetchData() // Refresh data
    } catch (error) {
      console.error("Error saving item:", error)
      toast.error("Failed to save item")
    }
  }

  const handleDeleteBudget = async (id: string) => {
    if (!currentAccount) return

    try {
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', id)
        .eq('account_instance_id', currentAccount.id)

      if (error) throw error
      toast.success("Budget deleted successfully")
      fetchData() // Refresh data
    } catch (error) {
      console.error("Error deleting budget:", error)
      toast.error("Failed to delete budget")
    }
  }

  const handleDeletePayment = async (budgetId: string, paymentId: string) => {
    if (!currentAccount) return

    try {
      const { error } = await supabase
        .from('logged_payments')
        .delete()
        .eq('id', paymentId)
        .eq('account_instance_id', currentAccount.id)

      if (error) throw error
      toast.success("Payment deleted successfully")
      fetchData() // Refresh data
    } catch (error) {
      console.error("Error deleting payment:", error)
      toast.error("Failed to delete payment")
    }
  }

  const handleDeleteItem = async (paymentId: string, itemId: string) => {
    if (!currentAccount) return

    try {
      const { error } = await supabase
        .from('logged_item_costs')
        .delete()
        .eq('id', itemId)
        .eq('account_instance_id', currentAccount.id)

      if (error) throw error
      toast.success("Item deleted successfully")
      fetchData() // Refresh data
    } catch (error) {
      console.error("Error deleting item:", error)
      toast.error("Failed to delete item")
    }
  }

  const resetBudgetForm = () => {
    setNewBudget({
      purchase: "",
      vendor_id: "",
      date: "",
      event_id: "",
      category: "",
      category_id: "",
      newCategoryName: "",
      cost: 0,
      tags: [],
      payment_for: "",
      payment_by: "",
      currency: "USD",
      actual_currency: "USD",
      notes: "",
      actual_cost: undefined,
      conversion_rate: 1,
      paid: false,
    })
  }

  const resetPaymentForm = () => {
    setNewPayment({
      purchase: "",
      payment_amount: 0,
      payment_by: "",
      payment_for: "",
      payment_date: "",
      item: "",
      budget_item_id: "",
      payment_method: "",
      payment_status: "pending",
      payment_reference: "",
      notes: "",
      receipt_url: "",
      currency: "USD",
      newPaymentFor: "",
      newPaymentBy: "",
      conversion_rate: 1,
      paid: false,
    })
    setEditingPayment(null)
  }

  const resetItemForm = () => {
    setNewItem({
      item: "",
      per_cost: 0,
      subtotal: 0,
      total: 0,
      quantity: 1,
      logged_payment_id: "",
      notes: "",
      currency: "USD",
      conversion_rate: 1,
      paid: false,
    })
    setEditingItem(null)
  }

  const getTotalBudget = () => {
    return budgets.reduce((sum, budget) => sum + (budget.converted_amount || budget.cost), 0)
  }

  const getTotalPaid = () => {
    return budgets.reduce((sum, budget) => {
      const paidAmount = budget.logged_payments.reduce((paySum, payment) => paySum + payment.payment_amount, 0)
      return sum + paidAmount
    }, 0)
  }

  const getTotalRemaining = () => {
    return getTotalBudget() - getTotalPaid()
  }

  const ColumnPicker = ({ type, columns, visibleColumns, onToggle }: {
    type: string
    columns: Record<string, string>
    visibleColumns: Record<string, Record<string, boolean>>
    onToggle: (column: string) => void
  }) => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Columns
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Visible Columns</Label>
          {Object.entries(columns).map(([key, label]) => (
            <div key={key} className="flex items-center space-x-2">
              <Checkbox
                id={`${type}-${key}`}
                checked={visibleColumns[type]?.[key] || false}
                onCheckedChange={() => onToggle(key)}
              />
              <Label htmlFor={`${type}-${key}`} className="text-sm">{label}</Label>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )

  const handleMarkAsPaid = async (futurePaymentId: string) => {
    try {
      const { error } = await supabase
        .from('future_payments')
        .update({ status: 'paid' })
        .eq('id', futurePaymentId)
      
      if (error) throw error
      
      // Refresh future payments
      const { data: futurePaymentsData, error: futurePaymentsError } = await supabase
        .from('future_payments')
        .select('*')
        .eq('account_instance_id', currentAccount?.id)
      
      if (futurePaymentsError) throw futurePaymentsError
      setFuturePayments(futurePaymentsData)
    } catch (error) {
      console.error('Error marking future payment as paid:', error)
    }
  }

  const handleEditFuturePayment = (futurePayment: any) => {
    setNewFuturePayment({
      budget_item_id: futurePayment.budget_item_id,
      amount: futurePayment.amount,
      due_date: futurePayment.due_date,
      status: futurePayment.status,
      notes: futurePayment.notes,
      currency: futurePayment.currency || "USD",
      conversion_rate: futurePayment.conversion_rate,
    })
    setShowFuturePaymentDialog(true)
  }

  const handleDeleteFuturePayment = async (futurePaymentId: string) => {
    try {
      const { error } = await supabase
        .from('future_payments')
        .delete()
        .eq('id', futurePaymentId)
      
      if (error) throw error
      
      // Refresh future payments
      const { data: futurePaymentsData, error: futurePaymentsError } = await supabase
        .from('future_payments')
        .select('*')
        .eq('account_instance_id', currentAccount?.id)
      
      if (futurePaymentsError) throw futurePaymentsError
      setFuturePayments(futurePaymentsData)
    } catch (error) {
      console.error('Error deleting future payment:', error)
    }
  }

  const handleSaveFuturePayment = async () => {
    if (!currentAccount) return
    
    try {
      const { error } = await supabase
        .from('future_payments')
        .insert({
          budget_item_id: newFuturePayment.budget_item_id,
          amount: newFuturePayment.amount,
          due_date: newFuturePayment.due_date,
          status: newFuturePayment.status,
          notes: newFuturePayment.notes,
          account_instance_id: currentAccount.id,
          conversion_rate: newFuturePayment.conversion_rate,
        })
      
      if (error) throw error
      
      // Refresh future payments
      const { data: futurePaymentsData, error: futurePaymentsError } = await supabase
        .from('future_payments')
        .select('*')
        .eq('account_instance_id', currentAccount.id)
      
      if (futurePaymentsError) throw futurePaymentsError
      setFuturePayments(futurePaymentsData)
      
      // Reset form
      setNewFuturePayment({
        budget_item_id: "",
        amount: 0,
        due_date: "",
        status: "pending",
        notes: "",
        currency: "USD",
        conversion_rate: 1,
      })
      setShowFuturePaymentDialog(false)
    } catch (error) {
      console.error('Error saving future payment:', error)
    }
  }

  const handleEditPayment = (payment: LoggedPayment) => {
    setNewPayment({
      purchase: payment.purchase,
      payment_amount: payment.payment_amount,
      payment_by: payment.payment_by,
      payment_for: payment.payment_for,
      payment_date: payment.payment_date,
      item: payment.item,
      budget_item_id: payment.budget_item_id,
      payment_method: payment.payment_method,
      payment_status: payment.payment_status,
      payment_reference: payment.payment_reference,
      notes: payment.notes,
      receipt_url: payment.receipt_url,
      currency: payment.currency || "USD",
      newPaymentFor: "",
      newPaymentBy: "",
      conversion_rate: typeof payment.conversion_rate === 'number' && !isNaN(payment.conversion_rate) ? payment.conversion_rate : 1,
      paid: payment.paid || false,
    })
    setEditingPayment(payment)
    setShowPaymentDialog(true)
  }

  const handleEditItem = (item: LoggedItem) => {
    setNewItem({
      item: item.item,
      per_cost: item.per_cost,
      subtotal: item.subtotal,
      total: item.total,
      quantity: item.quantity,
      logged_payment_id: item.logged_payment_id,
      notes: item.notes,
      currency: item.currency || 'USD',
      conversion_rate: typeof item.conversion_rate === 'number' && !isNaN(item.conversion_rate) ? item.conversion_rate : 1,
      paid: item.paid || false,
    })
    setEditingItem(item)
    setShowItemDialog(true)
  }

  // Persist column preferences in localStorage
  useEffect(() => {
    const stored = localStorage.getItem('budget_visible_columns')
    if (stored) setVisibleColumns(JSON.parse(stored))
  }, [])
  useEffect(() => {
    localStorage.setItem('budget_visible_columns', JSON.stringify(visibleColumns))
  }, [visibleColumns])

  const handleToggleColumn = (tab: string, column: string) => {
    setVisibleColumns(prev => ({
      ...prev,
      [tab]: {
        ...prev[tab],
        [column]: !prev[tab][column],
      }
    }))
  }

  // Render table rows for each tab
  const renderBudgetRows = () => budgets.map(budget => (
    <TableRow key={budget.id} className="cursor-pointer hover:bg-gray-50" onClick={() => {
      setEditingBudget(budget)
      setNewBudget({
        purchase: budget.purchase,
        vendor_id: budget.vendor_id || "",
        date: budget.date,
        event_id: budget.event_id || "",
        category: budget.category,
        category_id: budget.category_id || "",
        newCategoryName: "",
        cost: budget.cost,
        tags: budget.tags || [],
        payment_for: budget.payment_for || "",
        payment_by: budget.payment_by || "",
        currency: budget.currency || "USD",
        actual_currency: budget.actual_currency || "USD",
        notes: budget.notes || "",
        actual_cost: budget.actual_cost,
        conversion_rate: budget.conversion_rate || 1,
        paid: budget.paid || false,
      })
      setShowBudgetDialog(true)
    }}>
      {visibleColumns.budgets.expense_item && <TableCell>{budget.purchase}</TableCell>}
      {visibleColumns.budgets.event && <TableCell>{budget.event_title || "No event"}</TableCell>}
      {visibleColumns.budgets.vendor && <TableCell>{budget.vendor_name || "No vendor"}</TableCell>}
      {visibleColumns.budgets.expense_date && <TableCell>{budget.date}</TableCell>}
      {visibleColumns.budgets.category && <TableCell>{budget.category}</TableCell>}
      {visibleColumns.budgets.budget_cost && <TableCell>{budget.cost}</TableCell>}
      {visibleColumns.budgets.actual_cost && <TableCell>{budget.actual_cost}</TableCell>}
      {visibleColumns.budgets.total_paid && <TableCell>{budget.logged_payments.reduce((sum, p) => sum + (p.payment_amount || 0), 0)}</TableCell>}
      {visibleColumns.budgets.remaining_cost && <TableCell>{(budget.cost || 0) - budget.logged_payments.reduce((sum, p) => sum + (p.payment_amount || 0), 0)}</TableCell>}
      {visibleColumns.budgets.notes && <TableCell>{budget.notes}</TableCell>}
      {visibleColumns.budgets.paid && (
        <TableCell>
          <Checkbox 
            checked={budget.paid || false}
            onCheckedChange={(checked) => {
              // Update the budget's paid status
              const updatedBudget = { ...budget, paid: checked as boolean }
              setBudgets(budgets.map(b => b.id === budget.id ? updatedBudget : b))
              // Save to database
              supabase
                .from('budgets')
                .update({ paid: checked })
                .eq('id', budget.id)
                .then(({ error }) => {
                  if (error) {
                    console.error('Error updating paid status:', error)
                    toast.error('Failed to update paid status')
                  }
                })
            }}
            onClick={(e) => e.stopPropagation()}
          />
        </TableCell>
      )}
      <TableCell>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              handleEditPayment(budget.logged_payments[0] || {})
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              handleDeleteBudget(budget.id)
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  ))
  const renderPaymentRows = () => budgets.flatMap(budget => budget.logged_payments.map(payment => (
    <TableRow key={payment.id} className="cursor-pointer hover:bg-gray-50" onClick={() => handleEditPayment(payment)}>
      {visibleColumns.payments.expense_item && <TableCell>{budget.purchase}</TableCell>}
      {visibleColumns.payments.payment_amount && <TableCell>{payment.payment_amount}</TableCell>}
      {visibleColumns.payments.payment_method && <TableCell>{payment.payment_method}</TableCell>}
      {visibleColumns.payments.payment_date && <TableCell>{payment.payment_date}</TableCell>}
      {visibleColumns.payments.payment_for && <TableCell>{payment.payment_for}</TableCell>}
      {visibleColumns.payments.payment_by && <TableCell>{payment.payment_by}</TableCell>}
      {visibleColumns.payments.paid && (
        <TableCell>
          <Checkbox 
            checked={payment.paid || false}
            onCheckedChange={(checked) => {
              // Update the payment's paid status
              const updatedPayment = { ...payment, paid: checked as boolean }
              setBudgets(budgets.map(b => ({
                ...b,
                logged_payments: b.logged_payments.map(p => p.id === payment.id ? updatedPayment : p)
              })))
              // Save to database
              supabase
                .from('logged_payments')
                .update({ paid: checked })
                .eq('id', payment.id)
                .then(({ error }) => {
                  if (error) {
                    console.error('Error updating paid status:', error)
                    toast.error('Failed to update paid status')
                  }
                })
            }}
            onClick={(e) => e.stopPropagation()}
          />
        </TableCell>
      )}
      <TableCell>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              handleEditPayment(payment)
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              handleDeletePayment(budget.id, payment.id)
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )))
  const renderItemRows = () => budgets.flatMap(budget => budget.logged_payments.flatMap(payment => payment.logged_items.map(item => (
    <TableRow key={item.id} className="cursor-pointer hover:bg-gray-50" onClick={() => handleEditItem(item)}>
      {visibleColumns.items.logged_payment_item && <TableCell>{payment.purchase}</TableCell>}
      {visibleColumns.items.number_of_units && <TableCell>{item.quantity}</TableCell>}
      {visibleColumns.items.per_unit_cost && <TableCell>{item.per_cost}</TableCell>}
      {visibleColumns.items.subtotal && <TableCell>{item.subtotal}</TableCell>}
      {visibleColumns.items.paid && (
        <TableCell>
          <Checkbox 
            checked={item.paid || false}
            onCheckedChange={(checked) => {
              // Update the item's paid status
              const updatedItem = { ...item, paid: checked as boolean }
              setBudgets(budgets.map(b => ({
                ...b,
                logged_payments: b.logged_payments.map(p => ({
                  ...p,
                  logged_items: p.logged_items.map(i => i.id === item.id ? updatedItem : i)
                }))
              })))
              // Save to database
              supabase
                .from('logged_item_costs')
                .update({ paid: checked })
                .eq('id', item.id)
                .then(({ error }) => {
                  if (error) {
                    console.error('Error updating paid status:', error)
                    toast.error('Failed to update paid status')
                  }
                })
            }}
            onClick={(e) => e.stopPropagation()}
          />
        </TableCell>
      )}
      <TableCell>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              handleEditItem(item)
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              handleDeleteItem(payment.id, item.id)
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  ))))

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="animate-spin h-8 w-8 text-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading budget data...</p>
        </div>
      </div>
    )
  }

  // Only render Budget Items section by default, no internal Tabs
  return (
    <div className="space-y-6">
      {/* Banner Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 text-white shadow-2xl mb-0">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-500/20 via-transparent to-amber-500/20"></div>
        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-rose-500 rounded-xl flex items-center justify-center shadow-lg">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-light">Budget Management</h1>
              <p className="text-slate-200 font-light">Track expenses, payments, and items for your events</p>
            </div>
          </div>
        </div>
      </div>

      {/* Budget Overview Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="border-blue-200/50 shadow-sm bg-white/90 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Calculator className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Budget</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${getTotalBudget().toLocaleString()} {userCurrency}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200/50 shadow-sm bg-white/90 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingDown className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Paid</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${getTotalPaid().toLocaleString()} {userCurrency}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200/50 shadow-sm bg-white/90 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Remaining</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${getTotalRemaining().toLocaleString()} {userCurrency}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200/50 shadow-sm bg-white/90 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <ArrowUpDown className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Currency</p>
                <p className="text-2xl font-bold text-gray-900">{userCurrency}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget Items Section Only */}
      <Card className="border-slate-200/50 shadow-lg bg-white/90 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Budget Items
            </CardTitle>
            <Dialog open={showBudgetDialog} onOpenChange={setShowBudgetDialog}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    setEditingBudget(null)
                    resetBudgetForm()
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Budget Item
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingBudget ? "Edit Budget Item" : "Add New Budget Item"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="purchase">Expense Item</Label>
                    <Input
                      id="purchase"
                      value={newBudget.purchase}
                      onChange={(e) => setNewBudget({ ...newBudget, purchase: e.target.value })}
                      placeholder="e.g., Wedding Catering"
                    />
                  </div>
                  <div>
                    <Label htmlFor="event">Event</Label>
                    <Select
                      value={newBudget.event_id}
                      onValueChange={(value) => setNewBudget({ ...newBudget, event_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select event" />
                      </SelectTrigger>
                      <SelectContent>
                        {events.map((event) => (
                          <SelectItem key={event.id} value={event.id}>
                            {event.name} - {event.date}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="vendor">Vendor</Label>
                    <Select
                      value={newBudget.vendor_id}
                      onValueChange={(value) => setNewBudget({ ...newBudget, vendor_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select vendor" />
                      </SelectTrigger>
                      <SelectContent>
                        {vendors.map((vendor) => (
                          <SelectItem key={vendor.id} value={vendor.id}>
                            {vendor.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="date">Expense Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={newBudget.date}
                      onChange={(e) => setNewBudget({ ...newBudget, date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={newBudget.category_id}
                      onValueChange={(value) => setNewBudget({ ...newBudget, category_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select or create category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                        ))}
                        <SelectItem value="__new__">+ Create New Category</SelectItem>
                      </SelectContent>
                    </Select>
                    {newBudget.category_id === "__new__" && (
                      <Input
                        className="mt-2"
                        placeholder="New category name"
                        value={newBudget.newCategoryName || ""}
                        onChange={e => setNewBudget({ ...newBudget, newCategoryName: e.target.value })}
                        onBlur={async () => {
                          if (newBudget.newCategoryName && currentAccount) {
                            const { data, error } = await supabase
                              .from('categories')
                              .insert({ name: newBudget.newCategoryName, account_instance_id: currentAccount.id })
                              .select()
                              .single()
                            if (!error && data) {
                              setCategories([...categories, data])
                              setNewBudget({ ...newBudget, category_id: data.id, newCategoryName: "" })
                            }
                          }
                        }}
                      />
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="cost">Budget Cost</Label>
                      <Input
                        id="cost"
                        type="number"
                        step="0.01"
                        value={newBudget.cost}
                        onChange={(e) => setNewBudget({ ...newBudget, cost: Number.parseFloat(e.target.value) || 0 })}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="currency">Currency</Label>
                      <Select
                        value={newBudget.currency}
                        onValueChange={(value) => setNewBudget({ ...newBudget, currency: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
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
                  </div>
                  <div className="flex items-center gap-2">
                    <Label>Auto-calculate from payments?</Label>
                    <Switch checked={autoCalcActual} onCheckedChange={setAutoCalcActual} />
                  </div>
                  {!autoCalcActual && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="actual_cost">Actual Cost</Label>
                        <Input
                          id="actual_cost"
                          type="number"
                          step="0.01"
                          value={newBudget.actual_cost || ""}
                          onChange={(e) => setNewBudget({ ...newBudget, actual_cost: Number.parseFloat(e.target.value) || 0 })}
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <Label htmlFor="actual_currency">Actual Currency</Label>
                        <Select
                          value={newBudget.actual_currency || newBudget.currency}
                          onValueChange={(value) => setNewBudget({ ...newBudget, actual_currency: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select currency" />
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
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="paid"
                      checked={newBudget.paid}
                      onCheckedChange={(checked) => setNewBudget({ ...newBudget, paid: checked as boolean })}
                    />
                    <Label htmlFor="paid">Mark as Paid</Label>
                  </div>
                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Input
                      id="notes"
                      value={newBudget.notes || ""}
                      onChange={(e) => setNewBudget({ ...newBudget, notes: e.target.value })}
                      placeholder="Add any notes..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="conversion_rate">Exchange Rate</Label>
                      <Input
                        id="conversion_rate"
                        type="number"
                        step="0.0001"
                        value={typeof newBudget.conversion_rate === 'number' && !isNaN(newBudget.conversion_rate) ? newBudget.conversion_rate : 1}
                        onChange={e => setNewBudget({ ...newBudget, conversion_rate: Number.parseFloat(e.target.value) || 1 })}
                        placeholder="1.00"
                      />
                      <div className="text-xs text-muted-foreground">From {newBudget.currency} to {userCurrency}</div>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={() => setShowPaymentDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Log Payment
                    </Button>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <Button variant="outline" onClick={() => setShowBudgetDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveBudget}>{editingBudget ? "Update" : "Add"} Budget Item</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto px-4">
            {activeTab === "budgets" && (
              <>
                <div className="flex justify-end mb-2">
                  <ColumnPicker type="budgets" columns={budgetColumns} visibleColumns={visibleColumns} onToggle={col => handleToggleColumn('budgets', col)} />
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      {Object.entries(budgetColumns).map(([key, label]) => visibleColumns.budgets[key] && <TableHead key={key}>{label}</TableHead>)}
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>{renderBudgetRows()}</TableBody>
                </Table>
              </>
            )}
            {activeTab === "payments" && (
              <>
                <div className="flex justify-end mb-2">
                  <ColumnPicker type="payments" columns={paymentColumns} visibleColumns={visibleColumns} onToggle={col => handleToggleColumn('payments', col)} />
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      {Object.entries(paymentColumns).map(([key, label]) => visibleColumns.payments[key] && <TableHead key={key}>{label}</TableHead>)}
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>{renderPaymentRows()}</TableBody>
                </Table>
              </>
            )}
            {activeTab === "items" && (
              <>
                <div className="flex justify-end mb-2">
                  <ColumnPicker type="items" columns={itemColumns} visibleColumns={visibleColumns} onToggle={col => handleToggleColumn('items', col)} />
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      {Object.entries(itemColumns).map(([key, label]) => visibleColumns.items[key] && <TableHead key={key}>{label}</TableHead>)}
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>{renderItemRows()}</TableBody>
                </Table>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Future Payment Dialog */}
      <Dialog open={showFuturePaymentDialog} onOpenChange={setShowFuturePaymentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Future Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="fp_budget_item">Budget Item</Label>
              <Select
                value={newFuturePayment.budget_item_id}
                onValueChange={(value) => setNewFuturePayment({ ...newFuturePayment, budget_item_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select budget item" />
                </SelectTrigger>
                <SelectContent>
                  {budgets.map((budget) => (
                    <SelectItem key={budget.id} value={budget.id}>
                      {budget.purchase} - {budget.vendor_name || 'No vendor'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="fp_amount">Amount</Label>
              <Input
                id="fp_amount"
                type="number"
                step="0.01"
                value={newFuturePayment.amount}
                onChange={(e) => setNewFuturePayment({ ...newFuturePayment, amount: Number.parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="fp_due_date">Due Date</Label>
              <Input
                id="fp_due_date"
                type="date"
                value={newFuturePayment.due_date}
                onChange={(e) => setNewFuturePayment({ ...newFuturePayment, due_date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="fp_status">Status</Label>
              <Select
                value={newFuturePayment.status}
                onValueChange={(value) => setNewFuturePayment({ ...newFuturePayment, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="fp_notes">Notes</Label>
              <Input
                id="fp_notes"
                value={newFuturePayment.notes}
                onChange={(e) => setNewFuturePayment({ ...newFuturePayment, notes: e.target.value })}
                placeholder="Additional notes"
              />
            </div>
            <div>
              <Label htmlFor="fp_currency">Currency</Label>
              <Select
                value={newFuturePayment.currency}
                onValueChange={(value) => setNewFuturePayment({ ...newFuturePayment, currency: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
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
              <Label htmlFor="fp_conversion_rate">Exchange Rate</Label>
              <Input
                id="fp_conversion_rate"
                type="number"
                step="0.0001"
                value={typeof newFuturePayment.conversion_rate === 'number' && !isNaN(newFuturePayment.conversion_rate) ? newFuturePayment.conversion_rate : 1}
                onChange={e => setNewFuturePayment({ ...newFuturePayment, conversion_rate: Number.parseFloat(e.target.value) || 1 })}
                placeholder="1.00"
              />
              <div className="text-xs text-muted-foreground">From {newFuturePayment.currency} to {userCurrency}</div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFuturePaymentDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveFuturePayment}>
              Save Future Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingPayment ? "Edit Payment" : "Add New Payment"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="payment_description">Expense Item</Label>
              <Select
                value={newPayment.budget_item_id}
                onValueChange={(value) => setNewPayment({ ...newPayment, budget_item_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select budget item" />
                </SelectTrigger>
                <SelectContent>
                  {budgets.map((budget) => (
                    <SelectItem key={budget.id} value={budget.id}>
                      {budget.purchase} - {budget.vendor_name || 'No vendor'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="payment_amount">Payment Amount</Label>
                <Input
                  id="payment_amount"
                  type="number"
                  step="0.01"
                  value={newPayment.payment_amount}
                  onChange={(e) => setNewPayment({ ...newPayment, payment_amount: Number.parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="payment_currency">Currency</Label>
                <Select
                  value={newPayment.currency || "USD"}
                  onValueChange={(value) => setNewPayment({ ...newPayment, currency: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
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
            </div>
            <div>
              <Label htmlFor="payment_method">Payment Method</Label>
              <Select
                value={newPayment.payment_method}
                onValueChange={(value) => setNewPayment({ ...newPayment, payment_method: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                  <SelectItem value="debit_card">Debit Card</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="payment_date">Payment Date</Label>
              <Input
                id="payment_date"
                type="date"
                value={newPayment.payment_date}
                onChange={(e) => setNewPayment({ ...newPayment, payment_date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="payment_for">Payment For</Label>
              <Select
                value={newPayment.payment_for}
                onValueChange={(value) => setNewPayment({ ...newPayment, payment_for: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select or create payment for" />
                </SelectTrigger>
                <SelectContent>
                  {paymentForOptions.map((option) => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                  <SelectItem value="__new__">+ Create New</SelectItem>
                </SelectContent>
              </Select>
              {newPayment.payment_for === "__new__" && (
                <Input
                  className="mt-2"
                  placeholder="New payment for option"
                  value={newPayment.newPaymentFor || ""}
                  onChange={e => setNewPayment({ ...newPayment, newPaymentFor: e.target.value })}
                  onBlur={() => {
                    if (newPayment.newPaymentFor && !paymentForOptions.includes(newPayment.newPaymentFor)) {
                      setPaymentForOptions([...paymentForOptions, newPayment.newPaymentFor])
                      setNewPayment({ ...newPayment, payment_for: newPayment.newPaymentFor, newPaymentFor: "" })
                    }
                  }}
                />
              )}
            </div>
            <div>
              <Label htmlFor="payment_by">Payment By</Label>
              <Select
                value={newPayment.payment_by}
                onValueChange={(value) => setNewPayment({ ...newPayment, payment_by: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select or create payment by" />
                </SelectTrigger>
                <SelectContent>
                  {paymentByOptions.map((option) => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                  <SelectItem value="__new__">+ Create New</SelectItem>
                </SelectContent>
              </Select>
              {newPayment.payment_by === "__new__" && (
                <Input
                  className="mt-2"
                  placeholder="New payment by option"
                  value={newPayment.newPaymentBy || ""}
                  onChange={e => setNewPayment({ ...newPayment, newPaymentBy: e.target.value })}
                  onBlur={() => {
                    if (newPayment.newPaymentBy && !paymentByOptions.includes(newPayment.newPaymentBy)) {
                      setPaymentByOptions([...paymentByOptions, newPayment.newPaymentBy])
                      setNewPayment({ ...newPayment, payment_by: newPayment.newPaymentBy, newPaymentBy: "" })
                    }
                  }}
                />
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="payment_paid"
                checked={newPayment.paid}
                onCheckedChange={(checked) => setNewPayment({ ...newPayment, paid: checked as boolean })}
              />
              <Label htmlFor="payment_paid">Mark as Paid</Label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="conversion_rate">Exchange Rate</Label>
                <Input
                  id="conversion_rate"
                  type="number"
                  step="0.0001"
                  value={typeof newPayment.conversion_rate === 'number' && !isNaN(newPayment.conversion_rate) ? newPayment.conversion_rate : 1}
                  onChange={e => setNewPayment({ ...newPayment, conversion_rate: Number.parseFloat(e.target.value) || 1 })}
                  placeholder="1.00"
                />
                <div className="text-xs text-muted-foreground">From {newPayment.currency} to {userCurrency}</div>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setShowItemDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Per Item Costs
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePayment}>
              {editingPayment ? "Update Payment" : "Save Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Item Dialog */}
      <Dialog open={showItemDialog} onOpenChange={setShowItemDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Item" : "Add New Item"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="item_name">Logged Payment Item</Label>
              <Select
                value={newItem.logged_payment_id}
                onValueChange={(value) => setNewItem({ ...newItem, logged_payment_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select logged payment" />
                </SelectTrigger>
                <SelectContent>
                  {budgets.flatMap(budget => budget.logged_payments).map((payment) => (
                    <SelectItem key={payment.id} value={payment.id}>
                      {payment.purchase} - {payment.payment_amount} {payment.currency || 'USD'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="item_name">Item Name</Label>
              <Input
                id="item_name"
                value={newItem.item}
                onChange={(e) => setNewItem({ ...newItem, item: e.target.value })}
                placeholder="e.g., Wedding cake, 3-tier"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="per_cost">Per Unit Cost</Label>
                <Input
                  id="per_cost"
                  type="number"
                  step="0.01"
                  value={newItem.per_cost}
                  onChange={(e) => {
                    const perCost = Number.parseFloat(e.target.value) || 0
                    const quantity = newItem.quantity
                    setNewItem({ 
                      ...newItem, 
                      per_cost: perCost,
                      subtotal: perCost * quantity,
                      total: perCost * quantity
                    })
                  }}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="quantity">Number of Units</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={newItem.quantity}
                  onChange={(e) => {
                    const quantity = Number.parseInt(e.target.value) || 1
                    const perCost = newItem.per_cost
                    setNewItem({ 
                      ...newItem, 
                      quantity,
                      subtotal: perCost * quantity,
                      total: perCost * quantity
                    })
                  }}
                  placeholder="1"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="subtotal">Subtotal</Label>
                <Input
                  id="subtotal"
                  type="number"
                  step="0.01"
                  value={newItem.subtotal}
                  onChange={(e) => setNewItem({ ...newItem, subtotal: Number.parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  readOnly
                />
              </div>
              <div>
                <Label htmlFor="total">Total</Label>
                <Input
                  id="total"
                  type="number"
                  step="0.01"
                  value={newItem.total}
                  onChange={(e) => setNewItem({ ...newItem, total: Number.parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  readOnly
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="item_currency">Currency</Label>
                <Select
                  value={newItem.currency}
                  onValueChange={(value) => setNewItem({ ...newItem, currency: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
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
                <Label htmlFor="item_conversion_rate">Exchange Rate</Label>
                <Input
                  id="item_conversion_rate"
                  type="number"
                  step="0.0001"
                  value={typeof newItem.conversion_rate === 'number' && !isNaN(newItem.conversion_rate) ? newItem.conversion_rate : 1}
                  onChange={e => setNewItem({ ...newItem, conversion_rate: Number.parseFloat(e.target.value) || 1 })}
                  placeholder="1.00"
                />
                <div className="text-xs text-muted-foreground">From {newItem.currency} to {userCurrency}</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="item_paid"
                checked={newItem.paid}
                onCheckedChange={(checked) => setNewItem({ ...newItem, paid: checked as boolean })}
              />
              <Label htmlFor="item_paid">Mark as Paid</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowItemDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveItem}>
              {editingItem ? "Update Item" : "Save Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
