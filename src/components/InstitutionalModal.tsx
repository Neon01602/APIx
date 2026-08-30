import React, { useState } from "react";
import { X, KeyRound, Lock, CheckCircle2, Copy, AlertCircle } from "lucide-react";

interface InstitutionalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstitutionalModal: React.FC<InstitutionalModalProps> = ({ isOpen, onClose }) => {
  const [apiKey, setApiKey] = useState<string>("NSO_RBI_SECURE_KEY_2026");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleFetchDetailedFeed = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/routes/detailed", {
        headers: {
          "X-API-Key": apiKey,
        },
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.message || `HTTP ${res.status} Unauthorized`);
      }

      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-3xl w-full p-6 relative animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-[#1f6feb]" />
              <h3 className="text-lg font-bold text-slate-900">
                Institutional Data Access (NSO / RBI Tier)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Role-Based Access Control (RBAC) gating full granular tick-level price series and micro-observations for econometric research.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* API Key Form */}
        <div className="py-4 space-y-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Institutional API Key (Header: <code>X-API-Key</code>)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter institutional API key..."
                className="flex-1 px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
              />
              <button
                onClick={handleFetchDetailedFeed}
                disabled={loading}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#1f6feb] hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? "Authenticating..." : "Query /api/routes/detailed"}
              </button>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
              <span>Demo Institutional Key: <code>NSO_RBI_SECURE_KEY_2026</code></span>
              <button
                onClick={() => copyToClipboard("NSO_RBI_SECURE_KEY_2026")}
                className="text-[#1f6feb] hover:underline flex items-center gap-1"
              >
                <Copy className="w-3 h-3" />
                <span>{copied ? "Copied!" : "Copy Key"}</span>
              </button>
            </div>
          </div>

          {/* Results Area */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {data && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">
                  Granular Observation Stream ({data.total_observations} records unlocked)
                </span>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Access Level: {data.access_tier}
                </span>
              </div>

              <div className="max-h-64 overflow-y-auto bg-slate-950 text-slate-200 p-3 rounded-lg text-[11px] font-mono border border-slate-800">
                <pre>{JSON.stringify(data, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 flex justify-end">
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
