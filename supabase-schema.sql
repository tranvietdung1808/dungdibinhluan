-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username text UNIQUE,
  avatar_url text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create guides table
CREATE TABLE IF NOT EXISTS public.guides (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  content text NOT NULL,
  thumbnail_url text,
  tags text[] DEFAULT '{}',
  author_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.guides
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS profiles_username_idx ON public.profiles(username);
CREATE INDEX IF NOT EXISTS guides_slug_idx ON public.guides(slug);
CREATE INDEX IF NOT EXISTS guides_author_id_idx ON public.guides(author_id);
CREATE INDEX IF NOT EXISTS guides_created_at_idx ON public.guides(created_at DESC);

-- Set up Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guides ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Guides policies
CREATE POLICY "Anyone can view published guides" ON public.guides FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create guides" ON public.guides FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authors can update own guides" ON public.guides FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Authors can delete own guides" ON public.guides FOR DELETE USING (auth.uid() = author_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER handle_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_guides_updated_at
  BEFORE UPDATE ON public.guides
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create function to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (new.id, new.raw_user_meta_data->>'username');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create mods table
CREATE TABLE IF NOT EXISTS public.mods (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  author text NOT NULL,
  category text DEFAULT 'Faces',
  version text NOT NULL,
  updated_at text NOT NULL,
  description text,
  long_description text,
  thumbnail text,
  download_url text,
  tags text[] DEFAULT '{}',
  thumbnail_orientation text DEFAULT 'portrait',
  featured boolean DEFAULT false,
  video_id text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for mods table
CREATE INDEX IF NOT EXISTS mods_slug_idx ON public.mods(slug);
CREATE INDEX IF NOT EXISTS mods_category_idx ON public.mods(category);
CREATE INDEX IF NOT EXISTS mods_featured_idx ON public.mods(featured);
CREATE INDEX IF NOT EXISTS mods_created_at_idx ON public.mods(created_at DESC);

-- Enable RLS for mods table
ALTER TABLE public.mods ENABLE ROW LEVEL SECURITY;

-- Mods policies (service role bypasses RLS, so these are for anon/authenticated access)
CREATE POLICY "Anyone can view mods" ON public.mods FOR SELECT USING (true);
CREATE POLICY "Service role can manage mods" ON public.mods FOR ALL USING (true);

CREATE TABLE IF NOT EXISTS public.community_comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  scope_type text NOT NULL CHECK (scope_type IN ('guide', 'mods')),
  scope_id text NOT NULL,
  parent_id uuid REFERENCES public.community_comments(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name text NOT NULL,
  author_avatar text,
  content text NOT NULL,
  is_admin_comment boolean NOT NULL DEFAULT false,
  is_pinned boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.community_comments
  ADD COLUMN IF NOT EXISTS is_admin_comment boolean NOT NULL DEFAULT false;
ALTER TABLE public.community_comments
  ADD COLUMN IF NOT EXISTS is_pinned boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS community_comments_scope_idx
  ON public.community_comments(scope_type, scope_id, created_at DESC);
CREATE INDEX IF NOT EXISTS community_comments_status_idx
  ON public.community_comments(status, created_at DESC);
CREATE INDEX IF NOT EXISTS community_comments_parent_idx
  ON public.community_comments(parent_id);

ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved comments are visible to everyone"
  ON public.community_comments
  FOR SELECT
  USING (status = 'approved' OR auth.uid() = user_id);

CREATE POLICY "Authenticated users can submit comments"
  ON public.community_comments
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

CREATE TRIGGER handle_community_comments_updated_at
  BEFORE UPDATE ON public.community_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- User Roles table – flexible role system
-- Supports: admin, vip, moderator, or any custom role
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'user',
  note text,  -- optional note, e.g. "VIP đến 2026-12-31"
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(email, role)  -- one user can have multiple roles, but no duplicates
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS user_roles_email_idx ON public.user_roles(email);
CREATE INDEX IF NOT EXISTS user_roles_role_idx ON public.user_roles(role);
CREATE INDEX IF NOT EXISTS user_roles_email_role_idx ON public.user_roles(email, role);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Only service_role can read/write (admin operations only)
CREATE POLICY "Service role full access" ON public.user_roles FOR ALL USING (true);

-- Auto-update updated_at
CREATE TRIGGER handle_user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
