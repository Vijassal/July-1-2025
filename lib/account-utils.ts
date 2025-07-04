import { supabase } from "@/lib/supabase"

/**
 * Ensures that a user has an account instance, creating one if necessary
 * This is a fallback for cases where the database trigger didn't work
 */
export async function ensureAccountInstance(userId: string, userEmail?: string): Promise<{
  success: boolean
  accountInstanceId?: string
  error?: string
}> {
  try {
    // First try to get existing account instance
    const { data: existingAccount, error: fetchError } = await supabase
      .from("account_instances")
      .select("id")
      .eq("owner_user_id", userId)
      .single()

    if (existingAccount) {
      return { success: true, accountInstanceId: existingAccount.id }
    }

    // If no account exists, create one
    const { data: accountInstance, error: createError } = await supabase
      .from("account_instances")
      .insert({
        name: userEmail || "My Account",
        owner_user_id: userId,
        owner_id: userId,
        currency: "USD"
      })
      .select("id")
      .single()

    if (createError || !accountInstance) {
      return { 
        success: false, 
        error: "Failed to create account instance" 
      }
    }

    // Insert owner into account_instance_users
    const { error: userInsertError } = await supabase
      .from("account_instance_users")
      .insert({
        account_instance_id: accountInstance.id,
        user_id: userId,
        role: "owner",
        status: "active",
        is_owner: true
      })
    if (userInsertError) {
      console.error("Error inserting owner into account_instance_users:", userInsertError)
    }

    // Create default app configuration
    await createDefaultAppConfiguration(accountInstance.id)

    // Create default website configuration
    await createDefaultWebsiteConfiguration(accountInstance.id)

    return { success: true, accountInstanceId: accountInstance.id }
  } catch (error) {
    console.error("Error ensuring account instance:", error)
    return { 
      success: false, 
      error: "Failed to ensure account instance" 
    }
  }
}

/**
 * Create default app configuration for new account
 */
async function createDefaultAppConfiguration(accountInstanceId: string): Promise<void> {
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
async function createDefaultWebsiteConfiguration(accountInstanceId: string): Promise<void> {
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
 * Get or create account instance ID for the current user
 * This is a convenience function that handles the entire flow
 */
export async function getOrCreateAccountInstanceId(): Promise<string | null> {
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error("User not found")
      return null
    }

    const result = await ensureAccountInstance(user.id, user.email || undefined)
    
    if (result.success && result.accountInstanceId) {
      return result.accountInstanceId
    } else {
      console.error("Failed to ensure account instance:", result.error)
      return null
    }
  } catch (error) {
    console.error("Error in getOrCreateAccountInstanceId:", error)
    return null
  }
} 