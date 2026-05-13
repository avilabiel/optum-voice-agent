export function formatScore(score: number): string {
  return score.toFixed(2);
}

export function formatRelativeTime(isoOrNull: string | null): string {
  if (!isoOrNull) return "—";
  const date = new Date(isoOrNull);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function isHighPriority(score: number): boolean {
  return score >= 0.8;
}
