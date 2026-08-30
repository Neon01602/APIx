"""
APIx Command-Line Interface & Engine Dispatcher
SIH 2026 PS 26056
Safe CLI entry point to eliminate arbitrary shell execution injection.
"""

import sys
import json
from database import init_db, get_all_fares, get_event_tags, append_fare_records
from index_engine import APIxEngine
from apix_scraper import get_compliance_status_report, run_multiwindow_scrape_cycle


def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No command specified"}))
        sys.exit(1)

    cmd = sys.argv[1]
    init_db()
    records = get_all_fares()
    events = get_event_tags()
    engine = APIxEngine(records, events)

    if cmd == "daily":
        print(json.dumps(engine.get_daily_index()))
    elif cmd == "weekly":
        print(json.dumps(engine.get_weekly_index()))
    elif cmd == "monthly":
        print(json.dumps(engine.get_monthly_index()))
    elif cmd == "routes":
        print(json.dumps(engine.get_all_routes_summary()))
    elif cmd == "routes_detailed":
        # Full granular data for institutional NSO/RBI access
        routes = engine.get_all_routes_summary()
        print(json.dumps({
            "access_tier": "INSTITUTIONAL_NSO_RBI",
            "timestamp": records[-1]["scraped_at"] if records else None,
            "total_observations": len(records),
            "basket_weights_source": "DGCA Domestic City-Pair Traffic Statistics",
            "routes": routes,
            "raw_records": records
        }))
    elif cmd == "alerts":
        print(json.dumps(engine.get_active_alerts()))
    elif cmd == "events":
        print(json.dumps(events))
    elif cmd == "compliance":
        print(json.dumps(get_compliance_status_report()))
    elif cmd == "route_detail":
        if len(sys.argv) < 4:
            print(json.dumps({"error": "Origin and destination required"}))
            sys.exit(1)
        origin = sys.argv[2].strip().upper()
        dest = sys.argv[3].strip().upper()
        res = engine.get_route_analysis(origin, dest)
        print(json.dumps(res))
    elif cmd == "forecast":
        if len(sys.argv) < 4:
            print(json.dumps({"error": "Origin and destination required"}))
            sys.exit(1)
        origin = sys.argv[2].strip().upper()
        dest = sys.argv[3].strip().upper()
        res = engine.get_route_forecast(origin, dest)
        print(json.dumps(res))
    elif cmd == "trigger_scrape":
        new_records = run_multiwindow_scrape_cycle()
        append_fare_records(new_records)
        print(json.dumps({
            "status": "SCRAPE_COMPLETED",
            "records_collected": len(new_records),
            "sources_attempted": ["EaseMyTrip"],
            "sources_blocked_compliant": ["IndiGo", "Air India", "Ixigo", "Cleartrip", "Goibibo"],
            "sources_pending_implementation": ["Akasa Air", "SpiceJet", "MakeMyTrip"]
        }))
    else:
        print(json.dumps({"error": f"Unknown command {cmd}"}))
        sys.exit(1)


if __name__ == "__main__":
    main()
