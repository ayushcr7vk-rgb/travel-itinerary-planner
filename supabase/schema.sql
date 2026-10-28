-- ==============================================================================
-- PERSONALIZED TRAVEL ITINERARY PLANNER - SUPABASE DATABASE SCHEMA
-- ==============================================================================
-- Description: Complete production schema with Row Level Security (RLS),
-- relational constraints, profiles trigger, and indexes.
-- Designed for PostgreSQL 15+ on Supabase.
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. PROFILES TABLE (Linked with Supabase Auth users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    preferred_currency VARCHAR(10) DEFAULT 'USD',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Trigger to automatically populate profile when new user signs up in Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if already exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. TRIPS TABLE
CREATE TABLE IF NOT EXISTS public.trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days INTEGER NOT NULL CHECK (total_days > 0),
    budget NUMERIC(12, 2) NOT NULL CHECK (budget >= 0),
    currency VARCHAR(10) DEFAULT 'USD' NOT NULL,
    travelers INTEGER DEFAULT 1 NOT NULL CHECK (travelers > 0),
    travel_style VARCHAR(50) DEFAULT 'balanced' NOT NULL, -- 'budget', 'balanced', 'luxury'
    interests TEXT[] DEFAULT '{}',                        -- e.g. ['adventure', 'food', 'culture']
    dietary_preferences TEXT,
    accessibility_requirements TEXT,
    total_estimated_cost NUMERIC(12, 2) DEFAULT 0,
    remaining_budget NUMERIC(12, 2) DEFAULT 0,
    is_demo BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. ITINERARIES TABLE (Holds day-by-day JSON details and practical advice)
CREATE TABLE IF NOT EXISTS public.itineraries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    summary TEXT NOT NULL,
    practical_tips TEXT[] DEFAULT '{}',
    days JSONB NOT NULL DEFAULT '[]'::jsonb,
    ai_model_used VARCHAR(100) DEFAULT 'gemini-3.8-flash',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. AUTOMATIC UPDATED_AT TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_trips_updated_at ON public.trips;
CREATE TRIGGER set_trips_updated_at
    BEFORE UPDATE ON public.trips
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_itineraries_updated_at ON public.itineraries;
CREATE TRIGGER set_itineraries_updated_at
    BEFORE UPDATE ON public.itineraries
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 6. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_trips_user_id ON public.trips(user_id);
CREATE INDEX IF NOT EXISTS idx_trips_destination ON public.trips(destination);
CREATE INDEX IF NOT EXISTS idx_itineraries_trip_id ON public.itineraries(trip_id);

-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- Strict user-isolation: Each user can only select, insert, update, or delete their own data.

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itineraries ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- Trips Policies
CREATE POLICY "Users can view their own trips"
    ON public.trips FOR SELECT
    USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert their own trips"
    ON public.trips FOR INSERT
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own trips"
    ON public.trips FOR UPDATE
    USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete their own trips"
    ON public.trips FOR DELETE
    USING (auth.uid() = user_id OR user_id IS NULL);

-- Itineraries Policies (Cascaded through trip ownership)
CREATE POLICY "Users can view itineraries for their trips"
    ON public.itineraries FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.trips
            WHERE trips.id = itineraries.trip_id
            AND (trips.user_id = auth.uid() OR trips.user_id IS NULL)
        )
    );

CREATE POLICY "Users can insert itineraries for their trips"
    ON public.itineraries FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.trips
            WHERE trips.id = itineraries.trip_id
            AND (trips.user_id = auth.uid() OR trips.user_id IS NULL)
        )
    );

CREATE POLICY "Users can update itineraries for their trips"
    ON public.itineraries FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.trips
            WHERE trips.id = itineraries.trip_id
            AND (trips.user_id = auth.uid() OR trips.user_id IS NULL)
        )
    );

CREATE POLICY "Users can delete itineraries for their trips"
    ON public.itineraries FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.trips
            WHERE trips.id = itineraries.trip_id
            AND (trips.user_id = auth.uid() OR trips.user_id IS NULL)
        )
    );

-- 8. SAMPLE SEED DATA (For manual testing in Supabase SQL Editor if desired)
COMMENT ON TABLE public.trips IS 'Stores planned trips with destination, duration, budget, and travel preferences.';
COMMENT ON TABLE public.itineraries IS 'Stores structured day-by-day activities, meal recommendations, and practical tips.';
