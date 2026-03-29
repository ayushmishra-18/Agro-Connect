-- Agro-Connect Database Initialization Script
-- Use this file to scaffold an empty Supabase project to run Agro-Connect locally.

-- ==========================================
-- 1. ENABLE EXTENSIONS
-- ==========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 2. CREATE CORE TABLES
-- ==========================================

-- Crops (Master Table)
CREATE TABLE public.c_crops (
    crop_id SERIAL PRIMARY KEY,
    crop_name_en VARCHAR(100) NOT NULL UNIQUE,
    name_localization JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Mandis (Master Table)
CREATE TABLE public.c_mandis (
    mandi_id SERIAL PRIMARY KEY,
    mandi_name VARCHAR(200) NOT NULL,
    state_code VARCHAR(2) NOT NULL,
    district_name VARCHAR(100),
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users (Mirrors auth.users)
CREATE TABLE public.u_users (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20) UNIQUE,
    user_type VARCHAR(20) CHECK (user_type IN ('FARMER', 'BUYER', 'ADMIN')),
    current_language_code VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Farmer Profiles
CREATE TABLE public.u_farmer_profile (
    user_id UUID REFERENCES public.u_users(user_id) ON DELETE CASCADE PRIMARY KEY,
    primary_location_lat DOUBLE PRECISION,
    primary_location_lon DOUBLE PRECISION,
    farm_size_acres DOUBLE PRECISION
);

-- Buyer Profiles
CREATE TABLE public.u_buyer_profile (
    user_id UUID REFERENCES public.u_users(user_id) ON DELETE CASCADE PRIMARY KEY,
    primary_location_lat DOUBLE PRECISION,
    primary_location_lon DOUBLE PRECISION,
    company_name VARCHAR(200)
);

-- Advisories (Farming Tips)
CREATE TABLE public.a_advisories (
    advisory_id SERIAL PRIMARY KEY,
    advisory_type VARCHAR(50) NOT NULL,
    crop_id INT REFERENCES public.c_crops(crop_id) ON DELETE CASCADE,
    state_scope VARCHAR(50),
    title_en VARCHAR(255) NOT NULL,
    content_en TEXT NOT NULL,
    urgency VARCHAR(20) DEFAULT 'NORMAL',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Marketplace Listings
CREATE TABLE public.m_listings (
    listing_id BIGSERIAL PRIMARY KEY,
    seller_user_id UUID REFERENCES public.u_users(user_id) ON DELETE CASCADE NOT NULL,
    item_type VARCHAR(50) DEFAULT 'CROP',
    crop_id INT REFERENCES public.c_crops(crop_id) ON DELETE CASCADE,
    quantity DOUBLE PRECISION NOT NULL CHECK (quantity > 0),
    unit_of_measure VARCHAR(20) DEFAULT 'Quintal',
    listed_price DOUBLE PRECISION NOT NULL CHECK (listed_price >= 0),
    listing_status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (listing_status IN ('ACTIVE', 'SOLD', 'CANCELLED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Marketplace Shopping Cart
CREATE TABLE public.m_cart_items (
    cart_id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES public.u_users(user_id) ON DELETE CASCADE NOT NULL,
    listing_id BIGINT REFERENCES public.m_listings(listing_id) ON DELETE CASCADE NOT NULL,
    quantity DOUBLE PRECISION NOT NULL CHECK (quantity > 0),
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, listing_id)
);

-- Marketplace Orders
CREATE TABLE public.m_orders (
    order_id BIGSERIAL PRIMARY KEY,
    buyer_user_id UUID REFERENCES public.u_users(user_id) ON DELETE CASCADE NOT NULL,
    total_amount DOUBLE PRECISION NOT NULL CHECK (total_amount >= 0),
    payment_status VARCHAR(50) DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'COMPLETED', 'FAILED', 'ESCROW')),
    order_status VARCHAR(50) DEFAULT 'PLACED',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Environmental Variables (ML Inputs)
-- Daily Prices
CREATE TABLE public.p_daily_market_prices (
    price_id SERIAL PRIMARY KEY,
    crop_id INT REFERENCES public.c_crops(crop_id) ON DELETE CASCADE NOT NULL,
    mandi_id INT REFERENCES public.c_mandis(mandi_id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    price_per_quintal DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(crop_id, mandi_id, date)
);

-- ML Predictions
CREATE TABLE public.p_prediction_outputs (
    prediction_id BIGSERIAL PRIMARY KEY,
    crop_id INT REFERENCES public.c_crops(crop_id) ON DELETE CASCADE NOT NULL,
    mandi_id INT REFERENCES public.c_mandis(mandi_id) ON DELETE CASCADE NOT NULL,
    forecast_date DATE NOT NULL,
    predicted_price DOUBLE PRECISION NOT NULL,
    confidence_score DOUBLE PRECISION,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(crop_id, mandi_id, forecast_date)
);

-- ==========================================
-- 3. ENABLE ROW LEVEL SECURITY (RLS)
-- ==========================================
ALTER TABLE public.c_crops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.c_mandis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.u_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.m_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.p_prediction_outputs ENABLE ROW LEVEL SECURITY;

-- Crops & Mandis: Read-only for everyone
CREATE POLICY "Public Read Access" ON public.c_crops FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON public.c_mandis FOR SELECT USING (true);

-- Profiles: Authenticated users can read all, but only edit their own
CREATE POLICY "Users can view all profiles" ON public.u_users FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can update own profile" ON public.u_users FOR UPDATE USING (auth.uid() = user_id);

-- Listings: Public read, Authenticated Edit own
CREATE POLICY "Listings are viewable by everyone" ON public.m_listings FOR SELECT USING (true);
CREATE POLICY "Users can insert their own listings" ON public.m_listings FOR INSERT WITH CHECK (auth.uid() = seller_user_id);
CREATE POLICY "Users can update their own listings" ON public.m_listings FOR UPDATE USING (auth.uid() = seller_user_id);

-- Predictions: Service-Role Only Inserts (Hardened)
CREATE POLICY "Public Read Access" ON public.p_prediction_outputs FOR SELECT USING (true);
-- No INSERT policy provided; relies on Supabase Service Role (backend Edge Functions) bypassing RLS.

-- ==========================================
-- 4. TRIGGERS (Auto-Profile Generation)
-- ==========================================
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.u_users (user_id, first_name, last_name, phone_number, user_type)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'first_name', 
    new.raw_user_meta_data->>'last_name', 
    NULLIF(new.raw_user_meta_data->>'phone_number', ''),
    NULLIF(new.raw_user_meta_data->>'user_type', '')
  );

  IF new.raw_user_meta_data->>'user_type' = 'FARMER' THEN
      INSERT INTO public.u_farmer_profile (user_id, primary_location_lat, primary_location_lon)
      VALUES (
          new.id,
          CAST(NULLIF(new.raw_user_meta_data->>'lat', '') AS DOUBLE PRECISION),
          CAST(NULLIF(new.raw_user_meta_data->>'lon', '') AS DOUBLE PRECISION)
      );
  ELSIF new.raw_user_meta_data->>'user_type' = 'BUYER' THEN
      INSERT INTO public.u_buyer_profile (user_id, primary_location_lat, primary_location_lon)
      VALUES (
          new.id,
          CAST(NULLIF(new.raw_user_meta_data->>'lat', '') AS DOUBLE PRECISION),
          CAST(NULLIF(new.raw_user_meta_data->>'lon', '') AS DOUBLE PRECISION)
      );
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
