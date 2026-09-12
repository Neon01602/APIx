/**
 * AirlineComparison.tsx
 * Comprehensive Domestic Indian Airline Carrier Matrix & Flight Compliance Tracker
 * Features IndiGo (6E), Air India (AI), Akasa Air (QP), AIX Connect (IX), SpiceJet (SG), and Vistara (UK)
 */

import React, { useState, useMemo } from "react";
import { AIRLINES_REGISTRY, ROUTE_FLIGHT_METADATA, AERODROMES_REGISTRY } from "../data/airlines";
import { RouteSummary } from "../types";
import {
  Plane,
  ShieldCheck,
  Clock,
  BarChart2,
  TrendingUp,
  Award,
  Layers,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Sparkles,
} from "lucide-react";

interface AirlineComparisonProps {
  routes: RouteSummary[];
  onSelectRoute?: (route: RouteSummary) => void;
}

export const AirlineComparison: React.FC<AirlineComparisonProps> = ({
  routes,
  onSelectRoute,
}) => {
  const [selectedCarrierCode, setSelectedCarrierCode] = useState<string>("ALL");
  const [selectedFilterType, setSelectedFilterType] = useState<"ALL" | "LCC" | "FSC">("ALL");

  const filteredAirlines = useMemo(() => {
    return AIRLINES_REGISTRY.filter((airline) => {
      if (selectedFilterType !== "ALL" && airline.type !== selectedFilterType) return false;
      return true;
    });
  }, [selectedFilterType]);

  const activeCarrier = useMemo(() => {
    return AIRLINES_REGISTRY.find((a) => a.code === selectedCarrierCode) || null;
  }, [selectedCarrierCode]);

  // Compute average route fares by carrier relative to index routes
  const carrierRouteFares = useMemo(() => {
    return routes.map((r) => {
      const meta = ROUTE_FLIGHT_METADATA[r.route];
      const baseFare = r.latest_fare;

      const carrierPrices = AIRLINES_REGISTRY.map((carrier) => {
        const adjustedFare = Math.round(baseFare * carrier.fareMultiplier);
        const isActiveOnRoute = meta?.activeAirlines.includes(carrier.code) ?? true;
        return {
          code: carrier.code,
          name: carrier.name,
          fare: adjustedFare,
          baseFare: Math.round(adjustedFare * 0.78),
          taxes: Math.round(adjustedFare * 0.22),
          isActive: isActiveOnRoute,
        };
      });

      return {
        routeKey: r.route,
        routeSummary: r,
        metadata: meta,
        originAerodrome: AERODROMES_REGISTRY[r.origin],
        destAerodrome: AERODROMES_REGISTRY[r.destination],
        carrierPrices,
        lowestPrice: Math.min(...carrierPrices.filter((p) => p.isActive).map((p) => p.fare)),
      };
    });
  }, [routes]);

  return (
    <div className="space-y-6">
      {/* Top Banner: Indian Civil Aviation Multi-Carrier Landscape */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-50 text-[#1f6feb] border border-blue-200">
                <Plane className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Scheduled Commercial Carriers & Fleet Matrix
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Real-time monitoring of domestic Indian carriers across trunk routes. Evaluated for DGCA passenger market share, On-Time Performance (OTP), and Civil Aviation Requirements (CAR) Section 3 unbundled tariff compliance.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium mr-1">Carrier Category:</span>
            <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold">
              <button
                onClick={() => setSelectedFilterType("ALL")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  selectedFilterType === "ALL" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                All Carriers (6)
              </button>
              <button
                onClick={() => setSelectedFilterType("LCC")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  selectedFilterType === "LCC" ? "bg-white text-[#1f6feb] shadow-xs" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Low-Cost (LCC)
              </button>
              <button
                onClick={() => setSelectedFilterType("FSC")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  selectedFilterType === "FSC" ? "bg-white text-[#1f6feb] shadow-xs" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Full-Service (FSC)
              </button>
            </div>
          </div>
        </div>

        {/* 6 Airline Carrier Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {filteredAirlines.map((airline) => {
            const isSelected = selectedCarrierCode === airline.code;
            return (
              <div
                key={airline.code}
                onClick={() => setSelectedCarrierCode(isSelected ? "ALL" : airline.code)}
                className={`rounded-xl border p-5 transition-all cursor-pointer relative bg-white ${
                  isSelected
                    ? "border-[#1f6feb] ring-2 ring-blue-100 shadow-sm"
                    : "border-slate-200 hover:border-slate-300 hover:shadow-xs"
                }`}
              >
                {/* Header: Carrier Code + Name + Type */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm tracking-wider shadow-xs"
                      style={{ backgroundColor: airline.brandColor, color: "#ffffff" }}
                    >
                      {airline.code}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-slate-900">{airline.name}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase bg-slate-100 text-slate-600 border border-slate-200">
                          {airline.type}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-medium truncate max-w-[180px]">
                        {airline.fullName}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${airline.badgeBg} ${airline.badgeText}`}
                  >
                    {airline.marketShare}% Share
                  </span>
                </div>

                {/* Market Share Bar */}
                <div className="mt-3.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                    <span>Domestic Market Share</span>
                    <span className="font-semibold text-slate-800">{airline.marketShare}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, airline.marketShare * 1.4)}%`, backgroundColor: airline.brandColor }}
                    />
                  </div>
                </div>

                {/* Key Metrics: OTP & CAR Compliance */}
                <div className="grid grid-cols-2 gap-2 mt-3.5 pt-3 border-t border-slate-100 text-xs">
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <div className="text-[10px] text-slate-400 uppercase font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      On-Time (OTP)
                    </div>
                    <div className="font-bold text-slate-900 text-sm mt-0.5">{airline.otpScore}%</div>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <div className="text-[10px] text-slate-400 uppercase font-medium flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      CAR Sec-3
                    </div>
                    <div className="font-bold text-emerald-700 text-sm mt-0.5">{airline.carComplianceScore}%</div>
                  </div>
                </div>

                {/* Fleet equipment tags */}
                <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                  {airline.fleet.map((craft, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200/60"
                    >
                      {craft}
                    </span>
                  ))}
                </div>

                {/* Rule 135 Rating Badge */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Rule 135 Volatility:</span>
                  <span className="font-bold text-slate-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    {airline.rule135Rating.replace("_", " ")}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cross-Carrier Trunk Route Comparison Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#1f6feb]" />
              Trunk Route Carrier Pricing & Equipment Matrix
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live estimated fares by operating carrier on the 10 benchmark routes. Click any row to open the complete Route Detail modal.
            </p>
          </div>
          <div className="text-xs text-slate-400 font-medium">
            * All-inclusive total fares decomposing Base Fare (78%) and Taxes (22%)
          </div>
        </div>

        <div className="mt-4 overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
              <tr>
                <th className="px-4 py-3">Route Corridor</th>
                <th className="px-3 py-3">Block Time</th>
                <th className="px-3 py-3">Primary Equipment</th>
                <th className="px-3 py-3 text-right">IndiGo (6E)</th>
                <th className="px-3 py-3 text-right">Air India (AI)</th>
                <th className="px-3 py-3 text-right">Akasa (QP)</th>
                <th className="px-3 py-3 text-right">AIX Connect (IX)</th>
                <th className="px-3 py-3 text-right">SpiceJet (SG)</th>
                <th className="px-3 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {carrierRouteFares.map((item) => {
                const isAnomaly = item.routeSummary.is_anomaly;
                return (
                  <tr
                    key={item.routeKey}
                    className={`hover:bg-slate-50/70 transition-colors ${
                      isAnomaly ? "bg-red-50/20" : ""
                    }`}
                  >
                    {/* Corridor */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">
                          {item.routeSummary.origin} → {item.routeSummary.destination}
                        </span>
                        {isAnomaly && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-600 text-white">
                            SURGE
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {item.originAerodrome?.city} ({item.originAerodrome?.icao}) to{" "}
                        {item.destAerodrome?.city} ({item.destAerodrome?.icao}) · {item.metadata?.distanceKm} km
                      </div>
                    </td>

                    {/* Block time */}
                    <td className="px-3 py-3 text-slate-600 font-mono">
                      {item.metadata?.blockTimeHours || "2h 00m"}
                    </td>

                    {/* Equipment */}
                    <td className="px-3 py-3 text-slate-500 text-[11px]">
                      {item.metadata?.primaryEquip || "A320neo"}
                    </td>

                    {/* Carrier Prices */}
                    {["6E", "AI", "QP", "IX", "SG"].map((carrierCode) => {
                      const cp = item.carrierPrices.find((c) => c.code === carrierCode);
                      if (!cp || !cp.isActive) {
                        return (
                          <td key={carrierCode} className="px-3 py-3 text-right text-slate-300">
                            —
                          </td>
                        );
                      }
                      const isLowest = cp.fare === item.lowestPrice;
                      return (
                        <td key={carrierCode} className="px-3 py-3 text-right">
                          <div
                            className={`font-mono text-xs ${
                              isLowest ? "text-emerald-700 font-bold" : "text-slate-800"
                            }`}
                          >
                            ₹{cp.fare.toLocaleString("en-IN")}
                          </div>
                          <div className="text-[9px] text-slate-400 font-mono">
                            Base: ₹{cp.baseFare.toLocaleString("en-IN")}
                          </div>
                        </td>
                      );
                    })}

                    {/* Inspect button */}
                    <td className="px-3 py-3 text-center">
                      <button
                        onClick={() => onSelectRoute && onSelectRoute(item.routeSummary)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-[#1f6feb] text-slate-600 hover:text-white transition-colors"
                        title="Inspect full route detail, charts, and forecasts"
                      >
                        <ChevronRight className="w-4 h-4" />
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
