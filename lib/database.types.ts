// Add your existing database types here
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          name: string | null
          email: string
          password: string
          emailVerified: string | null
          image: string | null
          user_type: "regular" | "professional" | "vendor"
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          name?: string | null
          email: string
          password: string
          emailVerified?: string | null
          image?: string | null
          user_type?: "regular" | "professional" | "vendor"
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          name?: string | null
          email?: string
          password?: string
          emailVerified?: string | null
          image?: string | null
          user_type?: "regular" | "professional" | "vendor"
          createdAt?: string
          updatedAt?: string
        }
      }
      account_instances: {
        Row: {
          id: string
          name: string
          owner_user_id: string
          currency: string
          subscription_status: "trial" | "active" | "past_due" | "canceled" | "unpaid"
          trial_ends_at: string | null
          subscription_ends_at: string | null
          max_events: number
          max_participants: number
          max_professional_accounts: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          owner_user_id: string
          currency?: string
          subscription_status?: "trial" | "active" | "past_due" | "canceled" | "unpaid"
          trial_ends_at?: string | null
          subscription_ends_at?: string | null
          max_events?: number
          max_participants?: number
          max_professional_accounts?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          owner_user_id?: string
          currency?: string
          subscription_status?: "trial" | "active" | "past_due" | "canceled" | "unpaid"
          trial_ends_at?: string | null
          subscription_ends_at?: string | null
          max_events?: number
          max_participants?: number
          max_professional_accounts?: number
          created_at?: string
        }
      }


      events: {
        Row: {
          id: string
          title: string
          description: string | null
          date: string
          location: string | null
          createdAt: string
          updatedAt: string
          userId: string
          account_instance_id: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          date: string
          location?: string | null
          createdAt?: string
          updatedAt?: string
          userId: string
          account_instance_id: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          date?: string
          location?: string | null
          createdAt?: string
          updatedAt?: string
          userId?: string
          account_instance_id?: string
        }
      }
      app_configurations: {
        Row: {
          id: string
          account_instance_id: string
          currency: string
          religion_enabled: boolean
          floorplan_enabled: boolean
          updated_at: string
        }
        Insert: {
          id?: string
          account_instance_id: string
          currency?: string
          religion_enabled?: boolean
          floorplan_enabled?: boolean
          updated_at?: string
        }
        Update: {
          id?: string
          account_instance_id?: string
          currency?: string
          religion_enabled?: boolean
          floorplan_enabled?: boolean
          updated_at?: string
        }
      }
      // Add other tables as needed
      user_type_registrations: {
        Row: {
          id: string
          user_id: string
          user_type: "regular" | "professional" | "vendor"
          is_active: boolean
          registered_at: string
          subscription_id: string | null
          requires_payment: boolean
          payment_required_at: string | null
          metadata?: Record<string, any>
        }
        Insert: {
          id?: string
          user_id: string
          user_type: "regular" | "professional" | "vendor"
          is_active?: boolean
          registered_at?: string
          subscription_id?: string | null
          requires_payment?: boolean
          payment_required_at?: string | null
          metadata?: Record<string, any>
        }
        Update: {
          id?: string
          user_id?: string
          user_type?: "regular" | "professional" | "vendor"
          is_active?: boolean
          registered_at?: string
          subscription_id?: string | null
          requires_payment?: boolean
          payment_required_at?: string | null
          metadata?: Record<string, any>
        }
      }
      account_creation_requests: {
        Row: {
          id: string
          professional_id: string
          client_email: string
          client_name?: string
          account_name: string
          message?: string
          status: "pending" | "accepted" | "declined" | "expired"
          created_at: string
          expires_at: string
          responded_at?: string
          account_instance_id?: string
        }
        Insert: {
          id?: string
          professional_id: string
          client_email: string
          client_name?: string
          account_name: string
          message?: string
          status?: "pending" | "accepted" | "declined" | "expired"
          created_at?: string
          expires_at?: string
          responded_at?: string
          account_instance_id?: string
        }
        Update: {
          id?: string
          professional_id?: string
          client_email?: string
          client_name?: string
          account_name?: string
          message?: string
          status?: "pending" | "accepted" | "declined" | "expired"
          created_at?: string
          expires_at?: string
          responded_at?: string
          account_instance_id?: string
        }
      }
      professional_account_access: {
        Row: {
          id: string
          professional_id: string
          account_instance_id: string
          access_level: "full" | "limited"
          granted_at: string
          granted_by: string
          created_at: string
          updated_at: string
          is_active: boolean
        }
        Insert: {
          id?: string
          professional_id: string
          account_instance_id: string
          access_level?: "full" | "limited"
          granted_at?: string
          granted_by: string
          created_at?: string
          updated_at?: string
          is_active?: boolean
        }
        Update: {
          id?: string
          professional_id?: string
          account_instance_id?: string
          access_level?: "full" | "limited"
          granted_at?: string
          granted_by?: string
          created_at?: string
          updated_at?: string
          is_active?: boolean
        }
      }
      subscription_plans: {
        Row: {
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
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          user_type: "regular" | "professional" | "vendor"
          price_monthly?: number | null
          price_yearly?: number | null
          features?: Record<string, any> | null
          max_events?: number
          max_participants?: number
          max_professional_accounts?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          user_type?: "regular" | "professional" | "vendor"
          price_monthly?: number | null
          price_yearly?: number | null
          features?: Record<string, any> | null
          max_events?: number
          max_participants?: number
          max_professional_accounts?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      user_subscriptions: {
        Row: {
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
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan_id: string
          status?: "trial" | "active" | "past_due" | "canceled" | "unpaid"
          current_period_start?: string | null
          current_period_end?: string | null
          trial_start?: string | null
          trial_end?: string | null
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          payment_provider?: string | null
          payment_provider_subscription_id?: string | null
          payment_provider_customer_id?: string | null
          metadata?: Record<string, any> | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          plan_id?: string
          status?: "trial" | "active" | "past_due" | "canceled" | "unpaid"
          current_period_start?: string | null
          current_period_end?: string | null
          trial_start?: string | null
          trial_end?: string | null
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          payment_provider?: string | null
          payment_provider_subscription_id?: string | null
          payment_provider_customer_id?: string | null
          metadata?: Record<string, any> | null
          created_at?: string
          updated_at?: string
        }
      }
      subscription_usage: {
        Row: {
          id: string
          user_id: string
          account_instance_id: string
          usage_type: string
          usage_count: number
          usage_date: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          account_instance_id: string
          usage_type: string
          usage_count?: number
          usage_date?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          account_instance_id?: string
          usage_type?: string
          usage_count?: number
          usage_date?: string
          created_at?: string
        }
      }
      payment_webhooks: {
        Row: {
          id: string
          provider: string
          event_type: string
          event_id: string
          payload: Record<string, any>
          processed: boolean
          processed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          provider: string
          event_type: string
          event_id: string
          payload: Record<string, any>
          processed?: boolean
          processed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          provider?: string
          event_type?: string
          event_id?: string
          payload?: Record<string, any>
          processed?: boolean
          processed_at?: string | null
          created_at?: string
        }
      }
      vendors: {
        Row: {
          id: string
          name: string
          date: string
          start_time: string
          event: string | null
          location: string | null
          type: string | null
          category: string | null
          created_at: string
          end_time: string | null
          account_instance_id: string | null
          contact_info: any
          business_name: string | null
          service_category: string | null
          description: string | null
          availability: any
          user_id: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          date: string
          start_time: string
          event?: string | null
          location?: string | null
          type?: string | null
          category?: string | null
          created_at?: string
          end_time?: string | null
          account_instance_id?: string | null
          contact_info?: any
          business_name?: string | null
          service_category?: string | null
          description?: string | null
          availability?: any
          user_id?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          date?: string
          start_time?: string
          event?: string | null
          location?: string | null
          type?: string | null
          category?: string | null
          created_at?: string
          end_time?: string | null
          account_instance_id?: string | null
          contact_info?: any
          business_name?: string | null
          service_category?: string | null
          description?: string | null
          availability?: any
          user_id?: string | null
          updated_at?: string | null
        }
      }
      vendor_profiles: {
        Row: {
          id: string
          user_id: string
          business_name: string
          service_category: string
          description: string | null
          contact_info: any
          availability: any
          pricing_info: any
          portfolio_images: string[] | null
          rating: number | null
          review_count: number | null
          is_approved: boolean | null
          is_featured: boolean | null
          revenue_share_percentage: number | null
          approved_at: string | null
          approved_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          business_name: string
          service_category: string
          description?: string | null
          contact_info?: any
          availability?: any
          pricing_info?: any
          portfolio_images?: string[] | null
          rating?: number | null
          review_count?: number | null
          is_approved?: boolean | null
          is_featured?: boolean | null
          revenue_share_percentage?: number | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          business_name?: string
          service_category?: string
          description?: string | null
          contact_info?: any
          availability?: any
          pricing_info?: any
          portfolio_images?: string[] | null
          rating?: number | null
          review_count?: number | null
          is_approved?: boolean | null
          is_featured?: boolean | null
          revenue_share_percentage?: number | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      vendor_contacts: {
        Row: {
          id: string
          vendor_id: string
          name: string
          email: string | null
          phone: string | null
          role: string | null
          is_primary: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          vendor_id: string
          name: string
          email?: string | null
          phone?: string | null
          role?: string | null
          is_primary?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          vendor_id?: string
          name?: string
          email?: string | null
          phone?: string | null
          role?: string | null
          is_primary?: boolean | null
          created_at?: string
          updated_at?: string
        }
      }
      spotlight_vendors: {
        Row: {
          id: string
          business_name: string
          service_category: string
          description: string | null
          contact_info: any
          pricing_info: any
          portfolio_images: string[] | null
          rating: number | null
          review_count: number | null
          is_approved: boolean | null
          is_featured: boolean | null
          revenue_share_percentage: number | null
          created_at: string
          updated_at: string
          approved_at: string | null
          approved_by: string | null
        }
        Insert: {
          id?: string
          business_name: string
          service_category: string
          description?: string | null
          contact_info?: any
          pricing_info?: any
          portfolio_images?: string[] | null
          rating?: number | null
          review_count?: number | null
          is_approved?: boolean | null
          is_featured?: boolean | null
          revenue_share_percentage?: number | null
          created_at?: string
          updated_at?: string
          approved_at?: string | null
          approved_by?: string | null
        }
        Update: {
          id?: string
          business_name?: string
          service_category?: string
          description?: string | null
          contact_info?: any
          pricing_info?: any
          portfolio_images?: string[] | null
          rating?: number | null
          review_count?: number | null
          is_approved?: boolean | null
          is_featured?: boolean | null
          revenue_share_percentage?: number | null
          created_at?: string
          updated_at?: string
          approved_at?: string | null
          approved_by?: string | null
        }
      }
      vendor_bookings: {
        Row: {
          id: string
          booking_link_id: string
          event_id: string
          vendor_name: string
          vendor_email: string
          vendor_phone: string | null
          service_type: string
          service_description: string | null
          proposed_date: string | null
          proposed_time: string | null
          status: 'pending' | 'approved' | 'rejected'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          booking_link_id: string
          event_id: string
          vendor_name: string
          vendor_email: string
          vendor_phone?: string | null
          service_type: string
          service_description?: string | null
          proposed_date?: string | null
          proposed_time?: string | null
          status?: 'pending' | 'approved' | 'rejected'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          booking_link_id?: string
          event_id?: string
          vendor_name?: string
          vendor_email?: string
          vendor_phone?: string | null
          service_type?: string
          service_description?: string | null
          proposed_date?: string | null
          proposed_time?: string | null
          status?: 'pending' | 'approved' | 'rejected'
          created_at?: string
          updated_at?: string
        }
      }
      budgets: {
        Row: {
          id: string
          purchase: string
          vendor_id: string | null
          date: string
          event_id: string | null
          category: string
          cost: number
          tags: string[] | null
          payment_for: string | null
          payment_by: string | null
          conversion_rate: number | null
          converted_amount: number | null
          currency: string | null
          account_instance_id: string
          created_at: string
          updated_at: string
          category_id: string | null
          actual_cost: number | null
          actual_currency: string | null
          notes: string | null
        }
        Insert: {
          id?: string
          purchase: string
          vendor_id?: string | null
          date: string
          event_id?: string | null
          category: string
          cost: number
          tags?: string[] | null
          payment_for?: string | null
          payment_by?: string | null
          conversion_rate?: number | null
          converted_amount?: number | null
          currency?: string | null
          account_instance_id: string
          created_at?: string
          updated_at?: string
          category_id?: string | null
          actual_cost?: number | null
          actual_currency?: string | null
          notes?: string | null
        }
        Update: {
          id?: string
          purchase?: string
          vendor_id?: string | null
          date?: string
          event_id?: string | null
          category?: string
          cost?: number
          tags?: string[] | null
          payment_for?: string | null
          payment_by?: string | null
          conversion_rate?: number | null
          converted_amount?: number | null
          currency?: string | null
          account_instance_id?: string
          created_at?: string
          updated_at?: string
          category_id?: string | null
          actual_cost?: number | null
          actual_currency?: string | null
          notes?: string | null
        }
      }
      logged_payments: {
        Row: {
          id: string
          budget_id: string
          purchase: string
          payment_amount: number
          payment_by: string
          payment_for: string
          payment_date: string
          item: string
          account_instance_id: string
          created_at: string
          updated_at: string
          budget_item_id: string | null
          payment_method: string | null
          payment_status: string | null
          payment_reference: string | null
          notes: string | null
          receipt_url: string | null
          currency: string | null
        }
        Insert: {
          id?: string
          budget_id: string
          purchase: string
          payment_amount: number
          payment_by: string
          payment_for: string
          payment_date: string
          item: string
          account_instance_id: string
          created_at?: string
          updated_at?: string
          budget_item_id?: string | null
          payment_method?: string | null
          payment_status?: string | null
          payment_reference?: string | null
          notes?: string | null
          receipt_url?: string | null
          currency?: string | null
        }
        Update: {
          id?: string
          budget_id?: string
          purchase?: string
          payment_amount?: number
          payment_by?: string
          payment_for?: string
          payment_date?: string
          item?: string
          account_instance_id?: string
          created_at?: string
          updated_at?: string
          budget_item_id?: string | null
          payment_method?: string | null
          payment_status?: string | null
          payment_reference?: string | null
          notes?: string | null
          receipt_url?: string | null
          currency?: string | null
        }
      }
      logged_item_costs: {
        Row: {
          id: string
          logged_payment_id: string
          item: string
          per_cost: number
          subtotal: number
          total: number
          account_instance_id: string
          created_at: string
          updated_at: string
          quantity: number | null
          notes: string | null
        }
        Insert: {
          id?: string
          logged_payment_id: string
          item: string
          per_cost: number
          subtotal: number
          total: number
          account_instance_id: string
          created_at?: string
          updated_at?: string
          quantity?: number | null
          notes?: string | null
        }
        Update: {
          id?: string
          logged_payment_id?: string
          item?: string
          per_cost?: number
          subtotal?: number
          total?: number
          account_instance_id?: string
          created_at?: string
          updated_at?: string
          quantity?: number | null
          notes?: string | null
        }
      }
      exchange_rates: {
        Row: {
          id: string
          from_currency: string
          to_currency: string
          rate: number
          date: string
          account_instance_id: string
          created_at: string
        }
        Insert: {
          id?: string
          from_currency: string
          to_currency: string
          rate: number
          date: string
          account_instance_id: string
          created_at?: string
        }
        Update: {
          id?: string
          from_currency?: string
          to_currency?: string
          rate?: number
          date?: string
          account_instance_id?: string
          created_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          account_instance_id: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          account_instance_id: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          account_instance_id?: string
          created_at?: string
        }
      }
      future_payments: {
        Row: {
          id: string
          budget_item_id: string
          due_date: string
          amount: number
          notes: string | null
          status: string
          paid_at: string | null
          account_instance_id: string
          created_at: string
        }
        Insert: {
          id?: string
          budget_item_id: string
          due_date: string
          amount: number
          notes?: string | null
          status?: string
          paid_at?: string | null
          account_instance_id: string
          created_at?: string
        }
        Update: {
          id?: string
          budget_item_id?: string
          due_date?: string
          amount?: number
          notes?: string | null
          status?: string
          paid_at?: string | null
          account_instance_id?: string
          created_at?: string
        }
      }
    }
  }
}
