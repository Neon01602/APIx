import React, { useState, useMemo } from "react";
import { RouteSummary, RouteHistoryItem } from "../types";
import { AlertTriangle, Info, Calendar, Filter, ArrowRight, TrendingUp } from "lucide-react";

interface RouteHeatmapProps {
  routes: RouteSummary[];
  onSelectRoute?: (route: RouteSummary) => void;
}

const ADVANCE_WINDOWS = [1, 7, 15, 30, 45] as const;

const CITY_NAMES: Record<string, string> = {
  DEL: "Delhi",
  BOM: "Mumbai",
  BLR: "Bengaluru",
  HYD: "Hyderabad",
  PNQ: "Pune",
  CCU: "Kolkata",
  AMD: "Ahmedabad",
  MAA: "Chennai",
};

export const RouteHeatmap: React.FC<RouteHeatmapProps> = ({ routes, onSelectRoute }) => {
  // Extract all available observation dates from the first route's history
  const availableDates = useMemo(() => {
    if (!routes || routes.length === 0 || !routes[0].history) return [];
    const dateSet = new Set<string>();
    routes[0].history.forEach((h) => dateSet.add(h.date));
    return Array.from(dateSet).sort();
  }, [routes]);

  // Selected date mode: 'latest', 'avg', or a specific date string
  const [selectedDateMode, setSelectedDateMode] = useState<string>("latest");
  const [hoveredCell, setHoveredCell] = useState<{
    route: string;
    advDays: number;
    fare: number;
    baseFare: number;
    taxesFees: number;
    isAnomaly: boolean;
    deviationPct: number;
  } | null>(null);

  // Compute cell data matrix: routeKey -> advDays -> { fare, base_fare, taxes_fees, is_anomaly, deviation_pct }
  const heatmapData = useMemo(() => {
    const matrix: Record<
      string,
      Record<
        number,
        {
          fare: number;
          baseFare: number;
          taxesFees: number;
          isAnomaly: boolean;
          deviationPct: number;
        }
      >
    > = {};

    routes.forEach((r) => {
      matrix[r.route] = {};
      ADVANCE_WINDOWS.forEach((w) => {
        matrix[r.route][w] = {
          fare: 0,
          baseFare: 0,
          taxesFees: 0,
          isAnomaly: false,
          deviationPct: 0,
        };
      });

      if (selectedDateMode === "avg") {
        // Compute 30-day average per advance window
        ADVANCE_WINDOWS.forEach((w) => {
          const matching = r.history.filter((h) => h.advance_days === w);
          if (matching.length > 0) {
            const sumFare = matching.reduce((acc, curr) => acc + curr.fare, 0);
            const sumBase = matching.reduce((acc, curr) => acc + (curr.base_fare || curr.fare * 0.78), 0);
            const sumTaxes = matching.reduce((acc, curr) => acc + (curr.taxes_fees || curr.fare * 0.22), 0);
            const avgFare = Math.round(sumFare / matching.length);
            const anyAnomaly = matching.some((h) => h.is_anomaly);
            const maxDev = Math.max(...matching.map((h) => h.deviation_pct));

            matrix[r.route][w] = {
              fare: avgFare,
              baseFare: Math.round(sumBase / matching.length),
              taxesFees: Math.round(sumTaxes / matching.length),
              isAnomaly: anyAnomaly,
              deviationPct: Math.round(maxDev),
            };
          }
        });
      } else {
        // Specific date (either 'latest' or selected date string)
        const targetDate =
          selectedDateMode === "latest"
            ? availableDates[availableDates.length - 1]
            : selectedDateMode;

        ADVANCE_WINDOWS.forEach((w) => {
          const item = r.history.find(
            (h) => h.date === targetDate && h.advance_days === w
          );
          if (item) {
            matrix[r.route][w] = {
              fare: Math.round(item.fare),
              baseFare: Math.round(item.base_fare || item.fare * 0.78),
              taxesFees: Math.round(item.taxes_fees || item.fare * 0.22),
              isAnomaly: item.is_anomaly,
              deviationPct: Math.round(item.deviation_pct),
            };
          }
        });
      }
    });

    return matrix;
  }, [routes, selectedDateMode, availableDates]);

  // Compute global min & max fare in current matrix to scale colors smoothly
  const { minFare, maxFare } = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;

    routes.forEach((r) => {
      ADVANCE_WINDOWS.forEach((w) => {
        const f = heatmapData[r.route]?.[w]?.fare || 0;
        if (f > 0) {
          if (f < min) min = f;
          if (f > max) max = f;
        }
      });
    });

    return { minFare: min === Infinity ? 3000 : min, maxFare: max === -Infinity ? 9000 : max };
  }, [routes, heatmapData]);

  // Color interpolation based on normalized fare intensity
  const getCellColor = (fare: number, isAnomaly: boolean) => {
    if (!fare) return "bg-slate-100 text-slate-400";
    if (isAnomaly) {
      return "bg-red-500 text-white font-bold ring-2 ring-red-300 ring-inset";
    }

    const range = maxFare - minFare || 1;
    const ratio = Math.max(0, Math.min(1, (fare - minFare) / range));

    if (ratio < 0.2) {
      return "bg-emerald-50 text-emerald-900 border border-emerald-200/50";
    } else if (ratio < 0.4) {
      return "bg-blue-50 text-blue-900 border border-blue-200/50";
    } else if (ratio < 0.6) {
      return "bg-amber-50 text-amber-900 border border-amber-200/50";
    } else if (ratio < 0.8) {
      return "bg-orange-100 text-orange-950 border border-orange-300/60";
    } else {
      return "bg-rose-100 text-rose-950 font-bold border border-rose-300/70";
    }
  };

  // Route average fare in current view
  const getRouteAvg = (routeKey: string) => {
    const vals = ADVANCE_WINDOWS.map((w) => heatmapData[routeKey]?.[w]?.fare || 0).filter(
      (v) => v > 0
    );
    if (vals.length === 0) return 0;
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  };

  // Window average fare in current view
  const getWindowAvg = (w: number) => {
    const vals = routes.map((r) => heatmapData[r.route]?.[w]?.fare || 0).filter((v) => v > 0);
    if (vals.length === 0) return 0;
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  };

  if (!routes || routes.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
        Loading route heatmap data...
      </div>
    );
  }

  return (
    <div id="route-heatmap-container" className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1f6feb]"></span>
              <h2 className="text-lg font-bold text-slate-900">
                Route-Level Fare Intensity Heatmap
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
              Real airfare pricing density across all 10 DGCA benchmark routes and 5 advance-purchase booking horizons (T+1 to T+45). Identifies dynamic yield compression and surge anomalies.
            </p>
          </div>

          {/* Date Selector Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#1f6feb]" />
              Observation Cycle:
            </span>
            <select
              id="heatmap-date-selector"
              value={selectedDateMode}
              onChange={(e) => setSelectedDateMode(e.target.value)}
              className="text-xs font-medium bg-slate-50 border border-slate-300 text-slate-800 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#1f6feb]"
            >
              <option value="latest">Latest Cycle ({availableDates[availableDates.length - 1] || "Latest"})</option>
              <option value="avg">30-Day Period Average</option>
              <optgroup label="Key Event Benchmarks">
                <option value="2026-08-15">Independence Day Surge (2026-08-15)</option>
                <option value="2026-08-24">Janmashtami / Raksha Bandhan (2026-08-24)</option>
                <option value="2026-08-01">Base Period (2026-08-01)</option>
                <option value="2026-08-08">Weekend Peak (2026-08-08)</option>
                <option value="2026-08-28">Market Normalization (2026-08-28)</option>
              </optgroup>
              <optgroup label="All Observation Dates">
                {availableDates.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>
        </div>

        {/* Legend Row */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-500">
            <span className="font-semibold text-slate-700">Fare Scale:</span>
            <div className="flex items-center gap-1.5">
              <span className="inline-block px-2 py-0.5 rounded text-[11px] bg-emerald-50 text-emerald-900 border border-emerald-200">
                Low (&lt;₹3.8k)
              </span>
              <span className="inline-block px-2 py-0.5 rounded text-[11px] bg-blue-50 text-blue-900 border border-blue-200">
                Standard
              </span>
              <span className="inline-block px-2 py-0.5 rounded text-[11px] bg-amber-50 text-amber-900 border border-amber-200">
                Elevated
              </span>
              <span className="inline-block px-2 py-0.5 rounded text-[11px] bg-rose-100 text-rose-950 border border-rose-200 font-semibold">
                High
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-red-500 text-white font-bold">
                <AlertTriangle className="w-2.5 h-2.5" /> Surge Anomaly (&gt;15%)
              </span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400">
            Range in current view: <strong className="text-slate-700">₹{minFare.toLocaleString("en-IN")}</strong> – <strong className="text-slate-700">₹{maxFare.toLocaleString("en-IN")}</strong>
          </div>
        </div>
      </div>

      {/* Heatmap Matrix Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4 sticky left-0 bg-slate-50 z-10 w-56">
                  Route & Traffic Share
                </th>
                <th className="py-3.5 px-3 text-center">
                  <div className="font-bold text-slate-900">T+1 Day</div>
                  <div className="text-[10px] text-slate-400 font-normal uppercase">Last-Minute</div>
                </th>
                <th className="py-3.5 px-3 text-center">
                  <div className="font-bold text-slate-900">T+7 Days</div>
                  <div className="text-[10px] text-slate-400 font-normal uppercase">Short Horizon</div>
                </th>
                <th className="py-3.5 px-3 text-center">
                  <div className="font-bold text-[#1f6feb]">T+15 Days</div>
                  <div className="text-[10px] text-[#1f6feb] font-semibold uppercase">Benchmark</div>
                </th>
                <th className="py-3.5 px-3 text-center">
                  <div className="font-bold text-slate-900">T+30 Days</div>
                  <div className="text-[10px] text-slate-400 font-normal uppercase">Planned</div>
                </th>
                <th className="py-3.5 px-3 text-center">
                  <div className="font-bold text-slate-900">T+45 Days</div>
                  <div className="text-[10px] text-slate-400 font-normal uppercase">Early-Bird</div>
                </th>
                <th className="py-3.5 px-4 text-right bg-slate-100/60 w-32">
                  Route Mean
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {routes.map((r) => {
                const originCity = CITY_NAMES[r.origin] || r.origin;
                const destCity = CITY_NAMES[r.destination] || r.destination;
                const routeAvg = getRouteAvg(r.route);

                return (
                  <tr
                    key={r.route}
                    className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                    onClick={() => onSelectRoute && onSelectRoute(r)}
                  >
                    {/* Route Label Cell */}
                    <td className="py-3.5 px-4 sticky left-0 bg-white group-hover:bg-slate-50 transition-colors z-10 border-r border-slate-100">
                      <div className="flex items-baseline justify-between">
                        <span className="font-bold text-slate-900 text-sm">
                          {r.origin} → {r.destination}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-500 ml-2">
                          {(r.normalized_weight * 100).toFixed(1)}% wt
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                        {originCity} to {destCity} ({r.traffic_share_label})
                      </div>
                    </td>

                    {/* Heatmap cells for 5 advance windows */}
                    {ADVANCE_WINDOWS.map((w) => {
                      const cell = heatmapData[r.route]?.[w] || {
                        fare: 0,
                        baseFare: 0,
                        taxesFees: 0,
                        isAnomaly: false,
                        deviationPct: 0,
                      };
                      const colorClass = getCellColor(cell.fare, cell.isAnomaly);

                      return (
                        <td
                          key={w}
                          className="p-1.5 text-center"
                          onMouseEnter={() =>
                            setHoveredCell({
                              route: r.route,
                              advDays: w,
                              fare: cell.fare,
                              baseFare: cell.baseFare,
                              taxesFees: cell.taxesFees,
                              isAnomaly: cell.isAnomaly,
                              deviationPct: cell.deviationPct,
                            })
                          }
                          onMouseLeave={() => setHoveredCell(null)}
                        >
                          <div
                            className={`py-2 px-2.5 rounded-lg text-xs transition-all transform hover:scale-105 shadow-2xs flex flex-col items-center justify-center ${colorClass}`}
                          >
                            <span className="font-extrabold tracking-tight">
                              ₹{cell.fare.toLocaleString("en-IN")}
                            </span>
                            {cell.isAnomaly && (
                              <span className="inline-flex items-center gap-0.5 text-[9px] uppercase tracking-wider mt-0.5 px-1 rounded bg-black/20 text-white font-bold">
                                +{cell.deviationPct}%
                              </span>
                            )}
                          </div>
                        </td>
                      );
                    })}

                    {/* Route Average */}
                    <td className="py-3 px-4 text-right font-bold text-slate-800 bg-slate-50/40 border-l border-slate-100">
                      ₹{routeAvg.toLocaleString("en-IN")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {/* Table Footer: Column (Advance Window) Averages */}
            <tfoot>
              <tr className="bg-slate-100/80 border-t-2 border-slate-200 text-xs font-bold text-slate-700">
                <td className="py-3 px-4 sticky left-0 bg-slate-100 z-10 uppercase tracking-wider text-[11px]">
                  Basket Window Average
                </td>
                {ADVANCE_WINDOWS.map((w) => {
                  const winAvg = getWindowAvg(w);
                  return (
                    <td key={w} className="py-3 px-3 text-center font-extrabold text-slate-900">
                      ₹{winAvg.toLocaleString("en-IN")}
                    </td>
                  );
                })}
                <td className="py-3 px-4 text-right text-slate-900 font-extrabold">
                  ₹{Math.round(
                    ADVANCE_WINDOWS.map(getWindowAvg).reduce((a, b) => a + b, 0) /
                      ADVANCE_WINDOWS.length
                  ).toLocaleString("en-IN")}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Floating or fixed Hover Inspection Card */}
      {hoveredCell && (
        <div className="bg-slate-900 text-white p-4 rounded-xl shadow-xl border border-slate-700 max-w-md mx-auto flex items-center justify-between gap-4 animate-in fade-in duration-100">
          <div>
            <div className="text-xs font-semibold text-slate-400">
              {hoveredCell.route} | Advance Window: <span className="text-[#58a6ff]">T+{hoveredCell.advDays} Days</span>
            </div>
            <div className="text-xl font-bold text-white mt-0.5">
              ₹{hoveredCell.fare.toLocaleString("en-IN")}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              Base: ₹{hoveredCell.baseFare.toLocaleString("en-IN")} (~78%) + Taxes/Fees: ₹{hoveredCell.taxesFees.toLocaleString("en-IN")} (~22%)
            </div>
          </div>
          {hoveredCell.isAnomaly && (
            <div className="text-right">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-red-600 text-white text-xs font-bold">
                <AlertTriangle className="w-3.5 h-3.5" /> Surge Active (+{hoveredCell.deviationPct}%)
              </span>
            </div>
          )}
        </div>
      )}

      {/* Analytical Callouts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Last-Minute Surge Premium (T+1 vs T+45)
          </div>
          <div className="text-2xl font-extrabold text-red-600 mt-1">
            +{Math.round(((getWindowAvg(1) - getWindowAvg(45)) / getWindowAvg(45)) * 100)}%
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Average spread across 10 routes between last-minute emergency booking (₹{getWindowAvg(1).toLocaleString("en-IN")}) and 45-day early-bird advance booking (₹{getWindowAvg(45).toLocaleString("en-IN")}).
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Early-Bird Discount (T+45 vs T+15)
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">
            -{Math.round(((getWindowAvg(15) - getWindowAvg(45)) / getWindowAvg(15)) * 100)}%
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Discount captured by booking 45 days in advance vs the DGCA standard 15-day index benchmark window (₹{getWindowAvg(15).toLocaleString("en-IN")}).
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Benchmark Yield Anchor
          </div>
          <div className="text-2xl font-extrabold text-[#1f6feb] mt-1">
            ₹{getWindowAvg(15).toLocaleString("en-IN")}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Weighted average fare at standard T+15 window across all 10 DGCA pilot routes, representing the core price basis used in the Laspeyres index.
          </p>
        </div>
      </div>
    </div>
  );
};
