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
