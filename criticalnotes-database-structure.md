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
          createdAt?: string
          updatedAt?: string
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
        }
      }
      // Add other tables as needed
    }
  }
}
