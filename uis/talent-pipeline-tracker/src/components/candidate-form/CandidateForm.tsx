"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { InlineAlert, Spinner } from "@/components/StateViews";
import { useToast } from "@/components/ToastProvider";
import { ACTIVE_SEARCH } from "@/lib/company";
import {
  candidateToFormValues,
  emptyFormValues,
  formValuesToInput,
  validateCandidate,
  type CandidateFormErrors,
  type CandidateFormValues,
} from "@/lib/validation";
import { ApiError, errorMessage } from "@/services/api-client";
import { createCandidate, updateCandidate } from "@/services/candidates";
import type { Candidate } from "@/types/candidate";

type Props = { mode: "create" } | { mode: "edit"; candidate: Candidate };

const FIELDS: {
  name: keyof CandidateFormValues;
  label: string;
  type: string;
  required: boolean;
  placeholder?: string;
  hint?: string;
  inputMode?: "numeric" | "decimal" | "email" | "tel" | "url";
}[] = [
  { name: "full_name", label: "Full name", type: "text", required: true, placeholder: "e.g. Laura Gómez Restrepo" },
  { name: "email", label: "Email", type: "email", required: true, placeholder: "name@example.com", inputMode: "email" },
  { name: "phone", label: "Phone", type: "tel", required: true, placeholder: "+57 300 123 4567", inputMode: "tel" },
  { name: "position", label: "Position applied for", type: "text", required: true },
  { name: "experience_years", label: "Years of experience", type: "number", required: true, placeholder: "0", inputMode: "decimal" },
  { name: "linkedin_url", label: "LinkedIn profile", type: "url", required: false, placeholder: "https://linkedin.com/in/…", inputMode: "url" },
  { name: "cv_url", label: "CV link", type: "url", required: false, placeholder: "https://…", hint: "Link to the CV in Drive or wherever it was received.", inputMode: "url" },
];

/** Shared form for registering (POST) and correcting (PUT) a candidate. */
export function CandidateForm(props: Props) {
  const router = useRouter();
  const { notify } = useToast();
  const [values, setValues] = useState<CandidateFormValues>(() =>
    props.mode === "edit" ? candidateToFormValues(props.candidate) : emptyFormValues(ACTIVE_SEARCH.position),
  );
  const [errors, setErrors] = useState<CandidateFormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function update(name: keyof CandidateFormValues, value: string) {
    setValues((v) => ({ ...v, [name]: value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: undefined }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    const found = validateCandidate(values);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setSubmitError("Please fix the highlighted fields before saving.");
      document.getElementById(`field-${Object.keys(found)[0]}`)?.focus();
      return;
    }

    setSubmitting(true);
    try {
      const input = formValuesToInput(values);
      if (props.mode === "create") {
        const created = await createCandidate(input);
        notify("success", `${created.full_name} has been registered in the pipeline.`);
        router.push(`/candidates/${created.id}`);
      } else {
        const updated = await updateCandidate(props.candidate.id, input);
        notify("success", `Changes to ${updated.full_name} saved.`);
        router.push(`/candidates/${props.candidate.id}`);
      }
    } catch (err) {
      // Map server-side 422 issues back onto the matching fields when possible.
      if (err instanceof ApiError && err.issues.length) {
        const serverErrors: CandidateFormErrors = {};
        for (const issue of err.issues) {
          const field = String(issue.loc[issue.loc.length - 1]) as keyof CandidateFormValues;
          if (field in values) serverErrors[field] = issue.msg;
        }
        setErrors(serverErrors);
      }
      setSubmitError(`Couldn't save: ${errorMessage(err)}`);
      notify("error", "The candidate could not be saved. Review the form and try again.");
      setSubmitting(false);
    }
  }

  const cancelHref = props.mode === "edit" ? `/candidates/${props.candidate.id}` : "/";

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6 rounded-lg border border-line bg-white p-6">
      <div className="grid gap-5 sm:grid-cols-2">
        {FIELDS.map((f) => {
          const id = `field-${f.name}`;
          const error = errors[f.name];
          return (
            <div key={f.name} className={f.name === "full_name" ? "sm:col-span-2" : undefined}>
              <label htmlFor={id} className="mb-1 block text-sm font-semibold">
                {f.label}
                {f.required ? (
                  <span className="text-flame" aria-hidden="true"> *</span>
                ) : (
                  <span className="font-normal text-muted"> (optional)</span>
                )}
              </label>
              <input
                id={id}
                name={f.name}
                type={f.type}
                inputMode={f.inputMode}
                min={f.type === "number" ? 0 : undefined}
                step={f.type === "number" ? "any" : undefined}
                value={values[f.name]}
                onChange={(e) => update(f.name, e.target.value)}
                placeholder={f.placeholder}
                required={f.required}
                aria-invalid={!!error}
                aria-describedby={error ? `${id}-error` : f.hint ? `${id}-hint` : undefined}
                disabled={submitting}
                className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none disabled:bg-paper ${
                  error ? "border-flame focus:border-flame" : "border-line focus:border-flame"
                }`}
              />
              {error ? (
                <p id={`${id}-error`} className="mt-1 text-xs text-flame-dark">{error}</p>
              ) : f.hint ? (
                <p id={`${id}-hint`} className="mt-1 text-xs text-muted">{f.hint}</p>
              ) : null}
            </div>
          );
        })}
      </div>

      {submitError && <InlineAlert tone="error">{submitError}</InlineAlert>}

      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-line pt-5">
        <Link href={cancelHref} className="rounded-md px-4 py-2 text-sm font-medium hover:bg-paper">
          Cancel
        </Link>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-md bg-flame px-5 py-2 text-sm font-semibold text-white hover:bg-flame-dark disabled:opacity-60"
        >
          {submitting && <Spinner />}
          {submitting ? "Saving…" : props.mode === "create" ? "Register candidate" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
