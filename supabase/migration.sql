-- Pro-Audit: Database Schema
-- Run this in Supabase SQL Editor

-- 1. Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT DEFAULT '',
  role TEXT NOT NULL DEFAULT 'auditeur' CHECK (role IN ('auditeur', 'manager', 'admin')),
  avatar_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'auditeur')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS: users can read their own profile, admins can read all
CREATE POLICY "users_read_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "admins_read_all" ON public.profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "users_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- 2. Magasins (stores)
CREATE TABLE IF NOT EXISTS public.magasins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  address TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.magasins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "all_read" ON public.magasins FOR SELECT USING (true);
CREATE POLICY "admin_insert" ON public.magasins FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "admin_update" ON public.magasins FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- 3. Audits
CREATE TABLE IF NOT EXISTS public.audits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL DEFAULT auth.uid(),
  magasin_id UUID REFERENCES public.magasins(id),
  magasin_name TEXT NOT NULL DEFAULT '',
  superviseur TEXT NOT NULL DEFAULT '',
  responsable TEXT DEFAULT '',
  date TEXT NOT NULL DEFAULT '',
  heure TEXT DEFAULT '',
  results JSONB DEFAULT '{}',
  counts JSONB DEFAULT '{"S":0,"M":0,"NS":0,"NA":0}',
  score INTEGER DEFAULT 0,
  custom_items JSONB DEFAULT '{}',
  status TEXT DEFAULT 'final' CHECK (status IN ('draft', 'final')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.audits ENABLE ROW LEVEL SECURITY;

-- Auditors see their own audits; managers/admins see all
CREATE POLICY "audits_select" ON public.audits
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('manager', 'admin'))
  );

CREATE POLICY "audits_insert" ON public.audits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "audits_update" ON public.audits
  FOR UPDATE USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('manager', 'admin'))
  );

CREATE POLICY "audits_delete" ON public.audits
  FOR DELETE USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 4. Corrective Actions
CREATE TABLE IF NOT EXISTS public.corrective_actions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  audit_id UUID REFERENCES public.audits(id) ON DELETE CASCADE,
  zone TEXT NOT NULL DEFAULT '',
  zone_icon TEXT DEFAULT '',
  item_label TEXT NOT NULL DEFAULT '',
  item_cat TEXT DEFAULT '',
  result TEXT NOT NULL DEFAULT '',
  action TEXT DEFAULT '',
  commentaire TEXT DEFAULT '',
  deadline_type TEXT DEFAULT '' CHECK (deadline_type IN ('', 'immediat', 'continu', 'date')),
  deadline DATE,
  assigned_to UUID REFERENCES public.profiles(id),
  status TEXT DEFAULT 'a_faire' CHECK (status IN ('a_faire', 'en_cours', 'termine', 'valide')),
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.corrective_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "actions_select" ON public.corrective_actions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.audits WHERE id = audit_id AND (
      user_id = auth.uid() OR
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('manager', 'admin'))
    ))
  );

CREATE POLICY "actions_insert" ON public.corrective_actions
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.audits WHERE id = audit_id AND user_id = auth.uid())
  );

CREATE POLICY "actions_update" ON public.corrective_actions
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('manager', 'admin'))
  );

-- 5. Audit Trail (journalisation)
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "log_admin_only" ON public.audit_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "log_insert" ON public.audit_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_audits_user_id ON public.audits(user_id);
CREATE INDEX IF NOT EXISTS idx_audits_magasin ON public.audits(magasin_name);
CREATE INDEX IF NOT EXISTS idx_audits_date ON public.audits(date);
CREATE INDEX IF NOT EXISTS idx_actions_audit_id ON public.corrective_actions(audit_id);
CREATE INDEX IF NOT EXISTS idx_actions_assigned ON public.corrective_actions(assigned_to);
CREATE INDEX IF NOT EXISTS idx_actions_status ON public.corrective_actions(status);
CREATE INDEX IF NOT EXISTS idx_log_entity ON public.audit_log(entity_type, entity_id);

-- Insert default magasins
INSERT INTO public.magasins (name) VALUES
  ('Prosuma Plateau'),
  ('Prosuma Marcory'),
  ('Prosuma Yopougon'),
  ('Prosuma Cocody'),
  ('Prosuma Koumassi'),
  ('Prosuma Port Bouet'),
  ('Prosuma Bingerville'),
  ('Prosuma Abobo'),
  ('Prosuma Anyama')
ON CONFLICT (name) DO NOTHING;

-- 6. Add reference column for human-readable IDs
ALTER TABLE public.audits ADD COLUMN IF NOT EXISTS ref TEXT DEFAULT '';
CREATE INDEX IF NOT EXISTS idx_audits_ref ON public.audits(ref);
