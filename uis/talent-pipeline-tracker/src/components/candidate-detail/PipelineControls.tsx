"use client";

import { useState } from "react";
import { InlineAlert, Spinner } from "@/components/StateViews";
import { useToast } from "@/components/ToastProvider";
import { useCandidate } from "@/hooks/CandidateContext";
import { STAGE_LABELS, STAGE_OPTIONS, STATUS_LABELS, STATUS_OPTIONS, isStage, isStatus } from "@/lib/labels";
import { errorMessage } from "@/services/api-client";
import type { CandidatePatch } from "@/types/candidate";

type Field = "status" | "stage";

const selectClass =
  "w-full rounded-md border border-line bg-white px-3 py-2 text-sm focus:border-flame focus:outline-none disabled:opacity-60";

/** Status and stage selectors — each change is saved immediately via PATCH. */
export function PipelineControls() {
  const { state, updatePipeline } = useCandidate();
  const { notify } = useToast();
  const [saving, setSaving] = useState<Field | null>(null);
  const [error, setError] = useState<{ field: Field; message: string } | null>(null);

  if (state.status !== "success") return null;
  const candidate = state.data;

  async function save(field: Field, patch: CandidatePatch, label: string) {
    setSaving(field);
    setError(null);
    try {
      await updatePipeline(patch);
      notify("success", `${field === "status" ? "Status" : "Stage"} updated to “${label}”.`);
    } catch (err) {
      setError({ field, message: errorMessage(err) });
    } finally {
      setSaving(null);
    }
  }

  return (
    <section className="rounded-lg border border-line bg-white p-6 lg:sticky lg:top-6">
      <h2 className="font-display text-xl">Selection process</h2>
      <p className="mt-1 text-sm text-muted">Changes are saved as soon as you pick a new value.</p>

      <div className="mt-5 space-y-5">
        <label className="block">
          <span className="mb-1 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted">
            Status
            {saving === "status" && (
              <span className="flex items-center gap-1 normal-case tracking-normal text-flame">
                <Spinner className="size-3" /> Saving…
              </span>
            )}
          </span>
          <select
            value={candidate.status}
            disabled={saving !== null}
            onChange={(e) => {
              const v = e.target.value;
              if (isStatus(v)) save("status", { status: v }, STATUS_LABELS[v]);
            }}
            className={selectClass}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>
        {error?.field === "status" && <InlineAlert tone="error">Couldn&apos;t update status: {error.message}</InlineAlert>}

        <label className="block">
          <span className="mb-1 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted">
            Stage
            {saving === "stage" && (
              <span className="flex items-center gap-1 normal-case tracking-normal text-flame">
                <Spinner className="size-3" /> Saving…
              </span>
            )}
          </span>
          <select
            value={candidate.stage}
            disabled={saving !== null}
            onChange={(e) => {
              const v = e.target.value;
              if (isStage(v)) save("stage", { stage: v }, STAGE_LABELS[v]);
            }}
            className={selectClass}
          >
            {STAGE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>
        {error?.field === "stage" && <InlineAlert tone="error">Couldn&apos;t update stage: {error.message}</InlineAlert>}
      </div>
    </section>
  );
}
