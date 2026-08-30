export interface IndexSeriesPoint {
  date: string;
  index_value: number;
  change_pct: number;
  week_label?: string;
  month_label?: string;
  start_date?: string;
  end_date?: string;
  observation_days?: number;
  event_tag?: string | null;
  event_description?: string | null;
}

export type DailyIndexPoint = IndexSeriesPoint;
export type WeeklyIndexPoint = IndexSeriesPoint;
export type MonthlyIndexPoint = IndexSeriesPoint;

export interface RouteHistoryItem {
  date: string;
  fare: number;
  base_fare?: number;
  taxes_fees?: number;
  rolling_avg: number;
  is_anomaly: boolean;
  deviation_pct: number;
  advance_days?: number;
  status?: string;
}

export interface RouteSummary {
  origin: string;
  destination: string;
  route: string;
  raw_dgca_weight: number;
  normalized_weight: number;
  traffic_share_label: string;
  latest_fare: number;
  trend: "trending_up" | "trending_down" | "stable";
  is_anomaly: boolean;
  deviation_pct: number;
  history: RouteHistoryItem[];
}

export interface ActiveAlert {
  route: string;
  origin: string;
  destination: string;
  latest_fare: number;
  rolling_avg: number;
  pct_above_average: number;
  message: string;
}

export interface EventTag {
  id?: number;
  date: string;
  tag_type: string;
  description: string;
}

export interface ForecastPoint {
  horizon_days: number;
  predicted_fare: number;
  lower_bound: number;
  upper_bound: number;
  model: string;
}

export interface RouteForecast {
  origin: string;
  destination: string;
  route: string;
  latest_fare: number;
  model_type: string;
  forecasts: ForecastPoint[];
  notes: string;
}

export interface SourceComplianceItem {
  source: string;
  status: "ACTIVE_COMPLIANT" | "BLOCKED_COMPLIANT" | "RESTRICTED";
  is_active: boolean;
  reason: string;
  endpoint?: string;
  robots_txt?: string;
}
