import type { Metadata } from "next";
import { Suspense } from "react";
import { EditCandidateView } from "@/components/candidate-form/EditCandidateView";
import { LoadingState } from "@/components/StateViews";
import { CandidateProvider } from "@/hooks/CandidateContext";

export const metadata: Metadata = { title: "Edit candidate" };

async function EditCandidateRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <CandidateProvider candidateId={id}>
      <EditCandidateView />
    </CandidateProvider>
  );
}

export default function EditCandidatePage({ params }: PageProps<"/candidates/[id]/edit">) {
  return (
    <Suspense fallback={<LoadingState label="Loading candidate data…" />}>
      <EditCandidateRoute params={params} />
    </Suspense>
  );
}
