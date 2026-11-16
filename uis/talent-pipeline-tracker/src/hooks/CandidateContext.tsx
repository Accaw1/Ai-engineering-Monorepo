"use client";

import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { useAsyncResource } from "@/hooks/useAsyncResource";
import { getCandidate, patchCandidate } from "@/services/candidates";
import type { AsyncState, Candidate, CandidatePatch } from "@/types/candidate";

interface CandidateContextValue {
  candidateId: string;
  state: AsyncState<Candidate>;
  reload: () => void;
  /** PATCH status/stage and reflect the server response in the UI. Throws on failure. */
  updatePipeline: (patch: CandidatePatch) => Promise<Candidate>;
  /** Keep the notes counter in sync after adding/removing notes. */
  adjustNotesCount: (delta: number) => void;
}

const CandidateContext = createContext<CandidateContextValue | null>(null);

/**
 * Owns the candidate shown on the detail page so header, pipeline controls
 * and notes can share it without prop drilling.
 */
export function CandidateProvider({ candidateId, children }: { candidateId: string; children: ReactNode }) {
  const { state, reload, mutate } = useAsyncResource(`candidate:${candidateId}`, (signal) =>
    getCandidate(candidateId, signal),
  );

  const updatePipeline = useCallback(
    async (patch: CandidatePatch) => {
      const updated = await patchCandidate(candidateId, patch);
      // Keep the local notes count: PATCH responses may not include it consistently.
      mutate((current) => ({ ...current, ...updated, notes_count: current.notes_count }));
      return updated;
    },
    [candidateId, mutate],
  );

  const adjustNotesCount = useCallback(
    (delta: number) =>
      mutate((current) => ({ ...current, notes_count: Math.max(0, current.notes_count + delta) })),
    [mutate],
  );

  const value = useMemo(
    () => ({ candidateId, state, reload, updatePipeline, adjustNotesCount }),
    [candidateId, state, reload, updatePipeline, adjustNotesCount],
  );

  return <CandidateContext.Provider value={value}>{children}</CandidateContext.Provider>;
}

export function useCandidate(): CandidateContextValue {
  const ctx = useContext(CandidateContext);
  if (!ctx) throw new Error("useCandidate must be used inside <CandidateProvider>");
  return ctx;
}
