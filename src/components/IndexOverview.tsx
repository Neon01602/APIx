import React, { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  BarChart,
  Bar,
} from "recharts";
import { TrendingUp, TrendingDown, Minus, Info, Tag, Calendar, Layers } from "lucide-react";
import { IndexSeriesPoint } from "../types";

type Frequency = "daily" | "weekly" | "monthly";

interface IndexOverviewProps {
  initialData?: IndexSeriesPoint[];
}

export const IndexOverview: React.FC<IndexOverviewProps> = ({ initialData = [] }) => {
  const [frequency, setFrequency] = useState<Frequency>("daily");
  const [seriesData, setSeriesData] = useState<IndexSeriesPoint[]>(initialData);
  const [loadingFrequency, setLoadingFrequency] = useState<boolean>(false);

  // Sync when initialData changes initially
  useEffect(() => {
    if (initialData.length > 0 && frequency === "daily") {
      setSeriesData(initialData);
    }
  }, [initialData]);

  // Fetch data when frequency changes
  useEffect(() => {
    let isMounted = true;
    async function fetchFrequencyData() {
      if (frequency === "daily" && initialData.length > 0) {
        setSeriesData(initialData);
        return;
      }
      try {
        setLoadingFrequency(true);
        const res = await fetch(`/api/index/${frequency}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setSeriesData(data);
          }
        }
      } catch (err) {
        console.error(`Failed to fetch ${frequency} index data:`, err);
      } finally {
        if (isMounted) {
          setLoadingFrequency(false);
        }
      }
    }
    fetchFrequencyData();
    return () => {
      isMounted = false;
    };
  }, [frequency]);

  const data = seriesData;

  if (!data || data.length === 0) {
    return (
      <div id="index-overview-loading" className="bg-white rounded-xl border border-slate-200 p-6 text-center text-slate-500">
        Loading Index Data...
      </div>
    );
  }

  const latestPoint = data[data.length - 1];
  const changePct = latestPoint ? latestPoint.change_pct : 0;
  const isUp = changePct > 0;
  const isDown = changePct < 0;

  const formatXAxis = (dateStr: string) => {
    try {
      if (frequency === "monthly") {
        return dateStr;
      }
      if (frequency === "weekly") {
        const pt = data.find((d) => d.date === dateStr || d.week_label === dateStr);
        if (pt && pt.week_label) {
          return pt.week_label;
        }
        if (dateStr.includes(" to ")) {
          const start = dateStr.split(" to ")[0];
          return start.slice(5);
        }
      }
      const parts = dateStr.split("-");
      if (parts.length === 3) {
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const monthIdx = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        return `${months[monthIdx]} ${day}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const minVal = Math.floor(Math.min(...data.map((d) => d.index_value)) - 2);
  const maxVal = Math.ceil(Math.max(...data.map((d) => d.index_value)) + 2);

  // Extract events present in data
  const events = data.filter((d) => d.event_tag);

  return (
    <section id="index-overview-section" className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
        {/* Left: Section Header, Formula note, & Frequency Switcher */}
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-slate-900 tracking-tight">APIx Index Overview</h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-50 text-[#1f6feb] border border-blue-200">
              Laspeyres Σ[wᵢ·(Pᵢ,ₜ/Pᵢ,₀)]×100
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Aggregated airfare price index across 6 high-density DGCA routes. Base period P₀ = 100.0.
          </p>

          {/* Aggregation Frequency Toggle */}
          <div className="flex items-center gap-1.5 mt-3">
            <span className="text-xs text-slate-500 font-medium mr-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Frequency:
            </span>
            <div className="inline-flex p-0.5 bg-slate-100 rounded-lg border border-slate-200 text-xs">
              <button
                id="freq-btn-daily"
                onClick={() => setFrequency("daily")}
                className={`px-3 py-1 font-medium rounded-md transition-all ${
                  frequency === "daily"
                    ? "bg-white text-[#1f6feb] shadow-xs font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Daily (Real-Time)
              </button>
              <button
                id="freq-btn-weekly"
                onClick={() => setFrequency("weekly")}
                className={`px-3 py-1 font-medium rounded-md transition-all ${
                  frequency === "weekly"
                    ? "bg-white text-[#1f6feb] shadow-xs font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Weekly Rollup
              </button>
              <button
                id="freq-btn-monthly"
                onClick={() => setFrequency("monthly")}
                className={`px-3 py-1 font-medium rounded-md transition-all ${
                  frequency === "monthly"
                    ? "bg-white text-[#1f6feb] shadow-xs font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Monthly Rollup
              </button>
            </div>
          </div>
        </div>

        {/* Right: Current Index Large Callout */}
        <div id="current-index-callout" className="flex items-center gap-4 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 self-start md:self-auto">
          <div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              {frequency === "daily" ? "Current APIx" : frequency === "weekly" ? "Latest Weekly Avg" : "Monthly Avg"}
            </div>
            <div className="text-3xl font-extrabold text-slate-900 leading-tight">
              {latestPoint.index_value.toFixed(1)}
            </div>
          </div>

          <div className="flex flex-col items-start border-l border-slate-200 pl-3">
            <div
              className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${
                isUp
                  ? "bg-emerald-50 text-emerald-700"
                  : isDown
                  ? "bg-blue-50 text-[#1f6feb]"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {isUp && <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />}
              {isDown && <TrendingDown className="w-3.5 h-3.5 text-[#1f6feb]" />}
              {!isUp && !isDown && <Minus className="w-3.5 h-3.5 text-slate-500" />}
              <span>{isUp ? `+${changePct}%` : `${changePct}%`}</span>
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5">
              vs prev {frequency === "daily" ? "day" : frequency === "weekly" ? "week" : "month"}
            </span>
          </div>
        </div>
      </div>

      {/* Primary Line Chart (Recharts) */}
      <div id="index-line-chart-container" className="h-72 w-full relative">
        {loadingFrequency && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-10 text-xs text-slate-600 font-medium">
            Loading {frequency} aggregation...
          </div>
        )}
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis
              dataKey="date"
              tickFormatter={formatXAxis}
              stroke="#64748b"
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: "#cbd5e1" }}
            />
            <YAxis
              domain={[minVal, maxVal]}
              stroke="#64748b"
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: "#cbd5e1" }}
              tickFormatter={(val) => `${val}`}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const point = payload[0].payload as IndexSeriesPoint;
                  return (
                    <div className="bg-slate-900 text-white rounded-lg px-3 py-2.5 text-xs shadow-lg border border-slate-700 max-w-xs">
                      <div className="font-semibold text-slate-300">
                        {point.week_label ? `${point.week_label} (${point.date})` : point.date}
                      </div>
                      <div className="text-sm font-bold text-white mt-1">
                        {frequency === "daily" ? "APIx Index: " : `${frequency.charAt(0).toUpperCase() + frequency.slice(1)} Average: `}
                        <span className="text-[#38bdf8]">{point.index_value}</span>
                      </div>
                      <div className="text-slate-400 text-[11px] mt-0.5">
                        Period change: {point.change_pct > 0 ? `+${point.change_pct}%` : `${point.change_pct}%`}
                      </div>
                      {point.observation_days && (
                        <div className="text-slate-400 text-[11px]">
                          Observations: {point.observation_days} daily samples
                        </div>
                      )}
                      {point.event_tag && (
                        <div className="mt-2 pt-1.5 border-t border-slate-800 text-[11px]">
                          <span className="text-amber-400 font-bold block">Event: {point.event_tag}</span>
                          <span className="text-slate-300">{point.event_description}</span>
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />
            <ReferenceLine y={100} stroke="#94a3b8" strokeDasharray="4 4" label={{ value: "Base 100", fill: "#94a3b8", fontSize: 10, position: "insideBottomRight" }} />
            <Line
              type="monotone"
              dataKey="index_value"
              stroke="#1f6feb"
              strokeWidth={3}
              dot={{ r: 4, fill: "#1f6feb", strokeWidth: 1.5, stroke: "#ffffff" }}
              activeDot={{ r: 6, fill: "#1f6feb", stroke: "#ffffff", strokeWidth: 2 }}
              isAnimationActive={true}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Event Tag Annotations Bar */}
      {events.length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
            <Tag className="w-3.5 h-3.5 text-amber-600" />
            <span>Economic Events in Range:</span>
          </span>
          {events.map((ev, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] bg-amber-50 text-amber-800 border border-amber-200"
              title={`${ev.date}: ${ev.event_description}`}
            >
              <strong>{ev.date.slice(5)}</strong>: {ev.event_tag?.replace(/_/g, " ")}
            </span>
          ))}
        </div>
      )}

      {/* Basket meta breakdown footer */}
      <div className="mt-3 pt-2 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
        <div className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-slate-400" />
          <span>
            {frequency === "daily"
              ? `Daily observation span: ${data[0]?.date} to ${latestPoint?.date} (${data.length} daily readings)`
              : frequency === "weekly"
              ? `Weekly aggregation: ${data.length} calendar weeks tracked`
              : `Monthly aggregation: ${data.length} months tracked`}
          </span>
        </div>
        <div>
          <span>DGCA 6-Route Basket (14.89% national passenger traffic normalized to 100%)</span>
        </div>
      </div>
    </section>
  );
};
