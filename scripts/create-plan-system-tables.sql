-- Create personal_calendar_items table
CREATE TABLE IF NOT EXISTS public.personal_calendar_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  date date NOT NULL,
  start_time time without time zone,
  end_time time without time zone,
  is_checklist boolean NOT NULL DEFAULT false,
  is_completed boolean NOT NULL DEFAULT false,
  account_instance_id uuid NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT personal_calendar_items_pkey PRIMARY KEY (id),
  CONSTRAINT personal_calendar_items_account_instance_id_fkey 
    FOREIGN KEY (account_instance_id) REFERENCES account_instances (id) ON DELETE CASCADE,
  CONSTRAINT personal_calendar_items_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE CASCADE
);

-- Create plan_settings table
CREATE TABLE IF NOT EXISTS public.plan_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  account_instance_id uuid NOT NULL,
  day_start_time time without time zone NOT NULL DEFAULT '08:00:00',
  day_end_time time without time zone NOT NULL DEFAULT '20:00:00',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT plan_settings_pkey PRIMARY KEY (id),
  CONSTRAINT plan_settings_account_instance_id_key UNIQUE (account_instance_id),
  CONSTRAINT plan_settings_account_instance_id_fkey 
    FOREIGN KEY (account_instance_id) REFERENCES account_instances (id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_personal_calendar_items_account_instance_id 
  ON public.personal_calendar_items USING btree (account_instance_id);
CREATE INDEX IF NOT EXISTS idx_personal_calendar_items_date 
  ON public.personal_calendar_items USING btree (date);
CREATE INDEX IF NOT EXISTS idx_plan_settings_account_instance_id 
  ON public.plan_settings USING btree (account_instance_id);
