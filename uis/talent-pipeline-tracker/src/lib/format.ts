const dateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : dateFormatter.format(d);
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : dateTimeFormatter.format(d);
}

export function formatYears(years: number): string {
  return `${years} ${years === 1 ? "year" : "years"}`;
}
