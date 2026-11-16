import {
  CANDIDATE_STAGES,
  CANDIDATE_STATUSES,
  type CandidateStage,
  type CandidateStatus,
} from "@/types/candidate";

/**
 * UI labels for API enum values. Raw API values (in_progress,
 * personal_interview, …) must never be rendered directly.
 */
export const STATUS_LABELS: Record<CandidateStatus, string> = {
  received: "Received",
  in_progress: "In progress",
  selected: "Selected",
  discarded: "Discarded",
};

export const STAGE_LABELS: Record<CandidateStage, string> = {
  pending: "Pending review",
  review: "Under review",
  personal_interview: "Personal interview",
  technical_interview: "Technical interview",
  offer_presented: "Offer presented",
};

export const STATUS_OPTIONS = CANDIDATE_STATUSES.map((value) => ({
  value,
  label: STATUS_LABELS[value],
}));

export const STAGE_OPTIONS = CANDIDATE_STAGES.map((value) => ({
  value,
  label: STAGE_LABELS[value],
}));

export function isStatus(value: string | null): value is CandidateStatus {
  return !!value && (CANDIDATE_STATUSES as readonly string[]).includes(value);
}

export function isStage(value: string | null): value is CandidateStage {
  return !!value && (CANDIDATE_STAGES as readonly string[]).includes(value);
}

/** Safe label lookups: unknown values fall back to a neutral label, never the raw value. */
export function statusLabel(value: string): string {
  return isStatus(value) ? STATUS_LABELS[value] : "Unknown status";
}

export function stageLabel(value: string): string {
  return isStage(value) ? STAGE_LABELS[value] : "Unknown stage";
}
