"""
APIx Backend - FastAPI Service
SIH 2026 PS 26056 - Real-Time Airfare Price Index Prototype

Endpoints:
- GET /api/health
- GET /api/index/daily
- GET /api/index/route/{origin}/{dest}
- GET /api/forecast/{origin}/{dest}
- GET /api/routes
- GET /api/routes/detailed (Role-gated NSO / RBI institutional feed)
- GET /api/alerts
- GET /api/events
- GET /api/compliance
- POST /api/scraper/trigger
"""

from fastapi import FastAPI, HTTPException, Header, Query, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any, Optional
import os

from database import init_db, get_all_fares, get_event_tags, append_fare_records
from index_engine import APIxEngine, DGCA_RAW_WEIGHTS, NORMALIZED_WEIGHTS
from apix_scraper import get_compliance_status_report, run_multiwindow_scrape_cycle

app = FastAPI(
    title="APIx — Real-Time Airfare Price Index API",
    description="Statistical Real-Time Airfare Price Index API for NSO / RBI / Ministry of Civil Aviation (SIH 2026 PS 26056). Powered by DGCA passenger traffic weighting, Laspeyres index methodology, and lightweight statistical forecasting.",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_engine() -> APIxEngine:
    init_db()
    records = get_all_fares()
    events = get_event_tags()
    return APIxEngine(records, events)


@app.on_event("startup")
def on_startup():
    init_db()


@app.get("/api/health", tags=["Health"])
def health_check():
    return {
        "status": "ok",
        "service": "APIx Statistical Index Service",
        "version": "1.0.0",
        "sih_problem_statement": "PS 26056 - Real-Time Airfare Price Index"
    }


@app.get("/api/index/daily", tags=["Index Series"])
def get_daily_index():
    """Returns the full APIx Laspeyres daily time series with event tag annotations."""
    engine = get_engine()
    return engine.get_daily_index()


@app.get("/api/index/weekly", tags=["Index Series"])
def get_weekly_index():
    """Returns weekly rolled-up APIx Laspeyres index series with period averages and changes."""
    engine = get_engine()
    return engine.get_weekly_index()


@app.get("/api/index/monthly", tags=["Index Series"])
def get_monthly_index():
    """Returns monthly rolled-up APIx Laspeyres index series with monthly averages."""
    engine = get_engine()
    return engine.get_monthly_index()


@app.get("/api/index/route/{origin}/{dest}", tags=["Route Intelligence"])
def get_route_detail(origin: str, dest: str):
    """Returns specific route's fare history, cost breakdown, surge anomalies (>15%), and trend indicator."""
    engine = get_engine()
    analysis = engine.get_route_analysis(origin, dest)
    if not analysis:
        raise HTTPException(
            status_code=404,
            detail=f"Route {origin.upper()}-{dest.upper()} not found in the pilot basket."
        )
    return analysis


@app.get("/api/forecast/{origin}/{dest}", tags=["Statistical Forecasting"])
def get_route_forecast(origin: str, dest: str):
    """Lightweight statistical forecasting (Exponential Smoothing & Linear Trend) for T+1, T+3, T+7 days."""
    engine = get_engine()
    forecast = engine.get_route_forecast(origin, dest)
    if not forecast:
        raise HTTPException(
            status_code=404,
            detail=f"Route {origin.upper()}-{dest.upper()} not found for forecasting."
        )
    return forecast


@app.get("/api/routes", tags=["Route Basket"])
def get_routes_basket():
    """Returns the 6-route pilot basket with DGCA traffic-share percentages, normalized weights, and summary."""
    engine = get_engine()
    return engine.get_all_routes_summary()


@app.get("/api/routes/detailed", tags=["Institutional NSO/RBI"])
def get_routes_detailed(
    x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
    authorization: Optional[str] = Header(None, alias="Authorization"),
    api_key: Optional[str] = Query(None)
):
    """
    Role-gated NSO / RBI institutional endpoint providing full granular tick records and historical observations.
    Requires institutional API key (Demo: NSO_RBI_SECURE_KEY_2026).
    """
    token = x_api_key or authorization or api_key
    if token not in ["NSO_RBI_SECURE_KEY_2026", "Bearer NSO_RBI_SECURE_KEY_2026"]:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Institutional access required. Provide valid X-API-Key header (Demo: NSO_RBI_SECURE_KEY_2026)."
        )

    engine = get_engine()
    routes = engine.get_all_routes_summary()
    records = get_all_fares()
    return {
        "access_tier": "INSTITUTIONAL_NSO_RBI",
        "timestamp": records[-1]["scraped_at"] if records else None,
        "total_observations": len(records),
        "basket_weights_source": "DGCA Domestic City-Pair Traffic Statistics",
        "routes": routes,
        "raw_records": records
    }


@app.get("/api/alerts", tags=["Anomaly Detection"])
def get_active_alerts():
    """Returns any route currently flagged is_anomaly=true (>15% above rolling average)."""
    engine = get_engine()
    return engine.get_active_alerts()


@app.get("/api/events", tags=["Economic Events"])
def get_events():
    """Returns aviation and economic event tags (fuel revisions, holiday surges, weather shocks)."""
    return get_event_tags()


@app.get("/api/compliance", tags=["Scraper & Compliance"])
def get_compliance():
    """Returns source compliance registry, robots.txt status, and rate-limiting rules."""
    return get_compliance_status_report()


@app.post("/api/scraper/trigger", tags=["Scraper & Compliance"])
def trigger_scrape():
    """Triggers an automated multi-window scraping cycle."""
    new_records = run_multiwindow_scrape_cycle()
    append_fare_records(new_records)
    return {
        "status": "SCRAPE_COMPLETED",
        "records_collected": len(new_records),
        "sources_attempted": ["EaseMyTrip"],
        "sources_blocked_compliant": ["IndiGo", "Air India", "Ixigo", "Cleartrip", "Goibibo"],
        "sources_pending_implementation": ["Akasa Air", "SpiceJet", "MakeMyTrip"]
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
