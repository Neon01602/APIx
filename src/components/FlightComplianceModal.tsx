/**
 * FlightComplianceModal.tsx
 * Ministry of Civil Aviation & DGCA Flight Regulatory Compliance Audit Modal
 * Evaluates CAR Section 3 Series M Part IV, Aircraft Rule 135, and Unbundled Pricing Standards.
 */

import React from "react";
import { X, ShieldCheck, CheckCircle, Scale, AlertTriangle, FileCheck, Building2, Plane } from "lucide-react";
import { DGCA_COMPLIANCE_AUDIT, AERODROMES_REGISTRY } from "../data/airlines";

interface FlightComplianceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FlightComplianceModal: React.FC<FlightComplianceModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full p-6 relative animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100 pr-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200">
                <ShieldCheck className="w-5 h-5" />
              </span>
              <h3 className="text-lg font-bold text-slate-900">
                DGCA & MoCA Flight Regulatory Compliance Audit
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Statutory verification under DGCA Civil Aviation Requirements (CAR), Aircraft Rule 135, and MoCA Passenger Charter mandates.
            </p>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-5 pr-1 text-xs">
          {/* Top Compliance Summary Callout */}
          <div className="bg-gradient-to-r from-emerald-50 to-blue-50 p-4 rounded-xl border border-emerald-200/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                100%
              </div>
              <div>
                <div className="font-bold text-slate-900 text-sm">Regulatory Audit Certified</div>
                <div className="text-[11px] text-slate-600 mt-0.5">
                  All 4 statutory flight and airfare compliance tests successfully validated.
                </div>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              AUDIT PASS
            </span>
          </div>

          {/* Audit Rules List */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-[#1f6feb]" />
              Civil Aviation Regulatory Framework
            </div>

            {DGCA_COMPLIANCE_AUDIT.map((item) => (
              <div
                key={item.ruleId}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-xs">{item.title}</span>
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-blue-50 text-[#1f6feb] border border-blue-200">
                        {item.ruleId}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 font-medium">
                      Authority: <strong>{item.authority}</strong> · {item.statutoryReference}
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                    <CheckCircle className="w-3 h-3 text-emerald-600" />
                    {item.currentStatus} ({item.scorePct}%)
                  </span>
                </div>

                <p className="text-slate-600 mt-2 text-[11px] leading-relaxed">
                  <strong>Statutory Mandate:</strong> {item.mandate}
                </p>
                <div className="mt-2 pt-2 border-t border-slate-200/60 text-slate-500 text-[11px]">
                  <strong>APIx Ingestion Implementation:</strong> {item.auditDetails}
                </div>
              </div>
            ))}
          </div>

          {/* Aerodrome Registry & Operators */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-[#1f6feb]" />
              Authorized Aerodromes in Basket (ICAO & Airport Operators)
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.values(AERODROMES_REGISTRY).map((aero) => (
                <div key={aero.iata} className="p-2.5 rounded-lg border border-slate-200 bg-white text-[11px]">
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span>{aero.iata}</span>
                    <span className="font-mono text-slate-400 text-[10px]">{aero.icao}</span>
                  </div>
                  <div className="text-slate-600 font-medium truncate mt-0.5">{aero.city}</div>
                  <div className="text-slate-400 text-[9px] truncate mt-0.5">{aero.operator}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Official Reference: DGCA Air Transport Series 'M' & Rule 135</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Close Audit
          </button>
        </div>
      </div>
    </div>
  );
};
