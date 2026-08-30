import React from "react";
import { ResponsiveContainer, LineChart, Line } from "recharts";
import { ArrowUpRight, ArrowDownRight, ArrowRight, AlertTriangle } from "lucide-react";
import { RouteSummary } from "../types";

interface RouteBreakdownProps {
  routes: RouteSummary[];
  onSelectRoute?: (route: RouteSummary) => void;
}

export const RouteBreakdown: React.FC<RouteBreakdownProps> = ({ routes, onSelectRoute }) => {
  if (!routes || routes.length === 0) {
    return (
      <div id="routes-loading" className="bg-white rounded-xl border border-slate-200 p-6 text-center text-slate-500">
        Loading Route Basket...
      </div>
    );
  }

  // City names map
  const cityNames: Record<string, string> = {
    DEL: "Delhi",
    BOM: "Mumbai",
    BLR: "Bengaluru",
    HYD: "Hyderabad",
    PNQ: "Pune",
    CCU: "Kolkata",
  };

  return (
    <section id="route-breakdown-section" className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 tracking-tight">
            Route Breakdown
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            DGCA benchmark routes in pilot basket with rolling anomaly detection and trend trajectory
          </p>
        </div>
      </div>

      {/* Grid of 6 cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {routes.map((r) => {
          const originCity = cityNames[r.origin] || r.origin;
          const destCity = cityNames[r.destination] || r.destination;
          const isUp = r.trend === "trending_up";
          const isDown = r.trend === "trending_down";

          return (
            <div
              key={r.route}
              id={`route-card-${r.route.toLowerCase()}`}
              onClick={() => onSelectRoute && onSelectRoute(r)}
              className={`bg-white rounded-xl border p-5 transition-all shadow-xs relative ${
                r.is_anomaly
                  ? "border-red-300 ring-1 ring-red-100"
                  : "border-slate-200 hover:border-slate-300"
              } cursor-pointer hover:shadow-sm`}
            >
              {/* Card Header: Route Name & Surge Badge if Anomaly */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-base font-bold text-slate-900">
                      {r.origin} → {r.destination}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 font-medium">
                    {originCity} to {destCity}
                  </div>
                </div>

                {/* Surge Badge ONLY if is_anomaly is true */}
                {r.is_anomaly && (
                  <span
                    id={`surge-badge-${r.route.toLowerCase()}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-600 text-white shadow-xs animate-pulse"
                  >
                    <AlertTriangle className="w-3 h-3" />
                    Surge
                  </span>
                )}
              </div>

              {/* DGCA Weight Subtitle */}
              <div className="mt-2 text-xs font-medium text-slate-500">
                <span>{r.traffic_share_label}</span>
                <span className="text-slate-400 text-[11px] ml-1">
                  ({(r.normalized_weight * 100).toFixed(1)}% norm)
                </span>
              </div>

              {/* Fare & Trend Row */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-end justify-between">
                <div>
                  <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                    Latest Fare
                  </div>
                  <div className="text-2xl font-extrabold text-slate-900">
                    ₹{r.latest_fare.toLocaleString("en-IN")}
                  </div>
                </div>

                {/* Trend indicator & Sparkline */}
                <div className="flex flex-col items-end">
                  <div
                    className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded ${
                      isUp
                        ? "text-red-700 bg-red-50"
                        : isDown
                        ? "text-emerald-700 bg-emerald-50"
                        : "text-slate-600 bg-slate-100"
                    }`}
                  >
                    {isUp && <ArrowUpRight className="w-3.5 h-3.5" />}
                    {isDown && <ArrowDownRight className="w-3.5 h-3.5" />}
                    {!isUp && !isDown && <ArrowRight className="w-3.5 h-3.5" />}
                    <span className="capitalize">
                      {r.trend === "trending_up"
                        ? "Up"
                        : r.trend === "trending_down"
                        ? "Down"
                        : "Stable"}
                    </span>
                  </div>

                  {/* Sparkline */}
                  {r.history && r.history.length > 1 && (
                    <div className="w-24 h-8 mt-1">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={r.history}>
                          <Line
                            type="monotone"
                            dataKey="fare"
                            stroke={r.is_anomaly ? "#dc2626" : "#f97316"}
                            strokeWidth={2}
                            dot={false}
                            isAnimationActive={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
