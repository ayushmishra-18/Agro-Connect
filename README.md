# 🌱 Agro-Connect (V1)

[![Platform](https://img.shields.io/badge/Platform-Android%20%7C%20Web-2e7d32?style=for-the-badge)](https://github.com/ayushmishra-18/Agro-Connect)
[![Tech Stack](https://img.shields.io/badge/Stack-Kotlin%20%7C%20Next.js%20%7C%20Supabase-1b5e20?style=for-the-badge)](https://github.com/ayushmishra-18/Agro-Connect)
[![Status](https://img.shields.io/badge/Status-In%20Development-ffc107?style=for-the-badge)](https://github.com/ayushmishra-18/Agro-Connect)

**Agro-Connect** is a professional-grade Agritech platform engineered to bridge the digital divide for rural farmers in India. By combining a **high-performance, offline-first Android application** with a **glassmorphic Next.js web dashboard**, the ecosystem provides localized, ML-driven price forecasting, peer-to-peer marketplace access, integrated mapping, and highly-scalable backend infrastructure.

---

## 🏗️ Visual Architecture

```mermaid
graph TD
    subgraph "Mobile Client (Android Client)"
        Mobile[Kotlin/Compose App]
        RoomDB[Room SQLite Cache]
        WorkManager[SyncWorker]
        OSMDroid[OpenStreetMap]
    end

    subgraph "Web Dashboard (Next.js)"
        Web[Next.js App]
        Recharts[Interactive Predictions]
        i18n[Multi-language (i18next)]
    end

    subgraph "Supabase Backend (SaaS)"
        Auth[GoTrue Auth]
        Postgres[(PostgreSQL + RLS)]
        EdgeFunctions[Deno Edge Functions]
    end

    subgraph "External Data APIs"
        Agmarknet[AGMARKNET Crop Prices]
        MeteoAPI[Open-Meteo Weather]
        GeoAPI[BigDataCloud Geo]
    end

    %% Flow: Ingestion
    Agmarknet --> EdgeFunctions
    MeteoAPI --> EdgeFunctions
    GeoAPI --> EdgeFunctions
    EdgeFunctions --> Postgres

    %% Flow: Serving
    Postgres <--> Mobile
    Postgres <--> Web
    
    %% Flow: Offline-First
    RoomDB <--> Mobile
    WorkManager <--> RoomDB
    WorkManager <--> Postgres

    style RoomDB fill:#2e7d32,stroke:#1b5e20,color:#fff
    style Postgres fill:#004d40,stroke:#00251a,color:#fff
```

---

## 🚀 Key Features

### 📈 1. 7-Day ML Price Predictions
An internal ML pipeline processes daily crop variables to project 7-day crop price forecasts.
- **Deep Mobile Integration**: The `PredictionsScreen` provides dynamic dropdowns for crops and mandis, with location-based auto-selection of the nearest market.
- **Interactive Visuals**: The web dashboard utilizes **Recharts** to render `AreaChart` components for historical price trends.
- **Confidence Scoring**: Includes tiered confidence scores (e.g., 80%+) and identified "Sell Windows" for optimal profitability.

### 📶 2. Absolute Offline-First Engineering
Designed for rural 2G/3G connectivity using standard Android persistence patterns:
- **Room Persistence**: The `AppDatabase` manages entities for `Mandi`, `Advisory`, `Prediction`, and `Weather`.
- **Intelligent Repository**: `AgroRepository` implements a "network-first with local fallback" strategy, ensuring zero downtime.
- **Automatic Sync**: `SyncWorker` (WorkManager) orchestrates invisible data synchronization every 12 hours.

### 🌍 3. Quad-Language Support (i18n)
Full localization parity across **English**, **Hindi**, and **Marathi** to maximize rural adoption.
- **Mobile**: Uses native Android XML resources with a `LocaleHelper` for runtime language switching.
- **Web**: Implements `react-i18next` with a comprehensive 400+ key translation library covering specific agritech jargon.

### 🗺️ 4. Hyper-Local Intelligence
- **Weather Proxy**: A dedicated Edge Function fetches real-time data from **Open-Meteo**, mapping WMO codes to actionable farming advisories (e.g., "Heavy rain detected: delay pesticide spray").
- **Mandi Discovery**: Uses **OSMDroid** for decentralized mapping, calculating Euclidean distances to markets without reliance on proprietary map APIs.

### 🛒 5. Peer-to-Peer Marketplace
A secure transactional layer for crops and equipment:
- **Escrow Logic**: Tables for `m_listings`, `m_cart_items`, and `m_orders` manage the commercial lifecycle.
- **Security**: Hardened via **Row-Level Security (RLS)** explicitly forbidding unauthorized data modifications.

---

## 🛠️ Technology Stack

### **Mobile (Android Client)**
- **UI Framework**: Jetpack Compose (Material 3).
- **Network**: Ktor Client with Kotlinx Serialization.
- **Persistence**: Room Database (SQLite).
- **Async & Scheduling**: Kotlin Coroutines & WorkManager.
- **Dependency Injection**: Manual injection via `AgroRepository` singleton pattern.

### **Web (Dashboard)**
- **Framework**: Next.js 14+ (App Router).
- **Visualization**: Recharts (Dynamic Area/Line Charts).
- **Internationalization**: i18next & react-i18next.
- **Styling**: Vanilla CSS with comprehensive Design Tokens.

### **Backend (Supabase Infrastructure)**
- **Database**: PostgreSQL (Relational) with custom PL/pgSQL triggers for auto-profile generation.
- **Deno Runtime**: Edge Functions handle `weather-proxy`, `sync-market-prices`, and `predict-prices`.
- **Security**: Supabase Auth (GoTrue) integration for identity-scoped data access.

---

## 📦 Getting Started

### Prerequisites
- **Android Studio**: Ladybug, Koala, or newer.
- **Node.js**: v18+ (LTS recommended).
- **Java**: JDK 17+.

### Quick Installation

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/ayushmishra-18/Agro-Connect.git
    cd Agro-Connect
    ```

2.  **Web Dashboard Setup**:
    ```bash
    cd web-dashboard
    npm install
    # Set up .env.local with Supabase URL & Anon Key
    npm run dev
    ```

3.  **Android Client Setup**:
    - Open `mobile-android` in Android Studio.
    - Set `SUPABASE_URL` and `SUPABASE_ANKEY` in your `local.properties` file.
    - Sync Gradle and Run on an emulator or physical device.

---

## 🤝 Contributing
Contributions are welcome! Please follow the `feature/` taxonomy for branches and ensure all code passes Android `lintRelease` and Web ESLint before submitting a PR.

## 📄 License
This project is licensed under the [MIT License](./LICENSE).
