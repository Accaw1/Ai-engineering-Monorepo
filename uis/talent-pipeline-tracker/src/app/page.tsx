import { Suspense } from "react";
import { CandidateListView } from "@/components/candidates/CandidateListView";
import { LoadingState } from "@/components/StateViews";
import { ACTIVE_SEARCH } from "@/lib/company";

export default function CandidatesPage() {
  return (
    <div className="space-y-6">
      <section>
        <p className="text-xs font-semibold uppercase tracking-widest text-flame">Active search</p>
        <h1 className="mt-1 font-display text-3xl sm:text-4xl">{ACTIVE_SEARCH.position} candidates</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted">
          {ACTIVE_SEARCH.location}. Profile: {ACTIVE_SEARCH.profile.toLowerCase()}. Select a candidate to
          update their status or stage and log interview notes.
        </p>
      </section>
      {/* useSearchParams in the list requires a Suspense boundary. */}
      <Suspense fallback={<LoadingState label="Loading candidates…" />}>
        <CandidateListView />
      </Suspense>
    </div>
  );
}
