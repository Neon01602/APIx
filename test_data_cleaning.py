"""
APIx Data Cleaning Unit Tests
SIH 2026 PS 26056
"""

import unittest
from data_cleaning import (
    deduplicate_records,
    clean_outliers,
    separate_components,
    clean_fare_dataset
)


class TestDataCleaningPipeline(unittest.TestCase):

    def setUp(self):
        self.sample_records = [
            {
                "source": "EaseMyTrip",
                "origin": "DEL",
                "destination": "BOM",
                "travel_date": "2026-08-15",
                "advance_purchase_days": 15,
                "fare_total": 5200.0,
                "base_fare": 4056.0,
                "taxes_fees": 1144.0,
                "scraped_at": "2026-08-01 09:00:00",
                "status": "SIMULATED_BACKTEST"
            },
            # Exact Duplicate
            {
                "source": "EaseMyTrip",
                "origin": "DEL",
                "destination": "BOM",
                "travel_date": "2026-08-15",
                "advance_purchase_days": 15,
                "fare_total": 5200.0,
                "base_fare": 4056.0,
                "taxes_fees": 1144.0,
                "scraped_at": "2026-08-01 09:00:00",
                "status": "SIMULATED_BACKTEST"
            },
            # Hard Outlier Below Minimum
            {
                "source": "EaseMyTrip",
                "origin": "DEL",
                "destination": "BOM",
                "travel_date": "2026-08-16",
                "advance_purchase_days": 15,
                "fare_total": 120.0,
                "scraped_at": "2026-08-01 09:05:00",
                "status": "SIMULATED_BACKTEST"
            },
            # Hard Outlier Above Maximum
            {
                "source": "EaseMyTrip",
                "origin": "DEL",
                "destination": "BOM",
                "travel_date": "2026-08-17",
                "advance_purchase_days": 15,
                "fare_total": 85000.0,
                "scraped_at": "2026-08-01 09:10:00",
                "status": "SIMULATED_BACKTEST"
            },
            # Missing component breakdown
            {
                "source": "EaseMyTrip",
                "origin": "BLR",
                "destination": "DEL",
                "travel_date": "2026-08-15",
                "advance_purchase_days": 7,
                "fare_total": 6000.0,
                "base_fare": None,
                "taxes_fees": None,
                "scraped_at": "2026-08-01 09:15:00",
                "status": "SIMULATED_BACKTEST"
            }
        ]

    def test_deduplication(self):
        deduped = deduplicate_records(self.sample_records)
        self.assertEqual(len(deduped), 4)

    def test_outlier_filtering(self):
        cleaned, outliers = clean_outliers(self.sample_records)
        # 120 and 85000 should be detected as outliers
        outlier_fares = [r["fare_total"] for r in outliers]
        self.assertIn(120.0, outlier_fares)
        self.assertIn(85000.0, outlier_fares)
        self.assertTrue(all(500 <= r["fare_total"] <= 50000 for r in cleaned))

    def test_component_separation(self):
        raw = {
            "fare_total": 10000.0,
            "base_fare": None,
            "taxes_fees": None
        }
        separated = separate_components(raw)
        self.assertEqual(separated["base_fare"], 7800.0)
        self.assertEqual(separated["taxes_fees"], 2200.0)
        self.assertAlmostEqual(separated["base_fare"] + separated["taxes_fees"], separated["fare_total"], places=2)

    def test_full_pipeline(self):
        cleaned, outliers = clean_fare_dataset(self.sample_records)
        self.assertEqual(len(outliers), 2)
        for r in cleaned:
            self.assertTrue(500.0 <= r["fare_total"] <= 50000.0)
            self.assertAlmostEqual(r["base_fare"] + r["taxes_fees"], r["fare_total"], places=2)


if __name__ == "__main__":
    unittest.main()
