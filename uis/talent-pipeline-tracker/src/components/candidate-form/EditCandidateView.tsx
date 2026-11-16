"use client";

import Link from "next/link";
import { CandidateForm } from "@/components/candidate-form/CandidateForm";
import { ErrorState, LoadingState } from "@/components/StateViews";
import { useCandidate } from "@/hooks/CandidateContext";

export function EditCandidateView() {
  const { candidateId, state, reload } = useCandidate();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href={`/candidates/${candidateId}`}
        className="inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-flame"
      >
        ← Back to candidate
      </Link>

      {state.status === "loading" && <LoadingState label="Loading candidate data…" />}
      {state.status === "error" && (
        <ErrorState title="We couldn't load this candidate" message={state.error} onRetry={reload} />
      )}
      {state.status === "success" && (
        <>
          <div>
            <h1 className="font-display text-3xl">Edit {state.data.full_name}</h1>
            <p className="mt-1 text-sm text-muted">
              Correct contact details or application data. Status and stage are managed from the candidate
              page.
            </p>
          </div>
          <CandidateForm mode="edit" candidate={state.data} />
        </>
      )}
    </div>
  );
}
