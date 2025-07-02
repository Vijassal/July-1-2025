"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { AccountService, AccountInstance, ProfessionalAccess } from "@/lib/account-service"
import { getUserActiveTypes } from "@/lib/user-type-helpers"

interface AccountContextType {
  // Current account state
  currentAccount: AccountInstance | null
  setCurrentAccount: (account: AccountInstance | null) => void
  
  // User state
  userTypes: string[]
  isProfessional: boolean
  isLoading: boolean
  
  // Professional access
  accessibleAccounts: ProfessionalAccess[]
  
  // Actions
  switchAccount: (accountId: string) => Promise<void>
  refreshAccountData: () => Promise<void>
}

const AccountContext = createContext<AccountContextType | undefined>(undefined)

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const [currentAccount, setCurrentAccount] = useState<AccountInstance | null>(null)
  const [userTypes, setUserTypes] = useState<string[]>([])
  const [isProfessional, setIsProfessional] = useState(false)
  const [accessibleAccounts, setAccessibleAccounts] = useState<ProfessionalAccess[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Initialize account context
  useEffect(() => {
    initializeAccountContext()
  }, [])

  const initializeAccountContext = async () => {
    try {
      setIsLoading(true)
      
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user?.id) {
        setIsLoading(false)
        return
      }

      // Get user types
      const types = await getUserActiveTypes(user.id)
      setUserTypes(types)
      setIsProfessional(types.includes("professional"))

      if (types.includes("professional")) {
        // For professionals, get accessible accounts
        const access = await AccountService.getProfessionalAccess(user.id)
        setAccessibleAccounts(access)
        
        // Set first accessible account as current (if any)
        if (access.length > 0) {
          const firstAccount = await AccountService.getAccountInstanceById(access[0].account_instance_id, user.id)
          setCurrentAccount(firstAccount)
        }
      } else {
        // For regular users, get their primary account
        const account = await AccountService.getPrimaryAccountInstance(user.id)
        setCurrentAccount(account)
      }
    } catch (error) {
      console.error("Error initializing account context:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const switchAccount = async (accountId: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user?.id) return

      const account = await AccountService.getAccountInstanceById(accountId, user.id)
      if (account) {
        setCurrentAccount(account)
      }
    } catch (error) {
      console.error("Error switching account:", error)
    }
  }

  const refreshAccountData = async () => {
    await initializeAccountContext()
  }

  const value: AccountContextType = {
    currentAccount,
    setCurrentAccount,
    userTypes,
    isProfessional,
    isLoading,
    accessibleAccounts,
    switchAccount,
    refreshAccountData,
  }

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>
}

export function useAccount() {
  const context = useContext(AccountContext)
  if (context === undefined) {
    throw new Error("useAccount must be used within an AccountProvider")
  }
  return context
} 