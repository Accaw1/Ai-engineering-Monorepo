import Link from "next/link";
import { ACTIVE_SEARCH } from "@/lib/company";

export function AppHeader() {
  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="grid size-10 place-items-center rounded-full bg-flame font-display text-xl text-white"
          >
            B
          </span>
          <span className="leading-tight">
            <span className="block font-display text-lg">Brasaland Talent Pipeline</span>
            <span className="block text-xs text-muted">
              {ACTIVE_SEARCH.department} · {ACTIVE_SEARCH.position} search
            </span>
          </span>
        </Link>
        <nav className="flex items-center gap-2 text-sm">
          <Link href="/" className="rounded-md px-3 py-2 font-medium hover:bg-paper">
            Candidates
          </Link>
          <Link
            href="/candidates/new"
            className="rounded-md bg-flame px-3 py-2 font-semibold text-white hover:bg-flame-dark"
          >
            + Register candidate
          </Link>
        </nav>
      </div>
    </header>
  );
}
