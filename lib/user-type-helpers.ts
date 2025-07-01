import { createClientSupabase } from "@/lib/supabase"

export type UserType = "regular" | "professional" | "vendor"

export interface UserTypeRegistration {
  id: string
  user_id: string
  user_type: UserType
  is_active: boolean
  registered_at: string
  metadata?: Record<string, any>
}

export async function getUserActiveTypes(userId: string): Promise<UserType[]> {
  const supabase = createClientSupabase()

  const { data, error } = await supabase
    .from("user_type_registrations")
    .select("user_type")
    .eq("user_id", userId)
    .eq("is_active", true)

  if (error) {
    console.error("Error fetching user types:", error)
    return []
  }

  return data.map((reg) => reg.user_type)
}

export async function hasUserType(userId: string, userType: UserType): Promise<boolean> {
  const supabase = createClientSupabase()

  const { data, error } = await supabase
    .from("user_type_registrations")
    .select("id")
    .eq("user_id", userId)
    .eq("user_type", userType)
    .eq("is_active", true)
    .single()

  return !error && !!data
}

export async function registerUserType(
  userId: string,
  userType: UserType,
  metadata?: Record<string, any>,
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClientSupabase()

  // Check if already registered
  const existing = await hasUserType(userId, userType)
  if (existing) {
    return { success: false, error: "User already registered for this type" }
  }

  const { error } = await supabase.from("user_type_registrations").insert({
    user_id: userId,
    user_type: userType,
    is_active: true,
    metadata: metadata || {},
  })

  if (error) {
    console.error("Error registering user type:", error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function deactivateUserType(userId: string, userType: UserType): Promise<boolean> {
  const supabase = createClientSupabase()

  const { error } = await supabase
    .from("user_type_registrations")
    .update({ is_active: false })
    .eq("user_id", userId)
    .eq("user_type", userType)

  if (error) {
    console.error("Error deactivating user type:", error)
    return false
  }

  return true
}

export async function reactivateUserType(userId: string, userType: UserType): Promise<boolean> {
  const supabase = createClientSupabase()

  const { error } = await supabase
    .from("user_type_registrations")
    .update({ is_active: true })
    .eq("user_id", userId)
    .eq("user_type", userType)

  if (error) {
    console.error("Error reactivating user type:", error)
    return false
  }

  return true
}

export function getUserTypeDashboardPath(userType: UserType): string {
  switch (userType) {
    case "professional":
      return "/professional/dashboard"
    case "vendor":
      return "/vendor/dashboard"
    case "regular":
    default:
      return "/dashboard"
  }
}

export function getUserTypeDisplayName(userType: UserType): string {
  switch (userType) {
    case "professional":
      return "Event Planner"
    case "vendor":
      return "Service Vendor"
    case "regular":
    default:
      return "Regular User"
  }
}
