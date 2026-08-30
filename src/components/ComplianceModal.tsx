import React, { useEffect, useState } from "react";
import { X, ShieldCheck, ShieldAlert, CheckCircle, AlertTriangle, ExternalLink } from "lucide-react";
import { SourceComplianceItem } from "../types";

interface ComplianceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ComplianceModal: React.FC<ComplianceModalProps> = ({ isOpen, onClose }) => {
  const [complianceList, setComplianceList] = useState<SourceComplianceItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetch("/api/compliance")
        .then((res) => res.json())
        .then((data) => {
          setComplianceList(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-3xl w-full p-6 relative animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h3 className="text-lg font-bold text-slate-900">
                Aviation Data Source Compliance & Robots.txt Registry
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Real-time audit of all 7 domestic aggregator and airline endpoints. Evaluates robots.txt policies, ToS restrictions, and ethical rate-limiting (8–14s delay).
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {loading ? (
            <div className="text-center py-12 text-slate-400 text-sm animate-pulse">
              Auditing compliance policies...
            </div>
          ) : (
            complianceList.map((item) => {
              const isBlocked = item.status === "BLOCKED_COMPLIANT";
              return (
                <div
                  key={item.source}
                  className={`p-4 rounded-xl border transition-all ${
                    isBlocked
                      ? "bg-slate-50 border-slate-200"
                      : "bg-emerald-50/50 border-emerald-200"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      {isBlocked ? (
                        <div className="p-1 rounded bg-slate-200 text-slate-600">
                          <ShieldAlert className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="p-1 rounded bg-emerald-100 text-emerald-700">
                          <CheckCircle className="w-4 h-4" />
                        </div>
                      )}
                      <div>
                        <span className="font-bold text-sm text-slate-900">{item.source}</span>
                        <span
                          className={`ml-2 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                            isBlocked
                              ? "bg-slate-200 text-slate-700"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {isBlocked ? "BLOCKED (COMPLIANT SKIP)" : "ACTIVE PERMITTED"}
                        </span>
                      </div>
                    </div>

                    {item.robots_txt && (
                      <a
                        href={item.robots_txt}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-slate-500 hover:text-[#1f6feb] flex items-center gap-1 self-start sm:self-auto"
                      >
                        <span>robots.txt</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    <strong>Policy Rule:</strong> {item.reason}
                  </p>

                  {item.endpoint && (
                    <div className="mt-2 text-[11px] font-mono text-slate-500 bg-white/80 px-2.5 py-1 rounded border border-slate-200 truncate">
                      Endpoint: {item.endpoint}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Policy: 404 Robots.txt treated as allowed; fail-closed on ambiguity.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
