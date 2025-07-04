-- Create table for coming soon features
create table if not exists public.coming_soon_features (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  feature_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Optional: Add RLS policies if needed for your app 