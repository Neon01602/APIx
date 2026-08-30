# APIx — Real-Time Airfare Price Index Prototype
**Smart India Hackathon (SIH 2026) | Problem Statement: PS 26056**

> **APIx** is a real-time domestic airfare index and analytics engine built to provide sovereign transparency into airfare pricing across India's highest-density aviation corridors. Utilizing DGCA-weighted Laspeyres price index methodology, automated data cleaning, multi-window advance purchase tracking, and ethical scraping pipelines, APIx bridges the gap between raw flight volatility and macro economic intelligence.

---

## 1. System Architecture

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DATA INGESTION                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│  • EaseMyTrip Live Scraper (FareCalendar API, 3x Exponential Backoff)        │
│  • 8-Source robots.txt Compliance Registry (Audited & Disallow-Honored)     │
│  • Multi-Window Advance Purchase Tracking (T+1, T+7, T+15, T+30, T+45)       │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DATA CLEANING PIPELINE                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  • Deduplication: (source, origin, dest, travel_date, advance_days)         │
│  • Statistical Outlier Filter: Z-Score (|Z| > 3.0) & IQR Truncation          │
│  • Component Separation: Base Fare (82-88%) + Taxes/UDF/PSF/GST (12-18%)    │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            PERSISTENCE LAYER                                │
├─────────────────────────────────────────────────────────────────────────────┤
│  • SQLite Engine (PostgreSQL-compatible DDL schema)                          │
│  • Tables: `fares` (with indices & status tags), `event_tags`               │
│  • Granular Audit Status: LIVE_SCRAPED / SIMULATED_BACKTEST / REJECTED_OUTLIER│
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       APIx INDEX & FORECAST ENGINE                           │
├─────────────────────────────────────────────────────────────────────────────┤
│  • Laspeyres Index Engine: Σ [ w_i * (P_i,t / P_i,0) ] * 100               │
│  • DGCA Traffic-Share Normalization (Top 6 Metro Corridors = 14.89% share)  │
│  • Multi-Frequency Aggregations: Daily (Real-Time), Weekly & Monthly Rollup │
│  • Surge Anomaly Detection (>15% above 7-day rolling baseline)               │
│  • Statistical Forecasting (Holt's Exponential Smoothing + Linear Trend)    │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       INTERFACE & CONSUMPTION LAYER                         │
├─────────────────────────────────────────────────────────────────────────────┤
│  • FastAPI Backend (/api/index/*, /api/routes/*, /api/forecast/*)            │
│  • Full-Stack Node/Express API Proxy & Static Delivery                      │
│  • React + Tailwind + Recharts Operational Dashboard                        │
│  • Institutional NSO/RBI Data Export & Robots.txt Compliance Inspector       │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Key Components & Features

1. **Laspeyres Index Formulation**:
   $$\text{APIx}_t = \sum_{i=1}^{n} w_i \cdot \left(\frac{P_{i,t}}{P_{i,0}}\right) \times 100$$
   Base period index is set to $100.0$ ($P_0$ established on 2026-08-01).

2. **DGCA Top-6 Route Basket (Normalized)**:
   - `DEL-BOM` (4.14% raw $\rightarrow$ **27.80%** normalized)
   - `BLR-DEL` (2.83% raw $\rightarrow$ **19.01%** normalized)
   - `BLR-BOM` (2.49% raw $\rightarrow$ **16.72%** normalized)
   - `DEL-HYD` (1.99% raw $\rightarrow$ **13.36%** normalized)
   - `DEL-PNQ` (1.77% raw $\rightarrow$ **11.89%** normalized)
   - `DEL-CCU` (1.67% raw $\rightarrow$ **11.22%** normalized)

3. **Multi-Window Advance Purchase Tracking**:
   Captures dynamic pricing behaviors at $T+1$ (Immediate), $T+7$ (Near-Term), $T+15$ (Standard), $T+30$ (Early Bird), and $T+45$ (Advance).

4. **Multi-Frequency Aggregations**:
   - **Daily (Real-Time)**: High-resolution daily Laspeyres index with annotated economic event overlays (e.g., ATF fuel revisions, Independence Day rush, Raksha Bandhan).
   - **Weekly Rollups**: ISO calendar-week averages ($W_{31}, W_{32}, \dots$) for trend analysis.
   - **Monthly Rollups**: Monthly consolidated indices for macro-economic inflation indicators (NSO/RBI alignment).

5. **Empirical Validation**:
   Includes `backtest_validation.py` comparing the 30-day backtest series against DGCA's empirical $+20.5\%$ peak seasonal surge figure with Pearson correlation ($r > 0.90$) and directional concordance metrics.

---

## 3. Quickstart & Execution

### Prerequisites
- Python 3.10+
- Node.js 18+

### Setup & Database Seeding

```bash
# 1. Generate 30-day cleaned pilot dataset and initialize SQLite DB
python3 -c "import apix_scraper, database; apix_scraper.generate_pilot_dataset_csv(); database.init_db(force_reseed=True)"

# 2. Run the test suite (Index engine + Data cleaning tests)
python3 -m unittest test_data_cleaning.py test_index_engine.py

# 3. Run the backtest statistical validation script
python3 backtest_validation.py
```

### Launching the Application

```bash
# Start the full-stack server (Dev Mode on port 3000)
npm run dev

# Or run the FastAPI backend directly
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

---

## 4. API Reference

| Method | Endpoint | Description | Access Tier |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | System health check and uptime status | Public |
| `GET` | `/api/index/daily` | 30-day daily Laspeyres index with event annotations | Public |
| `GET` | `/api/index/weekly` | ISO calendar-week rolled-up index averages and changes | Public |
| `GET` | `/api/index/monthly` | Monthly rolled-up index averages and changes | Public |
| `GET` | `/api/index/route/{origin}/{dest}` | Route-specific fare history, cost breakdown, and surge anomalies | Public |
| `GET` | `/api/forecast/{origin}/{dest}` | 1, 3, and 7-day statistical fare forecasts with confidence bounds | Public |
| `GET` | `/api/routes` | Summary metrics for all 6 routes in the DGCA basket | Public |
| `GET` | `/api/routes/detailed` | Full granular observation data with DGCA weights and metadata | Institutional (NSO/RBI) |
| `GET` | `/api/alerts` | Active high-surge alerts (>15% above 7-day rolling average) | Public |
| `GET` | `/api/events` | Calendar of macroeconomic and festive event tags | Public |
| `GET` | `/api/compliance` | 8-source robots.txt audit and scraping compliance registry | Public |
| `POST` | `/api/scraper/trigger` | Triggers active live scrapers (EaseMyTrip) with retry fallback | Admin / Operational |

---

## 5. Compliance & Ethical Scraping Summary

APIx enforces strict compliance with provider Terms of Service and `robots.txt` guidelines:

| Source | Target | Robots.txt Status | Prototype Implementation Status |
| :--- | :--- | :--- | :--- |
| **EaseMyTrip** | FareCalendar API | **Allowed** (`/` permitted) | **Active & Live** (with 3-attempt exponential backoff) |
| **Akasa Air** | Public Flight Schedule | **Audited** (rate-limited) | Registry Audited (Roadmap Phase 2) |
| **SpiceJet** | Booking Calendar API | **Audited** (rate-limited) | Registry Audited (Roadmap Phase 2) |
| **MakeMyTrip** | Search API | **Restricted / Blocked** | Blocked per robots.txt policy |
| **IndiGo** | Booking Engine | **Disallowed** (`Disallow: /flight-search/`) | Strictly Blocked / Honor ToS |
| **Air India** | Booking Engine | **Disallowed** (`Disallow: /search/`) | Strictly Blocked / Honor ToS |
| **Ixigo** | Search Engine | **Disallowed** (`Disallow: /flights/search/`) | Strictly Blocked / Honor ToS |
| **Cleartrip** | Search Engine | **Disallowed** (`Disallow: /flights/results/`) | Strictly Blocked / Honor ToS |
| **Goibibo** | Search Engine | **Disallowed** (`Disallow: /flights/`) | Strictly Blocked / Honor ToS |

---

## 6. Honest Prototype Limitations & Roadmap

### What is Fully Implemented & Working:
- ✅ **Live EaseMyTrip Scraper**: Real HTTP requests with 3-attempt exponential backoff and error recovery.
- ✅ **Data Cleaning Pipeline**: Automated deduplication, Z-score/IQR anomaly filtering, and Base Fare / Taxes breakdown separation.
- ✅ **Mathematical Laspeyres Engine**: DGCA-weighted formula with base period $P_0=100.0$.
- ✅ **Multi-Frequency Aggregation**: Real-time Daily, Weekly, and Monthly rollups.
- ✅ **Statistical Forecasting**: Trend projection with upper and lower prediction intervals.
- ✅ **Interactive Web UI**: Responsive React + Tailwind + Recharts dashboard with modal inspectors and frequency toggles.

### What is Simulated / Staged in Prototype:
- 🟡 **30-Day Time Series**: 30-day historical window generated as `SIMULATED_BACKTEST` data calibrated to August 2026 economic events (ATF fuel adjustments, Independence Day surge, Raksha Bandhan surge) to simulate longitudinal tracking until live collection runs continuously.
- 🟡 **Database**: Runs locally on SQLite (with fully PostgreSQL-compatible schema and syntax).

### Future Roadmap:
- 🚀 Official Direct Airline API Integrations (DGCA Sovereign Data Exchange).
- 🚀 Distributed Celery / Redis Scraper Task Workers.
- 🚀 Seasonal Machine Learning / LSTM Neural Forecasting.

---

## 7. Credits & Acknowledgements

- **Competition**: Smart India Hackathon (SIH 2026)
- **Problem Statement**: PS 26056 — Real-Time Airfare Price Index (APIx)
- **Domain**: Ministry of Civil Aviation / National Statistical Office (NSO) / DGCA
