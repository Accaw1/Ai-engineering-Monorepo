"use client";

import { useCallback, useEffect, useState } from "react";
import { errorMessage, isAbort } from "@/services/api-client";
import type { AsyncState } from "@/types/candidate";

type Settled<T> =
  | { key: string; status: "success"; data: T; error: null }
  | { key: string; status: "error"; data: null; error: string };

/**
 * Fetches data for a given `key` and exposes loading / success / error.
 * When the key changes (or `reload()` is called) the state reverts to
 * loading until the new request settles. Stale requests are aborted.
 */
export function useAsyncResource<T>(
  key: string,
  fetcher: (signal: AbortSignal) => Promise<T>,
) {
  const [nonce, setNonce] = useState(0);
  const requestKey = `${key}#${nonce}`;
  const [settled, setSettled] = useState<Settled<T> | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const data = await fetcher(controller.signal);
        setSettled({ key: requestKey, status: "success", data, error: null });
      } catch (err) {
        if (isAbort(err)) return;
        setSettled({ key: requestKey, status: "error", data: null, error: errorMessage(err) });
      }
    })();
    return () => controller.abort();
    // `fetcher` is intentionally excluded: the key fully describes the request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  /** Replace the loaded data locally (e.g. after a successful mutation). */
  const mutate = useCallback(
    (updater: (current: T) => T) =>
      setSettled((s) => (s && s.status === "success" ? { ...s, data: updater(s.data) } : s)),
    [],
  );

  const state: AsyncState<T> =
    settled && settled.key === requestKey
      ? settled.status === "success"
        ? { status: "success", data: settled.data, error: null }
        : { status: "error", data: null, error: settled.error }
      : { status: "loading", data: null, error: null };

  return { state, reload, mutate };
}
