"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Briefcase, Settings, LogOut, LayoutDashboard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { createClientSupabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

const professionalNavItems = [
  {
    name: "Dashboard",
    href: "/professional/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
  },
]

export default function ProfessionalSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClientSupabase()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  return (
    <div className="flex h-full w-64 flex-col bg-white border-r border-gray-200">
      {/* Logo */}
      <div className="flex h-16 items-center px-6 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Briefcase className="h-8 w-8 text-blue-600" />
          <span className="text-xl font-bold text-gray-900">Professional</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6">
        <ul className="space-y-2">
          {professionalNavItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Logout */}
      <div className="px-4 py-4 border-t border-gray-200">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5" />
          Logout
        </Button>
      </div>
    </div>
  )
}
