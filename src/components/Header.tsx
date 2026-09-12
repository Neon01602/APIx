import React from "react";
import { ShieldCheck, KeyRound, FileText, Compass } from "lucide-react";

interface HeaderProps {
  onOpenCompliance?: () => void;
  onOpenInstitutional?: () => void;
  onOpenFlightCompliance?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenCompliance,
  onOpenInstitutional,
  onOpenFlightCompliance,
}) => {
  return (
    <header id="apix-header" className="w-full bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Left: APIx Official Logo (moved from right to left, text content removed) */}
        <div id="navbar-left-logo" className="flex items-center gap-3 py-1">
          <img
            src="src/assets/images/apix_logo.png"
            alt="APIx Logo"
            className="h-10 sm:h-11 w-auto object-contain select-none"
            referrerPolicy="no-referrer"
          />
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 leading-none">
                API<span className="text-[#1f6feb]">x</span>
              </span>
              
            </div>
            <span className="text-[11px] sm:text-xs text-slate-500 font-medium tracking-tight mt-0.5 hidden xs:inline-block">
              Real-Time Airfare Price Index
            </span>
          </div>
        </div>

        {/* Right: Action Modals, Flight Regulatory Compliance, and Docs */}
        <div id="navbar-right-actions" className="flex items-center space-x-2.5 sm:space-x-3">
          {/* Flight Regulatory Audit Badge (CAR Section 3 & Rule 135) */}
          {onOpenFlightCompliance && (
            <button
              id="flight-compliance-btn"
              onClick={onOpenFlightCompliance}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors"
              title="View DGCA CAR Section 3 & Rule 135 Flight Tariff Compliance Audit"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>CAR Sec-3 Compliant</span>
            </button>
          )}

          {/* Source Compliance Registry */}
          <button
            id="compliance-btn"
            onClick={onOpenCompliance}
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
            title="View robots.txt & ethical crawling compliance registry"
          >
            <Compass className="w-3.5 h-3.5 text-slate-500" />
            <span>Robots.txt</span>
          </button>

          {/* Institutional NSO/RBI Feed */}
          <button
            id="institutional-btn"
            onClick={onOpenInstitutional}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
            title="Institutional role-based access for NSO / RBI micro-data"
          >
            <KeyRound className="w-3.5 h-3.5 text-[#1f6feb]" />
            <span>NSO / RBI</span>
          </button>

          {/* OpenAPI Docs Link */}
          <a
            id="docs-link"
            href="/api/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-[#1f6feb] bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
            title="OpenAPI / Swagger documentation for NSO, RBI, and Ministry integration"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Docs</span>
          </a>
        </div>
      </div>
    </header>
  );
};
