"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MapPin, Calendar, Clock, Users, Target, Ruler, Navigation, Truck, Users2 } from "lucide-react"
import BlueprintTab from "./components/BlueprintTab"
import DestinationTab from "./components/DestinationTab"
import TransportationTab from "./components/TransportationTab"
import SeatArrangementTab from "./components/SeatArrangementTab"
import { LocalModeIndicator } from "./components/LocalModeIndicator"
import { supabase } from "@/lib/supabase"

export default function MapPage() {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState("blueprint")
  const [localMode, setLocalMode] = useState(false)
  const tab = searchParams.get("tab") || "blueprint"

  useEffect(() => {
    const tab = searchParams.get("tab")
    if (tab && ["blueprint", "destination", "transportation", "seating"].includes(tab)) {
      setActiveTab(tab)
    }
  }, [searchParams])

  // Test if database is available
  useEffect(() => {
    const testDatabase = async () => {
      try {
        const { error } = await supabase
          .from("blueprints")
          .select("id")
          .limit(1)

        if (error) {
          console.log("Database not available - running in local mode")
          setLocalMode(true)
        } else {
          setLocalMode(false)
        }
      } catch (error) {
        console.log("Database not available - running in local mode")
        setLocalMode(true)
      }
    }

    testDatabase()
  }, [])

  // Banner content based on tab
  let bannerIcon, bannerTitle, bannerSubtitle;
  switch (tab) {
    case "destination":
      bannerIcon = <Navigation className="w-6 h-6 text-white" />;
      bannerTitle = "Destination Planner";
      bannerSubtitle = "Plan and manage event destinations, logistics, and site details.";
      break;
    case "transportation":
      bannerIcon = <Truck className="w-6 h-6 text-white" />;
      bannerTitle = "Transportation Organizer";
      bannerSubtitle = "Coordinate shuttles, parking, and guest transportation.";
      break;
    case "seating":
      bannerIcon = <Users2 className="w-6 h-6 text-white" />;
      bannerTitle = "Seating Arranger";
      bannerSubtitle = "Arrange seating, assign guests, and manage table layouts.";
      break;
    default:
      bannerIcon = <Ruler className="w-6 h-6 text-white" />;
      bannerTitle = "Blueprint Designer";
      bannerSubtitle = "Create and edit blueprints for your event spaces. Draw layouts, add measurements, and save up to 10 blueprints.";
  }

  return (
    <div className="space-y-6">
      {/* Dynamic Banner/Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 text-white shadow-2xl mb-0">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-500/20 via-transparent to-amber-500/20"></div>
        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-rose-500 rounded-xl flex items-center justify-center shadow-lg">
              {bannerIcon}
            </div>
            <div>
              <h1 className="text-3xl font-light">{bannerTitle}</h1>
              <p className="text-slate-200 font-light">{bannerSubtitle}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Event Selector */}
      <div className="flex items-center justify-end">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Target className="w-4 h-4" />
            <span className="font-medium">Active Event</span>
          </div>
          <Select defaultValue="event-1">
            <SelectTrigger className="w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="event-1">Haldi & Mendhi - Mon, Oct 6, 2025</SelectItem>
              <SelectItem value="event-2">Wedding Ceremony - Tue, Oct 7, 2025</SelectItem>
              <SelectItem value="event-3">Reception - Wed, Oct 8, 2025</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Event Details Card */}
      <Card className="border-orange-200/50 shadow-sm bg-white/90 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-gray-900">Haldi & Mendhi</h2>
              <div className="flex items-center gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Mon, Oct 6, 2025</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>6:00 AM - 12:00 AM</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>41 Shockley Drive</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                Traditional
              </Badge>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Event
              </Badge>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users className="w-4 h-4" />
                <span>100 Attendees</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Local Mode Indicator */}
      <LocalModeIndicator isLocalMode={localMode} />

      {/* Render tab content based on ?tab=... */}
      {tab === "blueprint" && (
        <BlueprintTab userId="user-1" eventId="event-1" eventName="Haldi & Mendhi" />
      )}
      {tab === "destination" && (
        <DestinationTab userId="user-1" eventId="event-1" eventName="Haldi & Mendhi" />
      )}
      {tab === "transportation" && (
        <TransportationTab userId="user-1" eventId="event-1" eventName="Haldi & Mendhi" />
      )}
      {tab === "seating" && (
        <SeatArrangementTab userId="user-1" eventId="event-1" eventName="Haldi & Mendhi" />
      )}
    </div>
  )
}
