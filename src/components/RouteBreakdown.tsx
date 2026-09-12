import React, { useState, useMemo } from "react";
import { ResponsiveContainer, LineChart, Line } from "recharts";
import { ArrowUpRight, ArrowDownRight, ArrowRight, AlertTriangle, Plane, Clock, ShieldCheck, Filter, X, Check } from "lucide-react";
import { RouteSummary } from "../types";
import { ROUTE_FLIGHT_METADATA, AERODROMES_REGISTRY, AIRLINES_REGISTRY, CARRIER_CORRIDOR_FLIGHTS } from "../data/airlines";

interface RouteBreakdownProps {
  routes: RouteSummary[];
  onSelectRoute?: (route: RouteSummary) => void;
}

export const RouteBreakdown: React.FC<RouteBreakdownProps> = ({ routes, onSelectRoute }) => {
  const [carrierFilter, setCarrierFilter] = useState<string>("ALL");
  const [anomalyOnly, setAnomalyOnly] = useState<boolean>(false);

  const cityNames: Record<string, string> = {
    DEL: "Delhi",
    BOM: "Mumbai",
    BLR: "Bengaluru",
    HYD: "Hyderabad",
    PNQ: "Pune",
    CCU: "Kolkata",
    AMD: "Ahmedabad",
    MAA: "Chennai",
  };

  // Safe route key resolution
  const getRouteKey = (r: RouteSummary) => {
    if (r.route) return r.route;
    return `${r.origin}-${r.destination}`;
  };

  // Filter routes based on carrier and surge anomaly
  const filteredRoutes = useMemo(() => {
    return (routes || []).filter((r) => {
      if (anomalyOnly && !r.is_anomaly) return false;
      if (carrierFilter !== "ALL") {
        const key = getRouteKey(r);
        const meta = ROUTE_FLIGHT_METADATA[key];
        if (!meta || !meta.activeAirlines.includes(carrierFilter)) {
          return false;
        }
      }
      return true;
    });
  }, [routes, anomalyOnly, carrierFilter]);

  const activeCarrierData = useMemo(() => {
    if (carrierFilter === "ALL") return null;
    return AIRLINES_REGISTRY.find((c) => c.code === carrierFilter) || null;
  }, [carrierFilter]);

  const surgeCount = (routes || []).filter((r) => r.is_anomaly).length;

  if (!routes || routes.length === 0) {
    return (
      <div id="routes-loading" className="bg-white rounded-xl border border-slate-200 p-6 text-center text-slate-500">
        Loading Route Basket...
      </div>
    );
  }

  return (
    <section id="route-breakdown-section" className="mt-8 space-y-4">
      {/* Section Header with Flight Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <Plane className="w-5 h-5 text-[#1f6feb] transform -rotate-45" />
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              10 DGCA Domestic Flight Corridors
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time airfares, operating carrier equipment, block times, and Rule 135 surge anomaly detection.
          </p>
        </div>

        {/* Carrier and Anomaly Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Carrier Pills Bar */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold overflow-x-auto">
            <span className="text-slate-500 px-2 flex items-center gap-1 font-medium">
              <Filter className="w-3 h-3 text-slate-400" />
              Carrier:
            </span>

            {/* ALL button */}
            <button
              id="carrier-filter-all"
              onClick={() => setCarrierFilter("ALL")}
              className={`px-3 py-1 rounded-lg transition-all font-semibold ${
                carrierFilter === "ALL"
                  ? "bg-white text-slate-900 shadow-xs border border-slate-200/80"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All
            </button>

            {/* Individual Airline Buttons: 6E, AI, QP, IX, SG, UK */}
            {AIRLINES_REGISTRY.map((carrier) => {
              const isSelected = carrierFilter === carrier.code;
              return (
                <button
                  key={carrier.code}
                  id={`carrier-filter-${carrier.code.toLowerCase()}`}
                  onClick={() => setCarrierFilter(carrier.code)}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                    isSelected
                      ? "bg-white shadow-xs border"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                  style={{
                    color: isSelected ? carrier.brandColor : undefined,
                    borderColor: isSelected ? `${carrier.brandColor}40` : "transparent",
                  }}
                  title={`${carrier.name} (${carrier.fullName})`}
                >
                  <span>{carrier.code}</span>
                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                </button>
              );
            })}
          </div>

          {/* Surge Only Filter Button */}
          <button
            id="surge-filter-btn"
            onClick={() => setAnomalyOnly(!anomalyOnly)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
              anomalyOnly
                ? "bg-red-600 text-white border-red-600 shadow-xs"
                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
            }`}
          >
            <AlertTriangle className={`w-3.5 h-3.5 ${anomalyOnly ? "text-white" : "text-amber-500"}`} />
            <span>Surge Only ({surgeCount})</span>
          </button>
        </div>
      </div>

      {/* Active Filter Notification Ribbon */}
      {(carrierFilter !== "ALL" || anomalyOnly) && (
        <div className="flex items-center justify-between px-4 py-2 bg-blue-50/70 border border-blue-200/80 rounded-xl text-xs text-blue-900">
          <div className="flex items-center gap-2">
            <span className="font-semibold">
              Showing {filteredRoutes.length} of {routes.length} corridors
            </span>
            {activeCarrierData && (
              <span className="flex items-center gap-1.5 pl-2 border-l border-blue-200">
                Operated by:{" "}
                <span
                  className="font-bold px-1.5 py-0.5 rounded text-white text-[10px]"
                  style={{ backgroundColor: activeCarrierData.brandColor }}
                >
                  {activeCarrierData.name} ({activeCarrierData.code})
                </span>
                <span className="text-blue-700 font-medium">
                  · {activeCarrierData.type} · OTP: {activeCarrierData.otpScore}%
                </span>
              </span>
            )}
            {anomalyOnly && (
              <span className="text-red-700 font-bold pl-2 border-l border-blue-200">
                Filtered: &gt;15% Surge Volatility Only
              </span>
            )}
          </div>

          <button
            onClick={() => {
              setCarrierFilter("ALL");
              setAnomalyOnly(false);
            }}
            className="flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:text-blue-900 underline underline-offset-2 ml-2 cursor-pointer"
          >
            <X className="w-3 h-3" />
            Reset Filters
          </button>
        </div>
      )}

      {/* Grid of Corridor Cards — STRICTLY 3 ROUTES PER ROW on desktop/wide screens (lg:grid-cols-3 xl:grid-cols-3) */}
      {filteredRoutes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800">No corridors match this filter combination</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try resetting the carrier or surge anomaly filter to view all 10 DGCA trunk routes.
          </p>
          <button
            onClick={() => {
              setCarrierFilter("ALL");
              setAnomalyOnly(false);
            }}
            className="mt-4 px-4 py-1.5 text-xs font-bold text-white bg-[#1f6feb] hover:bg-blue-600 rounded-lg transition-colors cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-5">
          {filteredRoutes.map((r) => {
            const routeKey = getRouteKey(r);
            const originCity = cityNames[r.origin] || r.origin;
            const destCity = cityNames[r.destination] || r.destination;
            const isUp = r.trend === "trending_up";
            const isDown = r.trend === "trending_down";

            const meta = ROUTE_FLIGHT_METADATA[routeKey];
            const originAero = AERODROMES_REGISTRY[r.origin];
            const destAero = AERODROMES_REGISTRY[r.destination];

            // Specific carrier flight details if a single carrier is filtered
            const flightInfo =
              carrierFilter !== "ALL"
                ? CARRIER_CORRIDOR_FLIGHTS[routeKey]?.[carrierFilter]
                : null;

            // Adjusted carrier fare calculation
            const effectiveFare = activeCarrierData
              ? Math.round(r.latest_fare * activeCarrierData.fareMultiplier)
              : r.latest_fare;

            // Unbundled 78% base fare vs 22% taxes
            const baseFareVal = Math.round(effectiveFare * 0.78);
            const taxesVal = effectiveFare - baseFareVal;

            return (
              <div
                key={routeKey}
                id={`route-card-${routeKey.toLowerCase()}`}
                onClick={() => onSelectRoute && onSelectRoute(r)}
                className={`bg-white rounded-2xl border p-5 transition-all shadow-xs relative flex flex-col justify-between hover:shadow-sm cursor-pointer group ${
                  r.is_anomaly
                    ? "border-red-300 ring-2 ring-red-100/70"
                    : activeCarrierData
                    ? "border-slate-300 hover:border-[#1f6feb]"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div>
                  {/* Card Header: Route Name & Surge Badge if Anomaly */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-base font-black text-slate-900 group-hover:text-[#1f6feb] transition-colors">
                          {r.origin} → {r.destination}
                        </span>
                        {activeCarrierData && flightInfo && (
                          <span
                            className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white"
                            style={{ backgroundColor: activeCarrierData.brandColor }}
                          >
                            {flightInfo.flightNo}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 font-medium mt-0.5">
                        {originCity} ({originAero?.icao}) to {destCity} ({destAero?.icao})
                      </div>
                    </div>

                    {/* Surge Badge ONLY if is_anomaly is true */}
                    {r.is_anomaly ? (
                      <span
                        id={`surge-badge-${routeKey.toLowerCase()}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-600 text-white shadow-xs animate-pulse"
                      >
                        <AlertTriangle className="w-3 h-3" />
                        +{r.deviation_pct}% Surge
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        Rule 135 Pass
                      </span>
                    )}
                  </div>

                  {/* Flight Metadata Row: Distance & Block Time & Primary Aircraft */}
                  <div className="flex items-center gap-2.5 text-[11px] text-slate-500 mt-2.5 pt-2 border-t border-slate-100">
                    <span className="flex items-center gap-1 font-medium">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {meta?.blockTimeHours || "2h 10m"}
                    </span>
                    <span>·</span>
                    <span>{meta?.distanceKm || 1100} km</span>
                    <span>·</span>
                    <span className="text-slate-600 font-medium truncate max-w-[120px]" title={flightInfo?.aircraft || meta?.primaryEquip}>
                      {flightInfo?.aircraft || meta?.primaryEquip}
                    </span>
                  </div>

                  {/* Operating Carrier Badges on Corridor */}
                  <div className="flex items-center gap-1.5 mt-2.5">
                    <span className="text-[10px] text-slate-400 font-medium">
                      {carrierFilter === "ALL" ? "Carriers:" : "Corridor Fleet:"}
                    </span>
                    <div className="flex items-center gap-1 flex-wrap">
                      {meta?.activeAirlines.map((carrierCode) => {
                        const carrier = AIRLINES_REGISTRY.find((c) => c.code === carrierCode);
                        const isThisCarrier = carrierCode === carrierFilter;
                        return (
                          <span
                            key={carrierCode}
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded transition-transform ${
                              isThisCarrier
                                ? "ring-2 ring-offset-1 ring-slate-800 scale-105"
                                : ""
                            }`}
                            style={{
                              backgroundColor: carrier?.brandColor || "#1f6feb",
                              color: "#ffffff",
                            }}
                            title={`${carrier?.name} (${carrier?.type})`}
                          >
                            {carrierCode}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Bottom Section: Fare & Trend Row */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                        {activeCarrierData ? `${activeCarrierData.name} Fare` : "All-Inclusive Fare"}
                      </div>
                      <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
                        ₹{effectiveFare.toLocaleString("en-IN")}
                      </div>
                    </div>

                    {/* Trend indicator & Sparkline */}
                    <div className="flex flex-col items-end">
                      <div
                        className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-md ${
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
                        <span>
                          {r.trend === "trending_up"
                            ? "Rising"
                            : r.trend === "trending_down"
                            ? "Easing"
                            : "Stable"}
                        </span>
                      </div>

                      {/* Sparkline */}
                      {r.history && r.history.length > 1 && (
                        <div className="w-24 h-7 mt-1">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={r.history}>
                              <Line
                                type="monotone"
                                dataKey="fare"
                                stroke={r.is_anomaly ? "#dc2626" : activeCarrierData ? activeCarrierData.brandColor : "#1f6feb"}
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

                  {/* 2-Component Decomposition (Base 78% vs Taxes/Fees 22%) */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 text-[10px]">
                    <div className="flex items-center justify-between text-slate-500 mb-1">
                      <span>
                        Base (78%): <strong className="text-slate-800 font-mono">₹{baseFareVal.toLocaleString("en-IN")}</strong>
                      </span>
                      <span>
                        Taxes (22%): <strong className="text-slate-800 font-mono">₹{taxesVal.toLocaleString("en-IN")}</strong>
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden flex">
                      <div
                        style={{
                          width: "78%",
                          backgroundColor: activeCarrierData?.brandColor || "#1f6feb",
                        }}
                        className="transition-all"
                        title={`Base Carrier Revenue: ₹${baseFareVal.toLocaleString("en-IN")}`}
                      />
                      <div
                        style={{ width: "22%" }}
                        className="bg-slate-300"
                        title={`Statutory Taxes & Airport Fees: ₹${taxesVal.toLocaleString("en-IN")}`}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
