/**
 * Types for the Talent Tracker API (backend field names are kept as-is).
 * See https://playground.4geeks.com/tracker/api/v1/docs
 */

export const CANDIDATE_STATUSES = [
  "received",
  "in_progress",
  "selected",
  "discarded",
] as const;
export type CandidateStatus = (typeof CANDIDATE_STATUSES)[number];

export const CANDIDATE_STAGES = [
  "pending",
  "review",
  "personal_interview",
  "technical_interview",
  "offer_presented",
] as const;
export type CandidateStage = (typeof CANDIDATE_STAGES)[number];

/** Internal note attached to a candidate (GET /records/:id/notes). */
export interface CandidateNote {
  id: string;
  record_id: string;
  content: string;
  created_at: string;
}

/** A candidate as returned by GET /records and GET /records/:id. */
export interface Candidate {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  position: string;
  linkedin_url: string | null;
  cv_url: string | null;
  status: CandidateStatus;
  stage: CandidateStage;
  experience_years: number;
  notes_count: number;
  applied_at: string;
  updated_at: string;
}

/** Body for POST /records and PUT /records/:id (RecordCreate). */
export interface CandidateInput {
  full_name: string;
  email: string;
  phone: string;
  position: string;
  linkedin_url: string | null;
  cv_url: string | null;
  experience_years: number;
}

/** Body for PATCH /records/:id (RecordPatch). */
export interface CandidatePatch {
  status?: CandidateStatus;
  stage?: CandidateStage;
}

/** Body for POST /records/:id/notes (NoteCreate). */
export interface NoteInput {
  content: string;
}

/** Envelope for GET /records. */
export interface CandidateListResponse {
  total: number;
  page: number;
  limit: number;
  data: Candidate[];
}

/** Envelope for GET /records/:id/notes. */
export interface NoteListResponse {
  data: CandidateNote[];
  meta: { total: number };
}

/** Filters supported by GET /records. */
export interface CandidateFilters {
  status?: CandidateStatus;
  stage?: CandidateStage;
}

/** FastAPI 422 validation error item. */
export interface ApiValidationIssue {
  loc: (string | number)[];
  msg: string;
  type: string;
}

/** Generic async state used by every data-fetching hook. */
export type AsyncState<T> =
  | { status: "loading"; data: null; error: null }
  | { status: "success"; data: T; error: null }
  | { status: "error"; data: null; error: string };
