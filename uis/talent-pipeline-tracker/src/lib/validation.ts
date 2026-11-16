import type { Candidate, CandidateInput } from "@/types/candidate";

/** Raw form values (everything is a string while editing). */
export interface CandidateFormValues {
  full_name: string;
  email: string;
  phone: string;
  position: string;
  linkedin_url: string;
  cv_url: string;
  experience_years: string;
}

export type CandidateFormErrors = Partial<Record<keyof CandidateFormValues, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[\d\s().-]{7,20}$/;

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function emptyFormValues(defaultPosition: string): CandidateFormValues {
  return {
    full_name: "",
    email: "",
    phone: "",
    position: defaultPosition,
    linkedin_url: "",
    cv_url: "",
    experience_years: "",
  };
}

export function candidateToFormValues(c: Candidate): CandidateFormValues {
  return {
    full_name: c.full_name,
    email: c.email,
    phone: c.phone,
    position: c.position,
    linkedin_url: c.linkedin_url ?? "",
    cv_url: c.cv_url ?? "",
    experience_years: String(c.experience_years),
  };
}

/** Validates every field required by the API (RecordCreate) plus format checks. */
export function validateCandidate(v: CandidateFormValues): CandidateFormErrors {
  const errors: CandidateFormErrors = {};

  if (!v.full_name.trim()) errors.full_name = "Full name is required.";
  else if (v.full_name.trim().length < 3) errors.full_name = "Enter the candidate's full name.";

  if (!v.email.trim()) errors.email = "Email is required.";
  else if (!EMAIL_RE.test(v.email.trim())) errors.email = "Enter a valid email address.";

  if (!v.phone.trim()) errors.phone = "Phone is required.";
  else if (!PHONE_RE.test(v.phone.trim())) errors.phone = "Enter a valid phone number, e.g. +57 300 123 4567.";

  if (!v.position.trim()) errors.position = "Position is required.";

  if (!v.experience_years.trim()) errors.experience_years = "Years of experience is required.";
  else {
    const n = Number(v.experience_years);
    if (!Number.isFinite(n) || n < 0 || n > 60) errors.experience_years = "Enter a number between 0 and 60.";
  }

  if (v.linkedin_url.trim() && !isHttpUrl(v.linkedin_url.trim()))
    errors.linkedin_url = "Enter a full URL starting with https://";
  if (v.cv_url.trim() && !isHttpUrl(v.cv_url.trim())) errors.cv_url = "Enter a full URL starting with https://";

  return errors;
}

export function formValuesToInput(v: CandidateFormValues): CandidateInput {
  return {
    full_name: v.full_name.trim(),
    email: v.email.trim().toLowerCase(),
    phone: v.phone.trim(),
    position: v.position.trim(),
    linkedin_url: v.linkedin_url.trim() || null,
    cv_url: v.cv_url.trim() || null,
    experience_years: Number(v.experience_years),
  };
}
