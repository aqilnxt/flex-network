-- Enhance notifications table
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS metadata jsonb;

-- Handle is_read boolean -> read_at timestamptz conversion safely
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'is_read'
  ) THEN
    -- If read_at doesn't exist yet, add it
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'read_at'
    ) THEN
      ALTER TABLE public.notifications ADD COLUMN read_at timestamptz;
      UPDATE public.notifications SET read_at = now() WHERE is_read = true;
    END IF;
    ALTER TABLE public.notifications DROP COLUMN is_read;
  END IF;
END $$;

-- Enable RLS and policies
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
CREATE POLICY "notifications_select_own" ON public.notifications
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
CREATE POLICY "notifications_update_own" ON public.notifications
FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_insert_all" ON public.notifications;
CREATE POLICY "notifications_insert_all" ON public.notifications
FOR INSERT TO authenticated
WITH CHECK (true);
