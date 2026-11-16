"use client";

import { useState, type FormEvent } from "react";
import { ErrorState, InlineAlert, Spinner } from "@/components/StateViews";
import { useToast } from "@/components/ToastProvider";
import { useCandidate } from "@/hooks/CandidateContext";
import { useNotes } from "@/hooks/useNotes";
import { formatDateTime } from "@/lib/format";
import { errorMessage } from "@/services/api-client";

const MAX_NOTE_LENGTH = 2000;

/** Internal notes — shown only in the candidate detail view. */
export function NotesPanel() {
  const { candidateId, adjustNotesCount } = useCandidate();
  const { state, reload, addNote, removeNote } = useNotes(candidateId);
  const { notify } = useToast();

  const [draft, setDraft] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const content = draft.trim();
    if (!content) {
      setAddError("Write something before saving the note.");
      return;
    }
    setAdding(true);
    setAddError(null);
    try {
      await addNote(content);
      adjustNotesCount(1);
      setDraft("");
      notify("success", "Note added.");
    } catch (err) {
      setAddError(errorMessage(err));
    } finally {
      setAdding(false);
    }
  }

  async function onDelete(noteId: string) {
    setDeletingId(noteId);
    setDeleteError(null);
    try {
      await removeNote(noteId);
      adjustNotesCount(-1);
      notify("success", "Note deleted.");
    } catch (err) {
      setDeleteError(errorMessage(err));
    } finally {
      setDeletingId(null);
      setConfirmingId(null);
    }
  }

  return (
    <section className="rounded-lg border border-line bg-white p-6">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="font-display text-xl">Internal notes</h2>
        <span className="text-xs text-muted">Visible to People &amp; Culture only</span>
      </div>

      <form onSubmit={onSubmit} className="mt-4 space-y-2" noValidate>
        <label htmlFor="new-note" className="sr-only">New note</label>
        <textarea
          id="new-note"
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            if (addError) setAddError(null);
          }}
          maxLength={MAX_NOTE_LENGTH}
          rows={3}
          placeholder="Summary of the call or interview, next steps, impressions…"
          className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-flame focus:outline-none"
          disabled={adding}
        />
        {addError && <InlineAlert tone="error">{addError}</InlineAlert>}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted">{draft.length}/{MAX_NOTE_LENGTH}</span>
          <button
            type="submit"
            disabled={adding}
            className="inline-flex items-center gap-2 rounded-md bg-flame px-4 py-2 text-sm font-semibold text-white hover:bg-flame-dark disabled:opacity-60"
          >
            {adding && <Spinner />}
            {adding ? "Saving…" : "Add note"}
          </button>
        </div>
      </form>

      <div className="mt-6">
        {state.status === "loading" && (
          <p role="status" className="flex items-center gap-2 text-sm text-muted">
            <Spinner className="size-4 text-flame" /> Loading notes…
          </p>
        )}
        {state.status === "error" && (
          <ErrorState title="We couldn't load the notes" message={state.error} onRetry={reload} />
        )}
        {state.status === "success" && (
          <>
            {deleteError && (
              <div className="mb-3">
                <InlineAlert tone="error">Couldn&apos;t delete the note: {deleteError}</InlineAlert>
              </div>
            )}
            {state.data.length === 0 ? (
              <p className="text-sm text-muted">No notes yet. Add the first one after your next call or interview.</p>
            ) : (
              <ul className="space-y-3">
                {[...state.data]
                  .sort((a, b) => b.created_at.localeCompare(a.created_at))
                  .map((note) => (
                    <li key={note.id} className="rounded-md border border-line bg-paper/50 p-4">
                      <p className="whitespace-pre-wrap text-sm">{note.content}</p>
                      <div className="mt-3 flex items-center justify-between gap-2 text-xs text-muted">
                        <time dateTime={note.created_at}>{formatDateTime(note.created_at)}</time>
                        {confirmingId === note.id ? (
                          <span className="flex items-center gap-2">
                            <span>Delete this note?</span>
                            <button
                              type="button"
                              onClick={() => onDelete(note.id)}
                              disabled={deletingId === note.id}
                              className="inline-flex items-center gap-1 rounded bg-flame px-2 py-1 font-semibold text-white disabled:opacity-60"
                            >
                              {deletingId === note.id && <Spinner className="size-3" />}
                              {deletingId === note.id ? "Deleting…" : "Delete"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmingId(null)}
                              disabled={deletingId === note.id}
                              className="rounded px-2 py-1 font-medium hover:bg-line/60"
                            >
                              Cancel
                            </button>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmingId(note.id)}
                            className="rounded px-2 py-1 font-medium hover:bg-flame/10 hover:text-flame"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
              </ul>
            )}
          </>
        )}
      </div>
    </section>
  );
}
