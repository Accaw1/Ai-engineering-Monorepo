"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import { STAGE_OPTIONS, STATUS_OPTIONS } from "@/lib/labels";

const selectClass =
  "w-full rounded-md border border-line bg-white px-3 py-2 text-sm focus:border-flame focus:outline-none";

/**
 * Status / stage filters and the name-or-email search box. All three live in
 * the URL query string (?status=&stage=&q=) so views are shareable and
 * survive back/forward navigation. Updates use router.replace — no reload.
 */
export function CandidateFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const status = searchParams.get("status") ?? "";
  const stage = searchParams.get("stage") ?? "";
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  function setParam(name: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(name, value);
    else params.delete(name);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  function onQueryChange(value: string) {
    setQuery(value);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => setParam("q", value.trim()), 250);
  }

  const hasFilters = !!(status || stage || query);

  return (
    <div className="grid gap-3 rounded-lg border border-line bg-white p-4 sm:grid-cols-[2fr_1fr_1fr_auto] sm:items-end">
      <label className="block">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">Search</span>
        <input
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Name or email…"
          className={selectClass}
          autoComplete="off"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">Status</span>
        <select value={status} onChange={(e) => setParam("status", e.target.value)} className={selectClass}>
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">Stage</span>
        <select value={stage} onChange={(e) => setParam("stage", e.target.value)} className={selectClass}>
          <option value="">All stages</option>
          {STAGE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        disabled={!hasFilters}
        onClick={() => {
          if (debounce.current) clearTimeout(debounce.current);
          setQuery("");
          router.replace(pathname, { scroll: false });
        }}
        className="rounded-md border border-line px-3 py-2 text-sm font-medium hover:bg-paper disabled:cursor-not-allowed disabled:opacity-40"
      >
        Clear
      </button>
    </div>
  );
}
