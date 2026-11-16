"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";

type ToastTone = "success" | "error";
interface Toast {
  id: number;
  tone: ToastTone;
  message: string;
}

interface ToastContextValue {
  notify: (tone: ToastTone, message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

/** App-wide feedback toasts; survive client-side navigation (e.g. after saving a form). */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((t) => t.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback(
    (tone: ToastTone, message: string) => {
      const id = nextId.current++;
      setToasts((t) => [...t, { id, tone, message }]);
      setTimeout(() => dismiss(id), tone === "error" ? 7000 : 4000);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4 sm:items-end sm:pr-6"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.tone === "error" ? "alert" : "status"}
            className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg ${
              t.tone === "success"
                ? "border-olive/30 bg-white text-ink"
                : "border-flame/40 bg-white text-ink"
            }`}
          >
            <span
              aria-hidden="true"
              className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full text-xs font-bold text-white ${
                t.tone === "success" ? "bg-olive" : "bg-flame"
              }`}
            >
              {t.tone === "success" ? "✓" : "!"}
            </span>
            <p className="flex-1">{t.message}</p>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              className="text-muted hover:text-ink"
              aria-label="Dismiss notification"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
