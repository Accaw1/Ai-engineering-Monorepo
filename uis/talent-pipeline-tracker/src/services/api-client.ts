import type { ApiValidationIssue } from "@/types/candidate";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "");

/** Error thrown by every service call, carrying a user-facing message. */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly issues: ApiValidationIssue[] = [],
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const FIELD_NAMES: Record<string, string> = {
  full_name: "Full name",
  email: "Email",
  phone: "Phone",
  position: "Position",
  linkedin_url: "LinkedIn",
  cv_url: "CV link",
  experience_years: "Years of experience",
  content: "Note",
  status: "Status",
  stage: "Stage",
};

async function toApiError(res: Response): Promise<ApiError> {
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    // Non-JSON error body; fall through to generic messages.
  }

  if (res.status === 422 && body && typeof body === "object" && "detail" in body) {
    const detail = (body as { detail: unknown }).detail;
    if (Array.isArray(detail)) {
      const issues = detail as ApiValidationIssue[];
      const message = issues
        .map((i) => {
          const field = String(i.loc[i.loc.length - 1] ?? "");
          return `${FIELD_NAMES[field] ?? "A field"}: ${i.msg}`;
        })
        .join(" · ");
      return new ApiError(message || "Some fields are invalid.", 422, issues);
    }
  }

  if (res.status === 404) {
    return new ApiError("We couldn't find that candidate. It may have been removed.", 404);
  }

  const serverMessage =
    body && typeof body === "object" && "error" in body
      ? String((body as { error: unknown }).error)
      : null;

  if (res.status >= 500) {
    return new ApiError("The talent service is having trouble right now. Please try again in a moment.", res.status);
  }
  return new ApiError(serverMessage ?? `Request failed (${res.status}).`, res.status);
}

/** Thin fetch wrapper: JSON in/out, consistent errors, async/await throughout. */
export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!API_URL) {
    throw new ApiError("NEXT_PUBLIC_API_URL is not configured. Check your .env.local file.", 0);
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...init.headers,
      },
      cache: "no-store",
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    throw new ApiError("Can't reach the talent service. Check your connection and try again.", 0);
  }

  if (!res.ok) throw await toApiError(res);
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export function errorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Something went wrong. Please try again.";
}

export function isAbort(err: unknown): boolean {
  return err instanceof DOMException && err.name === "AbortError";
}
