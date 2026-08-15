"use client";

import React, { useState } from "react";
import { Copy, Check, MapPin, Building2, Globe } from "lucide-react";
import { PincodeItem } from "@/lib/db";

interface ResultCardProps {
  item: PincodeItem;
}

export function ResultCard({ item }: ResultCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(item.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group relative bg-slate-900/60 hover:bg-slate-800/80 backdrop-blur-md border border-slate-800 hover:border-amber-500/40 rounded-2xl p-5 transition-all duration-300 shadow-md hover:shadow-amber-500/5 hover:-translate-y-0.5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left side: Area Name & Details */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <MapPin className="w-4 h-4" />
            </span>
            <h3 className="text-base sm:text-lg font-semibold text-slate-100 group-hover:text-amber-300 transition-colors">
              {item.areaName}
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-slate-400">
            <div className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              <span>{item.district}</span>
            </div>
            <span className="text-slate-700">•</span>
            <div className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-slate-500" />
              <span>{item.state}</span>
            </div>
          </div>
        </div>

        {/* Right side: Pincode Badge & Copy Button */}
        <div className="flex items-center justify-between sm:justify-end gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-800/80">
          <div className="px-3.5 py-1.5 bg-amber-500/15 border border-amber-500/30 rounded-xl text-amber-400 font-mono font-bold text-base sm:text-lg tracking-wider">
            {item.code}
          </div>

          <button
            type="button"
            onClick={handleCopy}
            aria-label={`Copy pincode ${item.code}`}
            title="Copy pincode"
            className="p-2.5 rounded-xl bg-slate-800/90 hover:bg-amber-500 hover:text-slate-950 text-slate-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            {copied ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
