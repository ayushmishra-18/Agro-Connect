# 🌱 Agro-Connect (V1)

**Agro-Connect** is a comprehensive, production-ready Agritech platform engineered to bridge the digital divide for rural farmers. Featuring an **Offline-First Android App** and a glassmorphic **Next.js Web Dashboard**, the ecosystem empowers agricultural communities with localized, ML-driven price forecasting, marketplace access to buyers, integrated OSMMaps, and highly scalable offline caching.

---

## 🚀 Key Features

### 🛒 1. Peer-to-Peer Marketplace
Farmers and buyers can connect directly using the integrated marketplace. Contains dynamic escrow status monitoring, a robust shopping cart, and offline-compatible payment confirmation flows.

### 📈 2. AI 7-Day Price Predictions (PFE)
Supabase Edge Functions process daily crop variables, running an internal ML pipeline to project 7-day crop price forecasts (`p_prediction_outputs`) directly onto interactive `recharts` overlays and mobile grids. Includes "confidence scores" and calculated ideal "sell windows".

### 📶 3. Absolute Offline-First Experience (Room DB)
Rural 2G endpoints shouldn't handicap farmers. The Android Mobile architecture heavily caches Marketplace listings, Mandi coordinates, Advisories, and 7-day weather predictions into a local **SQLite Room Database**.
- `SyncWorker` powered by **WorkManager** quietly synchronizes background data states to Supabase every 12 hours.

### 🗺️ 4. Local Mandi GPS Mapping
Users can visually browse surrounding crop markets. Uses **OSMDroid** native mapping components embedded directly into Android, calculating Euclidean and navigational paths without relying on Google Maps API keys.

### 🌍 5. Deep Multi-Lingual Integration (i18n)
Both Web and Mobile platforms natively support English (`en`), Hindi (`hi`), and Marathi (`mr`). Powered by `react-i18next` for seamless client-side hydration without Next.js mismatch errors, and localized Android String resources.

---

## 🛠️ Technology Stack

### 📱 Full-Stack Architecture
- **Web Frontend**: React, Next.js (App Router), Lucide Icons, `react-i18next`, Recharts.
- **Mobile Client**: Kotlin, Jetpack Compose, Navigation-Compose, Room (SQLite), Ktor HTTP, Kotlinx-Serialization.
- **Backend Infrastructure**: Supabase (PostgreSQL), GoTrue Auth, Edge Functions (Deno).

### 🛡️ Security & Accessibility Compliance (WCAG AA)
Agro-Connect adheres to top-tier enterprise compliance metrics.
- **A11y Validated**: Dynamic regex-inserted `contentDescription` properties across all Jetpack Compose icons to fully support TalkBack. Material Design enforces minimum 48x48dp touch targets. Web boundaries utilize strict explicit `<label htmlFor="...">` and `aria-label` tags.
- **Network Defense**: Next.js Edge APIs intercept traffic to apply fixed-window Rate Limiting & injection-blocking `Content-Security-Policy` headers.
- **Database Hardening (RLS)**: Row-Level Security policies strictly enforce identity ownership. Predictive ML schemas prohibit unprotected `WITH CHECK (true)` vectors, offloading insertions securely to internal Service Roles. 

---

## 📦 Getting Started

### 1. Web Dashboard (Next.js)

```bash
# Navigate to the dashboard directory
cd web-dashboard

# Install dependencies (Node 18+ required)
npm install

# Configure environment keys (.env.local)
# NEXT_PUBLIC_SUPABASE_URL="..."
# NEXT_PUBLIC_SUPABASE_ANON_KEY="..."

# Boot the local development server (starts on port 3000)
npm run dev
```

### 2. Android Client (Kotlin)

1. Open the `./mobile-android/` directory inside **Android Studio**.
2. Allow Gradle to sync dependencies (Ensure SDK 34 is active).
3. Connect an Active Device or load an AVD Emulator.
4. Run `assembleDebug` to compile. 

> **Environment Constants:** The Supabase endpoints and Anon Keys are packaged directly into `build.gradle.kts` via `buildConfigField`. Keep local `.properties` synchronized if cloning into a new tenant.

---

## 📋 Database Schema Context
- `u_users` (UUID auth.users relational mapping)
- `u_farmer_profile` & `u_buyer_profile` (Identity & Telemetry data)
- `c_crops` & `c_mandis` (Foundational master records)
- `m_listings`, `m_cart_items`, `m_orders` (Escrow/Payment structure)
- `e_weather_data` & `e_fuel_prices` (Exogenous environmental variables)
- `p_daily_market_prices` & `p_prediction_outputs` (ML Data Ingestion pipelines)

---

## 🤝 Contributing
For feature additions, target branches using a standardized `feature/` taxonomy. Please consult the `/docs/` and `agro_connect_all_documentation.md` prior to executing significant architecture forks (especially regarding offline replication).
