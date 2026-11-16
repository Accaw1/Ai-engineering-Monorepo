"use client";

import Link from "next/link";
import { StageBadge, StatusBadge } from "@/components/Badges";
import { CandidateProfile } from "@/components/candidate-detail/CandidateProfile";
import { NotesPanel } from "@/components/candidate-detail/NotesPanel";
import { PipelineControls } from "@/components/candidate-detail/PipelineControls";
import { ErrorState, LoadingState } from "@/components/StateViews";
import { useCandidate } from "@/hooks/CandidateContext";

export function CandidateDetailView() {
  const { state, reload } = useCandidate();

  return (
    <div className="space-y-6">
      <Link href="/" className="inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-flame">
        ← Back to candidates
      </Link>

      {state.status === "loading" && <LoadingState label="Loading candidate…" />}

      {state.status === "error" && (
        <ErrorState title="We couldn't load this candidate" message={state.error} onRetry={reload}>
          <Link href="/" className="rounded-md border border-line bg-white px-4 py-2 text-sm font-medium">
            Back to list
          </Link>
        </ErrorState>
      )}

      {state.status === "success" && (
        <>
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl sm:text-4xl">{state.data.full_name}</h1>
              <p className="mt-1 text-muted">{state.data.position}</p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <StatusBadge status={state.data.status} />
                <StageBadge stage={state.data.stage} />
              </div>
            </div>
            <Link
              href={`/candidates/${state.data.id}/edit`}
              className="rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold hover:border-flame hover:text-flame"
            >
              Edit candidate data
            </Link>
          </header>

          <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
            <div className="space-y-6">
              <CandidateProfile />
              <NotesPanel />
            </div>
            <aside>
              <PipelineControls />
            </aside>
          </div>
        </>
      )}
    </div>
  );
}
