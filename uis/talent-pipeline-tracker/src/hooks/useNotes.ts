"use client";

import { useCallback } from "react";
import { useAsyncResource } from "@/hooks/useAsyncResource";
import { createNote, deleteNote, listNotes } from "@/services/candidates";
import type { CandidateNote } from "@/types/candidate";

/** Notes for one candidate: list, add and delete, keeping local state in sync. */
export function useNotes(candidateId: string) {
  const { state, reload, mutate } = useAsyncResource(`notes:${candidateId}`, (signal) =>
    listNotes(candidateId, signal),
  );

  const addNote = useCallback(
    async (content: string): Promise<CandidateNote> => {
      const note = await createNote(candidateId, { content });
      mutate((notes) => [note, ...notes]);
      return note;
    },
    [candidateId, mutate],
  );

  const removeNote = useCallback(
    async (noteId: string): Promise<void> => {
      await deleteNote(candidateId, noteId);
      mutate((notes) => notes.filter((n) => n.id !== noteId));
    },
    [candidateId, mutate],
  );

  return { state, reload, addNote, removeNote };
}
