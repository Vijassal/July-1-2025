"use client"

import { useEffect, useState } from "react"
import { Bell, Menu, Wrench } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter, usePathname } from "next/navigation"
import TopNavigation from "./TopNavigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { getComingSoonFeatures, ComingSoonFeature } from "@/lib/coming-soon-service"

interface UserBarProps {
  onMenuClick?: () => void
}

export default function UserBar({ onMenuClick }: UserBarProps) {
  const [user, setUser] = useState<any>(null)
  const [isMobile, setIsMobile] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const [comingSoonFeatures, setComingSoonFeatures] = useState<ComingSoonFeature[] | null>(null)
  const [loadingFeatures, setLoadingFeatures] = useState(false)
  const [featuresError, setFeaturesError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
    }
    fetchUser()
  }, [])

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const fetchFeatures = async () => {
    setLoadingFeatures(true)
    setFeaturesError(null)
    try {
      const features = await getComingSoonFeatures()
      setComingSoonFeatures(features)
    } catch (err: any) {
      setFeaturesError("Failed to load features.")
    } finally {
      setLoadingFeatures(false)
    }
  }

  // Hide on auth routes
  if (pathname.startsWith("/auth/")) return null

  const initials =
    user?.user_metadata?.name
      ?.split(" ")
      .map((n: string) => n[0])
      .join("")
      ?.toUpperCase() ??
    user?.email?.charAt(0).toUpperCase() ??
    "U"

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center bg-white">
      <div className="flex flex-1 items-center justify-between px-4">
        {/* Mobile menu button */}
        {isMobile && (
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onMenuClick}>
            <Menu className="h-4 w-4" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        )}

        {/* Top Navigation */}
        <div className="flex-1 flex justify-center">
          <TopNavigation currentPage={pathname} />
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2">
          {/* Coming Soon Button */}
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="relative h-8 w-8 border-amber-400 bg-amber-50 hover:bg-amber-100"
                onClick={fetchFeatures}
              >
                <Wrench className="h-4 w-4 text-amber-600" />
                <span className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-amber-500 text-[10px] font-medium text-white flex items-center justify-center">!</span>
                <span className="sr-only">Coming Soon</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[400px] max-w-md p-6">
              <DialogHeader>
                <DialogTitle>Coming Soon</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {loadingFeatures && <div className="text-xs text-amber-700">Loading...</div>}
                {featuresError && <div className="text-xs text-red-600">{featuresError}</div>}
                {comingSoonFeatures && comingSoonFeatures.length === 0 && (
                  <div className="text-xs text-muted-foreground">No upcoming features yet.</div>
                )}
                {comingSoonFeatures && comingSoonFeatures.map((feature) => (
                  <div
                    key={feature.id}
                    className="flex items-start gap-3 rounded-lg bg-amber-50 border border-amber-200 shadow-sm p-4"
                  >
                    <div className="flex-shrink-0 mt-1">
                      <Wrench className="w-5 h-5 text-amber-400" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-amber-900 mb-1 text-base">{feature.title}</div>
                      <div className="text-sm text-amber-800 mb-2 leading-relaxed">{feature.description}</div>
                      <div className="text-xs text-amber-500 font-mono mt-1">{feature.feature_date}</div>
                    </div>
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>
          {/* Notification Button */}
          <Button variant="ghost" size="icon" className="relative h-8 w-8">
            <Bell className="h-4 w-4" />
            <span className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground flex items-center justify-center">
              3
            </span>
            <span className="sr-only">Notifications</span>
          </Button>
          {/* User Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.user_metadata?.avatar_url ?? undefined} alt={user?.email} />
                  <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col">
                  <p className="text-sm font-medium truncate">{user?.user_metadata?.name ?? "User"}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/settings")}>Settings</DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/profile")}>Profile</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/auth/login")}>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
