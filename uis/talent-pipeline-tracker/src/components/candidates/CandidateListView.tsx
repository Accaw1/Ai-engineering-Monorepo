"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { StageBadge, StatusBadge } from "@/components/Badges";
import { CandidateFilters } from "@/components/candidates/CandidateFilters";
import { ErrorState, LoadingState } from "@/components/StateViews";
import { useCandidateList, useCandidateSearch } from "@/hooks/useCandidateList";
import { formatDate } from "@/lib/format";
import { isStage, isStatus } from "@/lib/labels";

export function CandidateListView() {
  const searchParams = useSearchParams();
  const rawStatus = searchParams.get("status");
  const rawStage = searchParams.get("stage");
  const status = isStatus(rawStatus) ? rawStatus : undefined;
  const stage = isStage(rawStage) ? rawStage : undefined;
  const query = searchParams.get("q") ?? "";

  const { state, reload } = useCandidateList({ status, stage });
  const visible = useCandidateSearch(state.data, query);

  return (
    <div className="space-y-4">
      <CandidateFilters />

      {state.status === "loading" && <LoadingState label="Loading candidates…" />}

      {state.status === "error" && (
        <ErrorState title="We couldn't load the candidate list" message={state.error} onRetry={reload} />
      )}

      {state.status === "success" && (
        <>
          <p className="text-sm text-muted" aria-live="polite">
            Showing <strong className="text-ink">{visible.length}</strong> of {state.data.length} candidates
            {(status || stage) && " matching the selected filters"}
          </p>

          {visible.length === 0 ? (
            <div className="rounded-lg border border-dashed border-line bg-white p-10 text-center">
              <p className="font-medium">No candidates match these filters.</p>
              <p className="mt-1 text-sm text-muted">
                Try a different search, clear the filters, or register a candidate who applied through
                another channel.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-line bg-white">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-b border-line bg-paper/60 text-xs uppercase tracking-wide text-muted">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-semibold">Candidate</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Position applied for</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Stage</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Applied</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {visible.map((c) => (
                    <tr key={c.id} className="group relative hover:bg-paper/70">
                      <td className="px-4 py-3">
                        {/* The stretched link makes the whole row clickable via client-side navigation. */}
                        <Link
                          href={`/candidates/${c.id}`}
                          className="font-semibold text-ink after:absolute after:inset-0 group-hover:text-flame"
                        >
                          {c.full_name}
                        </Link>
                        <span className="block text-xs text-muted">{c.email}</span>
                      </td>
                      <td className="px-4 py-3">{c.position}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="px-4 py-3">
                        <StageBadge stage={c.stage} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted">{formatDate(c.applied_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
