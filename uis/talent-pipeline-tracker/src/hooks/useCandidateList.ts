"use client";

import { useMemo } from "react";
import { useAsyncResource } from "@/hooks/useAsyncResource";
import { listCandidates } from "@/services/candidates";
import type { CandidateFilters } from "@/types/candidate";

/** Loads the pipeline from the API, filtered server-side by status and stage. */
export function useCandidateList(filters: CandidateFilters) {
  const key = `candidates?status=${filters.status ?? ""}&stage=${filters.stage ?? ""}`;
  const { state, reload } = useAsyncResource(key, (signal) => listCandidates(filters, signal));
  return { state, reload };
}

/** Client-side, instant search by name or email (no reload, no extra request). */
export function useCandidateSearch<T extends { full_name: string; email: string }>(
  items: T[] | null,
  query: string,
): T[] {
  return useMemo(() => {
    if (!items) return [];
    const q = normalize(query.trim());
    if (!q) return items;
    return items.filter(
      (c) => normalize(c.full_name).includes(q) || normalize(c.email).includes(q),
    );
  }, [items, query]);
}

/** Case- and accent-insensitive comparison so "victor" matches "Víctor". */
function normalize(value: string): string {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}
