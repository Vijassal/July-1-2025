"use client"

import type React from "react"
import { useState, useCallback, useEffect } from "react"
import {
  Home,
  Calendar,
  Briefcase,
  UserPlus,
  Edit,
  Map,
  MessageSquare,
  DollarSign,
  Settings,
  ArrowRight,
} from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface NavLink {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

interface SidebarProps {
  open?: boolean
  setOpen?: (open: boolean) => void
}

const mainNavigation: NavLink[] = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Events", href: "/events", icon: Calendar },
  { name: "Vendors", href: "/vendors", icon: Briefcase },
]

const toolsNavigation: NavLink[] = [
  { name: "Invite", href: "/invite", icon: UserPlus },
  { name: "Plan", href: "/plan", icon: Edit },
  { name: "Map", href: "/map", icon: Map },
  { name: "Chat", href: "/chat", icon: MessageSquare },
  { name: "Budget", href: "/budget", icon: DollarSign },
  // { name: "Gallery", href: "/gallery", icon: ImageIcon }, // Commented out for initial launch
]

export default function Sidebar({ open: controlledOpen, setOpen: controlledSetOpen }: SidebarProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  const open = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen
  const setOpen = controlledSetOpen !== undefined ? controlledSetOpen : setUncontrolledOpen

  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const handleLogout = useCallback(async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      toast.error("Error logging out")
      return
    }
    toast.success("Logged out")
    router.push("/auth/login")
  }, [router])

  return (
    <aside
      className={cn(
        "h-screen fixed left-0 top-0 z-40 flex flex-col justify-between transition-all duration-300 bg-background border-r border-border",
        open ? "w-60" : "w-16",
      )}
    >
      {/* Toggle Button */}
      <div className="flex flex-col items-center pt-4 pb-2 px-4 gap-2">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center justify-center w-8 h-8 rounded-md border border-border bg-background hover:bg-accent transition-colors"
          aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="3" width="14" height="14" rx="3" fill="currentColor" fillOpacity="0.5" />
            {open ? (
              <rect x="3" y="3" width="5" height="14" rx="2" fill="currentColor" />
            ) : (
              <rect x="12" y="3" width="5" height="14" rx="2" fill="currentColor" />
            )}
          </svg>
        </button>

        <Separator className="w-10/12 mt-2 mb-4" />

        {/* Main Navigation Icons */}
        <div className="flex flex-row gap-10 w-full justify-center">
          {mainNavigation
            .filter((link, idx) => open || idx === 0)
            .map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "group relative flex items-center justify-center w-9 h-9 rounded-md transition-colors",
                    isActive
                      ? "bg-accent text-accent-foreground font-semibold"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  )}
                >
                  <Icon size={20} />
                  <span className="absolute left-1/2 -translate-x-1/2 top-10 whitespace-nowrap bg-popover text-popover-foreground text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 border">
                    {item.name}
                  </span>
                </Link>
              )
            })}
        </div>

        <Separator className="w-10/12 mt-4 mb-2" />

        {/* Tools Navigation */}
        <div className="flex flex-col items-center w-full mt-4 gap-1">
          {toolsNavigation.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            if (open) {
              return (
                <div className="relative flex items-center w-full h-12" key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex-1 w-full h-full flex items-center rounded-md border border-transparent transition-colors text-sm font-medium px-4",
                      isActive
                        ? "bg-accent text-accent-foreground font-semibold"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    )}
                  >
                    <span className="flex-1 text-center">{item.name}</span>
                    <Icon size={20} className="ml-2" />
                  </Link>
                </div>
              )
            }

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group relative flex items-center justify-center w-10 h-10 rounded-md transition-colors",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                <Icon size={20} />
                <span className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2 whitespace-nowrap bg-popover text-popover-foreground text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 delay-100 z-50 border">
                  {item.name}
                </span>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Bottom Section */}
      <div className="flex flex-col items-center mb-4 gap-1">
        <ul className="w-full">
          {/* Settings */}
          <li>
            {open ? (
              <div className="relative flex items-center w-full h-12">
                <Link
                  href="/settings"
                  className="flex items-center w-full h-12 rounded-md border border-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors text-sm font-medium px-4"
                >
                  <span className="flex-1 text-center">Settings</span>
                  <Settings size={20} className="ml-2" />
                </Link>
              </div>
            ) : (
              <Link
                href="/settings"
                className="group relative flex items-center justify-center w-full h-16 rounded-md border border-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors p-0 leading-none"
              >
                <Settings size={20} />
                <span className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2 whitespace-nowrap bg-popover text-popover-foreground text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 delay-100 z-50 border">
                  Settings
                </span>
              </Link>
            )}
          </li>

          {/* Logout */}
          <li>
            {open ? (
              <div className="relative flex items-center w-full h-12">
                <button
                  onClick={handleLogout}
                  type="button"
                  className="flex items-center w-full h-12 rounded-md border border-transparent text-destructive hover:bg-destructive/10 transition-colors text-sm font-medium px-4 bg-transparent appearance-none"
                >
                  <span className="flex-1 text-center">Logout</span>
                  <ArrowRight size={20} className="ml-2" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleLogout}
                type="button"
                className="group relative flex items-center justify-center w-full h-16 rounded-md border border-transparent text-destructive hover:bg-destructive/10 transition-colors bg-transparent p-0 leading-none appearance-none"
              >
                <ArrowRight size={20} />
                <span className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2 whitespace-nowrap bg-popover text-popover-foreground text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 delay-100 z-50 border">
                  Logout
                </span>
              </button>
            )}
          </li>
        </ul>
      </div>
    </aside>
  )
}
