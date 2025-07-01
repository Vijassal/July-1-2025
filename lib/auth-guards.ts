import { createClientSupabase, handleAuthError } from "@/lib/supabase"
import { redirect } from "next/navigation"

export type UserType = "regular" | "professional" | "vendor"

export async function checkUserTypeAccess(requiredType: UserType) {
  const supabase = createClientSupabase()

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) {
      const handledError = await handleAuthError(userError)
      if (handledError.error.includes('Session expired')) {
        redirect("/auth/login")
      }
      throw new Error(handledError.error)
    }

    if (!user) {
      redirect("/auth/login")
    }

    // Check if user is registered for this type
    const { data: registration, error: regError } = await supabase
      .from("user_type_registrations")
      .select("*")
      .eq("user_id", user.id)
      .eq("user_type", requiredType)
      .eq("is_active", true)
      .single()

    if (regError || !registration) {
      // User is not registered for this type
      redirect("/auth/unauthorized")
    }

    return { user, registration }
  } catch (error) {
    console.error("Auth guard error:", error)
    redirect("/auth/login")
  }
}

export async function getUserRegisteredTypes(userId: string) {
  const supabase = createClientSupabase()

  try {
    const { data: registrations, error } = await supabase
      .from("user_type_registrations")
      .select("user_type")
      .eq("user_id", userId)
      .eq("is_active", true)

    if (error) {
      const handledError = await handleAuthError(error)
      console.error("Error fetching user types:", handledError.error)
      return []
    }

    return registrations.map((reg) => reg.user_type)
  } catch (error) {
    console.error("Error in getUserRegisteredTypes:", error)
    return []
  }
}

export async function requireAuth() {
  const supabase = createClientSupabase()

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) {
      const handledError = await handleAuthError(userError)
      throw new Error(handledError.error)
    }

    if (!user) {
      throw new Error("Authentication required")
    }

    return user
  } catch (error) {
    console.error("Auth requirement failed:", error)
    throw error
  }
}
