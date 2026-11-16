import { stageLabel, statusLabel } from "@/lib/labels";
import type { CandidateStage, CandidateStatus } from "@/types/candidate";

const STATUS_STYLES: Record<CandidateStatus, string> = {
  received: "bg-slate-100 text-slate-700 ring-slate-300",
  in_progress: "bg-amber-50 text-amber-800 ring-amber-300",
  selected: "bg-emerald-50 text-emerald-800 ring-emerald-300",
  discarded: "bg-stone-100 text-stone-500 ring-stone-300",
};

export function StatusBadge({ status }: { status: CandidateStatus }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
        STATUS_STYLES[status] ?? STATUS_STYLES.received
      }`}
    >
      {statusLabel(status)}
    </span>
  );
}

const STAGE_ORDER: Record<CandidateStage, number> = {
  pending: 1,
  review: 2,
  personal_interview: 3,
  technical_interview: 4,
  offer_presented: 5,
};

/** Stage label with a small 5-step progress indicator. */
export function StageBadge({ stage }: { stage: CandidateStage }) {
  const step = STAGE_ORDER[stage] ?? 0;
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap text-sm">
      <span aria-hidden="true" className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <span key={i} className={`h-1.5 w-3 rounded-full ${i <= step ? "bg-flame" : "bg-line"}`} />
        ))}
      </span>
      {stageLabel(stage)}
    </span>
  );
}
