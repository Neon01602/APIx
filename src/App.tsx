/**
 * APIx — Real-Time Airfare Price Index Prototype
 * SIH 2026 PS 26056
 */

import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { IndexOverview } from "./components/IndexOverview";
import { RouteBreakdown } from "./components/RouteBreakdown";
import { AlertsPanel } from "./components/AlertsPanel";
import { RouteHeatmap } from "./components/RouteHeatmap";
import { LeadTimeElasticity } from "./components/LeadTimeElasticity";
import { RouteDetailModal } from "./components/RouteDetailModal";
import { ComplianceModal } from "./components/ComplianceModal";
import { InstitutionalModal } from "./components/InstitutionalModal";
import { DailyIndexPoint, RouteSummary, ActiveAlert } from "./types";
import { BarChart3, Grid3X3, TrendingUp, Sparkles, Layers } from "lucide-react";

type DashboardView = "overview" | "heatmap" | "elasticity";

export default function App() {
  const [activeView, setActiveView] = useState<DashboardView>("overview");
  const [dailyIndex, setDailyIndex] = useState<DailyIndexPoint[]>([]);
  const [routes, setRoutes] = useState<RouteSummary[]>([]);
  const [alerts, setAlerts] = useState<ActiveAlert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<RouteSummary | null>(null);
  const [isComplianceOpen, setIsComplianceOpen] = useState<boolean>(false);
  const [isInstitutionalOpen, setIsInstitutionalOpen] = useState<boolean>(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const [indexRes, routesRes, alertsRes] = await Promise.all([
          fetch("/api/index/daily"),
          fetch("/api/routes"),
          fetch("/api/alerts"),
        ]);

        if (!indexRes.ok || !routesRes.ok || !alertsRes.ok) {
          throw new Error("Failed to load one or more API endpoints.");
        }

        const [indexData, routesData, alertsData] = await Promise.all([
          indexRes.json(),
          routesRes.json(),
          alertsRes.json(),
        ]);

        setDailyIndex(indexData);
        setRoutes(routesData);
        setAlerts(alertsData);
      } catch (err: any) {
        console.error("Data fetch error:", err);
        setError("Error loading airfare data from backend.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans">
      {/* 1. Header Bar */}
      <Header
        onOpenCompliance={() => setIsComplianceOpen(true)}
        onOpenInstitutional={() => setIsInstitutionalOpen(true)}
      />

      {/* Main Dashboard Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Navigation / View Switcher Tabs */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
            <button
              id="view-tab-overview"
              onClick={() => setActiveView("overview")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeView === "overview"
                  ? "bg-white text-[#1f6feb] shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Index & 10-Route Basket</span>
            </button>

            <button
              id="view-tab-heatmap"
              onClick={() => setActiveView("heatmap")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeView === "heatmap"
                  ? "bg-white text-[#1f6feb] shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
              <span>Route Fare Heatmap</span>
            </button>

            <button
              id="view-tab-elasticity"
              onClick={() => setActiveView("elasticity")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeView === "elasticity"
                  ? "bg-white text-[#1f6feb] shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Lead-Time Elasticity</span>
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500 px-2">
            <span className="inline-flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              10 DGCA Routes Active (1,500 Observations)
            </span>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24 text-slate-500 text-sm">
            <div className="animate-pulse flex flex-col items-center gap-2">
              <div className="w-8 h-8 rounded-full border-2 border-[#1f6feb] border-t-transparent animate-spin"></div>
              <span>Loading APIx Airfare Index & Route Data...</span>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm">
            {error}
          </div>
        ) : (
          <div>
            {/* View 1: Overview (Index Chart, 10 Route Cards, Alerts) */}
            {activeView === "overview" && (
              <div className="space-y-8 animate-in fade-in duration-200">
                <IndexOverview initialData={dailyIndex} />
                <RouteBreakdown
                  routes={routes}
                  onSelectRoute={(route) => setSelectedRoute(route)}
                />
                <AlertsPanel alerts={alerts} />
              </div>
            )}

            {/* View 2: Route-Level Fare Heatmap (Route × Advance-Purchase Window) */}
            {activeView === "heatmap" && (
              <div className="animate-in fade-in duration-200">
                <RouteHeatmap
                  routes={routes}
                  onSelectRoute={(route) => setSelectedRoute(route)}
                />
              </div>
            )}

            {/* View 3: Lead-Time Fare Elasticity Curve (T+45 to T+1) */}
            {activeView === "elasticity" && (
              <div className="animate-in fade-in duration-200">
                <LeadTimeElasticity
                  routes={routes}
                  onSelectRoute={(route) => setSelectedRoute(route)}
                />
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modal for Route Fare Inspection, 2-Component Breakdown & Forecasting */}
      {selectedRoute && (
        <RouteDetailModal
          route={selectedRoute}
          onClose={() => setSelectedRoute(null)}
        />
      )}

      {/* Modal for Source Robots.txt & Compliance Audit */}
      <ComplianceModal
        isOpen={isComplianceOpen}
        onClose={() => setIsComplianceOpen(false)}
      />

      {/* Modal for Institutional NSO/RBI Access Tier */}
      <InstitutionalModal
        isOpen={isInstitutionalOpen}
        onClose={() => setIsInstitutionalOpen(false)}
      />
    </div>
  );
}
