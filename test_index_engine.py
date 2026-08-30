"""
Unit Tests for APIx Index Engine (Laspeyres-Weighted Airfare Index & Intelligence Layer)
SIH 2026 PS 26056
"""
import sys as _sys, os as _os
_sys.path.insert(0, _os.path.join(_os.path.dirname(_os.path.abspath(__file__)), "api"))


import unittest
from _lib.index_engine import (
    DGCA_RAW_WEIGHTS,
    NORMALIZED_WEIGHTS,
    calculate_laspeyres_index,
    calculate_surge_anomaly,
    calculate_trend_indicator,
    calculate_statistical_forecast,
    APIxEngine,
)
from _lib.database import init_db, get_all_fares, get_event_tags


class TestAPIxIndexEngine(unittest.TestCase):
    def test_weights_normalization(self):
        """Test that the 6 DGCA route weights normalize to 1.0."""
        self.assertEqual(len(NORMALIZED_WEIGHTS), 6)
        total_normalized = sum(NORMALIZED_WEIGHTS.values())
        self.assertAlmostEqual(total_normalized, 1.0, places=5)

        # Check that individual route proportions match DGCA raw shares
        raw_total = sum(DGCA_RAW_WEIGHTS.values())
        for route, raw_wt in DGCA_RAW_WEIGHTS.items():
            expected = raw_wt / raw_total
            self.assertAlmostEqual(NORMALIZED_WEIGHTS[route], expected, places=5)

    def test_laspeyres_base_period(self):
        """At base period where current fares == base fares, index must be 100.0."""
        base_fares = {
            "DEL-BOM": 4850.0,
            "BLR-DEL": 5620.0,
            "BLR-BOM": 3450.0,
            "DEL-HYD": 4120.0,
            "DEL-PNQ": 3890.0,
            "DEL-CCU": 4980.0,
        }
        current_fares = base_fares.copy()
        index_val = calculate_laspeyres_index(current_fares, base_fares, NORMALIZED_WEIGHTS)
        self.assertAlmostEqual(index_val, 100.0, places=2)

    def test_laspeyres_uniform_price_increase(self):
        """If all fares rise by 20%, APIx index must be exactly 120.0."""
        base_fares = {
            "DEL-BOM": 4000.0,
            "BLR-DEL": 5000.0,
            "BLR-BOM": 3000.0,
            "DEL-HYD": 4000.0,
            "DEL-PNQ": 3500.0,
            "DEL-CCU": 4500.0,
        }
        current_fares = {k: v * 1.20 for k, v in base_fares.items()}
        index_val = calculate_laspeyres_index(current_fares, base_fares, NORMALIZED_WEIGHTS)
        self.assertAlmostEqual(index_val, 120.0, places=2)

    def test_surge_anomaly_detection(self):
        """Test rule-based surge anomaly flagging (>15% above rolling avg)."""
        rolling_avg = 5000.0

        # Case 1: 10% increase -> No anomaly
        is_anomaly, pct = calculate_surge_anomaly(5500.0, rolling_avg, threshold_pct=15.0)
        self.assertFalse(is_anomaly)
        self.assertEqual(pct, 10.0)

        # Case 2: 15% increase -> No anomaly (threshold is strictly > 15%)
        is_anomaly, pct = calculate_surge_anomaly(5750.0, rolling_avg, threshold_pct=15.0)
        self.assertFalse(is_anomaly)
        self.assertEqual(pct, 15.0)

        # Case 3: 25% increase -> Anomaly
        is_anomaly, pct = calculate_surge_anomaly(6250.0, rolling_avg, threshold_pct=15.0)
        self.assertTrue(is_anomaly)
        self.assertEqual(pct, 25.0)

    def test_trend_indicator(self):
        """Test trend detection (trending_up, trending_down, stable)."""
        self.assertEqual(calculate_trend_indicator([5000.0, 5500.0]), "trending_up")
        self.assertEqual(calculate_trend_indicator([5500.0, 5200.0]), "trending_down")
        self.assertEqual(calculate_trend_indicator([5000.0, 5000.0]), "stable")
        self.assertEqual(calculate_trend_indicator([5000.0]), "stable")

    def test_statistical_forecasting(self):
        """Test lightweight statistical forecasting (exponential smoothing + linear trend)."""
        fares = [4500.0, 4600.0, 4700.0, 4850.0, 5000.0]
        forecasts = calculate_statistical_forecast(fares, horizon_days=[1, 3, 7])
        self.assertEqual(len(forecasts), 3)
        for fc in forecasts:
            self.assertIn("predicted_fare", fc)
            self.assertIn("lower_bound", fc)
            self.assertIn("upper_bound", fc)
            self.assertGreaterEqual(fc["upper_bound"], fc["predicted_fare"])
            self.assertLessEqual(fc["lower_bound"], fc["predicted_fare"])

    def test_engine_with_seeded_db_data(self):
        """Test full pipeline with pilot database data and event tags."""
        init_db(force_reseed=True)
        records = get_all_fares()
        events = get_event_tags()
        self.assertGreater(len(records), 0)
        self.assertGreater(len(events), 0)

        engine = APIxEngine(records, events)
        daily_index = engine.get_daily_index()
        self.assertGreater(len(daily_index), 0)
        self.assertEqual(daily_index[0]["index_value"], 100.0)

        # Test weekly rollups
        weekly_index = engine.get_weekly_index()
        self.assertGreater(len(weekly_index), 0)
        for w in weekly_index:
            self.assertIn("week_label", w)
            self.assertIn("index_value", w)
            self.assertIn("change_pct", w)

        # Test monthly rollups
        monthly_index = engine.get_monthly_index()
        self.assertGreater(len(monthly_index), 0)
        for m in monthly_index:
            self.assertIn("month_label", m)
            self.assertIn("index_value", m)

        # Test route analysis
        del_bom = engine.get_route_analysis("DEL", "BOM")
        self.assertIsNotNone(del_bom)
        self.assertEqual(del_bom["route"], "DEL-BOM")
        self.assertIn(del_bom["trend"], ["trending_up", "trending_down", "stable"])

        # Test route forecast
        forecast = engine.get_route_forecast("DEL", "BOM")
        self.assertIsNotNone(forecast)
        self.assertEqual(len(forecast["forecasts"]), 3)

        # Test route summaries
        summaries = engine.get_all_routes_summary()
        self.assertEqual(len(summaries), 6)

        # Test active alerts
        alerts = engine.get_active_alerts()
        self.assertIsInstance(alerts, list)


if __name__ == "__main__":
    unittest.main()
