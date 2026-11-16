import type { ReactNode } from "react";

export function Spinner({ className = "size-4" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block animate-spin rounded-full border-2 border-current border-r-transparent ${className}`}
    />
  );
}

export function LoadingState({ label }: { label: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-3 py-16 text-muted">
      <Spinner className="size-5 text-flame" />
      <span>{label}</span>
    </div>
  );
}

export function ErrorState({
  title,
  message,
  onRetry,
  children,
}: {
  title: string;
  message: string;
  onRetry?: () => void;
  children?: ReactNode;
}) {
  return (
    <div role="alert" className="rounded-lg border border-flame/30 bg-flame/5 p-6 text-center">
      <p className="font-semibold text-flame-dark">{title}</p>
      <p className="mt-1 text-sm text-ink/80">{message}</p>
      <div className="mt-4 flex justify-center gap-3">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="rounded-md bg-flame px-4 py-2 text-sm font-semibold text-white hover:bg-flame-dark"
          >
            Try again
          </button>
        )}
        {children}
      </div>
    </div>
  );
}

export function InlineAlert({ tone, children }: { tone: "success" | "error"; children: ReactNode }) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={`rounded-md px-3 py-2 text-sm ${
        tone === "error" ? "bg-flame/10 text-flame-dark" : "bg-olive/10 text-olive"
      }`}
    >
      {children}
    </p>
  );
}
