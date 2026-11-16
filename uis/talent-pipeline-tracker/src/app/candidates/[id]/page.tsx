import type { Metadata } from "next";
import { Suspense } from "react";
import { CandidateDetailView } from "@/components/candidate-detail/CandidateDetailView";
import { LoadingState } from "@/components/StateViews";
import { CandidateProvider } from "@/hooks/CandidateContext";

export const metadata: Metadata = { title: "Candidate" };

async function CandidateRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <CandidateProvider candidateId={id}>
      <CandidateDetailView />
    </CandidateProvider>
  );
}

export default function CandidatePage({ params }: PageProps<"/candidates/[id]">) {
  return (
    <Suspense fallback={<LoadingState label="Loading candidate…" />}>
      <CandidateRoute params={params} />
    </Suspense>
  );
}
