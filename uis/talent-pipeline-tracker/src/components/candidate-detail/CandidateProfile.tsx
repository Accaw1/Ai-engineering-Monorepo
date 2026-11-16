"use client";

import type { ReactNode } from "react";
import { useCandidate } from "@/hooks/CandidateContext";
import { formatDate, formatDateTime, formatYears } from "@/lib/format";
import { stageLabel, statusLabel } from "@/lib/labels";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-1 break-words text-sm">{children}</dd>
    </div>
  );
}

function ExternalLink({ href, children }: { href: string | null; children: ReactNode }) {
  if (!href) return <span className="text-muted">Not provided</span>;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="font-medium text-flame underline-offset-2 hover:underline">
      {children} ↗
    </a>
  );
}

export function CandidateProfile() {
  const { state } = useCandidate();
  if (state.status !== "success") return null;
  const c = state.data;

  return (
    <section className="rounded-lg border border-line bg-white p-6">
      <h2 className="font-display text-xl">Candidate profile</h2>
      <dl className="mt-4 grid gap-5 sm:grid-cols-2">
        <Field label="Full name">{c.full_name}</Field>
        <Field label="Position applied for">{c.position}</Field>
        <Field label="Email">
          <a href={`mailto:${c.email}`} className="hover:text-flame">{c.email}</a>
        </Field>
        <Field label="Phone">
          <a href={`tel:${c.phone.replace(/\s+/g, "")}`} className="hover:text-flame">{c.phone}</a>
        </Field>
        <Field label="LinkedIn">
          <ExternalLink href={c.linkedin_url}>View profile</ExternalLink>
        </Field>
        <Field label="CV">
          <ExternalLink href={c.cv_url}>Open CV</ExternalLink>
        </Field>
        <Field label="Years of experience">{formatYears(c.experience_years)}</Field>
        <Field label="Application date">{formatDate(c.applied_at)}</Field>
        <Field label="Status">{statusLabel(c.status)}</Field>
        <Field label="Stage">{stageLabel(c.stage)}</Field>
        <Field label="Last updated">{formatDateTime(c.updated_at)}</Field>
      </dl>
    </section>
  );
}
