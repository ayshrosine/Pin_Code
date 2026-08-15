"use client";

import React, { useState, useEffect } from "react";
import { Search, MapPin, Hash, X } from "lucide-react";

export type SearchMode = "area" | "pincode";

interface SearchBarProps {
  onSearchChange: (query: string, mode: SearchMode) => void;
  initialQuery?: string;
  initialMode?: SearchMode;
  isLoading?: boolean;
}

export function SearchBar({
  onSearchChange,
  initialQuery = "",
  initialMode = "area",
  isLoading = false,
}: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const [mode, setMode] = useState<SearchMode>(initialMode);

  // Debounce search input (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      onSearchChange(query, mode);
    }, 300);

    return () => clearTimeout(handler);
  }, [query, mode, onSearchChange]);

  const handleClear = () => {
    setQuery("");
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4">
      {/* Mode Toggle Buttons */}
      <div 
        className="flex items-center justify-center p-1.5 bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-700/60 max-w-xs mx-auto shadow-inner"
        role="radiogroup"
        aria-label="Search Mode Selection"
      >
        <button
          type="button"
          role="radio"
          aria-checked={mode === "area"}
          onClick={() => setMode("area")}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 text-xs md:text-sm font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-400 ${
            mode === "area"
              ? "bg-amber-500 text-slate-950 font-semibold shadow-md scale-[1.02]"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/40"
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Area Name</span>
        </button>

        <button
          type="button"
          role="radio"
          aria-checked={mode === "pincode"}
          onClick={() => setMode("pincode")}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 text-xs md:text-sm font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-400 ${
            mode === "pincode"
              ? "bg-amber-500 text-slate-950 font-semibold shadow-md scale-[1.02]"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/40"
          }`}
        >
          <Hash className="w-4 h-4" />
          <span>Pincode</span>
        </button>
      </div>

      {/* Input Field */}
      <div className="relative group">
        <label htmlFor="pincode-search-input" className="sr-only">
          {mode === "area" ? "Search by area name" : "Search by 6-digit pincode"}
        </label>
        
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-amber-400 transition-colors">
          <Search className="w-5 h-5" />
        </div>

        <input
          id="pincode-search-input"
          type={mode === "pincode" ? "text" : "text"}
          inputMode={mode === "pincode" ? "numeric" : "text"}
          pattern={mode === "pincode" ? "[0-9]*" : undefined}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={
            mode === "area"
              ? "Search area (e.g., Koramangala, Whitefield, Indiranagar)..."
              : "Enter pincode (e.g., 560034, 560066)..."
          }
          className="w-full pl-11 pr-12 py-3.5 md:py-4 bg-slate-900/90 text-slate-100 placeholder-slate-500 rounded-2xl border border-slate-700/70 shadow-lg focus:outline-none focus:ring-2 focus:ring-amber-400/80 focus:border-amber-400/80 transition-all text-sm md:text-base font-normal"
        />

        {/* Loading indicator or Clear button */}
        <div className="absolute inset-y-0 right-0 pr-4 flex items-center gap-2">
          {isLoading && (
            <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          )}
          {query && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Clear search input"
              className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
