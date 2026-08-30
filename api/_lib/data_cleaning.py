"""
APIx Data Cleaning & Validation Pipeline
SIH 2026 PS 26056

Implements:
1. Deduplication & schema normalization.
2. Statistical outlier detection (Z-score & IQR thresholding, sanity boundary checks).
3. Component separation (Base fare, taxes/fees, and fuel surcharges per DGCA standard).
"""

from typing import List, Dict, Any, Tuple, Optional
import math


def deduplicate_records(records: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Remove duplicate fare records with identical:
    (source, origin, destination, travel_date, advance_purchase_days, scraped_at).
    Maintains chronological order.
    """
    seen = set()
    deduped = []

    for r in records:
        key = (
            str(r.get("source", "")).strip().lower(),
            str(r.get("origin", "")).strip().upper(),
            str(r.get("destination", "")).strip().upper(),
            str(r.get("travel_date", "")).strip(),
            int(r.get("advance_purchase_days", 15)),
            str(r.get("scraped_at", "")).strip()
        )
        if key not in seen:
            seen.add(key)
            deduped.append(r)

    return deduped


def clean_outliers(
    records: List[Dict[str, Any]],
    method: str = "zscore",
    threshold: float = 3.0
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    """
    Detects and separates statistical and operational fare outliers per route and advance window.
    Sanity limits: fare must be between ₹500 and ₹50,000.
    Returns: (cleaned_records, flagged_outliers)
    """
    cleaned: List[Dict[str, Any]] = []
    outliers: List[Dict[str, Any]] = []

    # Group by route and advance_purchase_days
    groups: Dict[Tuple[str, str, int], List[Dict[str, Any]]] = {}
    for r in records:
        origin = str(r.get("origin", "")).strip().upper()
        dest = str(r.get("destination", "")).strip().upper()
        adv_days = int(r.get("advance_purchase_days", 15))
        grp_key = (origin, dest, adv_days)
        if grp_key not in groups:
            groups[grp_key] = []
        groups[grp_key].append(r)

    for grp_key, grp_records in groups.items():
        valid_group_fares: List[float] = []
        preliminary_valid: List[Dict[str, Any]] = []

        # 1. Hard domain sanity boundary check (500 <= fare <= 50,000)
        for r in grp_records:
            try:
                fare = float(r.get("fare_total", 0))
            except (ValueError, TypeError):
                outliers.append({**r, "outlier_reason": "INVALID_NUMERIC_FARE"})
                continue

            if fare < 500.0:
                outliers.append({**r, "outlier_reason": f"FARE_BELOW_MINIMUM_THRESHOLD ({fare} < 500)"})
            elif fare > 50000.0:
                outliers.append({**r, "outlier_reason": f"FARE_ABOVE_MAXIMUM_THRESHOLD ({fare} > 50000)"})
            else:
                preliminary_valid.append(r)
                valid_group_fares.append(fare)

        n = len(valid_group_fares)
        if n < 4:
            # Not enough sample points for robust z-score/IQR distribution; accept domain-validated records
            cleaned.extend(preliminary_valid)
            continue

        if method.lower() == "iqr":
            sorted_fares = sorted(valid_group_fares)
            q1 = sorted_fares[int(0.25 * n)]
            q3 = sorted_fares[int(0.75 * n)]
            iqr = q3 - q1
            lower_bound = q1 - 1.5 * iqr
            upper_bound = q3 + 1.5 * iqr

            for r in preliminary_valid:
                fare = float(r["fare_total"])
                if fare < lower_bound or fare > upper_bound:
                    outliers.append({**r, "outlier_reason": f"IQR_OUTLIER (fare={fare}, IQR_range=[{lower_bound:.1f}, {upper_bound:.1f}])"})
                else:
                    cleaned.append(r)
        else:
            # Z-Score method
            mean_val = sum(valid_group_fares) / n
            variance = sum((x - mean_val) ** 2 for x in valid_group_fares) / n
            std_dev = math.sqrt(variance)

            for r in preliminary_valid:
                fare = float(r["fare_total"])
                if std_dev > 0:
                    z_score = abs(fare - mean_val) / std_dev
                    if z_score > threshold:
                        outliers.append({**r, "outlier_reason": f"ZSCORE_OUTLIER (fare={fare}, z={z_score:.2f} > {threshold})"})
                    else:
                        cleaned.append(r)
                else:
                    cleaned.append(r)

    return cleaned, outliers


def separate_components(record: Dict[str, Any]) -> Dict[str, Any]:
    """
    Ensures complete breakdown of base_fare and taxes_fees per DGCA standard:
    ~78% base fare, ~22% taxes/fees/UDF/fuel surcharges.
    Guarantees base_fare + taxes_fees == fare_total.
    """
    rec = dict(record)
    fare_total = float(rec.get("fare_total", 0.0))

    base = rec.get("base_fare")
    taxes = rec.get("taxes_fees")

    if base is None or float(base) <= 0:
        base_fare = round(fare_total * 0.78, 2)
    else:
        base_fare = round(float(base), 2)

    if taxes is None or float(taxes) <= 0:
        taxes_fees = round(fare_total - base_fare, 2)
    else:
        taxes_fees = round(float(taxes), 2)

    # Reconcile exact sum equality to avoid floating point cent drift
    reconciled_taxes = round(fare_total - base_fare, 2)
    rec["base_fare"] = base_fare
    rec["taxes_fees"] = reconciled_taxes
    rec["fare_total"] = fare_total

    return rec


def clean_fare_dataset(
    records: List[Dict[str, Any]],
    method: str = "zscore",
    threshold: float = 3.0
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    """
    Runs full cleaning pipeline: Deduplicate -> Outlier filtering -> Component separation.
    """
    deduped = deduplicate_records(records)
    cleaned, outliers = clean_outliers(deduped, method=method, threshold=threshold)
    processed = [separate_components(r) for r in cleaned]
    return processed, outliers
