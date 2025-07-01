-- Create chat rooms table
CREATE TABLE IF NOT EXISTS public.chat_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  event_id UUID,
  account_instance_id UUID NOT NULL,
  created_by UUID NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT chat_rooms_pkey PRIMARY KEY (id),
  CONSTRAINT chat_rooms_event_id_fkey FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE,
  CONSTRAINT chat_rooms_account_instance_id_fkey FOREIGN KEY (account_instance_id) REFERENCES account_instances (id) ON DELETE CASCADE
);

-- Create chat participants table
CREATE TABLE IF NOT EXISTS public.chat_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  chat_room_id UUID NOT NULL,
  participant_type TEXT NOT NULL CHECK (participant_type IN ('user', 'vendor_contact')),
  user_id UUID,
  vendor_contact_id UUID,
  display_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  is_admin BOOLEAN DEFAULT false,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT chat_participants_pkey PRIMARY KEY (id),
  CONSTRAINT chat_participants_room_id_fkey FOREIGN KEY (chat_room_id) REFERENCES chat_rooms (id) ON DELETE CASCADE,
  CONSTRAINT chat_participants_vendor_contact_id_fkey FOREIGN KEY (vendor_contact_id) REFERENCES vendor_contacts (id) ON DELETE CASCADE
);

-- Create chat messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  chat_room_id UUID NOT NULL,
  participant_id UUID NOT NULL,
  message_text TEXT,
  message_html TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  is_anonymous BOOLEAN DEFAULT false,
  tagged_participants UUID[],
  edited_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT chat_messages_pkey PRIMARY KEY (id),
  CONSTRAINT chat_messages_room_id_fkey FOREIGN KEY (chat_room_id) REFERENCES chat_rooms (id) ON DELETE CASCADE,
  CONSTRAINT chat_messages_participant_id_fkey FOREIGN KEY (participant_id) REFERENCES chat_participants (id) ON DELETE CASCADE
);

-- Create chat notifications table
CREATE TABLE IF NOT EXISTS public.chat_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL,
  message_id UUID NOT NULL,
  is_read BOOLEAN DEFAULT false,
  email_sent BOOLEAN DEFAULT false,
  sms_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT chat_notifications_pkey PRIMARY KEY (id),
  CONSTRAINT chat_notifications_participant_id_fkey FOREIGN KEY (participant_id) REFERENCES chat_participants (id) ON DELETE CASCADE,
  CONSTRAINT chat_notifications_message_id_fkey FOREIGN KEY (message_id) REFERENCES chat_messages (id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_chat_rooms_event_id ON public.chat_rooms USING btree (event_id);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_account_instance_id ON public.chat_rooms USING btree (account_instance_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_room_id ON public.chat_participants USING btree (chat_room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON public.chat_messages USING btree (chat_room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages USING btree (created_at);
CREATE INDEX IF NOT EXISTS idx_chat_notifications_participant_id ON public.chat_notifications USING btree (participant_id);
