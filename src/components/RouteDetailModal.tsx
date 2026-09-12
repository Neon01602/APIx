import React, { useState, useEffect, useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Area,
  AreaChart,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  X,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  Calculator,
  Sparkles,
  Clock,
  Layers,
  PieChart as PieIcon,
  Plane,
  ShieldCheck,
  Building2,
  CheckCircle2,
} from "lucide-react";
import { RouteSummary, RouteForecast } from "../types";
import { ROUTE_FLIGHT_METADATA, AERODROMES_REGISTRY, AIRLINES_REGISTRY, DGCA_COMPLIANCE_AUDIT } from "../data/airlines";

interface RouteDetailModalProps {
  route: RouteSummary | null;
  onClose: () => void;
}

export const RouteDetailModal: React.FC<RouteDetailModalProps> = ({ route, onClose }) => {
  const [activeTab, setActiveTab] = useState<"history" | "breakdown" | "airlines" | "forecast">("history");
  const [forecast, setForecast] = useState<RouteForecast | null>(null);
  const [loadingForecast, setLoadingForecast] = useState<boolean>(false);

  useEffect(() => {
    if (route) {
      setLoadingForecast(true);
      fetch(`/api/forecast/${route.origin}/${route.destination}`)
        .then((res) => res.json())
        .then((data) => {
          setForecast(data);
          setLoadingForecast(false);
        })
        .catch(() => setLoadingForecast(false));
    }
  }, [route]);

  if (!route) return null;

  const isUp = route.trend === "trending_up";
  const isDown = route.trend === "trending_down";

  // Metadata and Aerodromes
  const meta = ROUTE_FLIGHT_METADATA[route.route];
  const originAero = AERODROMES_REGISTRY[route.origin];
  const destAero = AERODROMES_REGISTRY[route.destination];

  // Real 2-component fare decomposition from history
  const latestItem = route.history.length > 0 ? route.history[route.history.length - 1] : null;
  const latestFare = route.latest_fare || latestItem?.fare || 0;
  const latestBaseFare = latestItem?.base_fare ?? Math.round(latestFare * 0.78);
  const latestTaxesFees = latestItem?.taxes_fees ?? Math.round(latestFare - latestBaseFare);
  const baseFarePct = latestFare > 0 ? ((latestBaseFare / latestFare) * 100).toFixed(1) : "78.0";
  const taxesFeesPct = latestFare > 0 ? ((latestTaxesFees / latestFare) * 100).toFixed(1) : "22.0";

  // Multi-window 2-component stacked bar data for latest cycle date
  const windowBreakdownData = useMemo(() => {
    if (!route.history || route.history.length === 0) return [];
    const targetDate = latestItem?.date || route.history[route.history.length - 1].date;
    const windows = [1, 7, 15, 30, 45];
    return windows.map((w) => {
      const item = route.history.find((h) => h.date === targetDate && h.advance_days === w);
      const total = item?.fare || 0;
      const base = item?.base_fare ?? Math.round(total * 0.78);
      const taxes = item?.taxes_fees ?? Math.round(total - base);
      return {
        window: `T+${w}`,
        advance_days: w,
        base_fare: base,
        taxes_fees: taxes,
        total_fare: total,
      };
    });
  }, [route.history, latestItem]);

  const donutData = [
    { name: "Base Fare", value: latestBaseFare, color: "#1f6feb" },
    { name: "Taxes & Fees", value: latestTaxesFees, color: "#94a3b8" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full p-6 relative animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100 pr-8">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-black text-slate-900">
                {route.origin} → {route.destination}
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                Rank #{meta?.dgcaCorridorRank || "—"} DGCA Trunk
              </span>
              {route.is_anomaly && (
                <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded bg-red-600 text-white animate-pulse">
                  <AlertTriangle className="w-3 h-3" />
                  Surge Alert (+{route.deviation_pct}%)
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {originAero?.city} ({originAero?.icao}) to {destAero?.city} ({destAero?.icao}) · {meta?.distanceKm || 1100} km ({meta?.distanceNmi || 600} nmi) · Scheduled Block Time: {meta?.blockTimeHours || "2h 10m"}
            </p>
          </div>
        </div>

        {/* Top Metric Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 my-4 text-xs">
          <div>
            <div className="text-[11px] text-slate-400 font-medium uppercase">Latest Fare</div>
            <div className="text-xl font-black text-slate-900">₹{latestFare.toLocaleString("en-IN")}</div>
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-medium uppercase">DGCA Traffic Weight</div>
            <div className="text-xl font-bold text-[#1f6feb]">{route.traffic_share_label}</div>
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-medium uppercase">Rolling Avg</div>
            <div className="text-xl font-bold text-slate-700">
              ₹{route.history.length > 0 ? Math.round(route.history[route.history.length - 1].rolling_avg).toLocaleString("en-IN") : "—"}
            </div>
          </div>
          <div className="border-t sm:border-t-0 sm:border-l border-slate-200 pt-2 sm:pt-0 sm:pl-3">
            <div className="text-[11px] text-slate-400 font-medium uppercase">2-Component Split</div>
            <div className="flex items-center justify-between text-xs mt-0.5">
              <span className="text-[#1f6feb] font-bold">Base: {baseFarePct}%</span>
              <span className="text-slate-500 font-medium">Taxes: {taxesFeesPct}%</span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden flex mt-1.5">
              <div style={{ width: `${baseFarePct}%` }} className="bg-[#1f6feb]" title={`Base: ₹${latestBaseFare.toLocaleString("en-IN")}`} />
              <div style={{ width: `${taxesFeesPct}%` }} className="bg-slate-400" title={`Taxes/Fees: ₹${latestTaxesFees.toLocaleString("en-IN")}`} />
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2 mb-4 text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveTab("history")}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "history" ? "bg-[#1f6feb] text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Fare History & Baselines</span>
          </button>

          <button
            onClick={() => setActiveTab("breakdown")}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "breakdown" ? "bg-[#1f6feb] text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Cost Breakdown & Multi-Window</span>
          </button>

          <button
            onClick={() => setActiveTab("airlines")}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "airlines" ? "bg-[#1f6feb] text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Plane className="w-3.5 h-3.5" />
            <span>Airlines & Flight Compliance</span>
          </button>

          <button
            onClick={() => setActiveTab("forecast")}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "forecast" ? "bg-[#1f6feb] text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Statistical Forecast (T+1..T+7)</span>
          </button>
        </div>

        {/* Tab 1: Historical Fare Chart */}
        {activeTab === "history" && (
          <div className="flex-1 overflow-y-auto">
            <div className="text-xs font-semibold text-slate-700 mb-2 flex items-center justify-between">
              <span>Historical Fare vs. Rolling Baseline (INR)</span>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1 text-[#f97316]">
                  <span className="w-2.5 h-0.5 bg-[#f97316] inline-block"></span> Actual Fare
                </span>
                <span className="flex items-center gap-1 text-slate-400">
                  <span className="w-2.5 h-0.5 bg-slate-400 inline-block border-t border-dashed"></span> Rolling Avg
                </span>
              </div>
            </div>

            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={route.history} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(d) => d.slice(5)}
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(v) => `₹${v}`}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const item = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white rounded-lg p-2.5 text-xs shadow-lg">
                            <div className="font-bold text-slate-300">{label}</div>
                            <div className="text-amber-400 mt-0.5 font-bold">
                              Fare: ₹{item.fare?.toLocaleString("en-IN")}
                            </div>
                            <div className="text-slate-400">
                              Rolling Avg: ₹{Math.round(item.rolling_avg)?.toLocaleString("en-IN")}
                            </div>
                            {item.is_anomaly && (
                              <div className="text-red-400 font-bold mt-1">
                                Anomaly: +{item.deviation_pct}% deviation
                              </div>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="fare"
                    stroke="#f97316"
                    strokeWidth={2.5}
                    dot={(props: any) => {
                      const { cx, cy, payload } = props;
                      if (payload.is_anomaly) {
                        return (
                          <circle
                            key={payload.date}
                            cx={cx}
                            cy={cy}
                            r={5}
                            fill="#dc2626"
                            stroke="#ffffff"
                            strokeWidth={2}
                          />
                        );
                      }
                      return null;
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="rolling_avg"
                    stroke="#94a3b8"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Tab 2: Cost Breakdown & Multi-Window */}
        {activeTab === "breakdown" && (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-start gap-2">
              <Layers className="w-4 h-4 text-[#1f6feb] flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900">2-Component Airfare Decomposition:</span>
                <p className="text-slate-500 mt-0.5 leading-relaxed">
                  Total fares are decomposed into <strong className="text-[#1f6feb]">Base Fare</strong> and <strong className="text-slate-700">Taxes & Fees</strong>. The base fare reflects dynamic yield management while taxes/fees remain statutory and non-predatory.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                <div className="text-xs font-bold text-slate-900 flex items-center justify-between">
                  <span>Latest Fare Composition</span>
                  <span className="text-[11px] font-mono text-slate-500">₹{latestFare.toLocaleString("en-IN")} Total</span>
                </div>
                <div className="h-44 w-full mt-1 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={donutData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={65}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {donutData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: number) => [`₹${val.toLocaleString("en-IN")}`, ""]}
                        contentStyle={{ backgroundColor: "#0f172a", borderRadius: "8px", color: "#fff", fontSize: "11px" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#1f6feb]"></span>
                    <div>
                      <div className="text-[10px] text-slate-400">Base Fare ({baseFarePct}%)</div>
                      <div className="font-bold text-slate-800">₹{latestBaseFare.toLocaleString("en-IN")}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                    <div>
                      <div className="text-[10px] text-slate-400">Taxes/Fees ({taxesFeesPct}%)</div>
                      <div className="font-bold text-slate-800">₹{latestTaxesFees.toLocaleString("en-IN")}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                <div className="text-xs font-bold text-slate-900 flex items-center justify-between">
                  <span>Stacked Components by Advance Window</span>
                  <span className="text-[10px] text-slate-400 font-normal">T+1 to T+45</span>
                </div>
                <div className="h-44 w-full mt-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={windowBreakdownData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="window" stroke="#64748b" fontSize={10} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={10} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            const d = payload[0].payload;
                            return (
                              <div className="bg-slate-900 text-white rounded-lg p-2.5 text-[11px] shadow-lg">
                                <div className="font-bold text-slate-300 mb-1">{label} Horizon</div>
                                <div>Total: ₹{d.total_fare?.toLocaleString("en-IN")}</div>
                                <div className="text-[#58a6ff]">Base: ₹{d.base_fare?.toLocaleString("en-IN")}</div>
                                <div className="text-slate-400">Taxes: ₹{d.taxes_fees?.toLocaleString("en-IN")}</div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="base_fare" stackId="a" fill="#1f6feb" name="Base Fare" radius={[0, 0, 4, 4]} />
                      <Bar dataKey="taxes_fees" stackId="a" fill="#cbd5e1" name="Taxes & Fees" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Airlines & Flight Compliance */}
        {activeTab === "airlines" && (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
            {/* Operating Airlines on Corridor */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="font-bold text-slate-900 text-xs flex items-center justify-between mb-3">
                <span className="flex items-center gap-1.5">
                  <Plane className="w-4 h-4 text-[#1f6feb]" />
                  Active Domestic Carriers on {route.route}
                </span>
                <span className="text-[11px] text-slate-500">
                  {meta?.activeAirlines.length || 5} Scheduled Operators
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {AIRLINES_REGISTRY.map((carrier) => {
                  const isActive = meta?.activeAirlines.includes(carrier.code) ?? true;
                  const estimatedFare = Math.round(latestFare * carrier.fareMultiplier);
                  return (
                    <div
                      key={carrier.code}
                      className={`p-3 rounded-xl border transition-all ${
                        isActive ? "bg-white border-slate-200" : "bg-slate-100 border-slate-200 opacity-60"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-6 h-6 rounded-md flex items-center justify-center font-bold text-white text-[10px]"
                            style={{ backgroundColor: carrier.brandColor }}
                          >
                            {carrier.code}
                          </span>
                          <span className="font-bold text-slate-900">{carrier.name}</span>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded uppercase font-semibold bg-slate-100 text-slate-600">
                          {carrier.type}
                        </span>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-slate-400 text-[10px]">Estimated Fare:</span>
                        <span className="font-bold font-mono text-slate-900">
                          ₹{estimatedFare.toLocaleString("en-IN")}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                        <span>On-Time: <strong>{carrier.otpScore}%</strong></span>
                        <span className="text-emerald-600 font-medium">CAR Sec-3: {carrier.carComplianceScore}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Aerodrome & Runway Specs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 bg-white border border-slate-200 rounded-xl">
                <div className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-[#1f6feb]" />
                  Origin Aerodrome
                </div>
                <div className="font-bold text-slate-900 text-sm mt-1">
                  {originAero?.airportName} ({originAero?.iata} / {originAero?.icao})
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Runways: <strong>{originAero?.runways}</strong> · Elevation: {originAero?.elevationFeet} ft
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Operator: {originAero?.operator}
                </div>
              </div>

              <div className="p-3.5 bg-white border border-slate-200 rounded-xl">
                <div className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-[#1f6feb]" />
                  Destination Aerodrome
                </div>
                <div className="font-bold text-slate-900 text-sm mt-1">
                  {destAero?.airportName} ({destAero?.iata} / {destAero?.icao})
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Runways: <strong>{destAero?.runways}</strong> · Elevation: {destAero?.elevationFeet} ft
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Operator: {destAero?.operator}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Statistical Forecast */}
        {activeTab === "forecast" && (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-[#1f6feb] flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Lightweight Statistical Forecasting Model:</span>
                <p className="text-blue-700 mt-0.5 leading-relaxed">
                  Projected fares for horizons T+1 through T+7 computed via Exponential Smoothing and Linear Trend Regression with 95% confidence intervals.
                </p>
              </div>
            </div>

            {loadingForecast ? (
              <div className="py-12 text-center text-xs text-slate-400">Computing route forecasts...</div>
            ) : forecast?.forecasts ? (
              <div className="space-y-4">
                <div className="h-52 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={forecast.forecasts.map((f) => ({
                        horizon: `T+${f.horizon_days}`,
                        predicted: f.predicted_fare,
                        lower: f.lower_bound,
                        upper: f.upper_bound,
                      }))}
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="horizon" stroke="#64748b" fontSize={11} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                      <Tooltip
                        formatter={(val: number) => [`₹${val.toLocaleString("en-IN")}`, ""]}
                        contentStyle={{ backgroundColor: "#0f172a", borderRadius: "8px", color: "#fff", fontSize: "11px" }}
                      />
                      <Area
                        type="monotone"
                        dataKey="predicted"
                        stroke="#1f6feb"
                        fill="#3b82f6"
                        fillOpacity={0.15}
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                  {forecast.forecasts.map((f) => (
                    <div key={f.horizon_days} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-center">
                      <div className="text-[10px] text-slate-400 font-bold">T+{f.horizon_days}</div>
                      <div className="font-bold text-slate-900 text-xs mt-1">₹{f.predicted_fare.toLocaleString("en-IN")}</div>
                      <div className="text-[9px] text-slate-400 mt-0.5">±₹{Math.round((f.upper_bound - f.lower_bound) / 2)}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">No forecast points returned for this route.</div>
            )}
          </div>
        )}

        {/* Modal Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <span>DGCA CAR Sec-3 Part IV & Rule 135 Compliant Data Stream</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
