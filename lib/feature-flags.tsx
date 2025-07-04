"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { createClientSupabase } from "@/lib/supabase"
import { useAccount } from "@/lib/account-context"

interface FeatureFlags {
  religion_enabled: boolean
  floorplan_enabled: boolean
  trip_plan_enabled: boolean
  isLoading: boolean
}

interface FeatureFlagsContextType {
  features: FeatureFlags
  refreshFeatures: () => Promise<void>
}

const FeatureFlagsContext = createContext<FeatureFlagsContextType | undefined>(undefined)

export function FeatureFlagsProvider({ children }: { children: React.ReactNode }) {
  const [features, setFeatures] = useState<FeatureFlags>({
    religion_enabled: false,
    floorplan_enabled: false,
    trip_plan_enabled: false,
    isLoading: true,
  })
  
  const { currentAccount } = useAccount()
  const supabase = createClientSupabase()

  const fetchFeatureFlags = async () => {
    if (!currentAccount?.id) {
      setFeatures(prev => ({ ...prev, isLoading: false }))
      return
    }

    setFeatures({
      religion_enabled: true,
      floorplan_enabled: true,
      trip_plan_enabled: currentAccount.trip_plan_enabled ?? true,
      isLoading: false,
    })
  }

  const refreshFeatures = async () => {
    await fetchFeatureFlags()
  }

  useEffect(() => {
    fetchFeatureFlags()
  }, [currentAccount?.id])

  const value: FeatureFlagsContextType = {
    features,
    refreshFeatures,
  }

  return <FeatureFlagsContext.Provider value={value}>{children}</FeatureFlagsContext.Provider>
}

export function useFeatureFlags() {
  const context = useContext(FeatureFlagsContext)
  if (context === undefined) {
    throw new Error("useFeatureFlags must be used within a FeatureFlagsProvider")
  }
  return context
} 