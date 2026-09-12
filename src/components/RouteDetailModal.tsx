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
  Legend,
} from "recharts";
import { X, AlertTriangle, TrendingUp, TrendingDown, Minus, Calculator, Sparkles, Clock, Layers, PieChart as PieIcon } from "lucide-react";
import { RouteSummary, RouteForecast } from "../types";

interface RouteDetailModalProps {
  route: RouteSummary | null;
  onClose: () => void;
}

export const RouteDetailModal: React.FC<RouteDetailModalProps> = ({ route, onClose }) => {
  const [activeTab, setActiveTab] = useState<"history" | "forecast" | "breakdown">("history");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-3xl w-full p-6 relative animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start justify-between pr-8 mb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-xl font-bold text-slate-900">
                {route.origin} → {route.destination}
              </h3>
              {route.is_anomaly && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-600 text-white">
                  <AlertTriangle className="w-3 h-3" />
                  Surge Active (+{route.deviation_pct}%)
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              DGCA Traffic Share: <strong>{route.traffic_share_label}</strong> | Normalized Basket Weight: <strong>{(route.normalized_weight * 100).toFixed(2)}%</strong>
            </p>
          </div>
        </div>

        {/* Key Stats Row with 2-Component Split Widget */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
          <div>
            <div className="text-[11px] text-slate-400 font-medium uppercase">Latest Fare</div>
            <div className="text-xl font-bold text-slate-900">₹{route.latest_fare.toLocaleString("en-IN")}</div>
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-medium uppercase">Trend</div>
            <div className="flex items-center gap-1 text-sm font-semibold mt-0.5">
              {isUp && <TrendingUp className="w-4 h-4 text-red-600" />}
              {isDown && <TrendingDown className="w-4 h-4 text-emerald-600" />}
              {!isUp && !isDown && <Minus className="w-4 h-4 text-slate-500" />}
              <span className="capitalize">{route.trend.replace("_", " ")}</span>
            </div>
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
            {/* Inline mini split bar */}
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden flex mt-1.5">
              <div style={{ width: `${baseFarePct}%` }} className="bg-[#1f6feb]" title={`Base: ₹${latestBaseFare.toLocaleString("en-IN")}`} />
              <div style={{ width: `${taxesFeesPct}%` }} className="bg-slate-400" title={`Taxes/Fees: ₹${latestTaxesFees.toLocaleString("en-IN")}`} />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2 mb-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab("history")}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === "history"
                ? "bg-[#1f6feb] text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Fare History & Baselines</span>
          </button>

          <button
            onClick={() => setActiveTab("breakdown")}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === "breakdown"
                ? "bg-[#1f6feb] text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Cost Breakdown & Multi-Window</span>
          </button>

          <button
            onClick={() => setActiveTab("forecast")}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === "forecast"
                ? "bg-[#1f6feb] text-white"
                : "text-slate-600 hover:bg-slate-100"
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

            <div className="h-56 w-full">
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
                          <div className="bg-slate-900 text-white rounded-lg p-2.5 text-xs shadow-lg border border-slate-700">
                            <div className="font-semibold text-slate-300">Observation: {label}</div>
                            <div className="text-sm font-bold text-[#f97316] mt-1">
                              Fare: ₹{item.fare?.toLocaleString("en-IN")}
                            </div>
                            <div className="text-slate-400 text-[11px] mt-0.5">
                              Rolling Avg: ₹{Math.round(item.rolling_avg)?.toLocaleString("en-IN")}
                            </div>
                            {item.is_anomaly && (
                              <div className="text-red-400 font-bold mt-1">
                                Surge Anomaly: +{item.deviation_pct}%
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
                    dot={{ r: 3, fill: "#f97316" }}
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
            {/* Header info banner */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-start gap-2">
              <Layers className="w-4 h-4 text-[#1f6feb] flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900">2-Component Airfare Decomposition:</span>
                <p className="text-slate-500 mt-0.5 leading-relaxed">
                  Total fares are decomposed into <strong className="text-[#1f6feb]">Base Fare</strong> and <strong className="text-slate-700">Taxes & Fees</strong> via the data cleaning pipeline. The base fare absorbs dynamic yield escalation while statutory taxes and fees scale proportionately.
                </p>
              </div>
            </div>

            {/* Visual Charts Grid: Donut + Stacked Bar */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Donut Chart: Latest Fare Component Split */}
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

              {/* Stacked Bar Chart across Advance Windows */}
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
                      <Bar dataKey="base_fare" stackId="a" fill="#1f6feb" radius={[0, 0, 0, 0]} name="Base Fare" />
                      <Bar dataKey="taxes_fees" stackId="a" fill="#94a3b8" radius={[4, 4, 0, 0]} name="Taxes & Fees" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center justify-center gap-4 text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-[#1f6feb]"></span> Base Fare
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-[#94a3b8]"></span> Taxes & Fees
                  </span>
                </div>
              </div>
            </div>

            {/* Observations Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Window</th>
                    <th className="px-3 py-2 text-right">Base Fare (~78%)</th>
                    <th className="px-3 py-2 text-right">Taxes & Fees (~22%)</th>
                    <th className="px-3 py-2 text-right">Total Fare</th>
                    <th className="px-3 py-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {route.history.slice(-8).map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="px-3 py-2 text-slate-800">{item.date}</td>
                      <td className="px-3 py-2">
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-[#1f6feb] font-bold text-[10px]">
                          T+{item.advance_days || 15}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right text-slate-700 font-mono">
                        ₹{(item.base_fare ?? Math.round(item.fare * 0.78)).toLocaleString("en-IN")}
                      </td>
                      <td className="px-3 py-2 text-right text-slate-500 font-mono">
                        ₹{(item.taxes_fees ?? Math.round(item.fare * 0.22)).toLocaleString("en-IN")}
                      </td>
                      <td className="px-3 py-2 text-right font-bold text-slate-900 font-mono">
                        ₹{item.fare.toLocaleString("en-IN")}
                      </td>
                      <td className="px-3 py-2 text-center text-slate-400 text-[10px]">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                          {item.status || "CONFIRMED"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-slate-400 italic">
              * Note: Live APIs return all-inclusive fare totals. Reconciled 2-component decomposition separates statutory taxes/fees from carrier base revenue.
            </p>
          </div>
        )}

        {/* Tab 3: Statistical Forecast */}
        {activeTab === "forecast" && (
          <div className="flex-1 overflow-y-auto space-y-4">
            <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl text-xs text-slate-700 flex items-start gap-2">
              <Calculator className="w-4 h-4 text-[#1f6feb] flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[#1f6feb]">Lightweight Statistical Forecasting Model:</span>
                <p className="text-slate-600 mt-0.5 leading-relaxed">
                  Single Exponential Smoothing (α=0.35) combined with Linear Least-Squares Trend projection and 95% confidence intervals (±1.96·σ).
                </p>
              </div>
            </div>

            {loadingForecast ? (
              <div className="text-center py-8 text-slate-400 text-xs animate-pulse">
                Computing statistical forecast projections...
              </div>
            ) : forecast ? (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  {forecast.forecasts.map((fc) => (
                    <div key={fc.horizon_days} className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">
                        Forecast Horizon: T+{fc.horizon_days} Day{fc.horizon_days > 1 ? "s" : ""}
                      </div>
                      <div className="text-lg font-extrabold text-[#1f6feb] mt-0.5">
                        ₹{Math.round(fc.predicted_fare).toLocaleString("en-IN")}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">
                        95% CI: ₹{Math.round(fc.lower_bound).toLocaleString("en-IN")} – ₹{Math.round(fc.upper_bound).toLocaleString("en-IN")}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span>Model Type: {forecast.model_type}</span>
                  <span className="text-slate-400">{forecast.notes}</span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400">Forecast unavailable.</div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
