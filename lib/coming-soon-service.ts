import { createClientSupabase } from "@/lib/supabase"

export interface ComingSoonFeature {
  id: string
  title: string
  description: string
  feature_date: string
}

export async function getComingSoonFeatures(): Promise<ComingSoonFeature[]> {
  const supabase = createClientSupabase()
  const { data, error } = await supabase
    .from("coming_soon_features")
    .select("id, title, description, feature_date")
    .order("feature_date", { ascending: true })
  if (error) throw error
  return data as ComingSoonFeature[]
} 