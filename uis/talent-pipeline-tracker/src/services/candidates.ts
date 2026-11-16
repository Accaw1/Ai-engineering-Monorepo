import { apiRequest } from "@/services/api-client";
import type {
  Candidate,
  CandidateFilters,
  CandidateInput,
  CandidateListResponse,
  CandidateNote,
  CandidatePatch,
  NoteInput,
  NoteListResponse,
} from "@/types/candidate";

/** Upper bound used to load the full pipeline in one request (API caps pagination by `limit`). */
const PAGE_LIMIT = 500;

/** The list endpoint embeds notes; strip them so they only ever surface in the detail view. */
function toCandidate(raw: Candidate & { notes?: unknown }): Candidate {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { notes, ...candidate } = raw;
  return candidate;
}

export async function listCandidates(
  filters: CandidateFilters = {},
  signal?: AbortSignal,
): Promise<Candidate[]> {
  const params = new URLSearchParams({ limit: String(PAGE_LIMIT) });
  if (filters.status) params.set("status", filters.status);
  if (filters.stage) params.set("stage", filters.stage);
  const res = await apiRequest<CandidateListResponse>(`/records?${params}`, { signal });
  return res.data.map(toCandidate);
}

export async function getCandidate(id: string, signal?: AbortSignal): Promise<Candidate> {
  const raw = await apiRequest<Candidate>(`/records/${encodeURIComponent(id)}`, { signal });
  return toCandidate(raw);
}

export async function createCandidate(input: CandidateInput): Promise<Candidate> {
  const raw = await apiRequest<Candidate>("/records", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return toCandidate(raw);
}

export async function updateCandidate(id: string, input: CandidateInput): Promise<Candidate> {
  const raw = await apiRequest<Candidate>(`/records/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
  return toCandidate(raw);
}

export async function patchCandidate(id: string, patch: CandidatePatch): Promise<Candidate> {
  const raw = await apiRequest<Candidate>(`/records/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
  return toCandidate(raw);
}

export async function listNotes(id: string, signal?: AbortSignal): Promise<CandidateNote[]> {
  const res = await apiRequest<NoteListResponse>(`/records/${encodeURIComponent(id)}/notes`, {
    signal,
  });
  return res.data;
}

export async function createNote(id: string, input: NoteInput): Promise<CandidateNote> {
  return apiRequest<CandidateNote>(`/records/${encodeURIComponent(id)}/notes`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function deleteNote(id: string, noteId: string): Promise<void> {
  await apiRequest<void>(
    `/records/${encodeURIComponent(id)}/notes/${encodeURIComponent(noteId)}`,
    { method: "DELETE" },
  );
}
