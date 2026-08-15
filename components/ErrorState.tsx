"use client";

import React from "react";
import { AlertTriangle, MapPinOff, ServerOff, RefreshCw } from "lucide-react";

export type ErrorType = "invalid-format" | "not-found" | "service-unavailable";

interface ErrorStateProps {
  type: ErrorType;
  message?: string;
  query?: string;
  onRetry?: () => void;
}

export function ErrorState({ type, message, query, onRetry }: ErrorStateProps) {
  const getErrorDetails = () => {
    switch (type) {
      case "invalid-format":
        return {
          icon: <AlertTriangle className="w-8 h-8 text-amber-400" />,
          title: "Invalid Pincode Format",
          defaultMsg: "Please enter a valid 6-digit numeric pincode starting with 560 (e.g. 560034).",
          borderColor: "border-amber-500/30",
          bgColor: "bg-amber-500/10",
        };
      case "service-unavailable":
        return {
          icon: <ServerOff className="w-8 h-8 text-rose-400" />,
          title: "Service Temporarily Unavailable",
          defaultMsg: "India Post API service is currently busy or unreachable. Please try again in a moment.",
          borderColor: "border-rose-500/30",
          bgColor: "bg-rose-500/10",
        };
      case "not-found":
      default:
        return {
          icon: <MapPinOff className="w-8 h-8 text-slate-400" />,
          title: query ? `No results found for '${query}'` : "No Pincodes Found",
          defaultMsg: "No matching Bangalore post offices or pincodes were found. Check spelling or try a nearby area name.",
          borderColor: "border-slate-800",
          bgColor: "bg-slate-900/40",
        };
    }
  };

  const details = getErrorDetails();

  return (
    <div
      role="alert"
      className={`text-center py-12 px-6 rounded-3xl border ${details.borderColor} ${details.bgColor} backdrop-blur-md space-y-4 max-w-lg mx-auto shadow-lg transition-all`}
    >
      <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-center shadow-inner">
        {details.icon}
      </div>

      <div className="space-y-1">
        <h3 className="text-lg font-bold text-slate-100">{details.title}</h3>
        <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-md mx-auto">
          {message || details.defaultMsg}
        </p>
      </div>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold rounded-xl border border-slate-700 transition-all focus:outline-none focus:ring-2 focus:ring-amber-400"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Try Again</span>
        </button>
      )}
    </div>
  );
}
