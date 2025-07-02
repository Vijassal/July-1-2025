import { supabase } from "@/lib/supabase"

export interface SubscriptionPlan {
  id: string
  name: string
  description: string | null
  user_type: "regular" | "professional" | "vendor"
  price_monthly: number | null
  price_yearly: number | null
  features: Record<string, any> | null
  max_events: number
  max_participants: number
  max_professional_accounts: number
  is_active: boolean
}

export interface UserSubscription {
  id: string
  user_id: string
  plan_id: string
  status: "trial" | "active" | "past_due" | "canceled" | "unpaid"
  current_period_start: string | null
  current_period_end: string | null
  trial_start: string | null
  trial_end: string | null
  cancel_at_period_end: boolean
  canceled_at: string | null
  payment_provider: string | null
  payment_provider_subscription_id: string | null
  payment_provider_customer_id: string | null
  metadata: Record<string, any> | null
}

export interface SubscriptionUsage {
  id: string
  user_id: string
  account_instance_id: string
  usage_type: string
  usage_count: number
  usage_date: string
}

export class SubscriptionService {
  /**
   * Get all available subscription plans
   */
  static async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    try {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("is_active", true)
        .order("price_monthly", { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error("Error fetching subscription plans:", error)
      return []
    }
  }

  /**
   * Get subscription plans for a specific user type
   */
  static async getSubscriptionPlansByType(userType: "regular" | "professional" | "vendor"): Promise<SubscriptionPlan[]> {
    try {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("user_type", userType)
        .eq("is_active", true)
        .order("price_monthly", { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error("Error fetching subscription plans:", error)
      return []
    }
  }

  /**
   * Get user's current subscription
   */
  static async getUserSubscription(userId: string): Promise<UserSubscription | null> {
    try {
      const { data, error } = await supabase
        .from("user_subscriptions")
        .select("*")
        .eq("user_id", userId)
        .in("status", ["trial", "active"])
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== "PGRST116") throw error // PGRST116 = no rows returned
      return data
    } catch (error) {
      console.error("Error fetching user subscription:", error)
      return null
    }
  }

  /**
   * Get user's subscription with plan details
   */
  static async getUserSubscriptionWithPlan(userId: string): Promise<{
    subscription: UserSubscription
    plan: SubscriptionPlan
  } | null> {
    try {
      const { data, error } = await supabase
        .from("user_subscriptions")
        .select(`
          *,
          subscription_plans (*)
        `)
        .eq("user_id", userId)
        .in("status", ["trial", "active"])
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== "PGRST116") throw error
      if (!data) return null

      return {
        subscription: data,
        plan: data.subscription_plans
      }
    } catch (error) {
      console.error("Error fetching user subscription with plan:", error)
      return null
    }
  }

  /**
   * Check if user has active subscription
   */
  static async hasActiveSubscription(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .rpc("has_active_subscription", { user_uuid: userId })

      if (error) throw error
      return data || false
    } catch (error) {
      console.error("Error checking active subscription:", error)
      return false
    }
  }

  /**
   * Get user's subscription plan details
   */
  static async getUserSubscriptionPlan(userId: string): Promise<{
    plan_id: string
    plan_name: string
    user_type: string
    status: string
    trial_end: string | null
    current_period_end: string | null
    max_events: number
    max_participants: number
    max_professional_accounts: number
  } | null> {
    try {
      const { data, error } = await supabase
        .rpc("get_user_subscription_plan", { user_uuid: userId })

      if (error) throw error
      return data?.[0] || null
    } catch (error) {
      console.error("Error fetching user subscription plan:", error)
      return null
    }
  }

  /**
   * Create trial subscription for new user
   */
  static async createTrialSubscription(userId: string, userType: "regular" | "professional" | "vendor"): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .rpc("create_trial_subscription", { 
          user_uuid: userId, 
          user_type_param: userType 
        })

      if (error) throw error
      return data
    } catch (error) {
      console.error("Error creating trial subscription:", error)
      return null
    }
  }

  /**
   * Upgrade user subscription (for payment processing)
   */
  static async upgradeSubscription(
    userId: string,
    planId: string,
    paymentProvider: string,
    paymentProviderSubscriptionId: string,
    paymentProviderCustomerId: string
  ): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .rpc("upgrade_user_subscription", {
          user_uuid: userId,
          new_plan_id: planId,
          payment_provider: paymentProvider,
          payment_provider_subscription_id: paymentProviderSubscriptionId,
          payment_provider_customer_id: paymentProviderCustomerId
        })

      if (error) throw error
      return data
    } catch (error) {
      console.error("Error upgrading subscription:", error)
      return null
    }
  }

  /**
   * Track subscription usage
   */
  static async trackUsage(
    userId: string,
    accountInstanceId: string,
    usageType: string,
    usageCount: number = 1
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("subscription_usage")
        .upsert({
          user_id: userId,
          account_instance_id: accountInstanceId,
          usage_type: usageType,
          usage_count: usageCount,
          usage_date: new Date().toISOString().split('T')[0]
        }, {
          onConflict: "user_id,account_instance_id,usage_type,usage_date"
        })

      if (error) throw error
      return true
    } catch (error) {
      console.error("Error tracking usage:", error)
      return false
    }
  }

  /**
   * Get usage for a specific period
   */
  static async getUsage(
    userId: string,
    accountInstanceId: string,
    usageType: string,
    startDate: string,
    endDate: string
  ): Promise<SubscriptionUsage[]> {
    try {
      const { data, error } = await supabase
        .from("subscription_usage")
        .select("*")
        .eq("user_id", userId)
        .eq("account_instance_id", accountInstanceId)
        .eq("usage_type", usageType)
        .gte("usage_date", startDate)
        .lte("usage_date", endDate)
        .order("usage_date", { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error("Error fetching usage:", error)
      return []
    }
  }

  /**
   * Check if user can perform action based on subscription limits
   */
  static async checkUsageLimit(
    userId: string,
    accountInstanceId: string,
    action: "create_event" | "add_participant" | "add_professional_account"
  ): Promise<{ allowed: boolean; current: number; limit: number }> {
    try {
      const subscriptionPlan = await this.getUserSubscriptionPlan(userId)
      if (!subscriptionPlan) {
        return { allowed: false, current: 0, limit: 0 }
      }

      const usageType = action === "create_event" ? "events" : 
                       action === "add_participant" ? "participants" : 
                       "professional_accounts"

      const limit = action === "create_event" ? subscriptionPlan.max_events :
                   action === "add_participant" ? subscriptionPlan.max_participants :
                   subscriptionPlan.max_professional_accounts

      // Get current usage for this month
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      const endOfMonth = new Date()
      endOfMonth.setMonth(endOfMonth.getMonth() + 1)
      endOfMonth.setDate(0)

      const usage = await this.getUsage(
        userId,
        accountInstanceId,
        usageType,
        startOfMonth.toISOString().split('T')[0],
        endOfMonth.toISOString().split('T')[0]
      )

      const currentUsage = usage.reduce((sum, u) => sum + u.usage_count, 0)

      return {
        allowed: currentUsage < limit,
        current: currentUsage,
        limit
      }
    } catch (error) {
      console.error("Error checking usage limit:", error)
      return { allowed: false, current: 0, limit: 0 }
    }
  }

  /**
   * Cancel user subscription
   */
  static async cancelSubscription(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("user_subscriptions")
        .update({
          status: "canceled",
          cancel_at_period_end: true,
          canceled_at: new Date().toISOString()
        })
        .eq("user_id", userId)
        .in("status", ["trial", "active"])

      if (error) throw error
      return true
    } catch (error) {
      console.error("Error canceling subscription:", error)
      return false
    }
  }

  /**
   * Process payment webhook
   */
  static async processPaymentWebhook(
    provider: string,
    eventType: string,
    eventId: string,
    payload: Record<string, any>
  ): Promise<boolean> {
    try {
      // Store webhook
      const { error: webhookError } = await supabase
        .from("payment_webhooks")
        .insert({
          provider,
          event_type: eventType,
          event_id: eventId,
          payload
        })

      if (webhookError) throw webhookError

      // Process based on event type
      switch (eventType) {
        case "customer.subscription.created":
        case "customer.subscription.updated":
          return await this.handleSubscriptionUpdate(payload)
        case "customer.subscription.deleted":
          return await this.handleSubscriptionCancellation(payload)
        case "invoice.payment_succeeded":
          return await this.handlePaymentSuccess(payload)
        case "invoice.payment_failed":
          return await this.handlePaymentFailure(payload)
        default:
          console.log(`Unhandled webhook event: ${eventType}`)
          return true
      }
    } catch (error) {
      console.error("Error processing payment webhook:", error)
      return false
    }
  }

  /**
   * Handle subscription update from payment provider
   */
  private static async handleSubscriptionUpdate(payload: Record<string, any>): Promise<boolean> {
    try {
      const subscriptionId = payload.data?.object?.id
      const customerId = payload.data?.object?.customer
      const status = payload.data?.object?.status

      if (!subscriptionId || !customerId) return false

      // Find user by customer ID and update subscription
      const { error } = await supabase
        .from("user_subscriptions")
        .update({
          status: status === "active" ? "active" : "past_due",
          payment_provider_subscription_id: subscriptionId,
          payment_provider_customer_id: customerId,
          updated_at: new Date().toISOString()
        })
        .eq("payment_provider_customer_id", customerId)

      if (error) throw error
      return true
    } catch (error) {
      console.error("Error handling subscription update:", error)
      return false
    }
  }

  /**
   * Handle subscription cancellation from payment provider
   */
  private static async handleSubscriptionCancellation(payload: Record<string, any>): Promise<boolean> {
    try {
      const customerId = payload.data?.object?.customer

      if (!customerId) return false

      const { error } = await supabase
        .from("user_subscriptions")
        .update({
          status: "canceled",
          cancel_at_period_end: true,
          canceled_at: new Date().toISOString()
        })
        .eq("payment_provider_customer_id", customerId)

      if (error) throw error
      return true
    } catch (error) {
      console.error("Error handling subscription cancellation:", error)
      return false
    }
  }

  /**
   * Handle successful payment
   */
  private static async handlePaymentSuccess(payload: Record<string, any>): Promise<boolean> {
    try {
      const customerId = payload.data?.object?.customer
      const subscriptionId = payload.data?.object?.subscription

      if (!customerId) return false

      const { error } = await supabase
        .from("user_subscriptions")
        .update({
          status: "active",
          payment_provider_subscription_id: subscriptionId,
          payment_provider_customer_id: customerId,
          updated_at: new Date().toISOString()
        })
        .eq("payment_provider_customer_id", customerId)

      if (error) throw error
      return true
    } catch (error) {
      console.error("Error handling payment success:", error)
      return false
    }
  }

  /**
   * Handle failed payment
   */
  private static async handlePaymentFailure(payload: Record<string, any>): Promise<boolean> {
    try {
      const customerId = payload.data?.object?.customer

      if (!customerId) return false

      const { error } = await supabase
        .from("user_subscriptions")
        .update({
          status: "past_due",
          updated_at: new Date().toISOString()
        })
        .eq("payment_provider_customer_id", customerId)

      if (error) throw error
      return true
    } catch (error) {
      console.error("Error handling payment failure:", error)
      return false
    }
  }
} 