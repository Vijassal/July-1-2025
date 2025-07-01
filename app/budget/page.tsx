"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { createClientSupabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
} from "lucide-react"

interface Budget {
  id: string
  purchase: string
  vendor_id: string | null
  vendor_name?: string
  date: string
  event_id: string | null
  category: string
  cost: number
  tags: string[]
  payment_for: string
  payment_by: string
  conversion_rate: number | null
  converted_amount: number | null
  currency: string
  logged_payments: LoggedPayment[]
}

interface LoggedPayment {
  id: string
  budget_id: string
  purchase: string
  payment_amount: number
  payment_by: string
  payment_for: string
  payment_date: string
  item: string
  logged_items: LoggedItem[]
}

interface LoggedItem {
  id: string
  logged_payment_id: string
  item: string
  per_cost: number
  subtotal: number
  total: number
}

interface ExchangeRate {
  from_currency: string
  to_currency: string
  rate: number
  date: string
}

export default function BudgetPage() {
  const searchParams = useSearchParams()
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
  const [selectedBudgetForPayment, setSelectedBudgetForPayment] = useState<string | null>(null)
  const [selectedPaymentForItem, setSelectedPaymentForItem] = useState<string | null>(null)

  const supabase = createClientSupabase()

  const [newBudget, setNewBudget] = useState({
    purchase: "",
    vendor_id: "",
    date: "",
    event_id: "",
    category: "",
    cost: 0,
    tags: [] as string[],
    payment_for: "",
    payment_by: "",
    currency: "USD",
  })

  const [newPayment, setNewPayment] = useState({
    purchase: "",
    payment_amount: 0,
    payment_by: "",
    payment_for: "",
    payment_date: "",
    item: "",
  })

  const [newItem, setNewItem] = useState({
    item: "",
    per_cost: 0,
    subtotal: 0,
    total: 0,
  })

  useEffect(() => {
    const tab = searchParams.get("tab")
    if (tab && ["budgets", "payments", "items"].includes(tab)) {
      setActiveTab(tab)
    }
  }, [searchParams])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Get current user and account instance
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      // Mock data for demonstration
      const mockBudgets: Budget[] = [
        {
          id: "1",
          purchase: "Wedding Catering",
          vendor_id: "1",
          vendor_name: "Elite Catering",
          date: "2024-02-14",
          event_id: "1",
          category: "Food & Beverage",
          cost: 5000,
          tags: ["catering", "wedding", "main"],
          payment_for: "Full catering service",
          payment_by: "Credit Card",
          conversion_rate: 1.0,
          converted_amount: 5000,
          currency: "USD",
          logged_payments: [
            {
              id: "1",
              budget_id: "1",
              purchase: "Deposit Payment",
              payment_amount: 2500,
              payment_by: "Credit Card",
              payment_for: "50% Deposit",
              payment_date: "2024-01-15",
              item: "Catering Deposit",
              logged_items: [
                {
                  id: "1",
                  logged_payment_id: "1",
                  item: "Appetizers",
                  per_cost: 15,
                  subtotal: 750,
                  total: 750,
                },
                {
                  id: "2",
                  logged_payment_id: "1",
                  item: "Main Course",
                  per_cost: 35,
                  subtotal: 1750,
                  total: 1750,
                },
              ],
            },
          ],
        },
        {
          id: "2",
          purchase: "Photography Package",
          vendor_id: "2",
          vendor_name: "Premium Photography",
          date: "2024-02-14",
          event_id: "1",
          category: "Photography",
          cost: 3500,
          tags: ["photography", "wedding"],
          payment_for: "Full day photography",
          payment_by: "Bank Transfer",
          conversion_rate: 1.0,
          converted_amount: 3500,
          currency: "USD",
          logged_payments: [],
        },
      ]

      const mockVendors = [
        { id: "1", name: "Elite Catering" },
        { id: "2", name: "Premium Photography" },
        { id: "3", name: "Perfect Flowers" },
      ]

      const mockEvents = [
        { id: "1", title: "Johnson Wedding", date: "2024-02-14" },
        { id: "2", title: "Corporate Gala", date: "2024-03-15" },
      ]

      const mockExchangeRates: ExchangeRate[] = [
        { from_currency: "EUR", to_currency: "USD", rate: 1.08, date: "2024-01-15" },
        { from_currency: "GBP", to_currency: "USD", rate: 1.27, date: "2024-01-15" },
        { from_currency: "CAD", to_currency: "USD", rate: 0.74, date: "2024-01-15" },
      ]

      setBudgets(mockBudgets)
      setVendors(mockVendors)
      setEvents(mockEvents)
      setExchangeRates(mockExchangeRates)

      // Get user currency from settings (mock)
      setUserCurrency("USD")
    } catch (error) {
      console.error("Error fetching data:", error)
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
    try {
      const convertedAmount = calculateConvertedAmount(newBudget.cost, newBudget.currency, userCurrency)
      const conversionRate =
        newBudget.currency === userCurrency
          ? 1
          : exchangeRates.find((r) => r.from_currency === newBudget.currency && r.to_currency === userCurrency)?.rate ||
            1

      if (editingBudget) {
        // Update existing budget
        setBudgets(
          budgets.map((b) =>
            b.id === editingBudget.id
              ? {
                  ...editingBudget,
                  ...newBudget,
                  converted_amount: convertedAmount,
                  conversion_rate: conversionRate,
                  vendor_name: vendors.find((v) => v.id === newBudget.vendor_id)?.name,
                }
              : b,
          ),
        )
        toast.success("Budget updated successfully")
      } else {
        // Add new budget
        const budget: Budget = {
          id: Date.now().toString(),
          ...newBudget,
          converted_amount: convertedAmount,
          conversion_rate: conversionRate,
          vendor_name: vendors.find((v) => v.id === newBudget.vendor_id)?.name,
          logged_payments: [],
        }
        setBudgets([...budgets, budget])
        toast.success("Budget added successfully")
      }

      setShowBudgetDialog(false)
      setEditingBudget(null)
      resetBudgetForm()
    } catch (error) {
      toast.error("Failed to save budget")
    }
  }

  const handleSavePayment = async () => {
    try {
      if (!selectedBudgetForPayment) return

      const updatedBudgets = budgets.map((budget) => {
        if (budget.id === selectedBudgetForPayment) {
          const payments = [...budget.logged_payments]

          if (editingPayment && editingPayment.id) {
            // Update existing payment
            const index = payments.findIndex((p) => p.id === editingPayment.id)
            if (index !== -1) {
              payments[index] = { ...editingPayment, ...newPayment }
            }
          } else {
            // Add new payment
            payments.push({
              id: Date.now().toString(),
              budget_id: selectedBudgetForPayment,
              ...newPayment,
              logged_items: [],
            })
          }

          return { ...budget, logged_payments: payments }
        }
        return budget
      })

      setBudgets(updatedBudgets)
      toast.success(editingPayment ? "Payment updated successfully" : "Payment added successfully")

      setShowPaymentDialog(false)
      setEditingPayment(null)
      resetPaymentForm()
    } catch (error) {
      toast.error("Failed to save payment")
    }
  }

  const handleSaveItem = async () => {
    try {
      if (!selectedPaymentForItem) return

      const updatedBudgets = budgets.map((budget) => ({
        ...budget,
        logged_payments: budget.logged_payments.map((payment) => {
          if (payment.id === selectedPaymentForItem) {
            const items = [...payment.logged_items]

            if (editingItem && editingItem.id) {
              // Update existing item
              const index = items.findIndex((i) => i.id === editingItem.id)
              if (index !== -1) {
                items[index] = { ...editingItem, ...newItem }
              }
            } else {
              // Add new item
              items.push({
                id: Date.now().toString(),
                logged_payment_id: selectedPaymentForItem,
                ...newItem,
              })
            }

            return { ...payment, logged_items: items }
          }
          return payment
        }),
      }))

      setBudgets(updatedBudgets)
      toast.success(editingItem ? "Item updated successfully" : "Item added successfully")

      setShowItemDialog(false)
      setEditingItem(null)
      resetItemForm()
    } catch (error) {
      toast.error("Failed to save item")
    }
  }

  const handleDeleteBudget = async (id: string) => {
    try {
      setBudgets(budgets.filter((b) => b.id !== id))
      toast.success("Budget deleted successfully")
    } catch (error) {
      toast.error("Failed to delete budget")
    }
  }

  const handleDeletePayment = async (budgetId: string, paymentId: string) => {
    try {
      const updatedBudgets = budgets.map((budget) => {
        if (budget.id === budgetId) {
          return {
            ...budget,
            logged_payments: budget.logged_payments.filter((p) => p.id !== paymentId),
          }
        }
        return budget
      })

      setBudgets(updatedBudgets)
      toast.success("Payment deleted successfully")
    } catch (error) {
      toast.error("Failed to delete payment")
    }
  }

  const handleDeleteItem = async (paymentId: string, itemId: string) => {
    try {
      const updatedBudgets = budgets.map((budget) => ({
        ...budget,
        logged_payments: budget.logged_payments.map((payment) => {
          if (payment.id === paymentId) {
            return {
              ...payment,
              logged_items: payment.logged_items.filter((i) => i.id !== itemId),
            }
          }
          return payment
        }),
      }))

      setBudgets(updatedBudgets)
      toast.success("Item deleted successfully")
    } catch (error) {
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
      cost: 0,
      tags: [],
      payment_for: "",
      payment_by: "",
      currency: "USD",
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
    })
  }

  const resetItemForm = () => {
    setNewItem({
      item: "",
      per_cost: 0,
      subtotal: 0,
      total: 0,
    })
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

  const renderTabContent = () => {
    switch (activeTab) {
      case "budgets":
        return (
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
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="purchase">Purchase Description</Label>
                          <Input
                            id="purchase"
                            value={newBudget.purchase}
                            onChange={(e) => setNewBudget({ ...newBudget, purchase: e.target.value })}
                            placeholder="e.g., Wedding Catering"
                          />
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
                                  {event.title} - {event.date}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="date">Date</Label>
                          <Input
                            id="date"
                            type="date"
                            value={newBudget.date}
                            onChange={(e) => setNewBudget({ ...newBudget, date: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="category">Category</Label>
                          <Select
                            value={newBudget.category}
                            onValueChange={(value) => setNewBudget({ ...newBudget, category: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Food & Beverage">Food & Beverage</SelectItem>
                              <SelectItem value="Photography">Photography</SelectItem>
                              <SelectItem value="Decoration">Decoration</SelectItem>
                              <SelectItem value="Music">Music</SelectItem>
                              <SelectItem value="Transportation">Transportation</SelectItem>
                              <SelectItem value="Venue">Venue</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label htmlFor="cost">Cost</Label>
                            <Input
                              id="cost"
                              type="number"
                              step="0.01"
                              value={newBudget.cost}
                              onChange={(e) =>
                                setNewBudget({ ...newBudget, cost: Number.parseFloat(e.target.value) || 0 })
                              }
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
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="USD">USD</SelectItem>
                                <SelectItem value="EUR">EUR</SelectItem>
                                <SelectItem value="GBP">GBP</SelectItem>
                                <SelectItem value="CAD">CAD</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="payment_for">Payment For</Label>
                          <Input
                            id="payment_for"
                            value={newBudget.payment_for}
                            onChange={(e) => setNewBudget({ ...newBudget, payment_for: e.target.value })}
                            placeholder="e.g., Full catering service"
                          />
                        </div>
                        <div>
                          <Label htmlFor="payment_by">Payment Method</Label>
                          <Select
                            value={newBudget.payment_by}
                            onValueChange={(value) => setNewBudget({ ...newBudget, payment_by: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select payment method" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Credit Card">Credit Card</SelectItem>
                              <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                              <SelectItem value="Cash">Cash</SelectItem>
                              <SelectItem value="Check">Check</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
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
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50">
                      <TableHead>Purchase</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>Converted</TableHead>
                      <TableHead>Paid</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {budgets.map((budget) => {
                      const totalPaid = budget.logged_payments.reduce((sum, payment) => sum + payment.payment_amount, 0)
                      const remaining = (budget.converted_amount || budget.cost) - totalPaid

                      return (
                        <TableRow key={budget.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{budget.purchase}</div>
                              <div className="text-sm text-muted-foreground">{budget.date}</div>
                            </div>
                          </TableCell>
                          <TableCell>{budget.vendor_name || "No vendor"}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{budget.category}</Badge>
                          </TableCell>
                          <TableCell>
                            ${budget.cost.toLocaleString()} {budget.currency}
                          </TableCell>
                          <TableCell>
                            ${(budget.converted_amount || budget.cost).toLocaleString()} {userCurrency}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="text-sm font-medium">
                                ${totalPaid.toLocaleString()} {userCurrency}
                              </div>
                              <div className={`text-xs ${remaining > 0 ? "text-orange-600" : "text-green-600"}`}>
                                {remaining > 0 ? `$${remaining.toLocaleString()} remaining` : "Fully paid"}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedBudgetForPayment(budget.id)
                                  setEditingPayment(null)
                                  resetPaymentForm()
                                  setShowPaymentDialog(true)
                                }}
                              >
                                <Receipt className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingBudget(budget)
                                  setNewBudget({
                                    purchase: budget.purchase,
                                    vendor_id: budget.vendor_id || "",
                                    date: budget.date,
                                    event_id: budget.event_id || "",
                                    category: budget.category,
                                    cost: budget.cost,
                                    tags: budget.tags,
                                    payment_for: budget.payment_for,
                                    payment_by: budget.payment_by,
                                    currency: budget.currency,
                                  })
                                  setShowBudgetDialog(true)
                                }}
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleDeleteBudget(budget.id)}>
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )

      case "payments":
        return (
          <Card className="border-slate-200/50 shadow-lg bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="w-5 h-5" />
                Logged Payments
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-4">
                {budgets.map((budget) => (
                  <div key={budget.id}>
                    {budget.logged_payments.length > 0 && (
                      <div className="space-y-2">
                        {budget.logged_payments.map((payment) => (
                          <div key={payment.id} className="mb-6 overflow-x-auto px-4">
                            <div className="mb-2">
                              <div className="font-semibold text-lg text-gray-900 ml-8">{budget.purchase}</div>
                              <div className="text-sm text-muted-foreground font-medium mt-1 ml-8">{payment.purchase}</div>
                            </div>
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-slate-50/50">
                                  <TableHead>Payment Description</TableHead>
                                  <TableHead>Amount</TableHead>
                                  <TableHead>Date</TableHead>
                                  <TableHead>Method</TableHead>
                                  <TableHead>Items</TableHead>
                                  <TableHead>Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                <TableRow>
                                  <TableCell>{payment.purchase}</TableCell>
                                  <TableCell>${payment.payment_amount.toLocaleString()}</TableCell>
                                  <TableCell>{payment.payment_date}</TableCell>
                                  <TableCell>{payment.payment_by}</TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm">{payment.logged_items.length} items</span>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          setSelectedPaymentForItem(payment.id)
                                          setEditingItem(null)
                                          resetItemForm()
                                          setShowItemDialog(true)
                                        }}
                                      >
                                        <Package className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          setSelectedBudgetForPayment(budget.id)
                                          setEditingPayment(payment)
                                          setNewPayment({
                                            purchase: payment.purchase,
                                            payment_amount: payment.payment_amount,
                                            payment_by: payment.payment_by,
                                            payment_for: payment.payment_for,
                                            payment_date: payment.payment_date,
                                            item: payment.item,
                                          })
                                          setShowPaymentDialog(true)
                                        }}
                                      >
                                        <Edit className="w-3 h-3" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleDeletePayment(budget.id, payment.id)}
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )

      case "items":
        return (
          <Card className="border-slate-200/50 shadow-lg bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Item Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-6">
                {budgets.map((budget) => (
                  <div key={budget.id}>
                    {budget.logged_payments.some((p) => p.logged_items.length > 0) && (
                      <div className="space-y-4">
                        {budget.logged_payments.map((payment) => (
                          payment.logged_items.length > 0 && (
                            <div key={payment.id} className="mb-6 overflow-x-auto px-4">
                              <div className="mb-2">
                                <div className="font-semibold text-lg text-gray-900 ml-8">{budget.purchase}</div>
                                <div className="text-sm text-muted-foreground font-medium mt-1 ml-8">{payment.purchase}</div>
                              </div>
                              <Table>
                                <TableHeader>
                                  <TableRow className="bg-slate-50/50">
                                    <TableHead>Item</TableHead>
                                    <TableHead>Per Cost</TableHead>
                                    <TableHead>Subtotal</TableHead>
                                    <TableHead>Total</TableHead>
                                    <TableHead>Actions</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {payment.logged_items.map((item) => (
                                    <TableRow key={item.id}>
                                      <TableCell>{item.item}</TableCell>
                                      <TableCell>${item.per_cost.toLocaleString()}</TableCell>
                                      <TableCell>${item.subtotal.toLocaleString()}</TableCell>
                                      <TableCell className="font-medium">${item.total.toLocaleString()}</TableCell>
                                      <TableCell>
                                        <div className="flex items-center gap-2">
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => {
                                              setSelectedPaymentForItem(payment.id)
                                              setEditingItem(item)
                                              setNewItem({
                                                item: item.item,
                                                per_cost: item.per_cost,
                                                subtotal: item.subtotal,
                                                total: item.total,
                                              })
                                              setShowItemDialog(true)
                                            }}
                                          >
                                            <Edit className="w-3 h-3" />
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleDeleteItem(payment.id, item.id)}
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </Button>
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          )
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )

      default:
        return null
    }
  }

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

      {/* Tab Content */}
      <div className="space-y-6">{renderTabContent()}</div>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingPayment ? "Edit Payment" : "Add New Payment"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="payment_purchase">Payment Description</Label>
              <Input
                id="payment_purchase"
                value={newPayment.purchase}
                onChange={(e) => setNewPayment({ ...newPayment, purchase: e.target.value })}
                placeholder="e.g., Deposit Payment"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="payment_amount">Amount</Label>
                <Input
                  id="payment_amount"
                  type="number"
                  step="0.01"
                  value={newPayment.payment_amount}
                  onChange={(e) =>
                    setNewPayment({ ...newPayment, payment_amount: Number.parseFloat(e.target.value) || 0 })
                  }
                  placeholder="0.00"
                />
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
            </div>
            <div>
              <Label htmlFor="payment_method">Payment Method</Label>
              <Select
                value={newPayment.payment_by}
                onValueChange={(value) => setNewPayment({ ...newPayment, payment_by: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Credit Card">Credit Card</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Check">Check</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="payment_for_desc">Payment For</Label>
              <Input
                id="payment_for_desc"
                value={newPayment.payment_for}
                onChange={(e) => setNewPayment({ ...newPayment, payment_for: e.target.value })}
                placeholder="e.g., 50% Deposit"
              />
            </div>
            <div>
              <Label htmlFor="payment_item">Item</Label>
              <Input
                id="payment_item"
                value={newPayment.item}
                onChange={(e) => setNewPayment({ ...newPayment, item: e.target.value })}
                placeholder="e.g., Catering Deposit"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSavePayment}>{editingPayment ? "Update" : "Add"} Payment</Button>
            </div>
          </div>
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
              <Label htmlFor="item_name">Item Name</Label>
              <Input
                id="item_name"
                value={newItem.item}
                onChange={(e) => setNewItem({ ...newItem, item: e.target.value })}
                placeholder="e.g., Appetizers"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="per_cost">Per Cost</Label>
                <Input
                  id="per_cost"
                  type="number"
                  step="0.01"
                  value={newItem.per_cost}
                  onChange={(e) => setNewItem({ ...newItem, per_cost: Number.parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="subtotal">Subtotal</Label>
                <Input
                  id="subtotal"
                  type="number"
                  step="0.01"
                  value={newItem.subtotal}
                  onChange={(e) => setNewItem({ ...newItem, subtotal: Number.parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
              </div>
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
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowItemDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveItem}>{editingItem ? "Update" : "Add"} Item</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
