"use client";

import React, { useState, useEffect, useCallback } from "react";
import { SearchBar, SearchMode } from "@/components/SearchBar";
import { ResultCard } from "@/components/ResultCard";
import { ErrorState, ErrorType } from "@/components/ErrorState";
import { PincodeItem } from "@/lib/db";
import { MapPin, Sparkles, LayoutGrid, Table as TableIcon, Database, Zap, Clock } from "lucide-react";

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<SearchMode>("area");
  const [results, setResults] = useState<PincodeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataSource, setDataSource] = useState<"cache" | "live-api" | "initial">("initial");
  
  // Error state handling
  const [errorType, setErrorType] = useState<ErrorType | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // View mode state (cards vs table)
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  // Fetch initial cached pincodes on first load
  const fetchInitialCachedPincodes = useCallback(async () => {
    setLoading(true);
    setErrorType(null);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/pincodes/cached");
      const json = await res.json();

      if (res.ok && json.data) {
        setResults(json.data);
        setDataSource("initial");
      }
    } catch {
      // Ignore initial cached fetch error
    } finally {
      setLoading(false);
    }
  }, []);

  // Main search fetch logic
  const handleSearch = useCallback(async (searchQuery: string, searchMode: SearchMode) => {
    const trimmed = searchQuery.trim();

    if (!trimmed) {
      fetchInitialCachedPincodes();
      return;
    }

    setLoading(true);
    setErrorType(null);
    setErrorMessage(null);

    try {
      let url = "";
      if (searchMode === "pincode") {
        url = `/api/pincodes/${encodeURIComponent(trimmed)}`;
      } else {
        url = `/api/pincodes/search?area=${encodeURIComponent(trimmed)}`;
      }

      const res = await fetch(url);
      const json = await res.json();

      if (!res.ok) {
        setResults([]);
        setErrorMessage(json.error);

        if (res.status === 400) {
          setErrorType("invalid-format");
        } else if (res.status === 404) {
          setErrorType("not-found");
        } else if (res.status === 503 || res.status === 500) {
          setErrorType("service-unavailable");
        } else {
          setErrorType("not-found");
        }
      } else {
        setResults(json.data || []);
        setDataSource(json.source === "cache" ? "cache" : "live-api");
      }
    } catch {
      setResults([]);
      setErrorType("service-unavailable");
      setErrorMessage("Service temporarily unavailable, please try again.");
    } finally {
      setLoading(false);
    }
  }, [fetchInitialCachedPincodes]);

  const handleSearchChange = useCallback((newQuery: string, newMode: SearchMode) => {
    setQuery(newQuery);
    setMode(newMode);
    handleSearch(newQuery, newMode);
  }, [handleSearch]);

  useEffect(() => {
    fetchInitialCachedPincodes();
  }, [fetchInitialCachedPincodes]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* Background ambient light */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-1/3 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
      </div>

      {/* Header Banner */}
      <header className="border-b border-slate-800/80 bg-slate-900/40 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 shadow-md shadow-amber-500/20">
              <MapPin className="w-5 h-5 font-bold" />
            </div>
            <div>
              <h1 className="font-bold text-base sm:text-lg tracking-tight text-slate-100">
                Bangalore <span className="text-amber-400">Pincode Explorer</span>
              </h1>
              <p className="text-xs text-slate-400 hidden sm:block">
                Powered by Live India Post Public REST API & MongoDB Cache
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-xs text-slate-300 font-medium">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Live India Post API</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-xs text-slate-300 font-medium">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>MongoDB</span>
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 sm:py-12 space-y-8">
        {/* Hero Section */}
        <section className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Cache-First Postal Directory</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-50">
            Search Pincodes Across <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 bg-clip-text text-transparent">Bengaluru</span>
          </h2>

          <p className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-xl mx-auto">
            Live lookup connected directly to India Post public API (`api.postalpincode.in`) with automated MongoDB caching for maximum speed.
          </p>

          {/* Search Bar */}
          <div className="pt-4">
            <SearchBar
              onSearchChange={handleSearchChange}
              isLoading={loading}
            />
          </div>
        </section>

        {/* Results Metadata & Live Announcements */}
        <section aria-label="Search results and statistics" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-800/80">
            {/* ARIA Live Region for screen readers */}
            <div
              aria-live="polite"
              aria-atomic="true"
              className="text-xs sm:text-sm text-slate-400 font-medium flex items-center gap-2"
            >
              {loading ? (
                <span>Fetching live postal directory data...</span>
              ) : query.trim() ? (
                <span>
                  Found <strong className="text-amber-400">{results.length}</strong> result{results.length !== 1 ? "s" : ""} for &quot;<span className="text-slate-200">{query}</span>&quot; ({mode === "area" ? "Area Search" : "Pincode Search"})
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  Showing <strong>{results.length}</strong> recently searched & cached pincodes
                </span>
              )}

              {/* Data source badge */}
              {!loading && query.trim() && dataSource !== "initial" && (
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${
                  dataSource === "cache"
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
                }`}>
                  {dataSource === "cache" ? "Cache Hit" : "Live API"}
                </span>
              )}
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setViewMode("cards")}
                aria-label="Grid card view"
                title="Grid card view"
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === "cards"
                    ? "bg-slate-800 text-amber-400 shadow-sm"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                aria-label="Table view"
                title="Table view"
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === "table"
                    ? "bg-slate-800 text-amber-400 shadow-sm"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                <TableIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Loading Skeletons */}
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-28 bg-slate-900/50 border border-slate-800/80 rounded-2xl p-5 animate-pulse flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="h-5 w-2/3 bg-slate-800 rounded-md" />
                    <div className="h-4 w-1/3 bg-slate-800/60 rounded-md" />
                  </div>
                  <div className="h-6 w-20 bg-slate-800/80 rounded-lg self-end" />
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {!loading && errorType && (
            <ErrorState
              type={errorType}
              message={errorMessage || undefined}
              query={query}
              onRetry={() => handleSearch(query, mode)}
            />
          )}

          {/* Empty State when no error but empty results */}
          {!loading && !errorType && results.length === 0 && (
            <ErrorState
              type="not-found"
              query={query}
              onRetry={() => handleSearchChange("", "area")}
            />
          )}

          {/* Results Grid / Table */}
          {!loading && !errorType && results.length > 0 && (
            <>
              {viewMode === "cards" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {results.map((item, idx) => (
                    <ResultCard key={item.id || item.code + idx} item={item} />
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
                  <table className="w-full text-left text-sm text-slate-300">
                    <thead className="bg-slate-900 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="px-6 py-4">Pincode</th>
                        <th className="px-6 py-4">Area Name</th>
                        <th className="px-6 py-4">District</th>
                        <th className="px-6 py-4">State</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {results.map((item, idx) => (
                        <tr
                          key={item.id || item.code + idx}
                          className="hover:bg-slate-800/50 transition-colors"
                        >
                          <td className="px-6 py-4 font-mono font-bold text-amber-400">
                            {item.code}
                          </td>
                          <td className="px-6 py-4 font-medium text-slate-100">
                            {item.areaName}
                          </td>
                          <td className="px-6 py-4 text-slate-400">
                            {item.district}
                          </td>
                          <td className="px-6 py-4 text-slate-400">
                            {item.state}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-8 bg-slate-900/30 text-center text-xs text-slate-500">
        <p>Bangalore Pincode Explorer • Powered by India Post Live API & MongoDB Prisma Cache</p>
      </footer>
    </div>
  );
}
