"""
APIx Index Engine - Laspeyres-Weighted Airfare Price Index & Statistical Forecasting
SIH 2026 PS 26056 Prototype

Methodology:
- Laspeyres Price Index weighted by DGCA domestic passenger traffic share.
- Rule-based Anomaly Detection (>15% above rolling average).
- Lightweight Statistical Forecasting Model (Exponential Smoothing & Linear Trend Regression).
- Multi-Window Advance Purchase Tracking (T+3, T+7, T+15, T+21).
"""

from typing import Dict, List, Tuple, Any, Optional
import math
import datetime

# DGCA raw traffic-share percentages for the 6 pilot routes
DGCA_RAW_WEIGHTS: Dict[str, float] = {
    "DEL-BOM": 4.14,
    "BLR-DEL": 2.83,
    "BLR-BOM": 2.49,
    "DEL-HYD": 1.99,
    "DEL-PNQ": 1.77,
    "DEL-CCU": 1.67,
}

# Normalize weights so they sum to 1.0 for the pilot basket
TOTAL_RAW_WEIGHT: float = sum(DGCA_RAW_WEIGHTS.values())
NORMALIZED_WEIGHTS: Dict[str, float] = {
    route: weight / TOTAL_RAW_WEIGHT
    for route, weight in DGCA_RAW_WEIGHTS.items()
}


def get_route_key(origin: str, destination: str) -> str:
    """Standardize route key format (e.g., 'DEL-BOM')."""
    return f"{origin.strip().upper()}-{destination.strip().upper()}"


def calculate_laspeyres_index(
    current_fares: Dict[str, float],
    base_fares: Dict[str, float],
    weights: Optional[Dict[str, float]] = None,
) -> float:
    """
    Calculate Laspeyres Airfare Price Index for time t:
    APIx(t) = sum(w_i * (P_i,t / P_i,0)) * 100
    """
    if weights is None:
        weights = NORMALIZED_WEIGHTS

    total_index = 0.0
    weight_sum = 0.0

    for route, w in weights.items():
        if route in current_fares and route in base_fares:
            p_0 = base_fares[route]
            p_t = current_fares[route]
            if p_0 > 0:
                rel_price = p_t / p_0
                total_index += w * rel_price
                weight_sum += w

    if weight_sum == 0.0:
        return 100.0

    return (total_index / weight_sum) * 100.0


def calculate_surge_anomaly(current_fare: float, rolling_avg: float, threshold_pct: float = 15.0) -> Tuple[bool, float]:
    """
    Flag whether a fare is an anomaly (> threshold_pct % above rolling average).
    Rule-based statistical thresholding.
    """
    if rolling_avg <= 0:
        return False, 0.0

    pct_diff = ((current_fare - rolling_avg) / rolling_avg) * 100.0
    is_anomaly = pct_diff > threshold_pct
    return is_anomaly, round(pct_diff, 2)


def calculate_trend_indicator(fares_history: List[float]) -> str:
    """
    Compare the two most recent fares and return 'trending_up', 'trending_down', or 'stable'.
    """
    if len(fares_history) < 2:
        return "stable"

    latest = fares_history[-1]
    prev = fares_history[-2]

    if latest > prev:
        return "trending_up"
    elif latest < prev:
        return "trending_down"
    else:
        return "stable"


def calculate_statistical_forecast(fares_history: List[float], horizon_days: List[int] = [1, 3, 7]) -> List[Dict[str, Any]]:
    """
    Lightweight Statistical Forecasting Model:
    Applies Single Exponential Smoothing (alpha=0.35) combined with Linear Trend Regression.
    Returns forecasted fare estimates along with 95% confidence intervals (approx +/- 1.96 * sigma_residual).
    """
    n = len(fares_history)
    if n == 0:
        return []

    if n == 1:
        val = fares_history[0]
        return [
            {
                "horizon_days": h,
                "predicted_fare": round(val, 2),
                "lower_bound": round(val * 0.92, 2),
                "upper_bound": round(val * 1.08, 2),
                "model": "Baseline-Static"
            }
            for h in horizon_days
        ]

    # 1. Exponential Smoothing Level
    alpha = 0.35
    level = fares_history[0]
    for p in fares_history[1:]:
        level = alpha * p + (1.0 - alpha) * level

    # 2. Linear Trend Slope (Simple Least Squares on index)
    x_mean = (n - 1) / 2.0
    y_mean = sum(fares_history) / n
    numerator = sum((i - x_mean) * (fares_history[i] - y_mean) for i in range(n))
    denominator = sum((i - x_mean) ** 2 for i in range(n))
    slope = (numerator / denominator) if denominator != 0 else 0.0

    # 3. Residual standard deviation for confidence interval
    residuals = []
    for i in range(n):
        fitted = y_mean + slope * (i - x_mean)
        residuals.append(fares_history[i] - fitted)
    variance = sum(r ** 2 for r in residuals) / max(1, n - 2)
    std_err = math.sqrt(variance) if variance > 0 else (level * 0.05)

    forecasts = []
    for h in horizon_days:
        # Forecast = smoothed level + (slope * horizon)
        pred = max(500.0, level + (slope * h))
        margin = 1.96 * std_err * math.sqrt(1.0 + (h / n))
        
        forecasts.append({
            "horizon_days": h,
            "predicted_fare": round(pred, 2),
            "lower_bound": round(max(500.0, pred - margin), 2),
            "upper_bound": round(pred + margin, 2),
            "model": "Exponential-Smoothing-Linear-Trend"
        })

    return forecasts


class APIxEngine:
    def __init__(self, records: List[Dict[str, Any]], event_tags: Optional[List[Dict[str, Any]]] = None):
        """
        records: list of dicts with keys:
        'origin', 'destination', 'scraped_at', 'fare_total', 'base_fare', 'taxes_fees', 'travel_date', 'advance_purchase_days', 'status'
        """
        self.records = records
        self.event_tags = event_tags or []
        self._organize_data()

    def _organize_data(self):
        self.dates_set = set()
        self.route_date_fare: Dict[str, Dict[str, float]] = {}
        self.route_history: Dict[str, List[Dict[str, Any]]] = {}

        for r in self.records:
            origin = r["origin"].upper()
            dest = r["destination"].upper()
            route = f"{origin}-{dest}"
            fare = float(r["fare_total"])

            scraped = str(r["scraped_at"])
            date_str = scraped.split(" ")[0] if " " in scraped else scraped.split("T")[0]
            self.dates_set.add(date_str)

            if route not in self.route_date_fare:
                self.route_date_fare[route] = {}
                self.route_history[route] = []

            # Keep latest or baseline T+15/primary fare for daily index calculation
            adv_days = int(r.get("advance_purchase_days", 15))
            if date_str not in self.route_date_fare[route] or adv_days == 15:
                self.route_date_fare[route][date_str] = fare

            self.route_history[route].append({
                "date": date_str,
                "fare": fare,
                "base_fare": r.get("base_fare", round(fare * 0.78, 2)),
                "taxes_fees": r.get("taxes_fees", round(fare * 0.22, 2)),
                "travel_date": r.get("travel_date"),
                "advance_days": adv_days,
                "status": r.get("status", "CONFIRMED")
            })

        self.sorted_dates = sorted(list(self.dates_set))
        for route in self.route_history:
            self.route_history[route].sort(key=lambda x: (x["date"], x.get("advance_days", 0)))

    def get_daily_index(self) -> List[Dict[str, Any]]:
        """Compute the APIx index for every available date in chronological order."""
        if not self.sorted_dates:
            return []

        base_date = self.sorted_dates[0]
        base_fares = {
            route: self.route_date_fare[route][base_date]
            for route in self.route_date_fare
            if base_date in self.route_date_fare[route]
        }

        # Map event tags by date
        events_by_date = {ev["date"]: ev for ev in self.event_tags}

        daily_series = []
        prev_val = 100.0

        for i, d in enumerate(self.sorted_dates):
            current_fares = {
                route: self.route_date_fare[route][d]
                for route in self.route_date_fare
                if d in self.route_date_fare[route]
            }
            index_val = calculate_laspeyres_index(current_fares, base_fares, NORMALIZED_WEIGHTS)
            rounded_val = round(index_val, 2)
            pct_change = round(((rounded_val - prev_val) / prev_val) * 100.0, 2) if i > 0 else 0.0
            prev_val = rounded_val

            event_info = events_by_date.get(d)

            daily_series.append({
                "date": d,
                "index_value": rounded_val,
                "change_pct": pct_change,
                "event_tag": event_info["tag_type"] if event_info else None,
                "event_description": event_info["description"] if event_info else None
            })

        return daily_series

    def get_weekly_index(self) -> List[Dict[str, Any]]:
        """
        Computes calendar-week rollups of the Laspeyres index:
        Groups daily index values by ISO year-week (or 7-day windows), computing average index and change %.
        """
        daily = self.get_daily_index()
        if not daily:
            return []

        # Group by ISO week or 7-day chronological chunks
        weeks: Dict[str, List[Dict[str, Any]]] = {}
        for item in daily:
            try:
                d_obj = datetime.date.fromisoformat(item["date"])
                iso_yr, iso_wk, _ = d_obj.isocalendar()
                w_key = f"{iso_yr}-W{iso_wk:02d}"
            except Exception:
                w_key = item["date"][:7] + "-W"

            if w_key not in weeks:
                weeks[w_key] = []
            weeks[w_key].append(item)

        weekly_series = []
        prev_val = None

        for w_key, group in weeks.items():
            start_date = group[0]["date"]
            end_date = group[-1]["date"]
            avg_val = round(sum(d["index_value"] for d in group) / len(group), 2)
            
            if prev_val is not None and prev_val > 0:
                pct_change = round(((avg_val - prev_val) / prev_val) * 100.0, 2)
            else:
                pct_change = 0.0
            prev_val = avg_val

            # Collect any events in this week
            events = [d["event_tag"] for d in group if d.get("event_tag")]

            weekly_series.append({
                "week_label": w_key,
                "start_date": start_date,
                "end_date": end_date,
                "date": f"{start_date} to {end_date}",
                "index_value": avg_val,
                "change_pct": pct_change,
                "observation_days": len(group),
                "event_tag": events[0] if events else None,
                "event_description": f"{len(events)} events recorded in period" if len(events) > 1 else (group[0].get("event_description") if events else None)
            })

        return weekly_series

    def get_monthly_index(self) -> List[Dict[str, Any]]:
        """
        Computes monthly rollups of the Laspeyres index:
        Groups daily index values by YYYY-MM, computing monthly average index and change %.
        """
        daily = self.get_daily_index()
        if not daily:
            return []

        months: Dict[str, List[Dict[str, Any]]] = {}
        for item in daily:
            m_key = item["date"][:7]
            if m_key not in months:
                months[m_key] = []
            months[m_key].append(item)

        monthly_series = []
        prev_val = None

        for m_key, group in months.items():
            start_date = group[0]["date"]
            end_date = group[-1]["date"]
            avg_val = round(sum(d["index_value"] for d in group) / len(group), 2)

            if prev_val is not None and prev_val > 0:
                pct_change = round(((avg_val - prev_val) / prev_val) * 100.0, 2)
            else:
                pct_change = 0.0
            prev_val = avg_val

            events = [d["event_tag"] for d in group if d.get("event_tag")]

            monthly_series.append({
                "month_label": m_key,
                "start_date": start_date,
                "end_date": end_date,
                "date": m_key,
                "index_value": avg_val,
                "change_pct": pct_change,
                "observation_days": len(group),
                "event_tag": events[0] if events else None,
                "event_description": f"{len(events)} economic events in month" if events else None
            })

        return monthly_series

    def get_route_analysis(self, origin: str, dest: str) -> Optional[Dict[str, Any]]:
        """Get fare history, surge anomaly flags, cost breakdown, and trend indicator for a route."""
        route = get_route_key(origin, dest)
        if route not in self.route_history:
            return None

        history = self.route_history[route]
        
        # Aggregate primary observation history (one per date for rolling average and trend)
        unique_date_fares = {}
        for item in history:
            d = item["date"]
            if d not in unique_date_fares or item.get("advance_days") == 15:
                unique_date_fares[d] = item["fare"]

        sorted_date_keys = sorted(unique_date_fares.keys())
        fares_list = [unique_date_fares[k] for k in sorted_date_keys]
        trend = calculate_trend_indicator(fares_list)

        enriched_history = []
        running_fares: List[float] = []

        for item in history:
            running_fares.append(item["fare"])
            rolling_avg = sum(running_fares) / len(running_fares)
            is_anomaly, pct_above = calculate_surge_anomaly(item["fare"], rolling_avg, threshold_pct=15.0)

            enriched_history.append({
                "date": item["date"],
                "fare": item["fare"],
                "base_fare": item.get("base_fare"),
                "taxes_fees": item.get("taxes_fees"),
                "rolling_avg": round(rolling_avg, 2),
                "is_anomaly": is_anomaly,
                "deviation_pct": pct_above,
                "advance_days": item.get("advance_days", 15),
                "status": item.get("status", "CONFIRMED")
            })

        latest_entry = enriched_history[-1] if enriched_history else None

        return {
            "origin": origin.upper(),
            "destination": dest.upper(),
            "route": route,
            "raw_dgca_weight": DGCA_RAW_WEIGHTS.get(route, 0.0),
            "normalized_weight": round(NORMALIZED_WEIGHTS.get(route, 0.0), 4),
            "trend": trend,
            "latest_fare": latest_entry["fare"] if latest_entry else 0.0,
            "is_current_anomaly": latest_entry["is_anomaly"] if latest_entry else False,
            "deviation_pct": latest_entry["deviation_pct"] if latest_entry else 0.0,
            "history": enriched_history,
        }

    def get_route_forecast(self, origin: str, dest: str) -> Optional[Dict[str, Any]]:
        """
        Lightweight Statistical Forecasting for a route:
        Calculates T+1, T+3, T+7 day projected fares with 95% confidence intervals.
        """
        route = get_route_key(origin, dest)
        analysis = self.get_route_analysis(origin, dest)
        if not analysis:
            return None

        # Extract unique chronological fare series
        history = analysis["history"]
        fares_series = [h["fare"] for h in history if h.get("advance_days", 15) == 15 or len(history) <= 15]
        if not fares_series:
            fares_series = [h["fare"] for h in history]

        forecast_points = calculate_statistical_forecast(fares_series, horizon_days=[1, 3, 7])

        return {
            "origin": origin.upper(),
            "destination": dest.upper(),
            "route": route,
            "latest_fare": analysis["latest_fare"],
            "model_type": "Statistical Exponential Smoothing with Linear Trend",
            "forecasts": forecast_points,
            "notes": "Honest lightweight statistical projection; not a heavy ML model."
        }

    def get_all_routes_summary(self) -> List[Dict[str, Any]]:
        """Return the 6-route basket with DGCA weights, latest fares, trend, and anomaly state."""
        summaries = []
        for route, raw_wt in DGCA_RAW_WEIGHTS.items():
            origin, dest = route.split("-")
            analysis = self.get_route_analysis(origin, dest)
            if analysis:
                summaries.append({
                    "origin": origin,
                    "destination": dest,
                    "route": route,
                    "raw_dgca_weight": raw_wt,
                    "normalized_weight": round(NORMALIZED_WEIGHTS[route], 4),
                    "traffic_share_label": f"{raw_wt}% of traffic",
                    "latest_fare": analysis["latest_fare"],
                    "trend": analysis["trend"],
                    "is_anomaly": analysis["is_current_anomaly"],
                    "deviation_pct": analysis["deviation_pct"],
                    "history": analysis["history"]
                })
        return summaries

    def get_active_alerts(self) -> List[Dict[str, Any]]:
        """Return any route currently flagged is_anomaly=true."""
        alerts = []
        for route in DGCA_RAW_WEIGHTS:
            origin, dest = route.split("-")
            analysis = self.get_route_analysis(origin, dest)
            if analysis and analysis["is_current_anomaly"]:
                history = analysis["history"]
                rolling_avg = history[-1]["rolling_avg"] if history else 0.0
                alerts.append({
                    "route": route,
                    "origin": origin,
                    "destination": dest,
                    "latest_fare": analysis["latest_fare"],
                    "rolling_avg": rolling_avg,
                    "pct_above_average": analysis["deviation_pct"],
                    "message": f"{analysis['deviation_pct']}% above average"
                })
        return alerts
