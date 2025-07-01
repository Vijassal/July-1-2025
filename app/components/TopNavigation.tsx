"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface Tab {
  id: string
  label: string
  href: string
}

interface TopNavigationProps {
  currentPage: string
}

// Define tabs for each page
const pageTabsConfig: Record<string, Tab[]> = {
  "/invite": [
    { id: "guests", label: "Guests", href: "/invite" },
    { id: "rsvp", label: "RSVP", href: "/invite/rsvp" },
    { id: "design", label: "Design", href: "/invite/design" },
  ],
  "/events": [
    { id: "all", label: "All Events", href: "/events" },
    { id: "addEvent", label: "+ Add Event", href: "/events?tab=addEvent" },
    { id: "addSubEvent", label: "+ Add Sub-Event", href: "/events?tab=addSubEvent" },
  ],
  "/plan": [
    { id: "itinerary", label: "Itinerary", href: "/plan" },
    { id: "calendar", label: "Calendar", href: "/plan/calendar" },
    { id: "tasks", label: "Tasks", href: "/plan/tasks" },
  ],
  "/budget": [
    { id: "budgets", label: "Budget Items", href: "/budget?tab=budgets" },
    { id: "payments", label: "Logged Payments", href: "/budget?tab=payments" },
    { id: "items", label: "Item Breakdown", href: "/budget?tab=items" },
  ],
  "/vendors": [
    { id: "vendors", label: "My Vendors", href: "/vendors?tab=vendors" },
    { id: "spotlight", label: "Spotlight", href: "/vendors?tab=spotlight" },
    { id: "booking", label: "Booking Links", href: "/vendors?tab=booking" },
    { id: "shared", label: "Shared Data", href: "/vendors?tab=shared" },
  ],
  "/map": [
    { id: "blueprint", label: "Blueprint", href: "/map?tab=blueprint" },
    { id: "destination", label: "Destination", href: "/map?tab=destination" },
    { id: "transportation", label: "Transportation", href: "/map?tab=transportation" },
    { id: "seating", label: "Seating", href: "/map?tab=seating" },
  ],
}

export default function TopNavigation({ currentPage }: TopNavigationProps) {
  const [showSearch, setShowSearch] = useState(false)
  const searchParams = useSearchParams()

  // Handle undefined currentPage
  if (!currentPage) {
    return <div className="text-lg font-semibold tracking-tight">Dashboard</div>
  }

  // Get the base page path (e.g., "/invite" from "/invite/rsvp")
  const pathParts = currentPage.split("/").filter(Boolean)
  const basePage = pathParts.length > 0 ? "/" + pathParts[0] : "/"
  const tabs = pageTabsConfig[basePage] || []

  // For pages with URL params, get the current tab
  const getCurrentTab = () => {
    const tab = searchParams.get("tab")

    if (basePage === "/map") {
      return tab || "blueprint"
    } else if (basePage === "/budget") {
      return tab || "budgets"
    } else if (basePage === "/vendors") {
      return tab || "vendors"
    }
    return null
  }

  // If no tabs are configured for this page, show page title
  if (tabs.length === 0) {
    // For professional routes, show a clean title
    if (currentPage.startsWith("/professional")) {
      return <div className="text-lg font-semibold tracking-tight">Professional Dashboard</div>
    }
    return <div className="text-lg font-semibold tracking-tight">Dashboard</div>
  }

  return (
    <div className="flex items-center gap-4">
      {/* Navigation Tabs */}
      <div className="flex items-center bg-gray-100 rounded-lg p-1">
        {tabs.map((tab) => {
          let isActive = false

          if (basePage === "/map" || basePage === "/budget" || basePage === "/vendors") {
            // For pages with URL params, check the tab parameter
            const currentTab = getCurrentTab()
            isActive = tab.id === currentTab
          } else {
            // For other pages, use the existing logic
            isActive = currentPage === tab.href || (tab.href === basePage && currentPage === basePage)
          }

          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={cn(
                "px-4 py-2 rounded-md text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-gradient-to-r from-orange-400 to-amber-400 text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900 hover:bg-white/50",
              )}
            >
              {tab.label}
            </Link>
          )
        })}
      </div>

      {/* Search */}
      <div className="flex items-center">
        {showSearch ? (
          <div className="flex items-center gap-2">
            <Input placeholder="Search..." className="w-48 h-8 text-sm" autoFocus onBlur={() => setShowSearch(false)} />
          </div>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-gray-500 hover:text-gray-700"
            onClick={() => setShowSearch(true)}
          >
            <Search className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
