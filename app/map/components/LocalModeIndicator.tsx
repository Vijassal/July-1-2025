import { Badge } from "@/components/ui/badge"
import { Wifi, WifiOff } from "lucide-react"

interface LocalModeIndicatorProps {
  isLocalMode: boolean
  className?: string
}

export function LocalModeIndicator({ isLocalMode, className = "" }: LocalModeIndicatorProps) {
  if (!isLocalMode) return null

  return (
    <div className={`flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-md border border-amber-200 ${className}`}>
      <WifiOff className="h-3 w-3" />
      <span>Running in local mode - data not persisted</span>
    </div>
  )
} 