import type { Metadata } from "next";
import Link from "next/link";
import { CandidateForm } from "@/components/candidate-form/CandidateForm";
import { ACTIVE_SEARCH } from "@/lib/company";

export const metadata: Metadata = { title: "Register candidate" };

export default function NewCandidatePage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/" className="inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-flame">
        ← Back to candidates
      </Link>
      <div>
        <h1 className="font-display text-3xl">Register a candidate</h1>
        <p className="mt-1 text-sm text-muted">
          For applications received outside the job portal — referrals, email, LinkedIn or walk-ins at a
          Brasaland location. They&apos;ll join the {ACTIVE_SEARCH.position} pipeline alongside portal
          applicants.
        </p>
      </div>
      <CandidateForm mode="create" />
    </div>
  );
}
