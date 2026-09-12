import React, { useState, useMemo } from "react";
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
  Legend,
} from "recharts";
import { RouteSummary } from "../types";
import { TrendingUp, Clock, Compass, Layers, ArrowUpRight, CheckCircle2, AlertCircle } from "lucide-react";

interface LeadTimeElasticityProps {
  routes: RouteSummary[];
  onSelectRoute?: (route: RouteSummary) => void;
}

const ADVANCE_WINDOWS = [45, 30, 15, 7, 1] as const; // Ordered from earliest booking to departure day

const ROUTE_COLORS: Record<string, string> = {
  "DEL-BOM": "#1f6feb",
  "BLR-DEL": "#10b981",
  "BLR-BOM": "#f59e0b",
  "DEL-HYD": "#8b5cf6",
  "DEL-PNQ": "#ec4899",
  "DEL-CCU": "#06b6d4",
  "AMD-DEL": "#f97316",
  "MAA-DEL": "#6366f1",
  "HYD-BOM": "#14b8a6",
  "BLR-CCU": "#84cc16",
};

export const LeadTimeElasticity: React.FC<LeadTimeElasticityProps> = ({ routes, onSelectRoute }) => {
  const [selectedRouteKey, setSelectedRouteKey] = useState<string>("ALL");
  const [comparisonMode, setComparisonMode] = useState<boolean>(false);
  const [metricMode, setMetricMode] = useState<"fare" | "normalized">("fare"); // absolute INR or indexed to T+45=100

  // 1. Calculate average fare and component breakdown per advance window for each route
  const elasticityByRoute = useMemo(() => {
    const data: Record<
      string,
      Record<number, { fare: number; baseFare: number; taxesFees: number }>
    > = {};

    routes.forEach((r) => {
      data[r.route] = {};
      ADVANCE_WINDOWS.forEach((w) => {
        const matches = r.history.filter((h) => h.advance_days === w);
        if (matches.length > 0) {
          const avgFare = Math.round(
            matches.reduce((acc, curr) => acc + curr.fare, 0) / matches.length
          );
          const avgBase = Math.round(
            matches.reduce((acc, curr) => acc + (curr.base_fare || curr.fare * 0.78), 0) /
              matches.length
          );
          const avgTaxes = Math.round(
            matches.reduce((acc, curr) => acc + (curr.taxes_fees || curr.fare * 0.22), 0) /
              matches.length
          );
          data[r.route][w] = { fare: avgFare, baseFare: avgBase, taxesFees: avgTaxes };
        } else {
          data[r.route][w] = { fare: 0, baseFare: 0, taxesFees: 0 };
        }
      });
    });

    // Also compute basket weighted average
    data["ALL"] = {};
    ADVANCE_WINDOWS.forEach((w) => {
      let weightedFare = 0;
      let weightedBase = 0;
      let weightedTaxes = 0;

      routes.forEach((r) => {
        const item = data[r.route][w];
        weightedFare += item.fare * r.normalized_weight;
        weightedBase += item.baseFare * r.normalized_weight;
        weightedTaxes += item.taxesFees * r.normalized_weight;
      });

      data["ALL"][w] = {
        fare: Math.round(weightedFare),
        baseFare: Math.round(weightedBase),
        taxesFees: Math.round(weightedTaxes),
      };
    });

    return data;
  }, [routes]);

  // 2. Format Chart Data for Single Route / Basket Curve
  const chartData = useMemo(() => {
    return ADVANCE_WINDOWS.map((w) => {
      const point: any = {
        windowLabel: `T+${w}`,
        advanceDays: w,
        horizonDescription:
          w === 45
            ? "Early Bird (45d)"
            : w === 30
            ? "Advance (30d)"
            : w === 15
            ? "Benchmark (15d)"
            : w === 7
            ? "Short-Notice (7d)"
            : "Last-Minute (1d)",
      };

      if (comparisonMode) {
        // Include each route's value
        routes.forEach((r) => {
          const item = elasticityByRoute[r.route]?.[w];
          if (metricMode === "normalized") {
            const base45 = elasticityByRoute[r.route]?.[45]?.fare || 1;
            point[r.route] = Math.round(((item?.fare || 0) / base45) * 100);
          } else {
            point[r.route] = item?.fare || 0;
          }
        });
      } else {
        const item = elasticityByRoute[selectedRouteKey]?.[w] || {
          fare: 0,
          baseFare: 0,
          taxesFees: 0,
        };
        const base45 = elasticityByRoute[selectedRouteKey]?.[45]?.fare || 1;

        point.fare = item.fare;
        point.baseFare = item.baseFare;
        point.taxesFees = item.taxesFees;
        point.normalized = Math.round((item.fare / base45) * 100);
      }

      return point;
    });
  }, [elasticityByRoute, selectedRouteKey, comparisonMode, metricMode, routes]);

  // Selected route summary object (if not ALL)
  const activeRouteObj = useMemo(() => {
    return routes.find((r) => r.route === selectedRouteKey) || null;
  }, [routes, selectedRouteKey]);

  // Metrics for active route or basket
  const metrics = useMemo(() => {
    const dataObj = elasticityByRoute[selectedRouteKey] || elasticityByRoute["ALL"];
    const fare45 = dataObj?.[45]?.fare || 1;
    const fare15 = dataObj?.[15]?.fare || 1;
    const fare1 = dataObj?.[1]?.fare || 1;

    const surgeOverEarlyBird = Math.round(((fare1 - fare45) / fare45) * 100);
    const surgeOverBenchmark = Math.round(((fare1 - fare15) / fare15) * 100);
    const earlyBirdSavings = Math.round(((fare15 - fare45) / fare15) * 100);

    // Elasticity approximation: % change in fare per day as departure nears from T+15 to T+1
    const dailyEscalationRate = (((fare1 - fare15) / fare15) / 14 * 100).toFixed(2);

    return {
      fare45,
      fare15,
      fare1,
      surgeOverEarlyBird,
      surgeOverBenchmark,
      earlyBirdSavings,
      dailyEscalationRate,
    };
  }, [elasticityByRoute, selectedRouteKey]);

  return (
    <div id="lead-time-elasticity-container" className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <h2 className="text-lg font-bold text-slate-900">
                Lead-Time Airfare Elasticity Curve
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
              Empirical modeling of dynamic airline yield management as departure date approaches. Fares escalate non-linearly from early booking (T+45) through to last-minute distress pricing (T+1).
            </p>
          </div>

          {/* Interactive Filters */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Route Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">Route:</span>
              <select
                id="elasticity-route-selector"
                value={selectedRouteKey}
                disabled={comparisonMode}
                onChange={(e) => setSelectedRouteKey(e.target.value)}
                className="text-xs font-medium bg-slate-50 border border-slate-300 text-slate-800 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#1f6feb] disabled:opacity-50"
              >
                <option value="ALL">Weighted Basket Average (All 10 Routes)</option>
                {routes.map((r) => (
                  <option key={r.route} value={r.route}>
                    {r.origin} → {r.destination} ({(r.normalized_weight * 100).toFixed(1)}% wt)
                  </option>
                ))}
              </select>
            </div>

            {/* Toggle Multi-Route Comparison */}
            <button
              onClick={() => setComparisonMode(!comparisonMode)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                comparisonMode
                  ? "bg-[#1f6feb] text-white border-[#1f6feb]"
                  : "bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100"
              }`}
            >
              {comparisonMode ? "Single Route Mode" : "Compare All 10 Routes"}
            </button>

            {/* Normalized vs Absolute Fare */}
            {comparisonMode && (
              <div className="flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-[11px] font-semibold">
                <button
                  onClick={() => setMetricMode("fare")}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    metricMode === "fare" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500"
                  }`}
                >
                  Fare (₹)
                </button>
                <button
                  onClick={() => setMetricMode("normalized")}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    metricMode === "normalized"
                      ? "bg-white text-slate-900 shadow-2xs"
                      : "text-slate-500"
                  }`}
                >
                  Indexed (T+45=100)
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Metrics Row */}
        <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
            <div className="text-[10px] uppercase font-bold text-slate-400">Early Bird (T+45)</div>
            <div className="text-lg font-bold text-slate-800 mt-0.5">
              ₹{metrics.fare45.toLocaleString("en-IN")}
            </div>
            <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">
              -{metrics.earlyBirdSavings}% vs T+15 baseline
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
            <div className="text-[10px] uppercase font-bold text-slate-400">Benchmark Window (T+15)</div>
            <div className="text-lg font-bold text-[#1f6feb] mt-0.5">
              ₹{metrics.fare15.toLocaleString("en-IN")}
            </div>
            <div className="text-[10px] text-slate-500 font-medium mt-0.5">
              Core DGCA index reference
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
            <div className="text-[10px] uppercase font-bold text-slate-400">Last-Minute (T+1)</div>
            <div className="text-lg font-bold text-red-600 mt-0.5">
              ₹{metrics.fare1.toLocaleString("en-IN")}
            </div>
            <div className="text-[10px] text-red-600 font-semibold mt-0.5">
              +{metrics.surgeOverEarlyBird}% vs T+45 early bird
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
            <div className="text-[10px] uppercase font-bold text-slate-400">Yield Escalation Velocity</div>
            <div className="text-lg font-bold text-purple-600 mt-0.5">
              +{metrics.dailyEscalationRate}%/day
            </div>
            <div className="text-[10px] text-purple-600 font-semibold mt-0.5">
              Avg pace between T+15 & T+1
            </div>
          </div>
        </div>
      </div>

      {/* Main Elasticity Chart */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              {comparisonMode
                ? `Comparative Yield Curves (10 Routes${metricMode === "normalized" ? " — Indexed to T+45 = 100" : ""})`
                : selectedRouteKey === "ALL"
                ? "Weighted Basket Average Lead-Time Curve"
                : `${selectedRouteKey} Lead-Time Dynamic Pricing Curve`}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Departure date approaches from Left (45 days out) to Right (1 day out)
            </p>
          </div>

          {!comparisonMode && (
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-xs bg-[#1f6feb]/20 border border-[#1f6feb] inline-block"></span>
                Base Fare (~78%)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-xs bg-slate-200 border border-slate-400 inline-block"></span>
                Taxes & Fees (~22%)
              </span>
            </div>
          )}
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {comparisonMode ? (
              <LineChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="horizonDescription"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(v) => (metricMode === "normalized" ? `${v}` : `₹${v}`)}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-900 text-white rounded-xl p-3 text-xs shadow-xl border border-slate-700 max-w-xs">
                          <div className="font-bold text-slate-300 pb-1 border-b border-slate-800">
                            Horizon: {label}
                          </div>
                          <div className="space-y-1 mt-2 max-h-48 overflow-y-auto pr-1">
                            {payload.map((p) => (
                              <div key={p.name} className="flex items-center justify-between gap-3 text-[11px]">
                                <span className="font-semibold" style={{ color: p.color }}>
                                  {p.name}:
                                </span>
                                <span className="font-mono">
                                  {metricMode === "normalized"
                                    ? `${p.value}`
                                    : `₹${Number(p.value).toLocaleString("en-IN")}`}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                {routes.map((r) => (
                  <Line
                    key={r.route}
                    type="monotone"
                    dataKey={r.route}
                    stroke={ROUTE_COLORS[r.route] || "#64748b"}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                ))}
              </LineChart>
            ) : (
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="horizonDescription"
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
                        <div className="bg-slate-900 text-white rounded-xl p-3 text-xs shadow-xl border border-slate-700">
                          <div className="font-bold text-slate-300 pb-1 border-b border-slate-800">
                            Booking Window: {label}
                          </div>
                          <div className="mt-2 space-y-1">
                            <div className="text-base font-extrabold text-[#1f6feb]">
                              Total Fare: ₹{item.fare?.toLocaleString("en-IN")}
                            </div>
                            <div className="text-slate-300 flex items-center justify-between gap-3">
                              <span>Base Fare (~78%):</span>
                              <span className="font-mono">₹{item.baseFare?.toLocaleString("en-IN")}</span>
                            </div>
                            <div className="text-slate-400 flex items-center justify-between gap-3">
                              <span>Taxes & Fees (~22%):</span>
                              <span className="font-mono">₹{item.taxesFees?.toLocaleString("en-IN")}</span>
                            </div>
                            <div className="text-slate-400 text-[10px] pt-1 border-t border-slate-800">
                              Spread vs T+45: +{item.normalized - 100}%
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="baseFare"
                  stackId="1"
                  stroke="#1f6feb"
                  fill="#1f6feb"
                  fillOpacity={0.25}
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="taxesFees"
                  stackId="1"
                  stroke="#94a3b8"
                  fill="#94a3b8"
                  fillOpacity={0.3}
                  strokeWidth={1.5}
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Elasticity Matrix Table (All 10 Routes Side-by-Side) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Lead-Time Yield Compression Summary Table
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Empirical average fares at each booking horizon and full early-bird to last-minute spread
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Route</th>
                <th className="py-3 px-3 text-right">T+45 (Early)</th>
                <th className="py-3 px-3 text-right">T+30</th>
                <th className="py-3 px-3 text-right text-[#1f6feb]">T+15 (Benchmark)</th>
                <th className="py-3 px-3 text-right">T+7</th>
                <th className="py-3 px-3 text-right text-red-600">T+1 (Last-Minute)</th>
                <th className="py-3 px-4 text-right">Spread (T+1 - T+45)</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {routes.map((r) => {
                const f45 = elasticityByRoute[r.route]?.[45]?.fare || 0;
                const f30 = elasticityByRoute[r.route]?.[30]?.fare || 0;
                const f15 = elasticityByRoute[r.route]?.[15]?.fare || 0;
                const f7 = elasticityByRoute[r.route]?.[7]?.fare || 0;
                const f1 = elasticityByRoute[r.route]?.[1]?.fare || 0;
                const spread = f1 - f45;
                const spreadPct = f45 > 0 ? Math.round((spread / f45) * 100) : 0;

                return (
                  <tr key={r.route} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">
                        {r.origin} → {r.destination}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {r.traffic_share_label}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-emerald-700">
                      ₹{f45.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-3 text-right font-mono">
                      ₹{f30.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-[#1f6feb]">
                      ₹{f15.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-3 text-right font-mono">
                      ₹{f7.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-extrabold text-red-600">
                      ₹{f1.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="inline-block font-bold text-red-600">
                        +₹{spread.toLocaleString("en-IN")}
                      </span>
                      <span className="text-[10px] text-slate-400 ml-1">
                        (+{spreadPct}%)
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => onSelectRoute && onSelectRoute(r)}
                        className="text-[11px] font-semibold text-[#1f6feb] hover:underline"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
