import { supabase } from "@/lib/supabase"
import { AccountService } from "@/lib/account-service"
import { registerUserType } from "@/lib/user-type-helpers"

export class AccountInitialization {
  /**
   * Initialize account for a new user
   * This should be called after user registration
   */
  static async initializeUserAccount(userId: string, userEmail: string): Promise<{
    success: boolean
    accountInstance?: any
    error?: string
  }> {
    try {
      // Check if user already has an account instance
      const existingAccount = await AccountService.getPrimaryAccountInstance(userId)
      if (existingAccount) {
        return { success: true, accountInstance: existingAccount }
      }

      // Create account instance
      const accountInstance = await AccountService.createAccountInstance(userId, userEmail)
      if (!accountInstance) {
        return { success: false, error: "Failed to create account instance" }
      }

      // Register user as regular type by default
      const registrationResult = await registerUserType(userId, "regular")
      if (!registrationResult.success) {
        console.warn("Failed to register user type:", registrationResult.error)
        // Don't fail the entire process for this
      }

      // Create default app configuration
      await this.createDefaultAppConfiguration(accountInstance.id)

      // Create default website configuration
      await this.createDefaultWebsiteConfiguration(accountInstance.id)

      return { success: true, accountInstance }
    } catch (error) {
      console.error("Error initializing user account:", error)
      return { success: false, error: "Failed to initialize account" }
    }
  }

  /**
   * Create default app configuration for new account
   */
  private static async createDefaultAppConfiguration(accountInstanceId: string): Promise<void> {
    try {
      await supabase.from("app_configurations").insert({
        account_instance_id: accountInstanceId,
        currency: "USD",
        religion_enabled: false,
        floorplan_enabled: false
      })
    } catch (error) {
      console.error("Error creating default app configuration:", error)
    }
  }

  /**
   * Create default website configuration for new account
   */
  private static async createDefaultWebsiteConfiguration(accountInstanceId: string): Promise<void> {
    try {
      const defaultSlug = `event-${Date.now()}`
      
      const { data: website } = await supabase
        .from("website_configurations")
        .insert({
          account_instance_id: accountInstanceId,
          site_slug: defaultSlug,
          site_title: "Our Special Day",
          site_subtitle: "Join us as we celebrate our love",
          theme_id: "classic",
          color_scheme: {
            primary: "#e11d48",
            secondary: "#f59e0b",
            accent: "#8b5cf6",
            background: "#ffffff",
            text: "#1f2937"
          },
          is_published: false
        })
        .select()
        .single()

      if (website) {
        // Create default home page
        await supabase.from("website_pages").insert({
          website_id: website.id,
          page_slug: "home",
          page_title: "Home",
          page_type: "home",
          content: { sections: [] },
          sort_order: 0
        })
      }
    } catch (error) {
      console.error("Error creating default website configuration:", error)
    }
  }

  /**
   * Check if user needs account initialization
   */
  static async needsInitialization(userId: string): Promise<boolean> {
    try {
      const accountInstance = await AccountService.getPrimaryAccountInstance(userId)
      return !accountInstance
    } catch (error) {
      console.error("Error checking initialization status:", error)
      return true
    }
  }
} 