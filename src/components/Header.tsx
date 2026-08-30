import React from "react";
import { FileText, ShieldCheck, KeyRound } from "lucide-react";

interface HeaderProps {
  onOpenCompliance?: () => void;
  onOpenInstitutional?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenCompliance,
  onOpenInstitutional,
}) => {
  return (
    <header id="apix-header" className="w-full bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: APIx Wordmark + Tagline */}
        <div className="flex items-center space-x-3">
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              API<span className="text-[#1f6feb]">x</span>
            </span>
            <span className="text-sm font-medium text-slate-500 border-l border-slate-300 pl-3">
              Real-Time Airfare Price Index
            </span>
          </div>
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
            SIH 2026 PS 26056
          </span>
        </div>

        {/* Right: Actions & Modals */}
        <div className="flex items-center space-x-2.5">
          {/* Source Compliance Registry */}
          <button
            id="compliance-btn"
            onClick={onOpenCompliance}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-md border border-slate-200 transition-colors"
            title="View robots.txt & scraping compliance registry"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden md:inline">Source Compliance</span>
          </button>

          {/* Institutional NSO/RBI Feed */}
          <button
            id="institutional-btn"
            onClick={onOpenInstitutional}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-md border border-slate-200 transition-colors"
            title="Institutional role-based access for NSO / RBI micro-data"
          >
            <KeyRound className="w-3.5 h-3.5 text-[#1f6feb]" />
            <span className="hidden md:inline">NSO / RBI Access</span>
          </button>

          {/* OpenAPI Docs Link */}
          <a
            id="docs-link"
            href="/api/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#1f6feb] bg-blue-50 hover:bg-blue-100 rounded-md border border-blue-200 transition-colors"
            title="OpenAPI / Swagger documentation for NSO, RBI, and Ministry integration"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>OpenAPI (/api/docs)</span>
          </a>
        </div>
      </div>
    </header>
  );
};
