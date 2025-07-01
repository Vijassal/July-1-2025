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
          owner_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          owner_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          owner_id?: string
          created_at?: string
          updated_at?: string
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
        }
        Insert: {
          id?: string
          professional_id: string
          account_instance_id: string
          access_level?: "full" | "limited"
          granted_at?: string
          granted_by: string
        }
        Update: {
          id?: string
          professional_id?: string
          account_instance_id?: string
          access_level?: "full" | "limited"
          granted_at?: string
          granted_by?: string
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
          created_at?: string
          updated_at?: string
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
    }
  }
}
