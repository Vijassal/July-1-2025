import { supabase } from "@/lib/supabase"
import { getUserActiveTypes } from "@/lib/user-type-helpers"

export interface AccountInstance {
  id: string
  name: string
  owner_user_id: string
  owner_id: string
  currency: string
  created_at: string
}

export interface ProfessionalAccess {
  id: string
  professional_id: string
  account_instance_id: string
  access_level: "full" | "limited"
  granted_at: string
  granted_by: string
  is_active: boolean
}

export class AccountService {
  /**
   * Get the primary account instance for a regular user
   */
  static async getPrimaryAccountInstance(userId: string): Promise<AccountInstance | null> {
    try {
      const { data, error } = await supabase
        .from("account_instances")
        .select("*")
        .eq("owner_user_id", userId)
        .single()

      if (error) {
        console.error("Error fetching primary account instance:", error)
        return null
      }

      return data
    } catch (error) {
      console.error("Error in getPrimaryAccountInstance:", error)
      return null
    }
  }

  /**
   * Get all account instances a professional has access to
   */
  static async getProfessionalAccess(userId: string): Promise<ProfessionalAccess[]> {
    try {
      const { data, error } = await supabase
        .from("professional_account_access")
        .select(`
          *,
          account_instances (
            id,
            name,
            owner_user_id,
            currency
          )
        `)
        .eq("professional_id", userId)
        .eq("is_active", true)

      if (error) {
        console.error("Error fetching professional access:", error)
        return []
      }

      return data || []
    } catch (error) {
      console.error("Error in getProfessionalAccess:", error)
      return []
    }
  }

  /**
   * Create a new account instance for a user
   */
  static async createAccountInstance(userId: string, name: string): Promise<AccountInstance | null> {
    try {
      const { data, error } = await supabase
        .from("account_instances")
        .insert({
          name,
          owner_user_id: userId,
          owner_id: userId,
          currency: "USD"
        })
        .select()
        .single()

      if (error) {
        console.error("Error creating account instance:", error)
        return null
      }

      return data
    } catch (error) {
      console.error("Error in createAccountInstance:", error)
      return null
    }
  }

  /**
   * Get account instance by ID with proper access control
   */
  static async getAccountInstanceById(accountId: string, userId: string): Promise<AccountInstance | null> {
    try {
      // First check if user is the owner
      const { data: ownedAccount, error: ownedError } = await supabase
        .from("account_instances")
        .select("*")
        .eq("id", accountId)
        .eq("owner_user_id", userId)
        .single()

      if (ownedAccount) {
        return ownedAccount
      }

      // If not owner, check if user has professional access
      const { data: professionalAccess, error: accessError } = await supabase
        .from("professional_account_access")
        .select("*")
        .eq("account_instance_id", accountId)
        .eq("professional_id", userId)
        .eq("is_active", true)
        .single()

      if (professionalAccess) {
        // Fetch the account instance
        const { data: account, error: accountError } = await supabase
          .from("account_instances")
          .select("*")
          .eq("id", accountId)
          .single()

        if (accountError) {
          console.error("Error fetching account instance:", accountError)
          return null
        }

        return account
      }

      return null
    } catch (error) {
      console.error("Error in getAccountInstanceById:", error)
      return null
    }
  }

  /**
   * Get the current user's account context
   */
  static async getCurrentAccountContext(userId: string): Promise<{
    accountInstance: AccountInstance | null
    userTypes: string[]
    isProfessional: boolean
    accessibleAccounts: ProfessionalAccess[]
  }> {
    try {
      const userTypes = await getUserActiveTypes(userId)
      const isProfessional = userTypes.includes("professional")

      if (isProfessional) {
        const accessibleAccounts = await this.getProfessionalAccess(userId)
        return {
          accountInstance: null,
          userTypes,
          isProfessional,
          accessibleAccounts
        }
      } else {
        const accountInstance = await this.getPrimaryAccountInstance(userId)
        return {
          accountInstance,
          userTypes,
          isProfessional,
          accessibleAccounts: []
        }
      }
    } catch (error) {
      console.error("Error in getCurrentAccountContext:", error)
      return {
        accountInstance: null,
        userTypes: [],
        isProfessional: false,
        accessibleAccounts: []
      }
    }
  }
} 