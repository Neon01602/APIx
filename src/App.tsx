/**
 * APIx — Real-Time Airfare Price Index Prototype
 * SIH 2026 PS 26056
 */

import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { IndexOverview } from "./components/IndexOverview";
import { RouteBreakdown } from "./components/RouteBreakdown";
import { AlertsPanel } from "./components/AlertsPanel";
import { RouteDetailModal } from "./components/RouteDetailModal";
import { ComplianceModal } from "./components/ComplianceModal";
import { InstitutionalModal } from "./components/InstitutionalModal";
import { DailyIndexPoint, RouteSummary, ActiveAlert } from "./types";

export default function App() {
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
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-24 text-slate-500 text-sm">
            <div className="animate-pulse">Loading APIx Airfare Index...</div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm">
            {error}
          </div>
        ) : (
          <div className="space-y-8">
            {/* 2. Top Section — Index Overview */}
            <IndexOverview initialData={dailyIndex} />

            {/* 3. Middle Section — Route Breakdown (Grid of 6 cards) */}
            <RouteBreakdown
              routes={routes}
              onSelectRoute={(route) => setSelectedRoute(route)}
            />

            {/* 4. Bottom Section — Alerts Panel */}
            <AlertsPanel alerts={alerts} />
          </div>
        )}
      </main>

      {/* Modal for Route Fare Inspection, Breakdown & Forecasting */}
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
