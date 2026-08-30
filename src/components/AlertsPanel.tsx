import React from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { ActiveAlert } from "../types";

interface AlertsPanelProps {
  alerts: ActiveAlert[];
}

export const AlertsPanel: React.FC<AlertsPanelProps> = ({ alerts }) => {
  return (
    <section id="alerts-panel-section" className="mt-8 mb-12">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-slate-900 tracking-tight flex items-center gap-2">
          <span>Surge & Anomaly Alerts</span>
          {alerts && alerts.length > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-bold border border-red-200">
              {alerts.length} active
            </span>
          )}
        </h2>
        <span className="text-xs text-slate-400">Rule-based (&gt;15% above rolling avg)</span>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        {alerts && alerts.length > 0 ? (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.route}
                id={`alert-item-${alert.route.toLowerCase()}`}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-lg bg-red-50/70 border border-red-200 gap-2"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-1.5 rounded-full bg-red-100 text-red-600">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-slate-900">
                      {alert.origin} → {alert.destination}
                    </span>
                    <span className="text-xs text-slate-500 ml-2">
                      Current: <strong className="text-slate-800">₹{alert.latest_fare.toLocaleString("en-IN")}</strong>
                    </span>
                    <span className="text-xs text-slate-400 ml-2">
                      (Rolling Avg: ₹{Math.round(alert.rolling_avg).toLocaleString("en-IN")})
                    </span>
                  </div>
                </div>

                <div className="flex items-center self-end sm:self-center">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-red-600 text-white shadow-xs">
                    {alert.pct_above_average > 0 ? `+${alert.pct_above_average}%` : `${alert.pct_above_average}%`} above average
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div id="no-alerts-message" className="flex items-center space-x-2 text-sm text-slate-500 py-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>No fare anomalies detected</span>
          </div>
        )}
      </div>
    </section>
  );
};
